'use server';
import {randomUUID} from 'node:crypto';
import {db} from '../db';
import {requireProject} from '../project-access';
import {studioChat} from '@/ai/flows/studio-chat-flow';
export async function sendChatMessage(projectId:number,message:string,attachments?:{url:string,contentType:string}[],requestId?:string){
 let reserved=false,userId=0;const id=requestId||randomUUID();
 try{
  const {user}=await requireProject(projectId);userId=user.id;
  if(!/^[0-9a-f-]{36}$/.test(id)||typeof message!=='string'||message.length>20000||attachments?.length>4)throw Error('Demande invalide.');
  const c=await db.getConnection();
  try{await c.query('BEGIN');await c.query('SELECT pg_advisory_xact_lock(hashtext($1))',[`generation:${userId}`]);
   const existing=(await c.query('SELECT status,result,user_id,project_id FROM jojo_ai_generation_runs WHERE id=$1',[id])).rows[0];
   if(existing){await c.query('ROLLBACK');if(Number(existing.user_id)!==userId||Number(existing.project_id)!==projectId)throw Error('Demande invalide.');return existing.status==='complete'?existing.result:{success:false,error:existing.status==='reserved'?'Génération déjà en cours.':'Cette génération a échoué. Renvoyez une nouvelle demande.'};}
   if(Number((await c.query("SELECT COUNT(*)::int AS count FROM jojo_ai_generation_runs WHERE user_id=$1 AND status='reserved'",[userId])).rows[0].count)>0)throw Error('Une génération est déjà en cours sur votre compte.');
   const paid=await c.query('UPDATE jojo_ai_credits SET generation_credits=generation_credits-0.05,updated_at=now() WHERE dev_portal_user_id=$1 AND generation_credits>=0.05 RETURNING generation_credits',[userId]);
   if(!paid.rows[0])throw Error('Crédits de génération insuffisants.');
   await c.query("INSERT INTO jojo_ai_generation_runs(id,user_id,project_id,status,units) VALUES($1,$2,$3,'reserved',0.05)",[id,userId,projectId]);await c.query('COMMIT');reserved=true;
  }catch(e){await c.query('ROLLBACK');throw e;}finally{c.release();}
  const history=(await db.query('SELECT role,content FROM jojo_ai_chat_history WHERE project_id=$1 ORDER BY created_at DESC LIMIT 8',[projectId])).rows.reverse();
  const answer=await studioChat({projectId,message,attachments,history:history as any});
  await requireProject(projectId);
  const c2=await db.getConnection();let result:any;
  try{await c2.query('BEGIN');
   const run=(await c2.query("SELECT status FROM jojo_ai_generation_runs WHERE id=$1 FOR UPDATE",[id])).rows[0];if(run?.status!=='reserved')throw Error('Génération déjà clôturée.');
   await c2.query('SELECT id FROM jojo_ai_projects WHERE id=$1 FOR UPDATE',[projectId]);
   const pending=(await c2.query("SELECT COUNT(*)::int AS count,COALESCE(SUM(octet_length(content)),0) AS bytes FROM project_pending_actions WHERE project_id=$1 AND status='pending'",[projectId])).rows[0];
   if(Number(pending.count)+answer.files.length>100||Number(pending.bytes)+answer.files.reduce((n,f)=>n+Buffer.byteLength(f.content),0)>5*1024*1024)throw Error('Validez les modifications en attente avant de continuer.');
   for(const f of answer.files)await c2.query("INSERT INTO project_pending_actions(project_id,file_path,content,status,base_hash) VALUES($1,$2,$3,'pending',$4)",[projectId,f.path,f.content,f.baseHash]);
   await c2.query('INSERT INTO jojo_ai_chat_history(project_id,role,content) VALUES($1,$2,$3),($1,$4,$5)',[projectId,'user',message,'model',answer.message]);
   const balance=(await c2.query('SELECT generation_credits FROM jojo_ai_credits WHERE dev_portal_user_id=$1',[userId])).rows[0];
   result={success:true,text:answer.message,newBalance:Number(balance.generation_credits),refreshFiles:true};
   await c2.query("UPDATE jojo_ai_generation_runs SET status='complete',result=$1::jsonb WHERE id=$2",[JSON.stringify(result),id]);await c2.query('COMMIT');
  }catch(e){await c2.query('ROLLBACK');throw e;}finally{c2.release();}
  return result;
 }catch(error:any){
  if(reserved){let c;try{c=await db.getConnection();await c.query('BEGIN');const refunded=await c.query("UPDATE jojo_ai_generation_runs SET status='failed' WHERE id=$1 AND status='reserved' RETURNING units",[id]);if(refunded.rows[0])await c.query('UPDATE jojo_ai_credits SET generation_credits=generation_credits+$1 WHERE dev_portal_user_id=$2',[refunded.rows[0].units,userId]);await c.query('COMMIT');}catch{await c?.query('ROLLBACK').catch(()=>{});console.error('[Generation] Réconciliation requise pour',id);}finally{c?.release();}}
  return {success:false,error:reserved?'La génération n’a pas abouti. Vérifiez le moteur IA et les crédits ; aucun résultat simulé n’a été créé.':error.message};
 }
}
export async function getChatHistory(projectId:number){try{await requireProject(projectId);const {rows}=await db.query('SELECT role,content,created_at FROM jojo_ai_chat_history WHERE project_id=$1 ORDER BY created_at',[projectId]);return {success:true,history:rows};}catch{return {success:false,history:[]};}}
