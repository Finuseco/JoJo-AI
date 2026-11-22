import {FileCode2,FileText,FileJson,Database,Settings2,Terminal,Archive,Image as ImageIcon,Music2,Video,Newspaper,Landmark,ShoppingBag} from 'lucide-react';
import {fileTechnology} from '@/lib/technology-icons';
const brands=new Set(['react','html5','css3','javascript','typescript','android','kotlin','java','python','php','mysql','postgresql','docker','git','nodejs','npm','markdown','nextjs']);
const symbols:Record<string,typeof FileCode2>={code:FileCode2,document:FileText,json:FileJson,database:Database,config:Settings2,terminal:Terminal,archive:Archive,image:ImageIcon,music:Music2,video:Video,blog:Newspaper,finance:Landmark,shop:ShoppingBag};
export function TechnologyIcon({kind,size=20,className=''}:{kind:string;size?:number;className?:string}){
 if(brands.has(kind))return <img src={`/technology/${kind}.svg`} alt="" aria-hidden="true" width={size} height={size} draggable={false} className={`shrink-0 object-contain ${kind==='markdown'||kind==='nextjs'?'rounded bg-white p-0.5':''} ${className}`} style={{width:size,height:size}}/>;
 const Icon=symbols[kind]||FileCode2;
 return <Icon size={size} aria-hidden="true" className={`shrink-0 text-violet-300 ${className}`}/>;
}
export function FileTypeIcon({path,size=16}:{path:string;size?:number}){return <TechnologyIcon kind={fileTechnology(path)} size={size}/>;}
