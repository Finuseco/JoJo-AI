const {contextBridge,ipcRenderer}=require('electron');
const allowed=new Set(['palette','terminal','explorer','projects']);
contextBridge.exposeInMainWorld('jojoDesktop',{platform:process.platform,onCommand(callback){if(typeof callback!=='function')return;const handler=(_,command)=>{if(allowed.has(command))callback(command);};ipcRenderer.on('studio:command',handler);return()=>ipcRenderer.removeListener('studio:command',handler);}});
