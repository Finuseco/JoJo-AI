import {NextResponse} from 'next/server';
import {db} from '@/lib/db';
import {requireProject} from '@/lib/project-access';
import {githubRepository,githubApi,githubToken} from '@/lib/github';
import {readArchive} from '@/lib/project-archive';
import {projectFiles,storeImportedFiles} from '@/lib/project-snapshots';
import {limitedBody,sameOrigin} from '@/lib/http-limits';
export const dynamic='force-dynamic';
export async function GET(_:Request,{params}:{params:{id:string}}){try{const {user}=await requireProject(Number(params.id));const connected=await db.query('SELECT github_login FROM jojo_ai_integrations WHERE user_id=$1',[user.id]);const link=await db.query('SELECT repository,branch,base_sha,updated_at FROM jojo_ai_git_links WHERE project_id=$1',[params.id]);let commits=[];if(link.rows[0]){const data=await githubApi(`/repos/${link.rows[0].repository}/commits?sha=${encodeURIComponent(link.rows[0].branch)}&per_page=10`,await githubToken(user.id));commits=data.map((c:any)=>({sha:c.sha,message:c.commit.message,date:c.commit.author.date,url:c.html_url}));}return NextResponse.json({success:true,connected:connected.rows[0]?.github_login || null,link:link.rows[0]||null,commits},{headers:{'Cache-Control':'private,no-store'}});}catch(e:any){return NextResponse.json({success:false,error:e.message},{status:400});}}
export async function POST(request:Request,{params}:{params:{id:string}}){try{
 sameOrigin(request);const id=Number(params.id),{user}=await requireProject(id,true),input=JSON.parse((await limitedBody(request,10000)).toString('utf8')),token=await githubToken(user.id);
 if(input.action==='import'){
  const repository=githubRepository(input.repository||'');const repo=await githubApi(`/repos/${repository}`,token);const branch=String(input.branch||repo.default_branch);
  if(!/^[\w./-]{1,200}$/.test(branch)||branch.includes('..'))throw Error('Branche invalide.');
  const commit=await githubApi(`/repos/${repository}/commits/${encodeURIComponent(branch)}`,token);
  let target=`https://api.github.com/repos/${repository}/zipball/${commit.sha}`,download:Response|undefined;
  for(let n=0;n<3;n++){const u=new URL(target);if(u.protocol!=='https:'||!['api.github.com','codeload.github.com'].includes(u.hostname)||u.port)throw Error('Destination GitHub refusée.');download=await fetch(u,{headers:u.hostname==='api.github.com'&&token?{Authorization:`Bearer ${token}`}:{},redirect:'manual',signal:AbortSignal.timeout(30000)});if(![301,302,307,308].includes(download.status))break;target=new URL(download.headers.get('location')||'',u).toString();}
  if(!download?.ok)throw Error('Impossible de télécharger cette archive GitHub.');const result=await readArchive(await limitedBody(download,20*1024*1024),true);
  await storeImportedFiles(id,result.files,{repository,branch,sha:commit.sha});return NextResponse.json({success:true,count:result.files.length,skipped:result.skipped});
 }
 if(input.action==='push'){
  if(!token)throw Error('Connectez GitHub avant de publier un commit.');const {rows}=await db.query('SELECT * FROM jojo_ai_git_links WHERE project_id=$1',[id]);const link=rows[0];if(!link)throw Error('Importez d’abord un dépôt dans ce projet.');
  const message=String(input.message||'').trim();if(!message||message.length>500)throw Error('Message de commit requis (500 caractères maximum).');
  const current=await githubApi(`/repos/${link.repository}/commits/${encodeURIComponent(link.branch)}`,token);
  if(current.sha!==link.base_sha)throw Error('La branche distante a changé. Importez-la dans un nouveau projet pour comparer avant de publier. Aucun historique écrasé.');
  const files=await projectFiles(id);if(files.length>500)throw Error('Publication limitée à 500 fichiers par commit ; utilisez l’export ZIP pour les grands dépôts.');const tree=[];
  for(const file of files){const blob=await githubApi(`/repos/${link.repository}/git/blobs`,token,{content:file.content,encoding:file.encoding==='base64'?'base64':'utf-8'});tree.push({path:file.path,mode:file.mode||'100644',type:'blob',sha:blob.sha});}
  const createdTree=await githubApi(`/repos/${link.repository}/git/trees`,token,{base_tree:current.commit.tree.sha,tree});const commit=await githubApi(`/repos/${link.repository}/git/commits`,token,{message,tree:createdTree.sha,parents:[current.sha]});
  await githubApi(`/repos/${link.repository}/git/refs/heads/${link.branch.split('/').map(encodeURIComponent).join('/')}`,token,{sha:commit.sha,force:false},'PATCH');
  await db.query('UPDATE jojo_ai_git_links SET base_sha=$1,updated_at=now() WHERE project_id=$2',[commit.sha,id]);return NextResponse.json({success:true,sha:commit.sha});
 }
 throw Error('Action inconnue.');
}catch(e:any){return NextResponse.json({success:false,error:e.message},{status:400});}}
