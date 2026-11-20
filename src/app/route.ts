import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {NextRequest,NextResponse} from 'next/server';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(request:NextRequest){
 // Preserve links from older developer portal sign-in callbacks.
 const auth=request.nextUrl.searchParams.get('auth');
 if(auth){const destination=new URL('/dashboard',process.env.STUDIO_PUBLIC_ORIGIN||request.url);destination.searchParams.set('auth',auth);return NextResponse.redirect(destination,{headers:{'Cache-Control':'no-store'}});}
 const html=await readFile(path.join(process.cwd(),'public/showcase/index.html'),'utf8');
 return new Response(html,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'public, max-age=0, must-revalidate','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; base-uri 'none'; form-action 'self'; frame-ancestors 'none'"}});
}
