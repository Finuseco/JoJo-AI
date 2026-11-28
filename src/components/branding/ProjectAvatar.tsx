'use client';
import {useState} from 'react';
import {TechnologyIcon} from '@/components/icons/TechnologyIcon';
import {projectTechnology} from '@/lib/technology-icons';
export function ProjectAvatar({project,size=40}:{project:any;size?:number}){
 const [failed,setFailed]=useState(''),[loaded,setLoaded]=useState('');const src=`/api/projects/${project.id}/logo?v=${encodeURIComponent(project.updated_at||'')}`;
 return <span className="relative mb-3 grid shrink-0 place-items-center overflow-hidden rounded-xl border border-white/10 bg-white/5 sm:mb-5" style={{width:size,height:size}}>{loaded!==src&&<TechnologyIcon kind={projectTechnology(project.app_template).icon} size={Math.round(size*.7)}/>}{failed!==src&&<img src={src} alt="" width={size} height={size} className="absolute inset-0 h-full w-full object-contain p-1" style={{opacity:loaded===src?1:0}} onLoad={()=>setLoaded(src)} onError={()=>setFailed(src)}/>}</span>;
}
