const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path');
const {resolveStaticFile}=require('../server/runtime/static-routing.cjs');
test('published routes support exported HTML and SPA navigation without hiding API/asset errors',async t=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'jojo-routing-'));
 t.after(()=>fs.rm(root,{recursive:true,force:true}));
 await fs.mkdir(path.join(root,'account'));await fs.writeFile(path.join(root,'account/index.html'),'account');
 await fs.writeFile(path.join(root,'index.html'),'app');await fs.writeFile(path.join(root,'contact.html'),'contact');
 const options={spa:true,accept:'text/html'};
 assert.equal(await resolveStaticFile(root,'/account/',options),path.join(root,'account/index.html'));
 assert.equal(await resolveStaticFile(root,'/contact',options),path.join(root,'contact.html'));
 assert.equal(await resolveStaticFile(root,'/orders/42',options),path.join(root,'index.html'));
 for(const uri of ['/missing.js','/api/orders','/%2e%2e/secret','/%5csecret','/%zz','/.env']) assert.equal(await resolveStaticFile(root,uri,options),null,uri);
 assert.equal(await resolveStaticFile(root,'/orders/42',{spa:false,accept:'text/html'}),null);
 assert.equal(await resolveStaticFile(root,'/orders/42',{spa:true,accept:'application/json'}),null);
 await fs.symlink(os.tmpdir(),path.join(root,'escape'));
 assert.equal(await resolveStaticFile(root,'/escape/file.js',options),null);
});
