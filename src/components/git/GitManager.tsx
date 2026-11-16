'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import {Github,Download,Upload,GitCommit,RefreshCw,FolderGit2} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
interface Repository {name:string;private:boolean;branch:string;canPush:boolean}
export function GitManager({projectId,onRefresh,hasUnsavedChanges=false}:{projectId:number;onRefresh?:()=>void;hasUnsavedChanges?:boolean}){
 const [data,setData]=useState<any>({}),[repo,setRepo]=useState(''),[branch,setBranch]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false),[notice,setNotice]=useState(''),[conflicts,setConflicts]=useState<string[]>([]);
 const [repositories,setRepositories]=useState<Repository[]>([]),[page,setPage]=useState(0),[hasMore,setMore]=useState(false),[query,setQuery]=useState('');
 const file=useRef<HTMLInputElement>(null),url=`/api/projects/${projectId}/github`;
 const refresh=useCallback(async()=>{try{const r=await fetch(url,{cache:'no-store'}),result=await r.json();if(!r.ok)throw Error(result.error);setData(result);}catch(e:any){setNotice(e.message);}},[url]);
 useEffect(()=>{refresh();},[refresh]);
 async function browse(nextPage=1){setBusy(true);setNotice('');try{const response=await fetch(`/api/integrations/github/repositories?page=${nextPage}`,{cache:'no-store'}),result=await response.json();if(!response.ok)throw Error(result.error);setRepositories(r=>nextPage===1?result.repositories:[...r,...result.repositories]);setPage(nextPage);setMore(result.hasMore);}catch(e:any){setNotice(e.message);}finally{setBusy(false);}}
 async function execute(action:string,zip?:File){
  if(hasUnsavedChanges){setNotice('Enregistrez les fichiers ouverts avant une opération GitHub ou ZIP.');return;}
  setBusy(true);setNotice('');setConflicts([]);
  try{const response=await fetch(zip?`/api/projects/${projectId}/archive`:url,{method:'POST',headers:{'Content-Type':zip?'application/zip':'application/json'},body:zip||JSON.stringify({action,repository:repo,branch,message})});
   const result=await response.json();if(!response.ok){setConflicts(result.conflicts||[]);throw Error(result.error);}
   setNotice(result.unchanged?'La branche distante est déjà à jour.':result.synchronized?`Espace synchronisé · ${result.count} fichiers. Vos modifications locales sans conflit sont conservées.`:result.sha?`Commit publié : ${result.sha.slice(0,8)}`:`${result.count} fichiers importés · ${result.skipped||0} fichiers exclus`);
   if(!result.unchanged)onRefresh?.();await refresh();
  }catch(e:any){setNotice(e.message);}finally{setBusy(false);if(file.current)file.current.value='';}
 }
 const disabled=busy||hasUnsavedChanges;
 return <section className="h-full space-y-5 overflow-y-auto p-5 text-sm">
  <div className="flex items-center justify-between gap-2"><h2 className="flex items-center gap-2 font-semibold"><Github size={18}/> GitHub et fichiers</h2><Button size="icon" variant="ghost" onClick={refresh} aria-label="Actualiser GitHub"><RefreshCw size={16}/></Button></div>
  <p className="text-zinc-400">Importez un dépôt dans un projet vide, travaillez dans le studio puis récupérez ou publiez les modifications. Le code n’est jamais exécuté pendant l’import.</p>
  {hasUnsavedChanges&&<p className="rounded-lg border border-amber-400/30 p-3 text-amber-200">Enregistrez vos fichiers ouverts pour activer la synchronisation.</p>}
  <a className="inline-flex items-center gap-2 text-violet-300 underline" href="/api/integrations/github/connect"><Github size={16}/>{data.connected?`GitHub : ${data.connected}`:'Connecter GitHub'}</a>
  <p className="text-xs text-zinc-500">Cette application OAuth demande l’accès aux dépôts publics et privés autorisés par votre compte et votre organisation. Elle ne demande pas vos identifiants GitHub dans le studio.</p>
  {data.link?<div className="space-y-3 rounded-xl border border-white/10 p-4"><p className="break-all font-medium">{data.link.repository}</p><p className="text-zinc-400">{data.link.branch} · {data.link.base_sha?.slice(0,8)}</p><Button disabled={disabled} variant="outline" onClick={()=>execute('pull')}><Download size={16}/> Récupérer les changements GitHub</Button><p className="text-xs text-zinc-500">Une comparaison avec la version importée préserve les changements indépendants. En cas de conflit sur un fichier, aucun fichier n’est remplacé.</p></div>:<div className="space-y-3">
   {data.connected&&<><Button disabled={busy} variant="outline" onClick={()=>browse()}><FolderGit2 size={16}/> Parcourir mes dépôts</Button>{repositories.length>0&&<><Input aria-label="Filtrer les dépôts" placeholder="Filtrer les dépôts chargés" value={query} onChange={e=>setQuery(e.target.value)}/><div className="max-h-64 space-y-2 overflow-auto">{repositories.filter(r=>r.name.toLowerCase().includes(query.toLowerCase())).map(r=><label key={r.name} className="flex items-start gap-3 rounded-lg border border-white/10 p-3"><input className="mt-1" type="radio" name="repository" checked={repo===r.name} onChange={()=>{setRepo(r.name);setBranch(r.branch);}}/><span className="min-w-0 break-all">{r.name}<span className="mt-1 block text-xs text-zinc-500">{r.private?'Privé':'Public'} · {r.canPush?'Écriture autorisée':'Lecture seule'}</span></span></label>)}</div></>}{hasMore&&<Button variant="ghost" disabled={busy} onClick={()=>browse(page+1)}>Charger d’autres dépôts</Button>}</>}
   <label className="block">Dépôt GitHub<Input value={repo} onChange={e=>setRepo(e.target.value)} placeholder="https://github.com/proprietaire/depot"/></label>
   <label className="block">Branche (facultatif)<Input value={branch} onChange={e=>setBranch(e.target.value)} placeholder="Branche par défaut"/></label>
   <Button disabled={disabled||!repo} onClick={()=>execute('import')}><Download size={16}/> Importer le dépôt</Button>
  </div>}
  <div className="flex flex-wrap gap-2"><Button variant="outline" disabled={disabled} onClick={()=>file.current?.click()}><Upload size={16}/> Importer un ZIP</Button><a className="rounded-md border border-white/20 px-3 py-2" href={`/api/projects/${projectId}/archive`}>Télécharger le ZIP</a><input ref={file} className="hidden" type="file" accept=".zip" onChange={e=>{const f=e.target.files?.[0];if(f)execute('zip',f);}}/></div>
  {data.link&&<div className="space-y-2"><label>Message du commit<Input value={message} maxLength={500} onChange={e=>setMessage(e.target.value)} placeholder="Décrire les modifications enregistrées"/></label><Button disabled={disabled||!message||!data.connected} onClick={()=>execute('push')}><GitCommit size={16}/> Publier le commit</Button><p className="text-xs text-zinc-500">Une branche distante modifiée bloque la publication. Aucun push forcé.</p></div>}
  {notice&&<p role="status" className="rounded-lg border border-violet-500/30 p-3 text-violet-200">{notice}</p>}
  {conflicts.length>0&&<div className="space-y-2 rounded-lg border border-amber-500/30 p-3"><h3 className="font-medium text-amber-200">Fichiers à résoudre</h3>{conflicts.map(path=><p key={path} className="break-all font-mono text-xs">{path}</p>)}<p className="text-xs text-zinc-400">Exportez le ZIP local, comparez avec GitHub puis enregistrez la version voulue avant de récupérer à nouveau.</p></div>}
  <div className="space-y-3"><h3 className="font-medium">Historique GitHub</h3>{(data.commits||[]).map((c:any)=><a key={c.sha} href={c.url} target="_blank" rel="noreferrer" className="block rounded-lg border border-white/10 p-3"><p className="truncate">{c.message}</p><p className="text-xs text-zinc-500">{c.sha.slice(0,8)} · {new Date(c.date).toLocaleString()}</p></a>)}{!data.commits?.length&&<p className="text-zinc-500">Aucun historique chargé.</p>}</div>
 </section>;
}
