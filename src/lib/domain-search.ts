import {domainToASCII} from 'node:url';
import {randomUUID} from 'node:crypto';
import {limitedBody} from './http-limits';
export class DomainSearchError extends Error {constructor(message:string,public status=502,public retryAfter=0){super(message);}}
export function domainSearchConfigured(){return Boolean(process.env.DOMAIN_API_KEY?.trim()&&process.env.DOMAIN_API_RESELLER_ID?.trim());}
export function searchNames(input:unknown):string[]{
 if(typeof input!=='string'||input.length>253)throw new DomainSearchError('Saisissez un nom de domaine.',400);
 if(/[\s/:?#@\\%]/.test(input.trim()))throw new DomainSearchError('Saisissez le domaine sans URL ni chemin.',400);
 const name=domainToASCII(input.trim().toLowerCase());
 if(!name||name.length>63||!name.split('.').every(x=>/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(x)))throw new DomainSearchError('Nom invalide : saisissez le nom sans https:// ni chemin.',400);
 return name.includes('.')?[name]:['com','net','fr'].map(tld=>name+'.'+tld);
}
/** Mark up the live quote once. Never substitute catalogue examples for a missing quote. */
export function domainRetailQuote(info:any){
 if(info?.status!=='AVAILABLE'||typeof info.price!=='number'||!Number.isFinite(info.price)||info.price<=0||info.price>1e9||typeof info.currency!=='string'||!['USD','EUR','TRY','GBP'].includes(info.currency)||!Number.isInteger(info.period)||info.period<1||info.period>10)return null;
 // Supported provider currencies use cents. Round half up after applying the 15% markup.
 const amount=Math.round(info.price*115+1e-8)/100;
 return {amount,currency:info.currency,periodYears:info.period,markupPercent:15};
}
export function normalizeSearchResults(names:string[],payload:any){
 if(!Array.isArray(payload?.infos))throw new DomainSearchError('Réponse du fournisseur illisible. Disponibilité non vérifiée.');
 return names.map(domain=>{const matches=payload.infos.filter((x:any)=>typeof x?.domainName==='string'&&x.domainName.toLowerCase()===domain);const info=matches.length===1?matches[0]:null;
 const status=['AVAILABLE','NOTAVAILABLE'].includes(info?.status)?info.status:'UNKNOWN';
 return {domain,status,quote:domainRetailQuote(info),premium:info?.isPremium===true,documentsRequired:info?.isDocumentRequired===true};
 });
}
export async function searchDomains(input:unknown){
 const names=searchNames(input);if(!domainSearchConfigured())throw new DomainSearchError('Recherche de domaines non configurée.',503);
 const correlationId=randomUUID();let response:Response;
 try{response=await fetch('https://api.domainresellerapi.com/api/v1/domains/bulk-search',{method:'POST',headers:{'Content-Type':'application/json','X-API-KEY':process.env.DOMAIN_API_KEY!,'__reseller':process.env.DOMAIN_API_RESELLER_ID!,'X-Correlation-ID':correlationId},body:JSON.stringify(names.map(domainName=>({domainName}))),cache:'no-store',redirect:'error',signal:AbortSignal.timeout(20000)});}catch{throw new DomainSearchError(`Fournisseur injoignable. Référence : ${correlationId}`);}
 if(response.status===429){const retry=Math.min(300,Math.max(1,Number(response.headers.get('retry-after'))||5));throw new DomainSearchError('Trop de recherches. Réessayez dans quelques secondes.',429,retry);}
 if(response.status===401)throw new DomainSearchError('Connexion au fournisseur refusée. Vérifiez les identifiants revendeur côté serveur.',503);
 if(!response.ok){
  let code='';try{const data=JSON.parse((await limitedBody(response,32768)).toString());code=data?.error?.code||'';}catch{}
  const errors:Record<string,string>={'DnaValidationError':'Nom de domaine invalide.','Dna.DomainService:Domain:10005':'Nom de domaine invalide.','Dna.DomainService:Domain:10004':'Extension non proposée par le fournisseur.','Dna.DomainService:Domain:10017':'Registre momentanément indisponible.','Dna.DomainService:Price:10001':'Tarification de cette extension non configurée chez le fournisseur.'};
  throw new DomainSearchError(`${errors[code]||'Recherche indisponible (HTTP '+response.status+').' } Référence : ${correlationId}`,errors[code]&&response.status===400?400:502);
 }
 let payload;try{payload=JSON.parse((await limitedBody(response,128*1024)).toString());}catch{throw new DomainSearchError('Réponse fournisseur invalide. Disponibilité non vérifiée.');}
 return {results:normalizeSearchResults(names,payload),checkedAt:new Date().toISOString(),correlationId};
}
// Bounded per-process guard; provider limits remain authoritative across PM2 workers.
const recent=new Map<number,number>();let lastGlobal=0;
export function allowDomainSearch(userId:number,now=Date.now()){
 for(const [id,time] of recent)if(now-time>60000)recent.delete(id);
 if(now-(recent.get(userId)||0)<5000||now-lastGlobal<600||recent.size>=10000)throw new DomainSearchError('Veuillez patienter avant une nouvelle recherche.',429,5);
 recent.set(userId,now);lastGlobal=now;
}
