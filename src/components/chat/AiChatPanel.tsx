'use client';

import { FC, useState, useRef, useEffect } from 'react';
import {
    Send, Loader2, BrainCircuit, Plus, Coins,
    ShieldCheck, Lock, ChevronRight,
    Copy, RotateCcw, Check, MessageSquareText,
    Paperclip, X, Image as ImageIcon, FileText,
    UserCircle, Sparkles, ThumbsUp, ThumbsDown, Zap, Terminal,
    Vote, ArrowRight, Code, Play, Smartphone, Palette, Search
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

const DISPLAY_FONT = { fontFamily: 'var(--font-display), system-ui, sans-serif' } as const;

// Suggestions rapides (mêmes requêtes qu'avant, présentées avec des icônes)
const QUICK_PROMPTS = [
    { icon: Smartphone, label: 'Écran Android 14', prompt: "Conçois un écran Android 14 interactif avec solde et cartes pour mon application." },
    { icon: Palette, label: 'Logo vectoriel SVG', prompt: "Génère un logo vectoriel SVG haute définition pour mon application." },
    { icon: Search, label: 'Audit architecture', prompt: "Analyse et audite toute l'application et propose les meilleures optimisations." },
    { icon: Vote, label: 'Créer un sondage', prompt: "Fais un sondage d'architecture pour décider des prochaines fonctionnalités." },
];

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
            {isTyping && <span className="typing-caret" />}
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
    // Message de l'utilisateur affiché tout de suite, pendant que JoJo répond
    const [pendingText, setPendingText] = useState<string | null>(null);

    const chatEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading, pendingText]);

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

    // La réponse est arrivée : le message en attente est remplacé par l'historique
    useEffect(() => {
        if (!isLoading) setPendingText(null);
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
            setPendingText(messageToSend.trim() ? messageToSend : 'Fichier joint');
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
                    <div className="mt-3 p-3.5 rounded-2xl bg-[#070620]/60 border border-violet-400/30 space-y-2.5">
                        <div className="flex items-center gap-2 text-cyan-300 text-[10px] font-bold uppercase tracking-wider">
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
                                            "w-full text-left p-2.5 rounded-xl text-[11px] font-semibold transition-all border flex items-center justify-between",
                                            isVoted
                                                ? "bg-gradient-to-r from-violet-600 to-indigo-500 text-white border-violet-300/60 shadow-lg"
                                                : "bg-white/5 border-white/10 text-gray-200 hover:bg-violet-500/15 hover:border-violet-400/50"
                                        )}
                                    >
                                        <span>{opt}</span>
                                        {isVoted ? <Check className="h-3.5 w-3.5" /> : <ArrowRight className="h-3 w-3 opacity-50" />}
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
        <div className="h-full bg-[#0c0a2c]/60 border-l border-white/5 flex flex-col shadow-2xl overflow-hidden glass-panel relative">
            {/* En-tête JoJo AI */}
            <div className="h-14 px-4 flex items-center justify-between border-b border-white/10 bg-gradient-to-r from-violet-600/30 via-indigo-600/20 to-cyan-500/20 premium-border shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                    <Image src="/logos/icon.png" alt="JoJo AI" width={34} height={34} className="rounded-[22%] shadow-[0_6px_20px_rgba(99,102,241,0.55)]" />
                    <div className="min-w-0">
                        <div className="font-bold leading-none text-white text-sm" style={DISPLAY_FONT}>
                            JoJo <span className="gradient-text">AI</span>
                        </div>
                        <div className="mt-1 flex items-center gap-1.5 text-cyan-300 font-semibold text-[9px] tracking-widest uppercase">
                            <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_8px_#22d3ee] animate-pulse" />
                            GEMINI 3.8 FLASH • LIVE
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2.5">
                    <div className="flex items-center gap-1.5 bg-white/10 text-cyan-200 px-3 py-1.5 rounded-full border border-white/15">
                        <Coins className="h-3.5 w-3.5 text-cyan-300" />
                        <span className="text-[10px] font-bold tracking-wide">{currentCredits.toFixed(1)} COINS</span>
                    </div>
                    <Button size="icon" onClick={() => setIsBillingOpen(true)} aria-label="Recharger des crédits" className="btn-jojo h-8 w-8 rounded-full">
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Barre de progression de codage */}
            <AnimatePresence>
                {isLoading && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-violet-500/10 border-b border-violet-400/20 px-3 py-2"
                    >
                        <div className="flex justify-between items-center mb-1.5 px-1">
                            <span className="text-[9px] font-semibold text-cyan-300 uppercase tracking-[0.18em] flex items-center gap-2">
                                <Terminal className="h-3 w-3" /> JOJO tape au clavier et code en direct...
                            </span>
                            <span className="text-[9px] font-mono text-cyan-300">{Math.floor(progress)}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full rounded-full progress-shimmer shadow-[0_0_14px_rgba(168,85,247,0.7)]"
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ type: 'spring', stiffness: 50 }}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Zone de discussion */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-hide text-gray-200">
                {messages.length === 0 && !pendingText && (
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="py-12 flex flex-col items-center justify-center text-center space-y-4"
                    >
                        <Image src="/logos/icon.png" alt="" width={72} height={72} className="rounded-[22%] owl-glow" />
                        <h3 className="text-2xl font-bold tracking-tight text-white" style={DISPLAY_FONT}>
                            Chattez avec <span className="gradient-text">JoJo AI</span>
                        </h3>
                        <p className="max-w-[260px] text-sm font-medium text-cyan-300 leading-snug" style={DISPLAY_FONT}>
                            Expliquez-lui, il le fait à votre place.
                        </p>
                        <p className="max-w-[260px] text-xs text-gray-400 leading-relaxed">
                            Android, web, logo, audit : décrivez votre idée et JoJo la réalise en quelques secondes.
                        </p>
                    </motion.div>
                )}

                {messages.map((msg, i) => {
                    const isModel = msg.role === 'model';
                    const isLatest = isModel && i === messages.length - 1;

                    return (
                        <motion.div initial={{ opacity: 0, y: 12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.3 }} key={i} className={cn("flex flex-col gap-2 max-w-full", isModel ? "items-start" : "items-end")}>
                            <div className={cn("flex items-center gap-2 px-1", isModel ? "flex-row" : "flex-row-reverse")}>
                                <div className="h-7 w-7 rounded-xl border border-white/15 flex items-center justify-center shadow-lg overflow-hidden bg-[#070620]">
                                    {isModel ? (
                                        <Image src="/logos/icon.png" alt="JOJO" width={28} height={28} className="object-cover" />
                                    ) : (
                                        <UserCircle className="h-5 w-5 text-violet-300" />
                                    )}
                                </div>
                                <span className="text-[9px] font-semibold uppercase tracking-widest text-gray-400">
                                    {isModel ? 'JOJO AI STUDIO (GEMINI 3.8)' : user.manager_name}
                                </span>
                            </div>

                            <div className={cn(
                                "px-4 py-3 text-[13px] leading-relaxed relative group max-w-[95%] break-words",
                                isModel ? "chat-bubble-ai text-gray-100 rounded-2xl rounded-tl-md" : "chat-bubble-user text-white rounded-2xl rounded-tr-md"
                            )}>
                                {isModel ? (
                                    renderMessageBody(msg.content, i, isLatest)
                                ) : (
                                    <div className="whitespace-pre-wrap font-medium">{msg.content}</div>
                                )}

                                {isModel && (
                                    <div className="mt-3 pt-3 border-t border-white/10 flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => copyToClipboard(msg.content, i)} className="text-[10px] font-semibold uppercase text-gray-300 hover:text-cyan-300 flex items-center gap-1.5 transition-colors">
                                            {copiedId === i ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />} {copiedId === i ? 'Copié' : 'Copier Réponse'}
                                        </button>
                                        <button onClick={() => handleSubmit(undefined, msg.content)} className="text-gray-400 hover:text-cyan-300 transition-colors ml-auto" title="Relancer">
                                            <RotateCcw className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    );
                })}

                {/* Ton message, affiché tout de suite pendant que JoJo répond */}
                {isLoading && pendingText && (
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-2 items-end max-w-full">
                        <div className="flex flex-row-reverse items-center gap-2 px-1">
                            <div className="h-7 w-7 rounded-xl border border-white/15 flex items-center justify-center shadow-lg overflow-hidden bg-[#070620]">
                                <UserCircle className="h-5 w-5 text-violet-300" />
                            </div>
                            <span className="text-[9px] font-semibold uppercase tracking-widest text-gray-400">{user.manager_name}</span>
                        </div>
                        <div className="chat-bubble-user text-white rounded-2xl rounded-tr-md px-4 py-3 text-[13px] leading-relaxed max-w-[95%] break-words">
                            <div className="whitespace-pre-wrap font-medium">{pendingText}</div>
                        </div>
                    </motion.div>
                )}

                {/* JoJo écrit... */}
                {isLoading && (
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-2 items-start max-w-full" role="status" aria-label="JoJo AI est en train de répondre">
                        <div className="flex items-center gap-2 px-1">
                            <div className="h-7 w-7 rounded-xl overflow-hidden bg-[#070620] ring-2 ring-cyan-300/50 animate-pulse">
                                <Image src="/logos/icon.png" alt="JOJO" width={28} height={28} className="object-cover" />
                            </div>
                            <span className="text-[9px] font-semibold uppercase tracking-widest text-cyan-300">JoJo écrit…</span>
                        </div>
                        <div className="chat-bubble-ai rounded-2xl rounded-tl-md px-4 py-3.5 flex items-center gap-1.5">
                            <span className="typing-dot" />
                            <span className="typing-dot" />
                            <span className="typing-dot" />
                        </div>
                    </motion.div>
                )}
                <div ref={chatEndRef} />
            </div>

            {/* Suggestions rapides */}
            <div className="px-4 py-2 flex gap-2 overflow-x-auto scrollbar-hide border-t border-white/10 bg-[#070620]/40">
                {QUICK_PROMPTS.map(({ icon: Icon, label, prompt }) => (
                    <button
                        key={label}
                        type="button"
                        disabled={isLoading}
                        onClick={() => handleSubmit(undefined, prompt)}
                        className="whitespace-nowrap flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-violet-500/25 text-gray-200 hover:text-white text-[11px] font-semibold border border-white/15 hover:border-violet-300/60 transition-all disabled:opacity-50"
                    >
                        <Icon className="h-3.5 w-3.5 text-cyan-300" />
                        {label}
                    </button>
                ))}
            </div>

            {/* Aperçu des pièces jointes */}
            <AnimatePresence>
                {attachments.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="px-4 py-2 flex gap-2 overflow-x-auto bg-[#070620]/30 border-t border-white/10">
                        {attachments.map((file, idx) => (
                            <div key={idx} className="relative group shrink-0">
                                <div className="h-12 w-12 rounded-xl bg-violet-500/10 border border-violet-400/30 flex items-center justify-center overflow-hidden">
                                    {file.contentType.startsWith('image/') ? (
                                        <Image src={file.url} alt="upload" width={48} height={48} className="h-full w-full object-cover" unoptimized />
                                    ) : (
                                        <FileText className="h-5 w-5 text-cyan-300" />
                                    )}
                                </div>
                                <button onClick={() => removeAttachment(idx)} aria-label="Retirer la pièce jointe" className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 shadow-lg"><X className="h-2.5 w-2.5" /></button>
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Zone de saisie */}
            <div className="p-4 bg-[#070620]/50 border-t border-white/10 space-y-2 shrink-0">
                <form onSubmit={handleSubmit}>
                    <div className="chat-input rounded-3xl flex items-end gap-2 p-2 pl-4">
                        <Textarea
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            placeholder="Écrivez votre demande..."
                            className="flex-1 min-h-[56px] max-h-40 border-0 bg-transparent px-0 py-2 text-[13px] leading-relaxed text-white placeholder:text-white/60 resize-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                        />
                        <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                        <Button type="button" size="icon" variant="ghost" onClick={() => fileInputRef.current?.click()} aria-label="Joindre un fichier" className="h-10 w-10 shrink-0 text-gray-300 hover:text-cyan-300 hover:bg-white/10 rounded-full">
                            <Paperclip className="h-4 w-4" />
                        </Button>
                        <Button type="submit" size="icon" aria-label="Envoyer" disabled={isLoading || (!input.trim() && attachments.length === 0)} className="btn-send h-11 w-11 shrink-0 rounded-full border-0 active:scale-95">
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        </Button>
                    </div>
                </form>
                <p className="text-[8px] font-semibold text-gray-400 text-center uppercase tracking-widest">
                    JOJO AI STUDIO • Moteur Gemini 3.8 Flash & Émulateur Android 14 Connecté
                </p>
            </div>

            {/* Billing Dialog */}
            <Dialog open={isBillingOpen} onOpenChange={setIsBillingOpen}>
                <DialogContent className="bg-[#121038] border-white/10 text-white glass-panel rounded-3xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold tracking-tight flex items-center gap-3" style={DISPLAY_FONT}>
                            <Coins className="h-6 w-6 text-cyan-300" /> Recharger Elite Coins
                        </DialogTitle>
                    </DialogHeader>
                    {billingStep === 'amount' ? (
                        <div className="space-y-6 py-4">
                            <div className="grid grid-cols-3 gap-3">
                                {['1.90', '4.90', '9.90'].map(val => (
                                    <button key={val} onClick={() => setAmount(val)} className={cn("py-3 rounded-xl border text-xs font-bold transition-all", dollarAmount === val ? "bg-gradient-to-r from-violet-600 to-indigo-500 border-violet-300/60 text-white shadow-lg" : "bg-white/5 border-white/10 text-gray-300 hover:border-violet-300/50")}>
                                        {val}$ USD
                                    </button>
                                ))}
                            </div>
                            <Button onClick={() => setBillingStep('security')} className="btn-jojo w-full h-12 font-semibold text-sm rounded-full">Continuer</Button>
                        </div>
                    ) : (
                        <div className="space-y-6 py-4">
                            <div className="p-4 bg-violet-500/10 border border-violet-400/30 rounded-2xl flex items-center gap-4">
                                <ShieldCheck className="h-8 w-8 text-cyan-300" />
                                <p className="text-[11px] font-semibold text-gray-300 uppercase tracking-widest">Validation de sécurité pour {dollarAmount}$.</p>
                            </div>
                            <Button onClick={() => { setIsBillingOpen(false); toast({ title: "Crédits Rechargés !" }); }} className="btn-jojo w-full h-12 font-semibold text-sm rounded-full">Confirmer</Button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};
