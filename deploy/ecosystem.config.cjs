const path=require('node:path');
module.exports={apps:[{name:'jojo-ai',cwd:path.resolve(__dirname,'..'),script:'node_modules/next/dist/bin/next',args:'start -H 127.0.0.1 -p 8095',env:{NODE_ENV:'production'},max_memory_restart:'768M',autorestart:true}]};
