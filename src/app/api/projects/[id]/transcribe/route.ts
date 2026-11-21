import {NextResponse} from 'next/server';
import {requireProject} from '@/lib/project-access';
import {openaiSettings} from '@/lib/openai-settings';
import {sameOrigin,limitedBody} from '@/lib/http-limits';
export const dynamic='force-dynamic';
const TYPES:Record<string,string>={'audio/webm':'webm','audio/ogg':'ogg','audio/mp4':'m4a','audio/mpeg':'mp3','audio/wav':'wav','audio/x-wav':'wav'};
/** Dictée vocale : transcription par l'API OpenAI, avec la clé du compte (personnelle ou partagée). */
export async function POST(request:Request,{params}:{params:{id:string}}){
 try{
  sameOrigin(request);
  const {user}=await requireProject(Number(params.id));
  const type=(request.headers.get('content-type')||'').split(';')[0].trim().toLowerCase();
  if(!TYPES[type])throw Error('Format audio non pris en charge.');
  const audio=await limitedBody(request,8*1024*1024);
  if(audio.length<800)throw Error('Enregistrement trop court.');
  const settings=await openaiSettings(user.id);
  const form=new FormData();
  form.append('file',new Blob([audio],{type}),`dictee.${TYPES[type]}`);
  form.append('model',process.env.OPENAI_TRANSCRIBE_MODEL||'gpt-4o-transcribe');
  form.append('response_format','json');
  form.append('prompt','Transcris fidèlement la demande d’un client à un assistant de développement d’applications. Corrige la ponctuation et les mots mal reconnus, sans rien ajouter ni reformuler.');
  const response=await fetch('https://api.openai.com/v1/audio/transcriptions',{method:'POST',headers:{Authorization:`Bearer ${settings.apiKey}`},body:form,redirect:'error',signal:AbortSignal.timeout(60000),cache:'no-store'});
  if(!response.ok)throw Error(response.status===401||response.status===403?'Accès OpenAI refusé pour la transcription.':response.status===429?'Quota OpenAI atteint.':'La transcription a échoué. Vérifiez le modèle OPENAI_TRANSCRIBE_MODEL.');
  const data=await response.json();
  const text=typeof data.text==='string'?data.text.trim().slice(0,20000):'';
  if(!text)throw Error('Aucune parole détectée.');
  return NextResponse.json({success:true,text},{headers:{'Cache-Control':'private,no-store'}});
 }catch(e:any){return NextResponse.json({success:false,error:e.message},{status:400});}
}
