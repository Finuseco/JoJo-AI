'use client';
import {DiffEditor,loader} from '@monaco-editor/react';import * as monaco from 'monaco-editor';loader.config({monaco});
export default function ProposalMonacoDiff({original,modified,path}:{original:string;modified:string;path:string}){return <DiffEditor original={original} modified={modified} originalModelPath={'before/'+path} modifiedModelPath={'after/'+path} theme="vs-dark" options={{readOnly:true,renderSideBySide:false,automaticLayout:true,minimap:{enabled:false},scrollBeyondLastLine:false}}/>;}
