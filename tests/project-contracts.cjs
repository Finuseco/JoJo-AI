const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,f);
const {studioUrl,navigation}=require('../desktop/policy.cjs'),{previewFiles,resolvePreviewAsset}=require('../src/lib/preview-assets.ts');
test('Electron valide le domaine et isole les destinations externes',()=>{assert.equal(studioUrl('https://ai.cashpay-all.com/'),'https://ai.cashpay-all.com');for(const url of ['http://example.com','file:///etc/passwd','https://user:pass@example.com','https://example.com/?token=x'])assert.throws(()=>studioUrl(url));assert.equal(navigation('javascript:alert(1)','https://ai.cashpay-all.com'),'deny');assert.equal(navigation('file:///etc/passwd','https://ai.cashpay-all.com'),'deny');assert.equal(navigation('https://ai.cashpay-all.com/api/v1/session','https://ai.cashpay-all.com'),'studio');assert.equal(navigation('https://ai.cashpay-all.com.evil.test','https://ai.cashpay-all.com'),'external');});
test('Aperçu public filtre les fichiers non référencés',()=>{const files=[{path:'index.html',content:'<link href="css/main.css">',encoding:'utf8'},{path:'css/main.css',content:'body{color:red}',encoding:'utf8'},{path:'private.json',content:'{}',encoding:'utf8'}];assert.equal(previewFiles(files,false).length,2);assert.equal(resolvePreviewAsset('css/main.css','../../secret'),null);});
const {previewPage}=require('../src/lib/preview-assets.ts');
test('preview follows exported page links without exposing unrelated private files',()=>{
 const files=[{path:'index.html',content:'<a href="/account/">Compte</a><a href="contact">Contact</a>',encoding:'utf8'},{path:'account/index.html',content:'Compte',encoding:'utf8'},{path:'contact.html',content:'Contact',encoding:'utf8'},{path:'private.json',content:'secret',encoding:'utf8'}];
 assert.equal(previewFiles(files,false).length,3);
 assert.equal(resolvePreviewAsset('account/index.html','/'),'index.html');
 assert.equal(previewPage(new Map(files.map(f=>[f.path,f])),'/account/').path,'account/index.html');
});
const {starterFiles}=require('../src/lib/project-starters.ts');
test('React Native creates actual native sources and preserves the Gradle wrapper',()=>{
 const files=starterFiles('JoJo test','react-native'),map=new Map(files.map(f=>[f.path,f]));
 assert.equal(files.length,map.size);
 assert.equal(JSON.parse(map.get('package.json').content).dependencies['react-native'],'0.76.9');
 assert.equal(map.has('index.html'),false);
 assert.equal(map.has('android/app/src/main/java/com/helloworld/MainActivity.kt'),true);
 assert.equal(map.get('android/gradlew').mode,'100755');
 assert.equal(Buffer.from(map.get('android/gradle/wrapper/gradle-wrapper.jar').content,'base64').subarray(0,2).toString(),'PK');
 assert.equal(map.has('android/app/debug.keystore'),false);
 assert.ok(map.get('android/app/build.gradle').content.includes('debuggableVariants = []'));
});
