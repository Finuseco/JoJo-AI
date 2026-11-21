
'use client';

import { FC, useState, useEffect } from 'react';
import { Terminal as TermIcon, Shield, Wifi, AlertCircle, Trash2, Cpu, Smartphone, LayoutList, CheckCircle2, Download, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StudioTerminalProps {
    projectName: string;
    projectId?: number;
}

export const StudioTerminal: FC<StudioTerminalProps> = ({ projectName, projectId }) => {
    const [activeTab, setActiveTab] = useState<'terminal' | 'output' | 'problems' | 'build'>('terminal');
    const [installProgress, setInstallProgress] = useState(0);
    const [isInstalling, setIsInstalling] = useState(false);
    const [currentPackage, setCurrentPackage] = useState('');
    const [logs, setLogs] = useState<string[]>([]);

    useEffect(() => {
        if (isInstalling) {
            const packages = ['@elite/sdk-core', 'lucide-react', 'framer-motion', 'zod', 'clsx', 'tailwind-merge'];
            let pkgIndex = 0;
            
            const interval = setInterval(() => {
                setInstallProgress(prev => {
                    if (prev >= 100) {
                        clearInterval(interval);
                        setIsInstalling(false);
                        setLogs(prevLogs => [...prevLogs, `✓ Installation terminée avec succès.`]);
                        return 100;
                    }
                    
                    const nextProgress = prev + Math.random() * 15;
                    if (Math.floor(nextProgress / 20) > Math.floor(prev / 20)) {
                        const pkg = packages[pkgIndex % packages.length];
                        setCurrentPackage(pkg);
                        setLogs(prevLogs => [...prevLogs, `[ELITE-NPM] Extraction de ${pkg}...`]);
                        pkgIndex++;
                    }
                    return nextProgress;
                });
            }, 400);
            return () => clearInterval(interval);
        }
    }, [isInstalling]);

    const runInstall = () => {
        setIsInstalling(true);
        setInstallProgress(0);
        setLogs(['[ELITE-NPM] Initialisation du gestionnaire de paquets...', '[ELITE-NPM] Résolution des dépendances...']);
        setActiveTab('terminal');
    };

    return (
        <div className="h-full bg-[#0c0a2c] flex flex-col font-mono text-[10px] overflow-hidden border-t border-white/5">
            {/* Tab Navigation */}
            <div className="flex gap-4 px-4 pt-2 text-gray-500 border-b border-white/5 pb-2 shrink-0 overflow-x-auto scrollbar-hide">
                <button onClick={() => setActiveTab('terminal')} className={cn("px-2 py-1 rounded flex items-center gap-1.5 transition-all whitespace-nowrap", activeTab === 'terminal' ? "text-white bg-white/5" : "hover:text-white")}>
                    <TermIcon className="h-3 w-3" /> TERMINAL
                </button>
                <button onClick={() => setActiveTab('problems')} className={cn("px-2 py-1 rounded flex items-center gap-1.5 transition-all whitespace-nowrap", activeTab === 'problems' ? "text-white bg-white/5" : "hover:text-white")}>
                    <AlertCircle className="h-3 w-3" /> PROBLEMS
                </button>
                <button onClick={() => setActiveTab('output')} className={cn("px-2 py-1 rounded flex items-center gap-1.5 transition-all whitespace-nowrap", activeTab === 'output' ? "text-white bg-white/5" : "hover:text-white")}>
                    <LayoutList className="h-3 w-3" /> OUTPUT
                </button>
                <button onClick={() => setActiveTab('build')} className={cn("px-2 py-1 rounded flex items-center gap-1.5 transition-all whitespace-nowrap", activeTab === 'build' ? "text-white bg-white/5" : "hover:text-white")}>
                    <Cpu className="h-3 w-3" /> EAS BUILD
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 select-text scrollbar-hide space-y-1 bg-black/10">
                {activeTab === 'terminal' && (
                    <div className="space-y-1 text-gray-400">
                        <p><span className="text-blue-400">jojo@elite-studio</span>:<span className="text-green-400">~/project</span>$ {isInstalling ? 'npm install' : ''}</p>
                        
                        {logs.map((log, i) => (
                            <p key={i} className={cn(log.includes('✓') ? "text-green-500 font-bold" : "opacity-80")}>{log}</p>
                        ))}

                        {isInstalling && (
                            <div className="mt-3 space-y-2 p-3 bg-black/40 rounded-xl border border-white/5">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-accent font-black uppercase tracking-widest text-[8px]">Téléchargement : {currentPackage}</span>
                                    <span className="text-[8px] font-bold">{Math.floor(installProgress)}%</span>
                                </div>
                                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full bg-accent transition-all duration-300 shadow-[0_0_10px_rgba(124,58,237,0.55)]" style={{ width: `${installProgress}%` }} />
                                </div>
                                <p className="text-[7px] opacity-40 animate-pulse">Synchronisation avec registry.jojoai.com...</p>
                            </div>
                        )}
                        
                        {!isInstalling && installProgress === 0 && (
                            <div className="flex flex-col items-center justify-center py-10 opacity-20">
                                <TermIcon className="h-8 w-8 mb-2" />
                                <p className="uppercase tracking-[0.3em]">Console Prête</p>
                            </div>
                        )}
                        <div className="h-4 w-2 bg-accent/40 animate-pulse ml-1 inline-block" />
                    </div>
                )}

                {activeTab === 'problems' && (
                    <div className="space-y-3 p-2">
                        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                            <AlertCircle className="h-4 w-4 text-red-500" />
                            <div>
                                <p className="text-red-500 font-black uppercase text-[9px]">Erreur de Rendu</p>
                                <p className="text-gray-400 text-[8px]">Impossible de résoudre l'importation de '@/components/Button' dans app/page.tsx</p>
                            </div>
                        </div>
                        <p className="text-[8px] text-gray-600 font-bold uppercase tracking-widest px-2 italic">JOJO AI analyse actuellement ce bug pour proposer un correctif...</p>
                    </div>
                )}

                {activeTab === 'output' && (
                    <div className="space-y-1 text-gray-400">
                        <p className="opacity-40">[08:42:12] Initializing Elite Node v20.14...</p>
                        <p className="text-white">[Studio] Architecture context loaded (4 files, 1 project).</p>
                        <p className="text-accent">[GenAI] Connection to Elite Brain established.</p>
                        <p className="text-blue-400">[Watcher] Hot Module Replacement active.</p>
                    </div>
                )}

                {activeTab === 'build' && (
                    <div className="space-y-4 p-4 text-center">
                        <div className="h-20 w-20 border-2 border-accent/20 border-t-accent rounded-full animate-spin mx-auto flex items-center justify-center">
                            <Smartphone className="h-8 w-8 text-accent" />
                        </div>
                        <p className="text-blue-400 font-black uppercase tracking-widest">EAS CLOUD BUILD ENGINE</p>
                        <button onClick={runInstall} className="px-6 py-2 bg-accent text-white rounded-xl font-black text-[9px] uppercase tracking-[0.2em] shadow-lg shadow-accent/20 hover:scale-105 transition-all">Lancer Build APK</button>
                    </div>
                )}
            </div>
            
            {/* Action Bar Terminal */}
            <div className="h-8 border-t border-white/5 bg-black/20 flex items-center px-4 justify-between">
                <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5 text-[8px] font-bold text-gray-500 uppercase"><Wifi className="h-3 w-3 text-green-500" /> Connecté</span>
                    <span className="flex items-center gap-1.5 text-[8px] font-bold text-gray-500 uppercase"><Download className="h-3 w-3" /> 12.4 KB/s</span>
                </div>
                <button onClick={() => setLogs([])} className="text-gray-600 hover:text-red-400 transition-colors"><Trash2 className="h-3 w-3" /></button>
            </div>
        </div>
    );
};
