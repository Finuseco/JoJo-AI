'use client';
import dynamic from 'next/dynamic';
export const CodeEditor=dynamic(()=>import('./MonacoCodeEditor'),{ssr:false,loading:()=> <p className="p-4 text-sm text-zinc-400">Ouverture de l’éditeur…</p>});
