const AUTH_ORIGINS=new Set(['https://github.com','https://developer.cashpay-all.com']);
function studioUrl(value,development=false){const u=new URL(value);if(u.username||u.password||u.search||u.hash)throw Error('Adresse de service invalide.');if(u.protocol!=='https:'&&!(development&&u.protocol==='http:'&&['localhost','127.0.0.1'].includes(u.hostname)))throw Error('HTTPS requis.');return u.origin;}
function navigation(value,origin){try{const u=new URL(value);if(u.username||u.password)return 'deny';if(u.origin===origin)return 'studio';if(u.protocol==='https:'&&AUTH_ORIGINS.has(u.origin))return 'auth';return ['https:','http:','mailto:'].includes(u.protocol)?'external':'deny';}catch{return 'deny';}}
module.exports={studioUrl,navigation};
