'use client';
import {useCallback,useEffect,useState} from 'react';
import {Monitor,Smartphone,Copy,ExternalLink,RefreshCw,Terminal} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {toggleProjectVisibility} from '@/lib/actions/dev-portal.actions';
export function ProjectWebView({projectId,isPublic,isOwner,onPublicChange,onTerminal}:{projectId:number;isPublic:boolean;isOwner:boolean;onPublicChange:(value:boolean)=>void;onTerminal:()=>void}){
 const [size,setSize]=useState<'mobile'|'desktop'>('desktop'),[key,setKey]=useState(0),[data,setData]=useState<any>({}),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false),[origin,setOrigin]=useState('');
 const refresh=useCallback(async()=>{try{const r=await fetch(`/api/projects/${projectId}/runtime`,{cache:'no-store'});if(r.ok)setData(await r.json());}catch{}},[projectId]);
 useEffect(()=>{setOrigin(window.location.origin);refresh();},[refresh]);
 const path=`/p/${projectId}`,link=origin+path;
 return <section className="flex h-full min-h-0 flex-col bg-[#100c17]">
  <div className="shrink-0 space-y-3 border-b border-white/10 p-3 text-xs"><div className="flex flex-wrap items-center gap-2"><strong className="mr-auto text-sm">WebView du projet</strong><div className="flex gap-1" role="group" aria-label="Dimensions de la WebView"><Button size="sm" variant={size==='desktop'?'default':'outline'} onClick={()=>setSize('desktop')}><Monitor size={14}/> Desktop</Button><Button size="sm" variant={size==='mobile'?'default':'outline'} onClick={()=>setSize('mobile')}><Smartphone size={14}/> Mobile</Button></div><Button size="icon" variant="ghost" aria-label="Actualiser la WebView" onClick={()=>{setKey(k=>k+1);refresh();}}><RefreshCw size={15}/></Button></div>
   <div className="flex min-w-0 flex-wrap items-center gap-2 rounded-lg border border-white/10 bg-black/20 p-2"><code className="min-w-0 flex-1 break-all text-violet-300">{link||path}</code><Button size="sm" variant="ghost" onClick={async()=>{try{await navigator.clipboard.writeText(link);setNotice('Lien WebView copié.');}catch{setNotice('Sélectionnez le lien pour le copier.');}}}><Copy size={14}/> Copier</Button><a href={path} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 px-2 text-violet-300"><ExternalLink size={14}/> Ouvrir</a></div>
   <div className="flex flex-wrap items-center gap-3"><label className="flex items-center gap-2"><input type="checkbox" checked={isPublic} disabled={!isOwner||busy} onChange={async e=>{const value=e.target.checked;setBusy(true);const result=await toggleProjectVisibility(projectId,value);if(result.success){onPublicChange(value);setKey(k=>k+1);setNotice(value?'Lien public activé : accessible sans session développeur.':'Aperçu réservé aux membres du projet.');}else setNotice(result.error||'Activation refusée.');setBusy(false);}}/> Activer le lien public pour une WebView externe</label><Button size="sm" variant="outline" onClick={onTerminal}><Terminal size={14}/> Ouvrir le terminal</Button></div>
   <p className="text-zinc-400">{isPublic?'Le lien peut être ouvert sans connexion.':'Le lien exige une session membre. Activez l’accès public pour une WebView Android sans session.'} Le ZIP source reste privé. Les projets React doivent être compilés et publiés ; le terminal gère leur publication. Les interfaces Android natives se testent dans le panneau Android.</p>
   {data.site&&<p className="break-all text-zinc-400">Version publiée : <a href={data.site.url} target="_blank" rel="noreferrer" className="text-violet-300 underline">{data.site.url}</a>. Cette adresse de publication reste publique même si l’aperçu du studio est privé.</p>}
   {notice&&<p role="status" className="text-violet-200">{notice}</p>}
  </div>
  <div className="min-h-0 flex-1 overflow-auto p-2 sm:p-4"><div className={`mx-auto h-full min-h-64 overflow-hidden rounded-lg border border-white/15 bg-white ${size==='mobile'?'w-full max-w-[390px]':'w-full'}`}><iframe key={key} src={path} title="WebView et aperçu du projet" className="h-full w-full border-0" sandbox="allow-scripts allow-same-origin allow-forms allow-popups" referrerPolicy="no-referrer"/></div></div>
 </section>;
}
