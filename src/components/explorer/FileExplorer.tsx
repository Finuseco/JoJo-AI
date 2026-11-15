
'use client';

import { FC, useState } from 'react';
import { 
    ChevronDown, Folder, FileCode, FileJson, FileText, Settings, Globe, 
    File as FileIcon, Package, Code, Layers, ShieldCheck, Database, Terminal, FileBox, RefreshCw,
    ListTree, FilePlus, FolderPlus, Search, MoreVertical
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface FileExplorerProps {
    fileTree: any;
    onFileClick: (path: string) => void;
    onRefresh: () => void;
    onCreateItem: (path: string, type: 'file' | 'folder') => void;
}

const getFileIcon = (name: string) => {
    const ext = name.split('.').pop()?.toLowerCase();
    if (ext === 'sql') return <Database className="h-3.5 w-3.5 mr-2 text-blue-400" />;
    if (ext === 'json') return <FileJson className="h-3.5 w-3.5 mr-2 text-orange-400" />;
    if (ext === 'cpk') return <ShieldCheck className="h-3.5 w-3.5 mr-2 text-green-400" />;
    if (ext === 'jojo' || ext === 'jconf') return <FileBox className="h-3.5 w-3.5 mr-2 text-accent" />;
    if (ext === 'package.json') return <Package className="h-3.5 w-3.5 mr-2 text-red-400" />;
    if (ext === 'tsx' || ext === 'jsx') return <Code className="h-3.5 w-3.5 mr-2 text-blue-400" />;
    if (ext === 'ts' || ext === 'js') return <FileCode className="h-3.5 w-3.5 mr-2 text-yellow-400" />;
    if (ext === 'css') return <Layers className="h-3.5 w-3.5 mr-2 text-pink-400" />;
    if (ext === 'html') return <Globe className="h-3.5 w-3.5 mr-2 text-orange-500" />;
    if (ext === 'md') return <FileText className="h-3.5 w-3.5 mr-2 text-blue-300" />;
    return <FileIcon className="h-3.5 w-3.5 mr-2 opacity-60" />;
};

const FileTreeNode: FC<{ node: any; onClick: (p: string) => void; level?: number }> = ({ node, onClick, level = 0 }) => {
    return (
        <div className="flex flex-col">
            {Object.entries(node)
                .sort((a: any, b: any) => (a[1].type === 'folder' ? -1 : 1))
                .filter(([name]) => name !== '.keep') // Cacher le fichier témoin .keep
                .map(([name, data]: any) => (
                    <div className="flex flex-col" key={data.path}>
                        {data.type === 'folder' ? (
                            <div className="flex flex-col">
                                <button className="flex items-center w-full px-2 py-1.5 hover:bg-white/5 text-gray-400 group transition-all" style={{ paddingLeft: `${level * 12 + 8}px` }}>
                                    <ChevronDown className="h-3 w-3 mr-1 opacity-40 group-hover:opacity-100 transition-transform" />
                                    <Folder className="h-4 w-4 mr-2 text-yellow-600/60" />
                                    <span className="font-bold text-[10px] truncate uppercase tracking-tighter group-hover:text-white">{name}</span>
                                </button>
                                <FileTreeNode node={data.children} onClick={onClick} level={level + 1} />
                            </div>
                        ) : (
                            <button onClick={() => onClick(data.path)} className="flex items-center w-full px-2 py-1.5 hover:bg-white/5 text-gray-400 group transition-all" style={{ paddingLeft: `${level * 12 + 20}px` }}>
                                {getFileIcon(name)}
                                <span className="text-[11px] truncate group-hover:text-white font-mono">{name}</span>
                            </button>
                        )}
                    </div>
                ))}
        </div>
    );
};

export const FileExplorer: FC<FileExplorerProps> = ({ fileTree, onFileClick, onRefresh, onCreateItem }) => {
    const [newItem, setNewItem] = useState<{ active: boolean, type: 'file' | 'folder' }>({ active: false, type: 'file' });
    const [newItemName, setNewItemName] = useState('');
    const [filter, setFilter] = useState('');

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        if (newItemName) {
            onCreateItem(newItemName, newItem.type);
            setNewItem({ active: false, type: 'file' });
            setNewItemName('');
        }
    };

    return (
        <div className="w-full h-full bg-[#16161a] flex flex-col select-none overflow-hidden border-r border-white/5">
            {/* Header Pro Explorer */}
            <div className="h-11 px-4 flex items-center justify-between text-[10px] font-black uppercase text-gray-500 border-b border-white/5 tracking-widest bg-black/10">
                <span className="flex items-center gap-2"><ListTree className="h-3.5 w-3.5" /> Architecture</span>
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => setNewItem({ active: true, type: 'file' })} className="h-7 w-7 text-gray-600 hover:text-white hover:bg-white/5 transition-all" title="Nouveau Fichier"><FilePlus className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => setNewItem({ active: true, type: 'folder' })} className="h-7 w-7 text-gray-600 hover:text-white hover:bg-white/5 transition-all" title="Nouveau Dossier"><FolderPlus className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" onClick={onRefresh} className="h-7 w-7 text-gray-600 hover:text-white hover:bg-white/5 transition-all" title="Actualiser"><RefreshCw className="h-3.5 w-3.5" /></Button>
                </div>
            </div>
            
            {/* Barre de Recherche / Filtre */}
            <div className="p-2 border-b border-white/5 bg-black/5">
                <div className="relative group">
                    <Search className="absolute left-2.5 top-2.5 h-3 w-3 text-gray-600 group-focus-within:text-accent transition-colors" />
                    <Input 
                        placeholder="RECHERCHER..." 
                        value={filter}
                        onChange={e => setFilter(e.target.value)}
                        className="h-8 bg-black/40 border-white/5 pl-8 text-[9px] font-black tracking-[0.1em] rounded-lg focus:border-accent/40 focus:ring-0"
                    />
                </div>
            </div>

            {/* Arborescence Scrollable */}
            <div className="flex-1 overflow-y-auto p-1 py-4 scrollbar-hide">
                {newItem.active && (
                    <form onSubmit={handleCreate} className="px-4 py-2 mb-3">
                        <Input 
                            autoFocus 
                            value={newItemName} 
                            onChange={e => setNewItemName(e.target.value)} 
                            onBlur={() => !newItemName && setNewItem({ active: false, type: 'file' })}
                            placeholder={newItem.type === 'file' ? "Nom du fichier..." : "Nom du dossier..."}
                            className="h-9 bg-black/60 border-accent/40 text-[10px] font-bold uppercase rounded-lg shadow-2xl focus:ring-1 focus:ring-accent/20"
                        />
                    </form>
                )}
                
                {Object.keys(fileTree).length === 0 ? (
                    <div className="text-center py-20 px-6 opacity-20">
                        <ListTree className="h-12 w-12 mx-auto mb-4 text-gray-600" />
                        <p className="text-[9px] font-black uppercase tracking-[0.4em]">Initialisation des Nodes...</p>
                    </div>
                ) : (
                    <FileTreeNode node={fileTree} onClick={onFileClick} />
                )}
            </div>
            
            {/* Footer Explorer Stats */}
            <div className="h-6 bg-black/20 border-t border-white/5 flex items-center px-4 justify-between">
                <span className="text-[8px] font-bold text-gray-600 uppercase tracking-widest">{Object.keys(fileTree).length} racines détectées</span>
                <ShieldCheck className="h-3 w-3 text-green-500/40" />
            </div>
        </div>
    );
};
