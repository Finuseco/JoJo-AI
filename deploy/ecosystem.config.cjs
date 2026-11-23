const path=require('node:path');
const root=path.resolve(__dirname,'..');
const {read}=require('../scripts/studio-env.cjs');
// Explicitly replace stale PM2 values with the saved application configuration.
module.exports={apps:[{name:'jojo-ai',cwd:root,script:'node_modules/next/dist/bin/next',args:'start -H 127.0.0.1 -p 8095',env:{...read(root),NODE_ENV:'production'},max_memory_restart:'768M',autorestart:true}]};
