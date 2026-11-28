import {requireUser} from '@/lib/auth';
import {sameOrigin,limitedBody} from '@/lib/http-limits';
import {domainSearchConfigured,searchDomains,allowDomainSearch,DomainSearchError} from '@/lib/domain-search';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'private,no-store'};
export async function GET(){try{await requireUser();return Response.json({configured:domainSearchConfigured(),purchasesEnabled:false},{headers});}catch{return Response.json({error:'Authentification requise.'},{status:401,headers});}}
export async function POST(request:Request){
 let user;try{user=await requireUser();}catch{return Response.json({error:'Authentification requise.'},{status:401,headers});}
 try{sameOrigin(request);}catch{return Response.json({error:'Origine refusée.'},{status:403,headers});}
 try{const input=JSON.parse((await limitedBody(request,2048)).toString());allowDomainSearch(user.id);return Response.json(await searchDomains(input.name),{headers});}
 catch(e){const known=e instanceof DomainSearchError;return Response.json({error:known?e.message:'Requête invalide.'},{status:known?e.status:400,headers:{...headers,...(known&&e.retryAfter?{'Retry-After':String(e.retryAfter)}:{})}});}
}
