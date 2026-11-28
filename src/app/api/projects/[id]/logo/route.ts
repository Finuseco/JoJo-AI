import {NextResponse} from 'next/server';
import {createHash} from 'node:crypto';
import {db} from '@/lib/db';
import {requireProject} from '@/lib/project-access';
import {sameOrigin,limitedBody} from '@/lib/http-limits';
import {PROJECT_LOGO_PATH,normalizeProjectLogo} from '@/lib/project-logo';
import {downloadPublicLogo} from '@/lib/public-logo';
import {editablePath} from '@/lib/project-files';
export const dynamic='force-dynamic';
export async function GET(request:Request,{params}:{params:{id:string}}){try{
 const id=Number(params.id);await requireProject(id);
 if(new URL(request.url).searchParams.has('files')){const {rows}=await db.query("SELECT file_path AS path FROM jojo_ai_project_files WHERE project_id=$1 AND file_encoding='base64' AND lower(file_path) LIKE '%.png' ORDER BY file_path LIMIT 100",[id]);return NextResponse.json({files:rows},{headers:{'Cache-Control':'private,no-store'}});}
 const {rows}=await db.query("SELECT file_content FROM jojo_ai_project_files WHERE project_id=$1 AND file_encoding='base64' AND file_path=ANY($2::text[]) ORDER BY array_position($2::text[],file_path) LIMIT 1",[id,[PROJECT_LOGO_PATH,'app/src/main/res/drawable/jojo_logo.png','logo.png','public/logo.png','assets/logo.png']]);
 if(!rows[0])return new Response(null,{status:404});
 const bytes=normalizeProjectLogo(Buffer.from(rows[0].file_content,'base64'));
 return new Response(new Uint8Array(bytes),{headers:{'Content-Type':'image/png','Cache-Control':'private,no-store','X-Content-Type-Options':'nosniff'}});
}catch{return new Response(null,{status:403});}}
export async function POST(request:Request,{params}:{params:{id:string}}){try{
 sameOrigin(request);const id=Number(params.id);await requireProject(id);let bytes:Buffer;
 if(request.headers.get('content-type')?.startsWith('application/json')){
  const input=JSON.parse((await limitedBody(request,8192)).toString());
  if(typeof input.path==='string'){const path=editablePath(input.path);const {rows}=await db.query("SELECT file_content FROM jojo_ai_project_files WHERE project_id=$1 AND file_path=$2 AND file_encoding='base64'",[id,path]);if(!rows[0])throw Error('Image introuvable dans ce projet.');bytes=Buffer.from(rows[0].file_content,'base64');}
  else if(typeof input.url==='string'&&input.url.length<=2048)bytes=await downloadPublicLogo(input.url);
  else throw Error('Fichier ou lien requis.');
 }else bytes=await limitedBody(request,3*1024*1024);
 const content=normalizeProjectLogo(bytes).toString('base64');const c=await db.getConnection();
 try{await c.query('BEGIN');await c.query('SELECT id FROM jojo_ai_projects WHERE id=$1 FOR UPDATE',[id]);
  const stats=(await c.query("SELECT COUNT(*)::int AS count,COALESCE(SUM(octet_length(content)),0) AS bytes FROM project_pending_actions WHERE project_id=$1 AND status='pending'",[id])).rows[0];
  if(stats.count>=100||Number(stats.bytes)+content.length>5*1024*1024)throw Error('Validez les modifications en attente avant d’importer le logo.');
  const old=(await c.query('SELECT file_content FROM jojo_ai_project_files WHERE project_id=$1 AND file_path=$2',[id,PROJECT_LOGO_PATH])).rows[0];
  const hash=old?createHash('sha256').update(old.file_content).digest('hex'):'absent';
  await c.query("INSERT INTO project_pending_actions(project_id,file_path,content,status,base_hash,file_encoding) VALUES($1,$2,$3,'pending',$4,'base64')",[id,PROJECT_LOGO_PATH,content,hash]);
  await c.query('COMMIT');return NextResponse.json({success:true,path:PROJECT_LOGO_PATH},{headers:{'Cache-Control':'no-store'}});
 }catch(e){await c.query('ROLLBACK');throw e;}finally{c.release();}
}catch(e:any){return NextResponse.json({error:e.message||'Import du logo impossible.'},{status:400});}}
