'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
    Files, Settings, X, 
    Lock, Unlock, DatabaseZap, Github, BrainCircuit, Zap, Coins,
    MonitorIcon, SmartphoneIcon, TabletIcon, RefreshCw, Download, Radio, ListTree,
    ChevronDown, LayoutDashboard, ClipboardList, CheckCircle2, 
    Package, Smartphone, Smartphone as ExpoIcon, Menu, Share2, Globe, Rocket, Puzzle,
    AlertCircle, CheckCircle, Info, Terminal as TermIcon, GitBranch, Server, Activity,
    ShieldCheck, Users, Eye, Code, Layers, Sparkles, Search
} from 'lucide-react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { 
    getProjectFileTree, getFileContent, toggleProjectVisibility, getCredits, deleteProject,
    getPendingActions, approvePendingAction, rejectPendingAction, saveFileContent, createFileSystemItem,
    triggerBuild
} from '@/lib/actions/dev-portal.actions';
import { sendChatMessage, getChatHistory } from '@/lib/actions/ai.actions';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";

import { CodeEditor } from './editor/CodeEditor';
import { StudioTerminal } from './terminal/StudioTerminal';
import { FileExplorer } from './explorer/FileExplorer';
import { AiChatPanel } from './chat/AiChatPanel';
import { DatabaseManager } from './databases/DatabaseManager';
import { GitManager } from './git/GitManager';
import { AndroidEmulator } from './emulator/AndroidEmulator';
import { motion, AnimatePresence } from 'framer-motion';
import { JojoBrand } from './brand/JojoBrand';

export function StudioIDE({ project, session, projects, onProjectSwitch, onProjectDeleted }: any) {
  const { toast } = useToast();
  const [fileTree, setFileTree] = useState<any>({});
  const [openTabs, setOpenTabs] = useState<any[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [sidebarTab, setSidebarTab] = useState<'files' | 'approval' | 'git' | 'db' | 'settings' | 'domains'>('files');
  const [viewMode, setViewMode] = useState<'code' | 'preview'>('code');
  const isAndroidTemplate = project?.app_template === 'android' || project?.app_template === 'react-native';
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile' | 'tablet'>(isAndroidTemplate ? 'mobile' : 'desktop');
  const [mobileView, setMobileView] = useState<'chat' | 'preview' | 'code'>('chat');
  
  const [credits, setCredits] = useState(0);
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
  const [messages, setMessages] = useState<any[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [pendingActions, setPendingActions] = useState<any[]>([]);

  const isOwner = project.user_role === 'owner';
  const publicPreviewUrl = `${typeof window !== 'undefined' ? window.location.origin : 'http://jojoai.com'}/p/${project.id}`;

  const fetchTreeAndCredits = useCallback(async () => {
    const result = await getProjectFileTree(project.id);
    if (result.success) {
        const tree: any = {};
        result.files.forEach((path: string) => {
            let curr = tree;
            const parts = path.split('/');
            parts.forEach((part, i) => {
                if (!curr[part]) {
                    if (i < parts.length - 1) curr[part] = { path: parts.slice(0, i+1).join('/'), type: 'folder', children: {} };
                    else curr[part] = { path, type: 'file' };
                }
                if (curr[part].type === 'folder') curr = curr[part].children;
            });
        });
        setFileTree(tree);
    }
    const credRes = await getCredits();
    if (credRes.success) setCredits(credRes.credits);

    const historyRes = await getChatHistory(project.id);
    if (historyRes.success) setMessages(historyRes.history);

    const actionsRes = await getPendingActions(project.id);
    if (actionsRes.success) setPendingActions(actionsRes.actions);
  }, [project.id]);

  useEffect(() => { fetchTreeAndCredits(); }, [fetchTreeAndCredits]);

  const handleFileClick = async (path: string) => {
    if (openTabs.some(t => t.id === path)) { setActiveTabId(path); return; }
    const res = await getFileContent(project.id, path);
    const newTab = { id: path, title: path.split('/').pop()!, content: res.content, isDirty: false };
    setOpenTabs(prev => [...prev, newTab]);
    setActiveTabId(path);
  };

  const handleSaveFile = async (id: string, content: string) => {
    const res = await saveFileContent(project.id, id, content);
    if (res.success) {
        setOpenTabs(ts => ts.map(t => t.id === id ? { ...t, isDirty: false } : t));
        toast({ title: "Sauvegarde Elite", description: `Le fichier ${id.split('/').pop()} synchronisé.` });
    } else {
        console.error('Failed to save file:', res.error);
        toast({ variant: 'destructive', title: 'Erreur Sauvegarde', description: res.error || 'Impossible d\'enregistrer le fichier.' });
    }
  };

  const handleSendMessage = async (text: string, attachments?: any[]) => {
    if (!text.trim() && (!attachments || attachments.length === 0)) return;
    setIsAiLoading(true);
    const res = await sendChatMessage(project.id, text, attachments);
    setIsAiLoading(false);
    
    if (res.success) {
        setMessages(prev => [...prev, { role: 'user', content: text }, { role: 'model', content: res.text }]);
        if (res.newBalance !== undefined) setCredits(res.newBalance);
        if (res.refreshFiles) {
            fetchTreeAndCredits();
            // Si un fichier ouvert est modifié par l'IA, on rafraîchit ses onglets
            if (activeTabId) {
                const updatedContent = await getFileContent(project.id, activeTabId);
                setOpenTabs(ts => ts.map(t => t.id === activeTabId ? { ...t, content: updatedContent.content, isDirty: false } : t));
            }
        }
    } else {
        console.error('JOJO AI chat error:', res.error);
        toast({ variant: 'destructive', title: 'Erreur JOJO AI', description: res.error });
    }
  };

  const activeTab = openTabs.find(t => t.id === activeTabId);

  return (
    <div className="flex h-screen w-full bg-transparent text-gray-300 font-sans overflow-hidden flex-col select-none relative">
        {/* Barra de Menus */}
        <div className="h-9 bg-[#0c0a2c]/70 backdrop-blur-md border-b border-white/5 flex items-center px-2 gap-1 text-[11px] font-bold text-gray-500 z-[100] premium-border">
            <JojoBrand size={22} className="mr-4 gap-2" />
            
            <DropdownMenu>
                <DropdownMenuTrigger className="px-3 h-7 hover:bg-white/5 rounded transition-colors uppercase tracking-widest outline-none">Fichier</DropdownMenuTrigger>
                <DropdownMenuContent className="bg-[#19153f] border-white/10 text-white min-w-[200px] glass-panel">
                    <DropdownMenuItem className="text-[10px] uppercase font-bold" onClick={() => fetchTreeAndCredits()}>Actualiser</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleSaveFile(activeTab?.id || '', activeTab?.content || '')} className="text-[10px] uppercase font-bold flex justify-between">Sauvegarder <span className="opacity-40">Ctrl+S</span></DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
                <DropdownMenuTrigger className="px-3 h-7 hover:bg-white/5 rounded transition-colors uppercase tracking-widest outline-none">Collaboration</DropdownMenuTrigger>
                <DropdownMenuContent className="bg-[#19153f] border-white/10 text-white min-w-[200px] glass-panel">
                    <DropdownMenuItem className="text-[10px] uppercase font-bold" onClick={() => { navigator.clipboard.writeText(publicPreviewUrl); toast({ title: "Lien Copié", description: "Lien de visualisation prêt." }); }}>Copier Lien Preview</DropdownMenuItem>
                    <DropdownMenuItem className="text-[10px] uppercase font-bold">Gérer les Accès</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <div className="flex-1" />

            <div className="flex items-center gap-2 pr-2">
                <Button variant="ghost" className="h-6 px-3 bg-accent text-white text-[9px] font-black rounded uppercase shadow-lg" onClick={() => { navigator.clipboard.writeText(publicPreviewUrl); toast({ title: "Lien Public Copié" }); }}>
                    <Share2 className="h-3.5 w-3.5 mr-2" /> Partager
                </Button>
            </div>
        </div>

        {/* Workspace Principal */}
        <div className="flex flex-1 overflow-hidden relative">
            {/* Mobile View Container (md:hidden) */}
            <div className="flex flex-col flex-1 md:hidden overflow-hidden relative pb-16">
                {mobileView === 'chat' && (
                    <div className="h-full w-full flex flex-col">
                        <AiChatPanel 
                            projectId={project.id}
                            messages={messages}
                            onSendMessage={handleSendMessage}
                            isLoading={isAiLoading}
                            onRefresh={fetchTreeAndCredits}
                            currentCredits={credits}
                            user={session.user}
                            onInjectCode={(code) => {
                                if (activeTabId) {
                                    setOpenTabs(ts => ts.map(t => t.id === activeTabId ? { ...t, content: code, isDirty: true } : t));
                                    toast({ title: "Code injecté dans l'éditeur", description: activeTabId });
                                }
                            }}
                        />
                    </div>
                )}
                {mobileView === 'preview' && (
                    <div className="h-full w-full bg-[#0a0b2e]/70 flex flex-col overflow-hidden">
                        <div className="h-10 px-3 bg-[#0e0f34]/80 border-b border-white/10 flex items-center justify-between text-[11px] font-black uppercase text-gray-400 shrink-0">
                            <span className="text-cyan-400 flex items-center gap-2">
                                <Smartphone className="h-4 w-4" /> Android 14 (Pixel 8 Pro)
                            </span>
                        </div>
                        <div className="flex-1 relative overflow-hidden">
                            <AndroidEmulator 
                                projectId={project.id}
                                projectName={project.name}
                                appCode={activeTab?.content}
                                template={project.app_template}
                            />
                        </div>
                    </div>
                )}
                {mobileView === 'code' && (
                    <div className="h-full w-full flex flex-col bg-[#070620]/60">
                        <div className="h-9 flex bg-[#0c0a2c]/70 backdrop-blur-md border-b border-white/5 overflow-x-auto scrollbar-hide shrink-0">
                            {openTabs.map(tab => (
                                <div key={tab.id} onClick={() => setActiveTabId(tab.id)} className={cn("flex items-center px-4 py-2 text-[9px] font-bold border-r border-white/5 cursor-pointer min-w-[120px] transition-all", activeTabId === tab.id ? "bg-[#121038] text-white border-b-2 border-b-accent" : "bg-black/20 text-gray-500 hover:bg-black/40")}>
                                    <span className="truncate uppercase">{tab.title}{tab.isDirty && '*'}</span>
                                    <X className="ml-auto h-3 w-3 hover:text-red-400 p-0.5" onClick={(e) => { e.stopPropagation(); setOpenTabs(ts => ts.filter(t => t.id !== tab.id)); if (activeTabId === tab.id) setActiveTabId(null); }} />
                                </div>
                            ))}
                        </div>
                        <div className="flex-1 relative overflow-hidden">
                            {activeTab ? (
                                <CodeEditor content={activeTab.content} onChange={(v) => setOpenTabs(ts => ts.map(t => t.id === activeTabId ? { ...t, content: v, isDirty: true } : t))} filePath={activeTab.id} onCursorChange={(l, c) => setCursorPos({ line: l, col: c })} onSave={(v) => handleSaveFile(activeTab.id, v)} />
                            ) : (
                                <div className="p-4">
                                    <div className="text-xs uppercase font-bold text-gray-400 mb-3">Explorateur de Fichiers</div>
                                    <FileExplorer fileTree={fileTree} onFileClick={(p) => { handleFileClick(p); }} onRefresh={fetchTreeAndCredits} onCreateItem={(p, t) => createFileSystemItem(project.id, p, t).then(() => fetchTreeAndCredits())} />
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Mobile Bottom Navigation Bar (3 buttons: Chat, Preview, Code with tag icon) */}
                <div className="fixed bottom-0 left-0 right-0 h-16 bg-[#0c0a2c]/95 backdrop-blur-md border-t border-white/10 flex items-center justify-around z-[200] px-4 shadow-2xl">
                    <button 
                        onClick={() => setMobileView('chat')}
                        className={cn("flex flex-col items-center justify-center flex-1 py-2 transition-colors", mobileView === 'chat' ? "text-accent font-black" : "text-gray-400 hover:text-white")}
                    >
                        <BrainCircuit className="h-5 w-5 mb-1" />
                        <span className="text-[10px] uppercase tracking-wider">Chat</span>
                    </button>
                    <button 
                        onClick={() => setMobileView('preview')}
                        className={cn("flex flex-col items-center justify-center flex-1 py-2 transition-colors", mobileView === 'preview' ? "text-cyan-400 font-black" : "text-gray-400 hover:text-white")}
                    >
                        <Smartphone className="h-5 w-5 mb-1" />
                        <span className="text-[10px] uppercase tracking-wider">Preview</span>
                    </button>
                    <button 
                        onClick={() => setMobileView('code')}
                        className={cn("flex flex-col items-center justify-center flex-1 py-2 transition-colors", mobileView === 'code' ? "text-cyan-400 font-black" : "text-gray-400 hover:text-white")}
                    >
                        <Code className="h-5 w-5 mb-1" />
                        <span className="text-[10px] uppercase tracking-wider">&lt;Code&gt;</span>
                    </button>
                </div>
            </div>

            {/* Desktop View Layout (hidden md:flex) */}
            <div className="hidden md:flex flex-1 overflow-hidden relative">
            <div className="w-12 bg-[#0c0a2c]/70 backdrop-blur-md border-r border-white/5 flex flex-col items-center py-4 gap-6 z-50">
                <div className={cn("p-2 rounded-lg cursor-pointer transition-all", sidebarTab === 'files' ? "text-accent bg-accent/10" : "text-gray-600 hover:text-gray-400")} onClick={() => setSidebarTab('files')}><Files className="h-5 w-5" /></div>
                <div className={cn("p-2 rounded-lg cursor-pointer transition-all", sidebarTab === 'git' ? "text-accent bg-accent/10" : "text-gray-600 hover:text-gray-400")} onClick={() => setSidebarTab('git')}><Github className="h-5 w-5" /></div>
                <div className={cn("p-2 rounded-lg cursor-pointer transition-all", sidebarTab === 'db' ? "text-accent bg-accent/10" : "text-gray-600 hover:text-gray-400")} onClick={() => setSidebarTab('db')}><DatabaseZap className="h-5 w-5" /></div>
                <div className={cn("p-2 rounded-lg cursor-pointer transition-all mt-auto", sidebarTab === 'settings' ? "text-accent bg-accent/10" : "text-gray-600 hover:text-gray-400")} onClick={() => setSidebarTab('settings')}><Settings className="h-5 w-5" /></div>
            </div>

            <PanelGroup direction="horizontal">
                <Panel defaultSize={20} minSize={15} className="bg-[#0c0a2c]/70 backdrop-blur-md border-r border-white/5 glass-panel hidden md:block">
                    <AnimatePresence mode="wait">
                        {sidebarTab === 'files' && <FileExplorer fileTree={fileTree} onFileClick={handleFileClick} onRefresh={fetchTreeAndCredits} onCreateItem={(p, t) => createFileSystemItem(project.id, p, t).then((res) => { if (!res.success) console.error('Failed to create file system item:', res.error); fetchTreeAndCredits(); }).catch(err => { console.error('Error creating file system item:', err); })} />}
                        {sidebarTab === 'git' && <GitManager projectId={project.id} />}
                        {sidebarTab === 'db' && <DatabaseManager projectId={project.id} />}
                    </AnimatePresence>
                </Panel>
                
                <PanelResizeHandle className="w-px bg-white/5 hover:bg-accent/40 transition-colors hidden md:block" />

                <Panel defaultSize={50}>
                    <PanelGroup direction="vertical">
                        <Panel defaultSize={70}>
                            <div className="h-full flex flex-col bg-[#070620]/60">
                                <div className="h-9 flex bg-[#0c0a2c]/70 backdrop-blur-md border-b border-white/5 overflow-x-auto scrollbar-hide shrink-0">
                                    {openTabs.map(tab => (
                                        <div key={tab.id} onClick={() => setActiveTabId(tab.id)} className={cn("flex items-center px-4 py-2 text-[9px] font-bold border-r border-white/5 cursor-pointer min-w-[120px] transition-all", activeTabId === tab.id ? "bg-[#121038] text-white border-b-2 border-b-accent" : "bg-black/20 text-gray-500 hover:bg-black/40")}>
                                            <span className="truncate uppercase">{tab.title}{tab.isDirty && '*'}</span>
                                            <X className="ml-auto h-3 w-3 hover:text-red-400 p-0.5" onClick={(e) => { e.stopPropagation(); setOpenTabs(ts => ts.filter(t => t.id !== tab.id)); if (activeTabId === tab.id) setActiveTabId(null); }} />
                                        </div>
                                    ))}
                                </div>
                                <div className="flex-1 relative overflow-hidden h-full">
                                    <PanelGroup direction="horizontal">
                                        <Panel defaultSize={60}>
                                            {activeTab ? (
                                                <CodeEditor content={activeTab.content} onChange={(v) => setOpenTabs(ts => ts.map(t => t.id === activeTabId ? { ...t, content: v, isDirty: true } : t))} filePath={activeTab.id} onCursorChange={(l, c) => setCursorPos({ line: l, col: c })} onSave={(v) => handleSaveFile(activeTab.id, v)} />
                                            ) : (
                                                <div className="h-full flex flex-col items-center justify-center opacity-10">
                                                    <Image src="/logos/icon.png" alt="JOJO" width={100} height={100} className="animate-pulse" />
                                                </div>
                                            )}
                                        </Panel>
                                        <PanelResizeHandle className="w-px bg-white/5" />
                                        <Panel defaultSize={40}>
                                            <div className="h-full bg-[#0a0b2e]/70 flex flex-col border-l border-white/5 overflow-hidden">
                                                <div className="h-8 px-3 bg-[#0e0f34]/80 border-b border-white/10 flex items-center justify-between text-[10px] font-black uppercase text-gray-400 shrink-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-cyan-400 flex items-center gap-1.5 font-bold tracking-wider">
                                                            {previewDevice === 'mobile' ? <Smartphone className="h-3.5 w-3.5" /> : <Globe className="h-3.5 w-3.5" />}
                                                            {previewDevice === 'mobile' ? 'Android 14 (Pixel 8 Pro)' : 'Web Live View'}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1 bg-black/40 p-0.5 rounded-lg border border-white/10">
                                                        <button 
                                                            onClick={() => setPreviewDevice('mobile')}
                                                            className={cn("px-2 py-0.5 rounded text-[8px] font-black uppercase transition-all flex items-center gap-1", previewDevice === 'mobile' ? "bg-cyan-500 text-black shadow-md" : "text-gray-400 hover:text-white")}
                                                        >
                                                            <Smartphone className="h-2.5 w-2.5" /> Android
                                                        </button>
                                                        <button 
                                                            onClick={() => setPreviewDevice('desktop')}
                                                            className={cn("px-2 py-0.5 rounded text-[8px] font-black uppercase transition-all flex items-center gap-1", previewDevice === 'desktop' ? "bg-cyan-500 text-black shadow-md" : "text-gray-400 hover:text-white")}
                                                        >
                                                            <Globe className="h-2.5 w-2.5" /> Web
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="flex-1 relative overflow-hidden">
                                                    {previewDevice === 'mobile' ? (
                                                        <AndroidEmulator 
                                                            projectId={project.id} 
                                                            projectName={project.name} 
                                                            appCode={activeTab?.content} 
                                                            template={project.app_template} 
                                                        />
                                                    ) : (
                                                        <div className="h-full bg-white p-2">
                                                            <iframe src={publicPreviewUrl} className="w-full h-full border-none rounded-lg" />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </Panel>
                                    </PanelGroup>
                                </div>
                            </div>
                        </Panel>
                        <PanelResizeHandle className="h-px bg-white/5" />
                        <Panel defaultSize={30}>
                            <StudioTerminal projectName={project.name} projectId={project.id} />
                        </Panel>
                    </PanelGroup>
                </Panel>

                <PanelResizeHandle className="w-px bg-white/5 hidden lg:block" />

                <Panel defaultSize={30} minSize={20} className="hidden lg:block">
                    <AiChatPanel 
                        projectId={project.id} 
                        messages={messages} 
                        onSendMessage={handleSendMessage} 
                        isLoading={isAiLoading} 
                        onRefresh={fetchTreeAndCredits} 
                        currentCredits={credits} 
                        user={session.user}
                        onInjectCode={(code) => {
                            if (activeTabId) {
                                setOpenTabs(ts => ts.map(t => t.id === activeTabId ? { ...t, content: code, isDirty: true } : t));
                                toast({ title: "Code injecté dans l'éditeur", description: activeTabId });
                            }
                        }}
                    />
                </Panel>
            </PanelGroup>
        </div>

        <div className="h-6 bg-[#0c0a2c]/70 backdrop-blur-md text-gray-500 flex items-center justify-between px-3 text-[9px] font-bold uppercase tracking-widest z-50 premium-border">
            <div className="flex items-center gap-5">
                <div className="flex items-center gap-2 bg-white/5 px-2 py-0.5 rounded text-white"><GitBranch className="h-3 w-3 text-accent" /> main</div>
                <div className="flex items-center gap-2"><Activity className="h-3 w-3" /> CPU: 12% | RAM: 1.2GB</div>
            </div>
            <div className="flex items-center gap-5">
                <div className="flex items-center gap-1.5 bg-accent/10 text-accent px-2 py-0.5 rounded border border-accent/20"><Coins className="h-3 w-3" /><span>{credits.toFixed(1)} COINS</span></div>
                <div className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-green-500" /> SYNC OK</div>
                <span className="font-mono opacity-40">Ln {cursorPos.line}, Col {cursorPos.col}</span>
            </div>
        </div>
    </div>
  );
}
