const {app,BrowserWindow,Menu,shell,dialog}=require('electron');const path=require('node:path');const {studioUrl,navigation}=require('./policy.cjs');
const origin=studioUrl(process.env.JOJO_STUDIO_URL||'https://ai.cashpay-all.com',!app.isPackaged);
let window;
function create(){window=new BrowserWindow({width:1440,height:960,minWidth:360,minHeight:620,title:'JoJo AI Studio',backgroundColor:'#100d18',webPreferences:{preload:path.join(__dirname,'preload.cjs'),nodeIntegration:false,contextIsolation:true,sandbox:true,webSecurity:true,allowRunningInsecureContent:false,webviewTag:false,partition:'persist:jojo-studio'}});
 const go=(_,url)=>{const policy=navigation(url,origin);if(policy==='external'||policy==='deny'){_.preventDefault();if(policy==='external')shell.openExternal(url);}};
 window.webContents.on('will-navigate',go);window.webContents.on('will-redirect',go);
 window.webContents.setWindowOpenHandler(({url})=>{const kind=navigation(url,origin);if(kind!=='deny')shell.openExternal(url);return {action:'deny'};});
 window.webContents.session.setPermissionRequestHandler((contents,permission,callback)=>callback(navigation(contents.getURL(),origin)==='studio'&&permission==='clipboard-sanitized-write'));
 window.webContents.session.setPermissionCheckHandler((contents,permission)=>!!contents&&navigation(contents.getURL(),origin)==='studio'&&permission==='clipboard-sanitized-write');
 window.webContents.on('will-prevent-unload',event=>{const choice=dialog.showMessageBoxSync(window,{type:'question',buttons:['Rester','Quitter'],defaultId:0,cancelId:0,message:'Des fichiers ne sont pas enregistrés. Quitter cette page ?'});if(choice===1)event.preventDefault();});
 window.webContents.on('did-fail-load',(_,code,message)=>{if(code!==-3)dialog.showMessageBox(window,{type:'error',title:'Connexion au studio',message:'Le service JoJo AI est inaccessible.',detail:'Vérifiez votre connexion et la disponibilité de '+origin});});
 window.webContents.on('did-navigate',(_,url)=>{const host=new URL(url).hostname;window.setTitle('JoJo AI Studio — '+host);});
 const command=(label,id,accelerator)=>({label,accelerator,click:()=>window.webContents.send('studio:command',id)});
 Menu.setApplicationMenu(Menu.buildFromTemplate([{label:'Fichier',submenu:[command('Projets','projects'),{type:'separator'},{role:'quit',label:'Quitter'}]},{label:'Édition',submenu:[{role:'undo',label:'Annuler'},{role:'redo',label:'Rétablir'},{type:'separator'},{role:'cut',label:'Couper'},{role:'copy',label:'Copier'},{role:'paste',label:'Coller'},{role:'selectAll',label:'Tout sélectionner'}]},{label:'Affichage',submenu:[command('Palette de commandes','palette','Control+Shift+P'),command('Explorateur','explorer','Control+B'),command('Terminal','terminal','Control+J'),{role:'reload',label:'Actualiser'},{role:'togglefullscreen',label:'Plein écran'},{role:'resetZoom',label:'Zoom normal'},{role:'zoomIn',label:'Agrandir'},{role:'zoomOut',label:'Réduire'}]}]));
 window.loadURL(new URL('/dashboard',origin).href);
}
if(!app.requestSingleInstanceLock())app.quit();else{app.on('second-instance',()=>{if(window){if(window.isMinimized())window.restore();window.focus();}});app.whenReady().then(create);app.on('window-all-closed',()=>app.quit());app.on('certificate-error',(event,contents,url,error,certificate,callback)=>{event.preventDefault();callback(false);});}
