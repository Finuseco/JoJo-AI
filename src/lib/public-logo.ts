import https from 'node:https';
import net from 'node:net';
import {safeLookup} from './web-reader';
export function publicLogoUrl(value:string){
 const url=new URL(value);
 if(url.protocol!=='https:'||url.username||url.password||(url.port&&url.port!=='443')||net.isIP(url.hostname)||url.hostname.startsWith('['))throw Error('Utilisez un lien HTTPS public vers une image.');
 if(url.hostname==='github.com'&&/^\/[^/]+\/[^/]+\/blob\//.test(url.pathname)){url.hostname='raw.githubusercontent.com';url.pathname=url.pathname.replace('/blob/','/');url.search='';}
 return url;
}
export function downloadPublicLogo(value:string,hops=0):Promise<Buffer>{
 return new Promise((resolve,reject)=>{
  let url:URL;try{url=publicLogoUrl(value);}catch(e){reject(e);return;}
  const req=https.get(url,{lookup:safeLookup,headers:{Accept:'image/png','User-Agent':'JoJoAI-Logo/1.0'}},res=>{
   if(res.statusCode&&res.statusCode>=300&&res.statusCode<400&&res.headers.location){res.resume();if(hops>=3){reject(Error('Trop de redirections.'));return;}try{resolve(downloadPublicLogo(new URL(res.headers.location,url).href,hops+1));}catch(e){reject(e);}return;}
   if(res.statusCode!==200){res.resume();reject(Error('Image inaccessible. Téléchargez le fichier depuis votre service puis importez-le ici.'));return;}
   if(String(res.headers['content-type']).includes('text/html')){res.resume();reject(Error('Ce lien ouvre une page de partage. Fournissez un lien direct vers le PNG, ou téléchargez et importez le fichier.'));return;}
   let size=0;const chunks:Buffer[]=[];
   res.on('data',(chunk:Buffer)=>{size+=chunk.length;if(size>3*1024*1024){req.destroy(Error('Image trop volumineuse.'));return;}chunks.push(chunk);});
   res.on('end',()=>resolve(Buffer.concat(chunks)));res.on('error',reject);
  });
  const timer=setTimeout(()=>req.destroy(Error('Téléchargement trop long.')),10000);req.on('close',()=>clearTimeout(timer));req.on('error',reject);
 });
}
