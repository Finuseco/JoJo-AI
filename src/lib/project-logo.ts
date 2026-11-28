import {PNG} from 'pngjs';
export const PROJECT_LOGO_PATH='public/images/jojo-logo.png';
export function normalizeProjectLogo(bytes:Buffer){
 if(bytes.length<33||bytes.length>3*1024*1024||bytes.subarray(0,8).toString('hex')!=='89504e470d0a1a0a')throw Error('Utilisez une image PNG de 3 Mo maximum, ou importez un fichier JPEG/WebP depuis votre appareil.');
 const width=bytes.readUInt32BE(16),height=bytes.readUInt32BE(20);
 if(!width||!height||width>2048||height>2048)throw Error('Dimensions maximales : 2048 × 2048 pixels.');
 const png=PNG.sync.read(bytes);const clean=PNG.sync.write(png);
 if(clean.length>3*1024*1024)throw Error('Image trop volumineuse après décodage.');
 return clean;
}
