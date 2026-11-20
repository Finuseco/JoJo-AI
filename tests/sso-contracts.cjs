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

test('handoff rejects wrong browser challenge, audience, expiry and signing secret',()=>{
 const filename=require('node:path').resolve('src/lib/developer-handoff.ts');const mod=new Module(filename,module);mod.filename=filename;mod.paths=module.paths;mod._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText,filename);
 const secret='handoff-test-secret-longer-than-32-characters',challenge='a'.repeat(64),now=Math.floor(Date.now()/1000);
 const grant=(p={},options={})=>jwt.sign({id:1,role:'Developer',challenge,sessionExp:now+500,...p},secret,{algorithm:'HS256',expiresIn:60,issuer:'https://developer.cashpay-all.com',audience:'https://ai.cashpay-all.com',...options});
 const result=mod.exports.sessionFromGrant(grant(),challenge,secret);const payload=jwt.verify(result.token,secret);assert.equal(payload.id,1);assert.equal(payload.exp,now+500);assert.equal(payload.role,'Developer');
 assert.throws(()=>mod.exports.sessionFromGrant(grant(),'b'.repeat(64),secret));assert.throws(()=>mod.exports.sessionFromGrant(grant(),challenge,'wrong-secret-with-more-than-32-characters'));assert.throws(()=>mod.exports.sessionFromGrant(grant({sessionExp:now-1}),challenge,secret));assert.throws(()=>mod.exports.sessionFromGrant(grant({}, {expiresIn:-1}),challenge,secret));assert.throws(()=>mod.exports.sessionFromGrant(grant({}, {audience:'another-app'}),challenge,secret));assert.throws(()=>mod.exports.sessionFromGrant(grant({role:'Client'}),challenge,secret));
});

test('identity survives unavailable credit storage and stale local cookie, with profile photo',async()=>{
 const secret='identity-test-secret-with-more-than-32-characters',before=process.env.JOJO_AUTH_JWT_SECRET;process.env.JOJO_AUTH_JWT_SECRET=secret;
 const valid=jwt.sign({id:1,role:'Developer'},secret,{expiresIn:'1h'});let local='expired-or-invalid-cookie',shared=valid;const queries=[];
 const load=(relative,mocks={})=>{const filename=require('node:path').resolve(relative),mod=new Module(filename,module);mod.filename=filename;mod.paths=module.paths;const original=mod.require.bind(mod);mod.require=name=>Object.hasOwn(mocks,name)?mocks[name]:original(name);mod._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText,filename);return mod.exports;};
 const tokens=load('src/lib/jwt.ts');
 const auth=load('src/lib/auth.ts',{'next/headers':{cookies:()=>({get:name=>({value:name==='dev_portal_token'?local:shared}),set:()=>{}})},'./jwt':tokens,'./db':{db:{query:async(sql)=>{queries.push(sql);assert.match(sql,/^SELECT /);return {rows:[{id:1,username:'developer',manager_name:'Developer Name',profile_photo:'https://example.invalid/photo.png'}]};}}}});
 try{const session=await auth.studioSession();assert.equal(session.success,true);assert.equal(session.user.manager_name,'Developer Name');assert.equal(session.user.profile_photo,'https://example.invalid/photo.png');assert.equal(queries.length,1);local='';shared='';assert.equal((await auth.studioSession()).reason,'NO_SESSION');local='bad';shared='bad';assert.equal((await auth.studioSession()).reason,'SESSION_INVALID');}finally{if(before===undefined)delete process.env.JOJO_AUTH_JWT_SECRET;else process.env.JOJO_AUTH_JWT_SECRET=before;}
});
