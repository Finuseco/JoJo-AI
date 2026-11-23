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
const {fileTechnology,projectTypes}=require('../src/lib/technology-icons.ts');
test('technology mapping distinguishes code, manifests and project templates',()=>{
 for(const [path,expected] of Object.entries({'src/app.ts':'typescript','src/App.tsx':'react','INDEX.HTML':'html5','package-lock.json':'npm','Dockerfile':'docker','schema.sql':'database','unknown.xyz':'code'}))assert.equal(fileTechnology(path),expected);
 assert.ok(projectTypes.some(t=>t.id==='blog'));assert.ok(projectTypes.some(t=>t.id==='react-native'));
 for(const entry of projectTypes)assert.ok(entry.label&&entry.detail&&entry.icon);
});
test('blog builds real pages, excludes drafts, escapes content and rejects unsafe slugs',t=>{
 const os=require('node:os'),path=require('node:path'),{spawnSync}=require('node:child_process');
 const folder=fs.mkdtempSync(path.join(os.tmpdir(),'jojo-blog-'));t.after(()=>fs.rmSync(folder,{recursive:true,force:true}));
 for(const f of starterFiles('Journal <test>','blog')){const dest=path.join(folder,f.path);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,f.content);}
 const build=()=>spawnSync(process.execPath,['scripts/build.cjs'],{cwd:folder,encoding:'utf8'});
 assert.equal(build().status,0);assert.match(fs.readFileSync(path.join(folder,'dist/index.html'),'utf8'),/Aucun article publié/);
 const articles=[{slug:'premier-article',title:'Titre <script>',content:'Texte <script>alert(1)</script>',published:true},{slug:'brouillon',title:'Brouillon secret',content:'Non publié',published:false}];
 fs.writeFileSync(path.join(folder,'content/articles.json'),JSON.stringify(articles));assert.equal(build().status,0);
 const article=fs.readFileSync(path.join(folder,'dist/articles/premier-article/index.html'),'utf8');assert.ok(article.includes('&lt;script&gt;'));assert.ok(!article.includes('<script>alert'));
 assert.equal(fs.existsSync(path.join(folder,'dist/articles/brouillon')),false);
 articles[0].slug='../escape';fs.writeFileSync(path.join(folder,'content/articles.json'),JSON.stringify(articles));assert.notEqual(build().status,0);
});
