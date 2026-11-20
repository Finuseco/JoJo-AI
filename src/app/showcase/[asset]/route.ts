// Development fallback only. Nginx serves these same files directly in production.
import {readFile} from 'node:fs/promises';
import path from 'node:path';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const types:Record<string,string>={'style.css':'text/css; charset=utf-8','main.js':'application/javascript; charset=utf-8','jojo-ai.png':'image/png','cahier-des-charges.txt':'text/plain; charset=utf-8','project-brief.txt':'text/plain; charset=utf-8'};
export async function GET(_:Request,{params}:{params:{asset:string}}){const type=types[params.asset];if(!type)return new Response('Not found',{status:404});try{return new Response(new Uint8Array(await readFile(path.join(process.cwd(),'showcase',params.asset))),{headers:{'Content-Type':type,'Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'}});}catch{return new Response('Not found',{status:404});}}
