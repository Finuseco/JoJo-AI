'use client';
import {useState} from 'react';
import {ArrowRight,FolderCode,Pencil,Copy,Share2,Globe,Lock,Trash2,Loader2} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import {updateProjectDetails,duplicateProject,inviteCollaborator,toggleProjectVisibility,deleteProject} from '@/lib/client/studio-actions';

type Mode=''|'edit'|'share'|'delete';
export function ProjectCard({project,onOpen,onChanged}:{project:any;onOpen:()=>void;onChanged:()=>void}){
 const owner=project.user_role==='owner';
 const [mode,setMode]=useState<Mode>(''),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[error,setError]=useState('');
 const [name,setName]=useState(project.name),[description,setDescription]=useState(project.description||''),[email,setEmail]=useState('');
 function close(){setMode('');setError('');setMessage('');}
 async function run(task:()=>Promise<any>,done?:string){
  setBusy(true);setError('');setMessage('');
  try{const r=await task();if(!r||r.success===false)throw Error(r?.error||'Action impossible.');if(done)setMessage(done);return r;}
  catch(e:any){setError(e.message);return null;}
  finally{setBusy(false);}
 }
 async function save(e:React.FormEvent){e.preventDefault();const r=await run(()=>updateProjectDetails(project.id,name,description));if(r){close();onChanged();}}
 async function duplicate(){const r=await run(()=>duplicateProject(project.id));if(r)onChanged();}
 async function invite(e:React.FormEvent){e.preventDefault();const r=await run(()=>inviteCollaborator(project.id,email.trim()),'Invitation envoyée. La personne doit l’accepter depuis son espace.');if(r)setEmail('');}
 async function visibility(){const r=await run(()=>toggleProjectVisibility(project.id,!project.is_public));if(r)onChanged();}
 async function remove(){const r=await run(()=>deleteProject(project.id));if(r){close();onChanged();}}
 const action='inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-zinc-300 transition hover:border-violet-400/60 hover:text-white disabled:opacity-50';
 return <div className="jojo-project-card group rounded-2xl border border-white/10 bg-white/[.03] p-4 sm:p-5">
  <button type="button" onClick={onOpen} className="block w-full text-left">
   <FolderCode className="mb-3 text-violet-400 sm:mb-5" size={24}/>
   <div className="flex items-center justify-between"><h3 className="truncate pr-3 font-medium">{project.name}</h3><ArrowRight size={16} className="text-zinc-500 group-hover:text-violet-300"/></div>
   <p className="mt-2 line-clamp-2 text-sm text-zinc-500">{project.description||'Projet sans description'}</p>
   <p className="mt-3 text-xs text-zinc-500">{project.app_template} · {owner?'Propriétaire':'Collaborateur'} · {project.is_public?'Public':'Privé'}</p>
  </button>
  {error&&mode===''&&<p role="alert" className="mt-3 text-xs text-red-300">{error}</p>}
  {owner&&<div className="mt-4 flex flex-wrap gap-2 border-t border-white/5 pt-3">
   <button type="button" className={action} onClick={()=>{setName(project.name);setDescription(project.description||'');setMode('edit');}}><Pencil size={13}/>Modifier</button>
   <button type="button" className={action} disabled={busy} onClick={duplicate}>{busy?<Loader2 className="animate-spin" size={13}/>:<Copy size={13}/>}Dupliquer</button>
   <button type="button" className={action} onClick={()=>setMode('share')}><Share2 size={13}/>Partager</button>
   <button type="button" className={action} disabled={busy} onClick={visibility} title="Public : l’aperçu du projet est accessible sans connexion">{project.is_public?<Lock size={13}/>:<Globe size={13}/>}{project.is_public?'Rendre privé':'Rendre public'}</button>
   <button type="button" className={`${action} hover:!border-red-400/60 hover:!text-red-200`} onClick={()=>setMode('delete')}><Trash2 size={13}/>Supprimer</button>
  </div>}
  <Dialog open={mode==='edit'} onOpenChange={o=>!o&&close()}><DialogContent className="w-[calc(100%_-_1.5rem)] rounded-2xl border-white/10 bg-[#191321] text-zinc-100"><DialogHeader><DialogTitle>Modifier le projet</DialogTitle><DialogDescription>Changez le nom et la description affichés dans votre liste.</DialogDescription></DialogHeader>
   <form onSubmit={save} className="space-y-4"><label className="block space-y-2"><span className="text-sm text-zinc-400">Nom</span><Input value={name} maxLength={120} required onChange={e=>setName(e.target.value)}/></label><label className="block space-y-2"><span className="text-sm text-zinc-400">Description</span><textarea className="min-h-24 w-full rounded-lg border border-white/10 bg-black/20 p-3 text-sm" value={description} maxLength={5000} onChange={e=>setDescription(e.target.value)}/></label>{error&&<p role="alert" className="text-sm text-red-300">{error}</p>}<Button className="w-full" disabled={busy||!name.trim()}>{busy?<Loader2 className="animate-spin" size={16}/>:null}Enregistrer</Button></form></DialogContent></Dialog>
  <Dialog open={mode==='share'} onOpenChange={o=>!o&&close()}><DialogContent className="w-[calc(100%_-_1.5rem)] rounded-2xl border-white/10 bg-[#191321] text-zinc-100"><DialogHeader><DialogTitle>Partager « {project.name} »</DialogTitle><DialogDescription>Invitez un autre développeur CashPay avec son adresse e-mail. Il travaillera sur le même projet après avoir accepté l’invitation.</DialogDescription></DialogHeader>
   <form onSubmit={invite} className="space-y-4"><Input type="email" required placeholder="email@exemple.com" value={email} onChange={e=>setEmail(e.target.value)}/>{error&&<p role="alert" className="text-sm text-red-300">{error}</p>}{message&&<p role="status" className="text-sm text-emerald-300">{message}</p>}<Button className="w-full" disabled={busy||!email.trim()}>{busy?<Loader2 className="animate-spin" size={16}/>:<Share2 size={16}/>}Envoyer l’invitation</Button></form>
   <p className="text-xs leading-relaxed text-zinc-500">Pour un accès sans connexion, utilisez « Rendre public » : seul l’aperçu du projet devient visible, pas les fichiers.</p></DialogContent></Dialog>
  <Dialog open={mode==='delete'} onOpenChange={o=>!o&&close()}><DialogContent className="w-[calc(100%_-_1.5rem)] rounded-2xl border-white/10 bg-[#191321] text-zinc-100"><DialogHeader><DialogTitle>Supprimer ce projet ?</DialogTitle><DialogDescription>« {project.name} » et tous ses fichiers seront supprimés définitivement. Exportez-le d’abord en ZIP si vous voulez en garder une copie.</DialogDescription></DialogHeader>
   {error&&<p role="alert" className="text-sm text-red-300">{error}</p>}<div className="flex gap-2"><Button variant="outline" className="flex-1" onClick={close}>Annuler</Button><Button className="flex-1 bg-red-600 text-white hover:bg-red-500" disabled={busy} onClick={remove}>{busy?<Loader2 className="animate-spin" size={16}/>:<Trash2 size={16}/>}Supprimer</Button></div></DialogContent></Dialog>
 </div>;
}
