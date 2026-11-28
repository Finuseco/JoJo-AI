import {requireProject} from '@/lib/project-access';
import {HostingPanel} from '@/components/hosting/HostingPanel';
export const dynamic='force-dynamic';
export default async function Page({params}:{params:{id:string}}){try{const {project}=await requireProject(Number(params.id));return <HostingPanel projectId={project.id} name={project.name}/>;}catch{return <main className="p-8">Accès au projet requis. <a href="/dashboard">Revenir au tableau de bord</a></main>;}}
