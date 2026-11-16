'use client';

import { FC, useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface CodeEditorProps {
    content: string;
    onChange: (v: string) => void;
    filePath: string;
    onCursorChange?: (line: number, col: number) => void;
    onSave?: (content: string) => void;
}

export const CodeEditor: FC<CodeEditorProps> = ({ content, onChange, filePath, onCursorChange, onSave }) => {
    const lines = content.split('\n');
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const preRef = useRef<HTMLPreElement>(null);
    const [cursorLine, setCursorLine] = useState(0);

    const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
        if (preRef.current) {
            preRef.current.scrollTop = e.currentTarget.scrollTop;
            preRef.current.scrollLeft = e.currentTarget.scrollLeft;
        }
    };

    const updateCursorInfo = (target: HTMLTextAreaElement) => {
        const textBeforeCursor = target.value.substring(0, target.selectionStart);
        const currentLines = textBeforeCursor.split('\n');
        const line = currentLines.length;
        const col = currentLines[currentLines.length - 1].length + 1;
        setCursorLine(line - 1);
        if (onCursorChange) onCursorChange(line, col);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        // Gérer la touche Tabulation
        if (e.key === 'Tab') {
            e.preventDefault();
            const start = e.currentTarget.selectionStart;
            const end = e.currentTarget.selectionEnd;
            const newValue = content.substring(0, start) + "  " + content.substring(end);
            onChange(newValue);
            setTimeout(() => {
                if (textareaRef.current) {
                    textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 2;
                }
            }, 0);
        }
    };

    const highlightCode = (code: string) => code.split(/(\/\/[^\n]*|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|\b(?:const|let|var|function|export|default|return|import|from|async|await|if|else|for|while|class|interface|type|public|private|protected|extends|implements|true|false|null|undefined|[0-9]+)\b)/g).map((token,index) => {
        const cls=token.startsWith('//')?'code-comment':/^["']/.test(token)?'code-string':/^[0-9]+$/.test(token)?'code-number':/^(const|let|var|function|export|default|return|import|from|async|await|if|else|for|while|class|interface|type|public|private|protected|extends|implements)$/.test(token)?'code-keyword':undefined;
        return <span key={index} className={cls}>{token}</span>;
    });

    return (
        <div className="flex-1 flex h-full overflow-hidden editor-container bg-[#111114]">
            {/* Professional Gutter */}
            <div className="font-mono text-[11px] min-w-[45px] select-none scrollbar-hide overflow-hidden bg-black/20 border-r border-white/5 py-5 text-right pr-4">
                {lines.map((_, i) => (
                    <div key={i} className={cn("transition-colors leading-normal", i === cursorLine ? "text-accent font-black scale-110" : "text-gray-700")}>
                        {i + 1}
                    </div>
                ))}
            </div>
            
            <div className="relative flex-1 overflow-hidden h-full">
                <pre 
                    ref={preRef}
                    className="absolute inset-0 p-5 m-0 font-mono text-[13px] leading-normal pointer-events-none overflow-hidden whitespace-pre scrollbar-hide select-none h-full"
                >{highlightCode(content)}{'\n'}</pre>
                <textarea
                    ref={textareaRef}
                    value={content}
                    onChange={e => {
                        onChange(e.target.value);
                        updateCursorInfo(e.target);
                    }}
                    onScroll={handleScroll}
                    onKeyDown={handleKeyDown}
                    onKeyUp={(e) => updateCursorInfo(e.target as HTMLTextAreaElement)}
                    onClick={(e) => updateCursorInfo(e.target as HTMLTextAreaElement)}
                    onPaste={(e) => { setTimeout(() => updateCursorInfo(e.target as HTMLTextAreaElement), 0); }}
                    spellCheck={false}
                    className="absolute inset-0 p-5 w-full h-full bg-transparent border-none text-transparent caret-accent font-mono text-[13px] leading-normal resize-none focus:ring-0 whitespace-pre overflow-auto scrollbar-hide"
                />
            </div>
        </div>
    );
};
