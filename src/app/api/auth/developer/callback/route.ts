import {NextRequest,NextResponse} from 'next/server';
import {cookies} from 'next/headers';
import {createHash} from 'node:crypto';
import {db} from '@/lib/db';
import {sessionFromGrant} from '@/lib/developer-handoff';
import {studioSession} from '@/lib/auth';
export const dynamic='force-dynamic';
export async function GET(request:NextRequest){const stateName=process.env.NODE_ENV==='production'?'__Host-jojo_sso_state':'jojo_sso_state',state=cookies().get(stateName)?.value,code=request.nextUrl.searchParams.get('code');let target='/dashboard';let session:{token:string,maxAge:number}|undefined;
 try{if(!state||!code||!/^[A-Za-z0-9_-]{43}$/.test(code))throw Error('Invalid handoff');const challenge=createHash('sha256').update(state).digest('hex');const row=(await db.query('DELETE FROM jojo_ai_sso_codes WHERE code_hash=$1 AND challenge=$2 AND expires_at>NOW() RETURNING grant_token',[createHash('sha256').update(code).digest('hex'),challenge])).rows[0];if(!row)throw Error('Invalid or expired handoff');session=sessionFromGrant(row.grant_token,challenge,process.env.JOJO_AUTH_JWT_SECRET||process.env.JWT_SECRET||'');const identity=await studioSession(session.token);if(!identity.success)throw Error('Developer identity unavailable');}catch{session=undefined;target='/dashboard?auth=handoff_failed';console.error('[jojo-sso] callback failed: verify shared database, schema and signing secret');}
 const response=NextResponse.redirect(new URL(target,process.env.STUDIO_PUBLIC_ORIGIN||'https://ai.cashpay-all.com'),{headers:{'Cache-Control':'no-store','Referrer-Policy':'no-referrer'}});response.cookies.set(stateName,'',{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:0});if(session)response.cookies.set('dev_portal_token',session.token,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:session.maxAge});return response;}
