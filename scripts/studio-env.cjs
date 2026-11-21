const fs=require('node:fs'),path=require('node:path'),{parseEnv}=require('node:util');
function read(root){const result={};for(const name of ['.env','.env.production','.env.local','.env.production.local']){const file=path.join(root,name);if(fs.existsSync(file))Object.assign(result,parseEnv(fs.readFileSync(file,'utf8')));}return result;}
module.exports={read};
