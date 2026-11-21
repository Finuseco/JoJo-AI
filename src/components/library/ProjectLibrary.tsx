'use client';
import {useMemo,useState} from 'react';
import {FileCode,Image as ImageIcon,File as FileIcon,HardDrive,RefreshCw} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {TOTAL_LIMIT,COUNT_LIMIT} from '@/lib/project-files';
type Kind='all'|'code'|'image'|'other';
const IMAGE=/\.(png|jpe?g|webp|gif|svg|ico)$/i,CODE=/\.(tsx?|jsx?|css|scss|html?|json|md|sql|py|php|java|kt|xml|ya?ml|sh|gradle|txt)$/i;
const kindOf=(path:string):Exclude<Kind,'all'>=>IMAGE.test(path)?'image':CODE.test(path)?'code':'other';
export function formatSize(n:number){return n<1024?`${n} o`:n<1048576?`${(n/1024).toFixed(1)} Ko`:`${(n/1048576).toFixed(1)} Mo`;}
/** Bibliothèque du projet : tout ce qui est stocké (code, images générées, autres fichiers) et l'espace utilisé. */
export function ProjectLibrary({files,onOpen,onRefresh}:{files:any[];onOpen:(path:string)=>void;onRefresh:()=>void}){
 const [kind,setKind]=useState<Kind>('all'),[query,setQuery]=useState('');
 const {total,by,rows}=useMemo(()=>{
  const by={code:{n:0,size:0},image:{n:0,size:0},other:{n:0,size:0}};let total=0;
  for(const f of files){const k=kindOf(f.path);by[k].n++;by[k].size+=f.size||0;total+=f.size||0;}
  const rows=files.filter(f=>(kind==='all'||kindOf(f.path)===kind)&&f.path.toLowerCase().includes(query.toLowerCase())).sort((a,b)=>(b.size||0)-(a.size||0));
  return {total,by,rows};
 },[files,kind,query]);
 const percent=Math.min(100,Math.round(total/TOTAL_LIMIT*100));
 const tab=(id:Kind,label:string)=><button key={id} type="button" onClick={()=>setKind(id)} aria-pressed={kind===id} className={`rounded-full border px-3 py-1 text-xs ${kind===id?'border-violet-400 bg-violet-500/20 text-white':'border-white/10 text-zinc-400 hover:text-white'}`}>{label}</button>;
 return <section className="h-full space-y-5 overflow-auto p-4 text-sm sm:p-5">
  <header className="flex items-center gap-2"><HardDrive size={18}/><h2 className="mr-auto text-lg font-semibold">Bibliothèque du projet</h2><Button size="icon" variant="ghost" aria-label="Actualiser la bibliothèque" onClick={onRefresh}><RefreshCw size={16}/></Button></header>
  <div className="rounded-2xl border border-white/10 bg-white/[.03] p-4">
   <div className="flex items-baseline justify-between"><span className="font-medium">{formatSize(total)} utilisés</span><span className="text-xs text-zinc-500">limite du projet : {formatSize(TOTAL_LIMIT)} · {files.length}/{COUNT_LIMIT} fichiers</span></div>
   <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label="Espace utilisé"><div className={`h-full rounded-full ${percent>85?'bg-red-400':'bg-gradient-to-r from-violet-500 to-cyan-400'}`} style={{width:`${Math.max(percent,total?2:0)}%`}}/></div>
   <div className="mt-4 grid grid-cols-3 gap-3 text-center text-xs"><div><FileCode className="mx-auto mb-1 text-violet-400" size={18}/>{by.code.n} code<br/><span className="text-zinc-500">{formatSize(by.code.size)}</span></div><div><ImageIcon className="mx-auto mb-1 text-cyan-400" size={18}/>{by.image.n} images<br/><span className="text-zinc-500">{formatSize(by.image.size)}</span></div><div><FileIcon className="mx-auto mb-1 text-zinc-400" size={18}/>{by.other.n} autres<br/><span className="text-zinc-500">{formatSize(by.other.size)}</span></div></div>
  </div>
  <div className="flex flex-wrap items-center gap-2">{tab('all','Tout')}{tab('code','Code')}{tab('image','Images')}{tab('other','Autres')}<Input className="ml-auto w-full sm:w-56" aria-label="Rechercher dans la bibliothèque" placeholder="Rechercher" value={query} onChange={e=>setQuery(e.target.value)}/></div>
  <ul className="divide-y divide-white/5 rounded-2xl border border-white/10">{rows.map(f=><li key={f.path}><button type="button" onClick={()=>onOpen(f.path)} className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-white/5">{kindOf(f.path)==='image'?<ImageIcon size={14} className="shrink-0 text-cyan-400"/>:kindOf(f.path)==='code'?<FileCode size={14} className="shrink-0 text-violet-400"/>:<FileIcon size={14} className="shrink-0 text-zinc-400"/>}<span className="min-w-0 flex-1 truncate">{f.path}</span><span className="shrink-0 text-xs text-zinc-500">{formatSize(f.size||0)}</span></button></li>)}{!rows.length&&<li className="p-4 text-zinc-500">Aucun fichier.</li>}</ul>
 </section>;
}
