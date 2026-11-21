import {cookies} from 'next/headers';
import {db} from './db';
import {verifyToken} from './jwt';
import type {DevPortalUser} from './types';
export async function studioSession(providedToken?:string) {
  const candidates=providedToken?[providedToken]:[
    cookies().get('dev_portal_token')?.value,
    cookies().get('__Secure-cp_developer_sso')?.value,
  ].filter((value):value is string=>Boolean(value));
  if(!candidates.length)return {success:false as const,reason:'NO_SESSION' as const};
  let decoded:ReturnType<typeof verifyToken>=null;
  for(const candidate of candidates){decoded=verifyToken(candidate);if(decoded)break;}
  if(!decoded)return {success:false as const,reason:'SESSION_INVALID' as const};
  const {rows}=await db.query(`SELECT u.id,u.username,u.email,u.manager_name,u.company_name,u.phone,u.b2b_user_id,to_jsonb(u)->>'profile_photo' AS profile_photo FROM dev_portal_users u WHERE u.id=$1`,[decoded.id]);
  if(!rows[0])return {success:false as const,reason:'IDENTITY_NOT_FOUND' as const};
  if(providedToken)cookies().set('dev_portal_token',providedToken,{path:'/',httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',maxAge:604800});
  return {success:true as const,user:rows[0] as DevPortalUser};
}
export async function requireUser(){const session=await studioSession();if(!session.success||!session.user)throw new Error('Authentification requise.');return session.user;}
