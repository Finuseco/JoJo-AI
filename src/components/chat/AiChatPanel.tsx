'use client';

import { FC, useState, useRef, useEffect } from 'react';
import { 
    Send, Loader2, BrainCircuit, Plus, Coins, 
    ShieldCheck, Lock, ChevronRight,
    Copy, RotateCcw, Check, MessageSquareText,
    Paperclip, X, Image as ImageIcon, FileText,
    UserCircle, Sparkles, ThumbsUp, ThumbsDown, Zap, Terminal,
    Vote, ArrowRight, Code, Play
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { buyChatCredits, requestTransactionOtp } from '@/lib/actions/billing.actions';
import { useToast } from '@/hooks/use-toast';
import type { DevPortalUser } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

interface AiChatPanelProps {
    projectId: number;
    messages: any[];
    onSendMessage: (text: string, attachments?: any[]) => void;
    isLoading: boolean;
    currentCredits: number;
    onRefresh: () => void;
    user: DevPortalUser;
    onInjectCode?: (code: string) => void;
}

// Composant avec effet machine à écrire pour le dernier message
function TypewriterMessage({ content, isLatest }: { content: string; isLatest: boolean }) {
    const [displayedText, setDisplayedText] = useState(isLatest ? '' : content);
    const [isTyping, setIsTyping] = useState(isLatest);

    useEffect(() => {
        if (!isLatest) {
            setDisplayedText(content);
            setIsTyping(false);
            return;
        }

        let index = 0;
        setDisplayedText('');
        setIsTyping(true);

        const timer = setInterval(() => {
            index += 3; // 3 caractères à la fois pour un effet naturel et dynamique
            if (index >= content.length) {
                setDisplayedText(content);
                setIsTyping(false);
                clearInterval(timer);
            } else {
                setDisplayedText(content.slice(0, index));
            }
        }, 15);

        return () => clearInterval(timer);
    }, [content, isLatest]);

    return (
        <span>
            {displayedText}
            {isTyping && <span className="inline-block w-1.5 h-3.5 bg-cyan-400 ml-0.5 animate-pulse" />}
        </span>
    );
}

export const AiChatPanel: FC<AiChatPanelProps> = ({ 
    projectId, messages, onSendMessage, isLoading, currentCredits, onRefresh, user, onInjectCode 
}) => {
    const { toast } = useToast();
    const [input, setInput] = useState('');
    const [attachments, setAttachments] = useState<any[]>([]);
    const [isBillingOpen, setIsBillingOpen] = useState(false);
    const [billingStep, setBillingStep] = useState<'amount' | 'security'>('amount');
    const [dollarAmount, setAmount] = useState('1.90');
    const [copiedId, setCopiedId] = useState<number | null>(null);
    const [selectedPollVotes, setSelectedPollVotes] = useState<Record<number, string>>({});
    const [progress, setProgress] = useState(0);
    
    const chatEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => { 
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); 
    }, [messages, isLoading]);

    // Barre de progression pendant la réflexion de l'IA
    useEffect(() => {
        let interval: any;
        if (isLoading) {
            setProgress(0);
            interval = setInterval(() => {
                setProgress(prev => (prev >= 95 ? 95 : prev + (100 - prev) * 0.1));
            }, 300);
        } else {
            setProgress(100);
            setTimeout(() => setProgress(0), 500);
        }
        return () => clearInterval(interval);
    }, [isLoading]);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            setAttachments(prev => [...prev, { name: file.name, url: reader.result as string, contentType: file.type }]);
        };
        reader.readAsDataURL(file);
    };

    const removeAttachment = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = (e?: React.FormEvent, customText?: string) => {
        if (e) e.preventDefault();
        const messageToSend = customText || input;
        if ((messageToSend.trim() || attachments.length > 0) && !isLoading) {
            onSendMessage(messageToSend, attachments);
            if (!customText) setInput('');
            setAttachments([]);
        }
    };

    const copyToClipboard = (text: string, index: number) => {
        navigator.clipboard.writeText(text);
        setCopiedId(index);
        toast({ title: "Copié dans le presse-papiers" });
        setTimeout(() => setCopiedId(null), 2000);
    };

    // Parser les sondages interactifs [POLL: Question | Opt1 | Opt2]
    const renderMessageBody = (content: string, msgIndex: number, isLatest: boolean) => {
        const pollMatch = content.match(/\[POLL:\s*([^\]]+)\]/);
        const textWithoutPoll = content.replace(/\[POLL:\s*([^\]]+)\]/, '').trim();

        let pollQuestion = '';
        let pollOptions: string[] = [];

        if (pollMatch) {
            const parts = pollMatch[1].split('|').map(p => p.trim());
            pollQuestion = parts[0] || 'Choix d\'architecture :';
            pollOptions = parts.slice(1);
        }

        return (
            <div className="space-y-3">
                <div className="whitespace-pre-wrap font-medium">
                    <TypewriterMessage content={textWithoutPoll} isLatest={isLatest} />
                </div>

                {pollOptions.length > 0 && (
                    <div className="mt-3 p-3.5 rounded-2xl bg-black/40 border border-cyan-500/30 space-y-2.5">
                        <div className="flex items-center gap-2 text-cyan-400 text-[10px] font-black uppercase tracking-wider">
                            <Vote className="h-3.5 w-3.5" />
                            <span>{pollQuestion}</span>
                        </div>
                        <div className="grid gap-1.5">
                            {pollOptions.map((opt, optIdx) => {
                                const isVoted = selectedPollVotes[msgIndex] === opt;
                                return (
                                    <button
                                        key={optIdx}
                                        onClick={() => {
                                            setSelectedPollVotes(prev => ({ ...prev, [msgIndex]: opt }));
                                            handleSubmit(undefined, `J'ai choisi l'option du sondage : ${opt}`);
                                        }}
                                        className={cn(
                                            "w-full text-left p-2 rounded-xl text-[10px] font-bold transition-all border flex items-center justify-between",
                                            isVoted 
                                                ? "bg-cyan-500 text-black border-cyan-400 font-black shadow-lg" 
                                                : "bg-white/5 border-white/5 text-gray-300 hover:bg-cyan-500/10 hover:border-cyan-500/30"
                                        )}
                                    >
                                        <span>{opt}</span>
                                        {isVoted ? <Check className="h-3.5 w-3.5" /> : <ArrowRight className="h-3 w-3 opacity-40" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="h-full bg-[#0c0d12]/95 border-l border-white/5 flex flex-col shadow-2xl overflow-hidden glass-panel relative">
            {/* Header JOJO AI STUDIO */}
            <div className="h-11 px-5 flex items-center justify-between border-b border-white/10 bg-primary/20 premium-border shrink-0">
                <div className="flex items-center text-cyan-400 font-black text-[9px] tracking-widest uppercase">
                    <Sparkles className="h-3.5 w-3.5 mr-2 animate-pulse text-cyan-400" /> GEMINI 3.8 FLASH • LIVE
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 bg-cyan-500/10 text-cyan-400 px-2.5 py-1 rounded-lg border border-cyan-500/20">
                        <Coins className="h-3.5 w-3.5" />
                        <span className="text-[10px] font-black">{currentCredits.toFixed(1)} COINS</span>
                    </div>
                    <Button size="icon" onClick={() => setIsBillingOpen(true)} className="h-7 w-7 bg-cyan-500 hover:bg-cyan-400 rounded-lg shadow-lg hover:scale-105 transition-all text-black">
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Barre de Progression de Codage */}
            <AnimatePresence>
                {isLoading && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-cyan-500/10 border-b border-cyan-500/20 p-2"
                    >
                        <div className="flex justify-between items-center mb-1 px-1">
                            <span className="text-[8px] font-black text-cyan-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                <Terminal className="h-3 w-3" /> JOJO tape au clavier et code en direct...
                            </span>
                            <span className="text-[8px] font-mono text-cyan-400">{Math.floor(progress)}%</span>
                        </div>
                        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                            <motion.div 
                                className="h-full bg-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.5)]"
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ type: 'spring', stiffness: 50 }}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Chat Zone */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-hide text-gray-300">
                {messages.length === 0 && (
                    <div className="py-16 flex flex-col items-center justify-center opacity-30 text-center space-y-3">
                        <BrainCircuit className="h-14 w-14 text-cyan-400" />
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] max-w-[220px]">
                            Moteur Gemini Prêt • Tapez vos requêtes Android & Web
                        </p>
                    </div>
                )}
                {messages.map((msg, i) => {
                    const isModel = msg.role === 'model';
                    const isLatest = isModel && i === messages.length - 1;

                    return (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={i} className={cn("flex flex-col gap-2 max-w-full", isModel ? "items-start" : "items-end")}>
                            <div className={cn("flex items-center gap-2 px-1", isModel ? "flex-row" : "flex-row-reverse")}>
                                <div className={cn("h-7 w-7 rounded-xl border border-white/10 flex items-center justify-center shadow-lg overflow-hidden bg-black")}>
                                    {isModel ? (
                                        <Image src="/logos/icon.png" alt="JOJO" width={28} height={28} className="object-cover" />
                                    ) : (
                                        <UserCircle className="h-5 w-5 text-blue-400" />
                                    )}
                                </div>
                                <span className="text-[8px] font-black uppercase tracking-widest opacity-40">
                                    {isModel ? 'JOJO AI STUDIO (GEMINI 3.8)' : user.manager_name}
                                </span>
                            </div>
                            
                            <div className={cn(
                                "p-4 rounded-2xl text-[11px] leading-relaxed relative group shadow-xl max-w-[95%] break-words border",
                                isModel ? "bg-[#181a24] border-white/10 text-gray-200" : "bg-cyan-500/15 border-cyan-500/30 text-white"
                            )}>
                                {isModel ? (
                                    renderMessageBody(msg.content, i, isLatest)
                                ) : (
                                    <div className="whitespace-pre-wrap font-medium">{msg.content}</div>
                                )}

                                {isModel && (
                                    <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => copyToClipboard(msg.content, i)} className="text-[9px] font-black uppercase text-gray-400 hover:text-cyan-400 flex items-center gap-1.5 transition-colors">
                                            {copiedId === i ? <Check className="h-2.5 w-2.5 text-emerald-400" /> : <Copy className="h-2.5 w-2.5" />} {copiedId === i ? 'Copié' : 'Copier Réponse'}
                                        </button>
                                        <button onClick={() => handleSubmit(undefined, msg.content)} className="text-gray-500 hover:text-cyan-400 transition-colors ml-auto" title="Relancer">
                                            <RotateCcw className="h-3 w-3" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    );
                })}
                <div ref={chatEndRef} />
            </div>

            {/* Quick Prompt Chips */}
            <div className="px-4 py-1.5 flex gap-1.5 overflow-x-auto scrollbar-hide border-t border-white/5 bg-black/30">
                <button 
                    onClick={() => handleSubmit(undefined, "Conçois un écran Android 14 interactif avec solde et cartes pour mon application.")}
                    className="whitespace-nowrap px-2.5 py-1 rounded-xl bg-white/5 hover:bg-cyan-500/20 text-gray-400 hover:text-cyan-400 text-[9px] font-bold border border-white/5 transition-all"
                >
                    📱 Écran Android 14
                </button>
                <button 
                    onClick={() => handleSubmit(undefined, "Génère un logo vectoriel SVG haute définition pour mon application.")}
                    className="whitespace-nowrap px-2.5 py-1 rounded-xl bg-white/5 hover:bg-cyan-500/20 text-gray-400 hover:text-cyan-400 text-[9px] font-bold border border-white/5 transition-all"
                >
                    🎨 Logo Vectoriel SVG
                </button>
                <button 
                    onClick={() => handleSubmit(undefined, "Analyse et audite toute l'application et propose les meilleures optimisations.")}
                    className="whitespace-nowrap px-2.5 py-1 rounded-xl bg-white/5 hover:bg-cyan-500/20 text-gray-400 hover:text-cyan-400 text-[9px] font-bold border border-white/5 transition-all"
                >
                    🔍 Audit Architecture
                </button>
                <button 
                    onClick={() => handleSubmit(undefined, "Fais un sondage d'architecture pour décider des prochaines fonctionnalités.")}
                    className="whitespace-nowrap px-2.5 py-1 rounded-xl bg-white/5 hover:bg-cyan-500/20 text-gray-400 hover:text-cyan-400 text-[9px] font-bold border border-white/5 transition-all"
                >
                    📊 Créer un Sondage
                </button>
            </div>

            {/* Attachments Preview */}
            <AnimatePresence>
                {attachments.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="px-4 py-2 flex gap-2 overflow-x-auto bg-black/20 border-t border-white/5">
                        {attachments.map((file, idx) => (
                            <div key={idx} className="relative group shrink-0">
                                <div className="h-12 w-12 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center overflow-hidden">
                                    {file.contentType.startsWith('image/') ? (
                                        <Image src={file.url} alt="upload" width={48} height={48} className="h-full w-full object-cover" unoptimized />
                                    ) : (
                                        <FileText className="h-5 w-5 text-cyan-400" />
                                    )}
                                </div>
                                <button onClick={() => removeAttachment(idx)} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 shadow-lg"><X className="h-2 w-2" /></button>
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Input Form */}
            <div className="p-4 bg-black/40 border-t border-white/5 space-y-2 shrink-0">
                <form onSubmit={handleSubmit} className="relative">
                    <Textarea 
                        value={input} 
                        onChange={e => setInput(e.target.value)} 
                        placeholder="Demandez du code Android, un logo, ou une modification..."
                        className="bg-black/50 border-white/10 text-[11px] min-h-[85px] rounded-2xl pr-14 pl-4 focus:border-cyan-400/40 resize-none shadow-2xl leading-relaxed text-white" 
                    />
                    <div className="absolute right-3 bottom-3 flex flex-col gap-2">
                        <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                        <Button type="button" size="icon" variant="ghost" onClick={() => fileInputRef.current?.click()} className="h-8 w-8 text-gray-500 hover:text-cyan-400 hover:bg-white/5 rounded-lg">
                            <Paperclip className="h-4 w-4" />
                        </Button>
                        <Button type="submit" size="icon" disabled={isLoading || (!input.trim() && attachments.length === 0)} className="h-10 w-10 bg-cyan-500 hover:bg-cyan-400 text-black rounded-xl shadow-xl active:scale-95 transition-all">
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        </Button>
                    </div>
                </form>
                <p className="text-[7px] font-black text-gray-500 text-center uppercase tracking-widest">
                    JOJO AI STUDIO • Moteur Gemini 3.8 Flash & Émulateur Android 14 Connecté
                </p>
            </div>

            {/* Billing Dialog */}
            <Dialog open={isBillingOpen} onOpenChange={setIsBillingOpen}>
                <DialogContent className="bg-[#111114] border-white/10 text-white glass-panel rounded-3xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black uppercase tracking-tighter flex items-center gap-3">
                            <Coins className="h-6 w-6 text-cyan-400" /> Recharger Elite Coins
                        </DialogTitle>
                    </DialogHeader>
                    {billingStep === 'amount' ? (
                        <div className="space-y-6 py-4">
                            <div className="grid grid-cols-3 gap-3">
                                {['1.90', '4.90', '9.90'].map(val => (
                                    <button key={val} onClick={() => setAmount(val)} className={cn("py-3 rounded-xl border text-[10px] font-black transition-all", dollarAmount === val ? "bg-cyan-500 border-cyan-400 text-black shadow-lg" : "bg-black/40 border-white/5 text-gray-400 hover:border-white/20")}>
                                        {val}$ USD
                                    </button>
                                ))}
                            </div>
                            <Button onClick={() => setBillingStep('security')} className="w-full h-12 bg-cyan-500 text-black font-black text-[10px] uppercase tracking-widest rounded-xl">Continuer</Button>
                        </div>
                    ) : (
                        <div className="space-y-6 py-4">
                            <div className="p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl flex items-center gap-4">
                                <ShieldCheck className="h-8 w-8 text-cyan-400" />
                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Validation de sécurité pour {dollarAmount}$.</p>
                            </div>
                            <Button onClick={() => { setIsBillingOpen(false); toast({ title: "Crédits Rechargés !" }); }} className="w-full h-12 bg-white text-black font-black text-[10px] uppercase tracking-widest rounded-xl">Confirmer</Button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};
