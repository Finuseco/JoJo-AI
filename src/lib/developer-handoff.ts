import jwt from 'jsonwebtoken';
import {createHash} from 'node:crypto';
export function sessionFromGrant(grant:string,challenge:string,secret:string){
 if(!secret || (secret.length<32 && (secret.length<16 || createHash('sha256').update(secret).digest('hex')!==process.env.JOJO_LEGACY_DEVELOPER_SECRET_SHA256)))throw Error('SSO signing secret missing or not pinned');
 const p=jwt.verify(grant,secret,{algorithms:['HS256'],issuer:'https://developer.cashpay-all.com',audience:'https://ai.cashpay-all.com'});
 if(typeof p==='string'||p.role!=='Developer'||p.challenge!==challenge||!Number.isSafeInteger(p.id)||p.id<1||!Number.isSafeInteger(p.sessionExp)||p.sessionExp<=Math.floor(Date.now()/1000))throw Error('Invalid developer grant');
 return {token:jwt.sign({id:p.id,role:'Developer',exp:p.sessionExp},secret,{algorithm:'HS256',...(process.env.JOJO_AUTH_ISSUER?{issuer:process.env.JOJO_AUTH_ISSUER}:{}),...(process.env.JOJO_AUTH_AUDIENCE?{audience:process.env.JOJO_AUTH_AUDIENCE}:{})}),maxAge:p.sessionExp-Math.floor(Date.now()/1000)};
}
