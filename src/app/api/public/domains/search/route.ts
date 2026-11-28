import {sameOrigin,limitedBody} from '@/lib/http-limits';
import {domainSearchConfigured,searchDomains,allowDomainSearch,DomainSearchError} from '@/lib/domain-search';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'no-store'};
export async function GET(){return Response.json({configured:domainSearchConfigured(),purchasesEnabled:false},{headers});}
export async function POST(request:Request){
 try{sameOrigin(request);}catch{return Response.json({error:'Origine refusée.'},{status:403,headers});}
 try{
  // Public visitors share a bounded quota per process; never trust caller IP headers.
  allowDomainSearch(-1);
  const input=JSON.parse((await limitedBody(request,2048)).toString());
  return Response.json(await searchDomains(input.name),{headers});
 }catch(e){const known=e instanceof DomainSearchError;return Response.json({error:known?e.message:'Requête invalide.'},{status:known?e.status:400,headers:{...headers,...(known&&e.retryAfter?{'Retry-After':String(e.retryAfter)}:{})}});}
}
