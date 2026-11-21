'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getFileContent } from '@/lib/actions/dev-portal.actions';
import { ShieldCheck, Zap, AlertTriangle, XCircle, Search, Terminal } from 'lucide-react';
import Image from 'next/image';

export default function ProjectPreviewPage() {
    const params = useParams();
    const projectId = parseInt(params.id as string);
    const [content, setContent] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<{message: string, file: string, type: string} | null>(null);

    useEffect(() => {
        const fetchPreview = async () => {
            setError(null);
            try {
                // Simulation d'un moteur de rendu Next/Expo
                let res = await getFileContent(projectId, 'app/page.tsx');
                let fileName = 'app/page.tsx';
                
                if (!res.content) {
                    res = await getFileContent(projectId, 'App.tsx');
                    fileName = 'App.tsx';
                }
                
                if (!res.content) {
                    setError({ 
                        message: "Nexus Render Error: Point d'entrée manquant. JOJO doit créer app/page.tsx ou App.tsx.", 
                        file: "architecture",
                        type: "Entry Point Missing"
                    });
                } else {
                    // Analyse basique pour simuler des erreurs de syntaxe réelles
                    if (res.content.includes('import') && !res.content.includes('from')) {
                        setError({ 
                            message: "SyntaxError: Unexpected token. Mot-clé 'from' attendu dans l'importation.", 
                            file: fileName,
                            type: "Syntax Error"
                        });
                    } else if (res.content.includes('undefined')) {
                         setError({ 
                            message: "TypeError: Cannot read property of undefined. Vérifiez vos variables d'état.", 
                            file: fileName,
                            type: "Runtime Error"
                        });
                    }
                }
                
                setContent(res.content || "");
            } catch (err) {
                console.error('Project preview fetch error:', err);
                setError({ message: "Échec de connexion au tunnel virtuel.", file: "Nexus", type: "Network Error" });
            } finally {
                setLoading(false);
            }
        };
        fetchPreview();
    }, [projectId]);

    if (loading) {
        return (
            <div className="h-screen w-full bg-[#070620] flex flex-col items-center justify-center text-white">
                <div className="relative flex items-center justify-center">
                    <div className="h-32 w-32 border-2 border-accent/20 border-t-accent rounded-full animate-spin shadow-[0_0_40px_rgba(124,58,237,0.35)]" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Image src="/logos/icon.png" alt="JOJO" width={60} height={60} className="animate-pulse" />
                    </div>
                </div>
                <div className="mt-12 text-center space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.6em] text-accent">Lancement de l'Instance</p>
                    <p className="text-[7px] text-gray-600 font-bold uppercase tracking-widest">Initialisation du tunnel virtuel...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-[#0c0a2c] text-white p-10 font-sans flex flex-col items-center justify-center text-center">
                <div className="p-3 rounded-3xl bg-red-500/10 border border-red-500/20 mb-8 shadow-2xl">
                    <XCircle className="h-20 w-20 text-red-500" />
                </div>
                <h1 className="text-3xl font-black uppercase tracking-tight mb-2">{error.type}</h1>
                <p className="text-gray-500 font-bold uppercase text-[10px] tracking-widest mb-10">Fichier impacté : <span className="text-red-400">{error.file}</span></p>
                
                <div className="w-full max-w-3xl bg-black/60 border border-red-500/30 rounded-[2rem] p-8 text-left shadow-[0_32px_80px_rgba(0,0,0,0.5)] relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Terminal className="h-20 w-20" />
                    </div>
                    <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
                        <AlertTriangle className="h-5 w-5 text-yellow-500" />
                        <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Elite Debugger Logs</span>
                    </div>
                    <pre className="text-[12px] text-red-400 font-mono leading-relaxed block whitespace-pre-wrap bg-red-500/5 p-4 rounded-xl">
                        {error.message}
                    </pre>
                </div>
                
                <div className="mt-12 flex flex-col items-center gap-4">
                    <div className="flex items-center gap-3 px-6 py-3 bg-accent/10 border border-accent/30 rounded-full animate-pulse">
                        <Zap className="h-4 w-4 text-accent" />
                        <span className="text-[10px] font-black text-accent uppercase tracking-widest">JOJO AI répare l'architecture en arrière-plan...</span>
                    </div>
                    <button onClick={() => window.location.reload()} className="text-[9px] font-black text-gray-500 hover:text-white uppercase tracking-widest transition-colors border-b border-gray-800 pb-1">Forcer le rafraîchissement</button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white text-black font-sans relative">
            <div className="fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-2.5 bg-accent text-white rounded-full text-[10px] font-black uppercase shadow-2xl border border-white/20">
                <Zap className="h-4 w-4 animate-pulse" /> Live Elite Engine
            </div>
            
            <div className="p-12 max-w-7xl mx-auto">
                <div className="p-12 border-4 border-dashed border-gray-100 rounded-[4rem] text-center bg-gray-50/30">
                    <div className="mb-8 relative inline-block">
                        <ShieldCheck className="h-24 w-24 mx-auto text-accent opacity-10" />
                        <div className="absolute inset-0 flex items-center justify-center">
                           <Image src="/logos/icon.png" alt="JOJO" width={40} height={40} className="grayscale opacity-30" />
                        </div>
                    </div>
                    <h1 className="text-5xl font-black text-slate-900 mb-4 tracking-tighter">Instance Elite Prête</h1>
                    <p className="text-slate-400 font-bold uppercase tracking-[0.4em] text-[11px] mb-12">Architecture Nexus ID: {projectId}</p>
                    
                    <div className="text-left bg-slate-900 rounded-[3rem] p-10 shadow-2xl border border-white/5 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                        <div className="flex items-center gap-3 mb-6 text-gray-500 border-b border-white/10 pb-5">
                            <Search className="h-4 w-4" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Analyseur de Source Virtuel</span>
                        </div>
                        <pre className="text-blue-400 font-mono text-[13px] leading-relaxed overflow-auto max-h-[600px] scrollbar-hide">
                            {content}
                        </pre>
                    </div>
                </div>
            </div>
        </div>
    );
}