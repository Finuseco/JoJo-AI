import {randomUUID} from 'node:crypto';
import {NextResponse} from 'next/server';
import {db} from '@/lib/db';import {requireProject} from '@/lib/project-access';
import {previewFiles} from '@/lib/preview-assets';import {runtimeRunner} from '@/lib/runtime-runner';
export const dynamic='force-dynamic';
export async function GET(_:Request,{params}:{params:{id:string}}){try{
 const id=Number(params.id);if(!Number.isSafeInteger(id)||id<1)return NextResponse.json({code:'INVALID_PROJECT',error:'Identifiant de projet invalide.'},{status:400});
 const project=(await db.query('SELECT is_public,dev_portal_user_id,app_template FROM jojo_ai_projects WHERE id=$1',[id])).rows[0];if(!project)return NextResponse.json({code:'PROJECT_NOT_FOUND',error:'Projet introuvable.'},{status:404});
 let member=false;try{await requireProject(id);member=true;}catch{}if(!project.is_public&&!member)return NextResponse.json({code:'PREVIEW_ACCESS_REQUIRED',error:'Connectez-vous avec un compte membre de ce projet, ou demandez au propriétaire d’activer son lien public.'},{status:403,headers:{'Cache-Control':'no-store'}});
 let publishedUrl:string|null=null;let runtimeStatus=process.env.RUNTIME_RUNNER_URL?'available':'not_configured';let latestJob:any=null;
 if(process.env.RUNTIME_RUNNER_URL){try{const state=await runtimeRunner(`/v1/jobs?userId=${project.dev_portal_user_id}&projectId=${id}`);latestJob=state.jobs?.[0];if(state.site?.url){const primary=state.site.primaryDomain,selected=primary&&state.site.domains?.[primary]?.verified?'https://'+primary:state.site.url;const url=new URL(selected),studio=new URL(process.env.STUDIO_PUBLIC_ORIGIN||'http://localhost');if(url.protocol==='https:'&&url.origin!==studio.origin)publishedUrl=url.toString();}}catch{runtimeStatus='unavailable';}}
 if(publishedUrl)return NextResponse.json({publishedUrl,files:[],requiresBuild:false},{headers:{'Cache-Control':'private,no-store'}});
 const {rows}=await db.query('SELECT file_path AS path,file_content AS content,file_encoding AS encoding FROM jojo_ai_project_files WHERE project_id=$1 ORDER BY file_path',[id]);
 let requiresBuild=false;try{requiresBuild=Boolean(JSON.parse(rows.find(f=>f.path==='package.json')?.content||'{}').scripts?.build);}catch{}
 if(/<script[^>]+(?:type=["']module|src=["'][^"']+\.tsx?)/i.test(rows.find(f=>f.path==='index.html'||f.path==='public/index.html')?.content||''))requiresBuild=true;
 return NextResponse.json({files:previewFiles(rows,member),requiresBuild,...(member?{diagnostics:{runtimeStatus,latestJob:latestJob?{id:latestJob.id,action:latestJob.action,status:latestJob.status,error:latestJob.error||null}:null}}:{}),nativeAndroid:['android','react-native'].includes(project.app_template)&&!rows.some(f=>f.path==='index.html'||f.path==='public/index.html')},{headers:{'Cache-Control':'private,no-store'}});
}catch(e){const reference=randomUUID();console.error('Preview service error',reference,e instanceof Error?e.name:'unknown');return NextResponse.json({code:'PREVIEW_SERVICE_UNAVAILABLE',error:'Service d’aperçu indisponible. Ce problème ne signifie pas que le projet est privé.',reference},{status:503,headers:{'Cache-Control':'no-store'}});}}
