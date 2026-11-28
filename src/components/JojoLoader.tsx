import Image from 'next/image';
/** Écran de chargement JoJo AI : logo au centre, anneau qui tourne autour. */
export function JojoLoader({label='Chargement…',fullscreen=true}:{label?:string;fullscreen?:boolean}){
 return <div role="status" aria-live="polite" className={`jojo-loader ${fullscreen?'jojo-loader-full':''}`}>
  <div className="jojo-loader-orb"><span className="jojo-loader-ring" aria-hidden="true"/><span className="jojo-loader-ring jojo-loader-ring-2" aria-hidden="true"/>
   <Image src="/brand/jojo-ai.png" alt="JoJo AI" width={96} height={96} priority className="jojo-loader-logo"/></div>
  <p className="jojo-loader-label">{label}</p></div>;
}
