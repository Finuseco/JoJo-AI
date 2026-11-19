const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
const jwt=require('jsonwebtoken');
const Module=require('node:module');

test('developer SSO verifies role, signature and expiry',()=>{
 const filename=require('node:path').resolve('src/lib/jwt.ts');
 const mod=new Module(filename,module);mod.filename=filename;mod.paths=module.paths;
 mod._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText,filename);
 const before=process.env.JOJO_AUTH_JWT_SECRET;
 process.env.JOJO_AUTH_JWT_SECRET='test-only-sso-secret-with-more-than-32-characters';
 try {
 const sign=(payload,secret=process.env.JOJO_AUTH_JWT_SECRET)=>jwt.sign(payload,secret,{algorithm:'HS256'});
 assert.equal(mod.exports.verifyToken(sign({id:1,role:'Developer',exp:Math.floor(Date.now()/1000)+60})).id,1);
 assert.equal(mod.exports.verifyToken(sign({id:1,role:'Client'})),null);
 assert.equal(mod.exports.verifyToken(sign({id:1,role:'Developer',exp:1})),null);
 assert.equal(mod.exports.verifyToken(sign({id:1,role:'Developer'},'another-secret')),null);
 } finally {if(before===undefined)delete process.env.JOJO_AUTH_JWT_SECRET;else process.env.JOJO_AUTH_JWT_SECRET=before;}
});
