import {NextResponse} from 'next/server';
import {db} from '@/lib/db';
import {requireProject} from '@/lib/project-access';
import {githubRepository,githubApi,githubToken} from '@/lib/github';
import {githubArchive} from '@/lib/github-archive';
import {mergeGitFiles,snapshotDigest,gitFileChanges} from '@/lib/git-sync';
import {COUNT_LIMIT,FILE_LIMIT,TOTAL_LIMIT} from '@/lib/project-files';
import {projectFiles,storeImportedFiles} from '@/lib/project-snapshots';
import {limitedBody,sameOrigin} from '@/lib/http-limits';
export const dynamic='force-dynamic';
export async function GET(_:Request,{params}:{params:{id:string}}){try{const {user}=await requireProject(Number(params.id));const connected=await db.query('SELECT github_login FROM jojo_ai_integrations WHERE user_id=$1',[user.id]);const link=await db.query('SELECT repository,branch,base_sha,updated_at FROM jojo_ai_git_links WHERE project_id=$1',[params.id]);let commits=[];if(link.rows[0]){const data=await githubApi(`/repos/${link.rows[0].repository}/commits?sha=${encodeURIComponent(link.rows[0].branch)}&per_page=10`,await githubToken(user.id));commits=data.map((c:any)=>({sha:c.sha,message:c.commit.message,date:c.commit.committer.date,url:c.html_url}));}return NextResponse.json({success:true,connected:connected.rows[0]?.github_login || null,link:link.rows[0]||null,commits},{headers:{'Cache-Control':'private,no-store'}});}catch(e:any){return NextResponse.json({success:false,error:e.message},{status:400});}}
export async function POST(request:Request,{params}:{params:{id:string}}){let lock;try{
 sameOrigin(request);const id=Number(params.id),{user}=await requireProject(id,true),input=JSON.parse((await limitedBody(request,10000)).toString('utf8')),token=await githubToken(user.id);
 lock=await db.getConnection();const acquired=(await lock.query('SELECT pg_try_advisory_lock($1,$2) AS locked',[8095,id])).rows[0].locked;if(!acquired)throw Error('Une opération GitHub est déjà en cours sur ce projet.');
 if(input.action==='import'){
  const repository=githubRepository(input.repository||'');const repo=await githubApi(`/repos/${repository}`,token);const branch=String(input.branch||repo.default_branch);
  if(!/^[\w./-]{1,200}$/.test(branch)||branch.includes('..'))throw Error('Branche invalide.');
  const commit=await githubApi(`/repos/${repository}/commits/${encodeURIComponent(branch)}`,token);
  const result=await githubArchive(repository,commit.sha,token);
  await storeImportedFiles(id,result.files,{repository,branch,sha:commit.sha});return NextResponse.json({success:true,count:result.files.length,skipped:result.skipped});
 }
 if(input.action==='review'){
  const link=(await db.query('SELECT * FROM jojo_ai_git_links WHERE project_id=$1',[id])).rows[0];if(!link)throw Error('Importez d’abord un dépôt.');
  const targetBranch=String(input.branch||link.branch);if(!/^[\w./-]{1,200}$/.test(targetBranch)||targetBranch.includes('..'))throw Error('Branche invalide.');
  const local=await projectFiles(id),head=await githubApi(`/repos/${link.repository}/commits/${encodeURIComponent(targetBranch)}`,token);
  const [base,remote]=await Promise.all([githubArchive(link.repository,link.base_sha,token),githubArchive(link.repository,head.sha,token)]);
  return NextResponse.json({success:true,review:true,repository:link.repository,branch:targetBranch,linkedBranch:link.branch,baseSha:link.base_sha,remoteSha:head.sha,localDigest:snapshotDigest(local),checkedAt:new Date().toISOString(),commit:{sha:head.sha,message:head.commit.message,date:head.commit.committer.date,url:head.html_url},incoming:gitFileChanges(base.files,remote.files),outgoing:gitFileChanges(base.files,local),conflicts:mergeGitFiles(base.files,local,remote.files).conflicts,skipped:remote.skipped});
 }
 if(input.action==='pull'){
  const link=(await db.query('SELECT * FROM jojo_ai_git_links WHERE project_id=$1',[id])).rows[0];
  if(!link)throw Error('Importez d’abord un dépôt.');
  const targetBranch=String(input.branch||link.branch);if(!/^[\w./-]{1,200}$/.test(targetBranch)||targetBranch.includes('..'))throw Error('Branche invalide.');
  const local=await projectFiles(id),before=snapshotDigest(local);
  const remoteCommit=await githubApi(`/repos/${link.repository}/commits/${encodeURIComponent(targetBranch)}`,token);
  if(input.remoteSha&&(remoteCommit.sha!==input.remoteSha||before!==input.localDigest))throw Error('Les fichiers ou la branche ont changé depuis la comparaison. Vérifiez à nouveau.');
  if(remoteCommit.sha===link.base_sha&&targetBranch===link.branch)return NextResponse.json({success:true,unchanged:true,sha:remoteCommit.sha,branch:link.branch,date:remoteCommit.commit.committer.date,message:remoteCommit.commit.message});
  const [base,remote]=await Promise.all([githubArchive(link.repository,link.base_sha,token),githubArchive(link.repository,remoteCommit.sha,token)]);
  const merged=mergeGitFiles(base.files,local,remote.files);
  if(merged.conflicts.length)return NextResponse.json({success:false,error:'Modifications concurrentes. Aucun fichier remplacé. Exportez votre ZIP et résolvez ces fichiers avant de réessayer.',conflicts:merged.conflicts},{status:409});
  let bytes=0;
  if(merged.files.length>COUNT_LIMIT)throw Error('Trop de fichiers après synchronisation.');
  for(const f of merged.files){const n=Buffer.byteLength(f.content,f.encoding==='base64'?'base64':'utf8');bytes+=n;if(n>FILE_LIMIT||bytes>TOTAL_LIMIT)throw Error('Quota de fichiers dépassé après synchronisation.');}
  const client=await db.getConnection();
  try{await client.query('BEGIN');await client.query('SELECT id FROM jojo_ai_projects WHERE id=$1 FOR UPDATE',[id]);
   const current=(await client.query('SELECT file_path AS path,file_content AS content,file_encoding AS encoding,file_mode AS mode FROM jojo_ai_project_files WHERE project_id=$1 ORDER BY file_path',[id])).rows;
   const latest=(await client.query('SELECT base_sha FROM jojo_ai_git_links WHERE project_id=$1 FOR UPDATE',[id])).rows[0];
   if(snapshotDigest(current)!==before||latest?.base_sha!==link.base_sha)throw Error('Le projet a changé pendant la récupération. Réessayez sans perdre vos modifications.');
   await client.query('DELETE FROM jojo_ai_project_files WHERE project_id=$1',[id]);
   for(const f of merged.files)await client.query('INSERT INTO jojo_ai_project_files(project_id,file_path,file_content,file_encoding,file_mode) VALUES($1,$2,$3,$4,$5)',[id,f.path,f.content,f.encoding,f.mode||'100644']);
   await client.query('UPDATE jojo_ai_git_links SET base_sha=$1,updated_at=now(),branch=$3 WHERE project_id=$2',[remoteCommit.sha,id,targetBranch]);await client.query('UPDATE jojo_ai_projects SET updated_at=now() WHERE id=$1',[id]);await client.query('COMMIT');
  }catch(e){await client.query('ROLLBACK');throw e;}finally{client.release();}
  return NextResponse.json({success:true,synchronized:true,count:merged.files.length,skipped:remote.skipped,sha:remoteCommit.sha,changes:gitFileChanges(local,merged.files)});
 }
 if(input.action==='create'){
  if(!token)throw Error('Connectez GitHub avant de créer un dépôt.');
  const existing=(await db.query('SELECT 1 FROM jojo_ai_git_links WHERE project_id=$1',[id])).rows[0];if(existing)throw Error('Ce projet est déjà lié à un dépôt GitHub.');
  const name=String(input.name||'').trim();if(!/^[A-Za-z0-9_.-]{1,100}$/.test(name)||name==='.'||name==='..')throw Error('Nom de dépôt invalide : lettres, chiffres, tiret, point et souligné uniquement.');
  const {project}=await requireProject(id,true);const description=String(project.description||'').replace(/\s+/g,' ').trim().slice(0,300);
  const created=await githubApi('/user/repos',token,{name,description:description||undefined,private:input.private!==false,auto_init:true});
  const repository=String(created.full_name),branch=String(created.default_branch||'main');
  let initial:any;for(let attempt=0;attempt<4;attempt++){try{initial=await githubApi(`/repos/${repository}/commits/${encodeURIComponent(branch)}`,token);break;}catch(e){if(attempt===3)throw Error('Dépôt créé sur GitHub ('+repository+') mais sa première version n’est pas encore prête. Importez-le depuis la liste, puis publiez.');await new Promise(r=>setTimeout(r,800));}}
  await db.query('INSERT INTO jojo_ai_git_links(project_id,repository,branch,base_sha) VALUES($1,$2,$3,$4)',[id,repository,branch,initial.sha]);
  input.action='push';input.message=String(input.message||'').trim()||'Premier envoi depuis JoJo AI';
 }
 if(input.action==='push'){
  if(!token)throw Error('Connectez GitHub avant de publier un commit.');const {rows}=await db.query('SELECT * FROM jojo_ai_git_links WHERE project_id=$1',[id]);const link=rows[0];if(!link)throw Error('Importez d’abord un dépôt dans ce projet.');
  const message=String(input.message||'').trim();if(!message||message.length>500)throw Error('Message de commit requis (500 caractères maximum).');
  const current=await githubApi(`/repos/${link.repository}/commits/${encodeURIComponent(link.branch)}`,token);
  if(current.sha!==link.base_sha)throw Error('La branche distante a changé. Récupérez les modifications GitHub avant publication. Aucun historique écrasé.');
  const files=await projectFiles(id);
  if(input.remoteSha&&(current.sha!==input.remoteSha||snapshotDigest(files)!==input.localDigest))throw Error('Les fichiers ont changé depuis la comparaison. Vérifiez à nouveau.');
  const base=await githubArchive(link.repository,current.sha,token),changes=gitFileChanges(base.files,files);
  if(!changes.length)return NextResponse.json({success:true,unchanged:true,sha:current.sha,branch:link.branch});
  if(files.length>500)throw Error('Publication limitée à 500 fichiers par commit ; utilisez l’export ZIP pour les grands dépôts.');const tree=[];
  for(const file of files){const blob=await githubApi(`/repos/${link.repository}/git/blobs`,token,{content:file.content,encoding:file.encoding==='base64'?'base64':'utf-8'});tree.push({path:file.path,mode:file.mode||'100644',type:'blob',sha:blob.sha});}
  // Delete only tracked, importable files missing locally; preserve excluded remote files.
  for(const change of changes)if(change.status==='deleted')tree.push({path:change.path,mode:base.files.find(f=>f.path===change.path)?.mode||'100644',type:'blob',sha:null});
  const createdTree=await githubApi(`/repos/${link.repository}/git/trees`,token,{base_tree:current.commit.tree.sha,tree});const commit=await githubApi(`/repos/${link.repository}/git/commits`,token,{message,tree:createdTree.sha,parents:[current.sha]});
  await githubApi(`/repos/${link.repository}/git/refs/heads/${link.branch.split('/').map(encodeURIComponent).join('/')}`,token,{sha:commit.sha,force:false},'PATCH');
  await db.query('UPDATE jojo_ai_git_links SET base_sha=$1,updated_at=now() WHERE project_id=$2',[commit.sha,id]);return NextResponse.json({success:true,sha:commit.sha,changes});
 }
 throw Error('Action inconnue.');
}catch(e:any){return NextResponse.json({success:false,error:e.message},{status:400});}finally{if(lock){await lock.query('SELECT pg_advisory_unlock($1,$2)',[8095,Number(params.id)]).catch(()=>{});lock.release();}}}
