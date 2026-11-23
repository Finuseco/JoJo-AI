'use client';
import {useRef} from 'react';
import Editor,{loader,type OnMount} from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
loader.config({monaco});
export interface CodeEditorProps {content:string;filePath:string;onChange:(value:string)=>void;onCursorChange?:(line:number,col:number)=>void;onSave?:(content:string)=>void}
export default function MonacoCodeEditor({content,filePath,onChange,onCursorChange,onSave}:CodeEditorProps){
 const callbacks=useRef({onChange,onCursorChange,onSave});callbacks.current={onChange,onCursorChange,onSave};
 const mount:OnMount=(editor,m)=>{editor.addCommand(m.KeyMod.CtrlCmd|m.KeyCode.KeyS,()=>callbacks.current.onSave?.(editor.getValue()));editor.onDidChangeCursorPosition(e=>callbacks.current.onCursorChange?.(e.position.lineNumber,e.position.column));};
 return <Editor height="100%" path={filePath} value={content} theme="vs-dark" onMount={mount} onChange={value=>callbacks.current.onChange(value||'')} loading={<p className="p-4 text-sm text-zinc-400">Chargement de l’éditeur Monaco…</p>} options={{automaticLayout:true,fontSize:13,minimap:{enabled:false},scrollBeyondLastLine:false,padding:{top:14},wordWrap:'on',tabSize:2,insertSpaces:true,formatOnPaste:true,accessibilitySupport:'auto'}}/>;
}
