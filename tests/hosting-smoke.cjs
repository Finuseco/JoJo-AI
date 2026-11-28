// Real temporary worker, no Docker or production DNS needed. No mock services.
const {spawn}=require('node:child_process'),fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
(async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'jojo-hosting-')),key=crypto.randomBytes(32).toString('hex');
 const child=spawn(process.execPath,['server/runtime/server.cjs'],{env:{...process.env,RUNTIME_DATA_DIR:dir,RUNTIME_RUNNER_TOKEN:key,RUNTIME_CONTROL_PORT:'18993',RUNTIME_PUBLIC_PORT:'18992',HOSTING_BASE_DOMAIN:'apps.example.test',HOSTING_PUBLIC_IP:'127.0.0.1'},stdio:'ignore'});
 const call=async(url,body)=>{const r=await fetch('http://127.0.0.1:18993'+url,{method:body?'POST':'GET',headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});return {status:r.status,data:await r.json()};};
 try{
  for(let i=0;i<40;i++){try{await call('/v1/jobs?userId=1&projectId=1');break;}catch{await new Promise(r=>setTimeout(r,100));}}
  const start=await call('/v1/jobs',{userId:1,projectId:1,action:'publish-static',files:[{path:'index.html',content:'<h1>Published test artifact</h1>',encoding:'utf8'}]});assert.equal(start.status,202);
  let state;for(let i=0;i<60;i++){state=(await call('/v1/jobs?userId=1&projectId=1')).data;if(state.jobs[0]?.status==='complete')break;await new Promise(r=>setTimeout(r,100));}
  assert.equal(state.jobs[0].status,'complete');const site=state.site;
  const listing=await call('/v1/site-files?userId=1&projectId=1&siteId='+site.id);assert.equal(listing.status,200);assert.deepEqual(listing.data.files,[{path:'index.html',size:32}]);
  assert.equal((await call('/v1/site-files?userId=2&projectId=1&siteId='+site.id)).status,400);
  assert.equal((await call('/v1/domains',{action:'primary',domain:'customer.example.com',siteId:site.id,userId:1,projectId:1})).status,400);
  const page=await new Promise((resolve,reject)=>require('node:http').get({hostname:'127.0.0.1',port:18992,path:'/',headers:{Host:site.id+'.apps.example.test'}},res=>{let text='';res.on('data',x=>text+=x);res.on('end',()=>resolve({status:res.statusCode,text}));}).on('error',reject));assert.equal(page.status,200);assert.match(page.text,/Published test artifact/);
  console.log('PASS real static publication, file inventory, tenant isolation, unverified primary domain rejection. Public DNS/TLS not exercised.');
 }finally{child.kill('SIGTERM');await new Promise(resolve=>child.once('exit',resolve));await fs.rm(dir,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1;});
