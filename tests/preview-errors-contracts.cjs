const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
function route({query,member=false,worker=async()=>{throw Error('offline');}}){
 const exports={},code=ts.transpileModule(fs.readFileSync('src/app/api/projects/[id]/preview/route.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 vm.runInNewContext(code,{exports,process:{env:{RUNTIME_RUNNER_URL:'http://localhost',STUDIO_PUBLIC_ORIGIN:'https://studio.example'}},URL,console:{error(){}},require(name){return name==='node:crypto'?require(name):name==='next/server'?{NextResponse:{json:(body,options)=>({body,status:options?.status||200})}}:name==='@/lib/db'?{db:{query}}:name==='@/lib/project-access'?{requireProject:async()=>{if(!member)throw Error('auth');}}:name==='@/lib/runtime-runner'?{runtimeRunner:worker}:{previewFiles:files=>files};}});
 return exports.GET({}, {params:{id:'1'}});
}
test('database failures are service errors, not false private-project responses',async()=>{
 const r=await route({query:async()=>{throw Error('database failed');}});assert.equal(r.status,503);assert.equal(r.body.code,'PREVIEW_SERVICE_UNAVAILABLE');assert.ok(r.body.reference);
});
test('private access denied and missing project are distinct',async()=>{
 assert.equal((await route({query:async()=>({rows:[{is_public:false}]})})).status,403);
 assert.equal((await route({query:async()=>({rows:[]})})).status,404);
});
test('public project does not require a member session and build failure is not privacy',async()=>{
 let calls=0;const r=await route({query:async()=>({rows:++calls===1?[{is_public:true,app_template:'react'}]:[{path:'package.json',content:'{"scripts":{"build":"vite build"}}',encoding:'utf8'}]})});assert.equal(r.status,200);assert.equal(r.body.requiresBuild,true);assert.equal(r.body.diagnostics,undefined);
});
test('members see worker failures and verified custom URL is used',async()=>{
 let calls=0;const r=await route({member:true,query:async()=>({rows:++calls===1?[{is_public:false}]:[]})});assert.equal(r.status,200);assert.equal(r.body.diagnostics.runtimeStatus,'unavailable');
 const published=await route({member:true,query:async()=>({rows:[{is_public:false}]}),worker:async()=>({site:{url:'https://base.example',primaryDomain:'news.example',domains:{'news.example':{verified:true}}}})});assert.equal(published.body.publishedUrl,'https://news.example/');
});
