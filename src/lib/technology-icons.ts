export const projectTypes = [
 {id:'empty',label:'Projet vide',detail:'Importer GitHub ou ZIP',icon:'git'},
 {id:'react',label:'Application React',detail:'Web · TypeScript · Vite',icon:'react'},
 {id:'react-native',label:'React Native',detail:'Mobile · Android · Gradle',icon:'react'},
 {id:'android',label:'Android natif',detail:'Java / Kotlin · Gradle',icon:'android'},
 {id:'web',label:'Site HTML / CSS / JavaScript',detail:'Web · sans compilation obligatoire',icon:'html5'},
 {id:'blog',label:'Blog / site d’actualité',detail:'Articles · catégories · recherche',icon:'blog'},
 {id:'music',label:'Site / app web musique',detail:'Projet web à personnaliser',icon:'music'},
 {id:'video',label:'Site / app web vidéo',detail:'Projet web à personnaliser',icon:'video'},
 {id:'fintech',label:'Services financiers',detail:'Projet web · intégrations à configurer',icon:'finance'},
 {id:'ecommerce',label:'Boutique en ligne',detail:'Projet web à personnaliser',icon:'shop'},
] as const;
export function projectTechnology(type:string){return projectTypes.find(p=>p.id===type)||projectTypes[0];}
export function fileTechnology(path:string):string {
 const name=path.split('/').pop()?.toLowerCase()||'';
 if(name==='dockerfile'||name.startsWith('docker-compose')||name.startsWith('compose.'))return 'docker';
 if(name.startsWith('.git'))return 'git';
 if(['package.json','package-lock.json','.npmrc'].includes(name))return 'npm';
 if(name.startsWith('tsconfig'))return 'typescript';
 if(name.startsWith('next.config'))return 'nextjs';
 if(name.startsWith('.env'))return 'config';
 if(name.endsWith('.gradle')||name==='gradlew'||name==='gradlew.bat'||name.endsWith('.apk')||name==='androidmanifest.xml')return 'android';
 const ext=name.split('.').pop()||'';
 const icons:Record<string,string>={html:'html5',htm:'html5',css:'css3',scss:'css3',sass:'css3',js:'javascript',mjs:'javascript',cjs:'javascript',ts:'typescript',mts:'typescript',cts:'typescript',jsx:'react',tsx:'react',kt:'kotlin',kts:'kotlin',java:'java',py:'python',php:'php',sql:'database',mysql:'mysql',pgsql:'postgresql',json:'json',md:'markdown',mdx:'markdown',yaml:'config',yml:'config',toml:'config',xml:'code',sh:'terminal',bash:'terminal',zip:'archive',jar:'archive',png:'image',jpg:'image',jpeg:'image',svg:'image',webp:'image',gif:'image',mp3:'music',wav:'music',mp4:'video',webm:'video',pdf:'document',txt:'document'};
 return icons[ext]||'code';
}
