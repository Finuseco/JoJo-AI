'use client';
import {resolvePreviewAsset} from '@/lib/preview-assets';
import {useEffect,useRef,useState} from 'react';import {useParams} from 'next/navigation';

const MIME:Record<string,string>={png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',svg:'image/svg+xml',webp:'image/webp',gif:'image/gif',ico:'image/x-icon',woff2:'font/woff2',woff:'font/woff',ttf:'font/ttf',mp3:'audio/mpeg',wav:'audio/wav',ogg:'audio/ogg',m4a:'audio/mp4',mp4:'video/mp4',webm:'video/webm',html:'text/html',css:'text/css',js:'text/javascript',json:'application/json',txt:'text/plain'};
const extension=(path:string)=>(path.split('.').pop()||'').toLowerCase();

/** Pont injecté dans la page d'aperçu (iframe isolée) : navigation entre les pages du projet et appels fetch vers ses fichiers. */
function bridgeScript(base:string){
 const source=`(function(){var BASE=${JSON.stringify(base).replace(/</g,'\\u003c')},pending={},seq=0;
function absolute(u){return /^(?:[a-z][a-z0-9+.-]*:|\\/\\/)/i.test(u);}
window.addEventListener('message',function(e){var m=e.data;if(m&&m.type==='jojo-fetch-result'&&pending[m.id]){pending[m.id](m);delete pending[m.id];}});
document.addEventListener('click',function(e){if(e.defaultPrevented||e.button||e.metaKey||e.ctrlKey||e.shiftKey)return;var a=e.target&&e.target.closest?e.target.closest('a[href]'):null;if(!a)return;var h=a.getAttribute('href')||'';
if(!h||h.charAt(0)==='#'||/^(?:mailto:|tel:|javascript:)/i.test(h))return;e.preventDefault();
if(absolute(h)){if(/^https:/i.test(h))parent.postMessage({type:'jojo-open',url:h},'*');return;}
parent.postMessage({type:'jojo-nav',href:h,base:BASE},'*');},true);
var nativeFetch=window.fetch;
window.fetch=function(input,init){var url=typeof input==='string'?input:(input&&input.url)||String(input);if(absolute(url))return nativeFetch.apply(this,arguments);
return new Promise(function(resolve){var id=++seq;pending[id]=function(r){var body=r.b64?Uint8Array.from(atob(r.b64),function(c){return c.charCodeAt(0);}):r.text;resolve(new Response(r.status===204?null:body,{status:r.status,headers:{'Content-Type':r.mime}}));};parent.postMessage({type:'jojo-fetch',id:id,href:url,base:BASE},'*');});};
})();`;
 return source;
}

export default function ProjectPreviewPage(){const {id}=useParams();const [html,setHtml]=useState(''),[published,setPublished]=useState(''),[error,setError]=useState('');
 const files=useRef<Map<string,any>>(new Map()),frame=useRef<HTMLIFrameElement>(null),build=useRef<(entry:any)=>string>(()=> '');
 useEffect(()=>{let active=true;
  const find=(path:string|null)=>path?(files.current.get(path)||files.current.get('public/'+path)||null):null;
  const lookup=(base:string,href:string)=>{const path=resolvePreviewAsset(base,href);if(!path)return null;return find(path)||find(path.replace(/\/$/,'')+'/index.html')||(!/\.[a-z0-9]+$/i.test(path)?find(path+'.html'):null);};
  const resource=(file:any)=>{const encoded=file.encoding==='base64'?file.content:btoa(unescape(encodeURIComponent(file.content)));return `data:${MIME[extension(file.path)]||'application/octet-stream'};base64,${encoded}`;};
  build.current=(entry:any)=>{
   const doc=new DOMParser().parseFromString(entry.content,'text/html');
   for(const script of Array.from(doc.querySelectorAll('script[src]'))){const file=find(resolvePreviewAsset(entry.path,script.getAttribute('src')||''));if(file?.encoding==='utf8'){script.removeAttribute('src');script.textContent=file.content.replace(/<\/script/gi,'<\\/script');}}
   for(const link of Array.from(doc.querySelectorAll('link[rel="stylesheet"]'))){const file=find(resolvePreviewAsset(entry.path,link.getAttribute('href')||''));if(file?.encoding==='utf8'){const style=doc.createElement('style');style.textContent=file.content.replace(/url\(['"]?([^)'" ]+)['"]?\)/g,(all:string,value:string)=>{const asset=find(resolvePreviewAsset(file.path,value));return asset?`url("${resource(asset)}")`:all;});link.replaceWith(style);}}
   for(const style of Array.from(doc.querySelectorAll('style,[style]'))){const inline=style.tagName.toLowerCase()==='style';const css=inline?style.textContent||'':style.getAttribute('style')||'';const content=css.replace(/url\(['"]?([^)'" ]+)['"]?\)/g,(all:string,value:string)=>{const asset=find(resolvePreviewAsset(entry.path,value));return asset?`url("${resource(asset)}")`:all;});if(inline)style.textContent=content;else style.setAttribute('style',content);}
   for(const image of Array.from(doc.querySelectorAll('img[src],video[src],audio[src],source[src]'))){const file=find(resolvePreviewAsset(entry.path,image.getAttribute('src')||''));if(file)image.setAttribute('src',resource(file));}
   const bridge=doc.createElement('script');bridge.textContent=bridgeScript(entry.path);doc.head.prepend(bridge);
   const csp=doc.createElement('meta');csp.httpEquiv='Content-Security-Policy';csp.content="default-src 'none'; script-src 'unsafe-inline' https: data:; style-src 'unsafe-inline' https:; img-src data: https:; connect-src https:; font-src data: https:; media-src data: blob: https:; frame-src 'none'; base-uri 'none'; form-action 'none'";doc.head.prepend(csp);
   return '<!doctype html>'+doc.documentElement.outerHTML;
  };
  const notFound=(path:string)=>`<!doctype html><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'"><body style="font-family:system-ui;padding:32px;color:#222"><h1 style="font-size:20px">Page introuvable dans l’aperçu</h1><p>Le fichier « ${path.replace(/[<>&"]/g,'')} » n’existe pas dans ce projet.</p>`;
  const onMessage=(event:MessageEvent)=>{
   if(event.source!==frame.current?.contentWindow)return;const m=event.data;if(!m||typeof m.type!=='string')return;
   if(m.type==='jojo-open'&&typeof m.url==='string'&&/^https:\/\//i.test(m.url)){window.open(m.url,'_blank','noopener,noreferrer');return;}
   if(m.type==='jojo-nav'&&typeof m.href==='string'&&typeof m.base==='string'){const file=lookup(m.base,m.href);if(file&&extension(file.path)==='html'&&file.encoding==='utf8')setHtml(build.current(file));else setHtml(file?'<!doctype html><meta charset="utf-8"><body style="font-family:system-ui;padding:32px">Ce fichier n’est pas une page.':notFound(m.href));return;}
   if(m.type==='jojo-fetch'&&typeof m.href==='string'&&typeof m.base==='string'&&Number.isSafeInteger(m.id)){
    const file=lookup(m.base,m.href),reply=(body:any)=>(event.source as Window).postMessage({type:'jojo-fetch-result',id:m.id,...body},'*');
    if(!file)reply({status:404,mime:'application/json',text:JSON.stringify({error:'Cet appel cible un serveur : l’aperçu ne contient que les fichiers du projet. Compilez et publiez le projet pour tester son back-end.',url:String(m.href).slice(0,200)})});
    else if(file.encoding==='base64')reply({status:200,mime:MIME[extension(file.path)]||'application/octet-stream',b64:file.content});
    else reply({status:200,mime:MIME[extension(file.path)]||'text/plain',text:file.content});
   }
  };
  window.addEventListener('message',onMessage);
  (async()=>{try{const r=await fetch(`/api/projects/${id}/preview`,{cache:'no-store'}),data=await r.json();if(!r.ok)throw Error(data.error);
   if(data.publishedUrl){const url=new URL(data.publishedUrl);if(url.protocol!=='https:'||url.origin===window.location.origin)throw Error('Hébergement isolé requis.');if(active)setPublished(url.toString());return;}
   if(data.nativeAndroid)throw Error('Projet Android natif : utilisez le panneau Android pour tester son APK. Une WebView nécessite du contenu web.');
   if(data.requiresBuild)throw Error('Compilez et publiez ce projet dans le terminal pour activer son aperçu WebView.');
   files.current=new Map<string,any>(data.files.map((f:any)=>[f.path,f]));const entry=files.current.get('index.html')||files.current.get('public/index.html');
   if(!entry||entry.encoding==='base64')throw Error('Ce projet nécessite une compilation. Lancez le build dans le panneau Exécution puis ouvrez l’adresse publiée.');
   if(active)setHtml(build.current(entry));
  }catch(e:any){if(active)setError(e.message);}})();
  return()=>{active=false;window.removeEventListener('message',onMessage);};},[id]);
 if(error)return <div className="grid min-h-dvh place-items-center bg-zinc-950 p-6 text-center text-zinc-300"><p className="max-w-md">{error}</p></div>;
 if(published)return <iframe title="WebView du projet publié" src={published} sandbox="allow-scripts allow-same-origin allow-forms allow-popups" referrerPolicy="no-referrer" className="h-dvh w-full border-0 bg-white"/>;
 return html?<iframe ref={frame} title="Aperçu isolé du projet" srcDoc={html} sandbox="allow-scripts" referrerPolicy="no-referrer" className="h-dvh w-full border-0 bg-white"/>:<p className="p-6">Chargement de l’aperçu…</p>;
}
