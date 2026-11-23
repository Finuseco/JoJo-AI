import {NextResponse} from 'next/server';
import {studioSession} from '@/lib/auth';
import {generationBalance} from '@/lib/generation-ledger';
export const dynamic='force-dynamic';
export async function GET(){const headers={'Cache-Control':'private,no-store'};try{const session=await studioSession();if(!session.success)return NextResponse.json({error:'Session requise.',reason:session.reason},{status:401,headers});let credits=null;try{credits=await generationBalance(session.user.id);}catch{console.error('[Studio quotas] Credits unavailable; authenticated identity preserved.');}return NextResponse.json({user:session.user,credits,creditsAvailable:credits!==null,apiVersion:'v1'},{headers});}catch{return NextResponse.json({error:'Vérification du compte indisponible.',reason:'SESSION_SERVICE_UNAVAILABLE'},{status:503,headers});}}
