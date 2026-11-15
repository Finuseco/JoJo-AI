
'use client';

import { FC, useState } from 'react';
import { 
    Github, GitBranch, GitCommit, GitPullRequest, 
    RefreshCcw, ShieldCheck, ExternalLink, Link as LinkIcon,
    History, Clock, AlertCircle, Plus, Send, Download, GitMerge
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export const GitManager: FC<{ projectId: number }> = ({ projectId }) => {
    const { toast } = useToast();
    const [repoUrl, setRepoUrl] = useState('');
    const [isLinked, setIsLinked] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    const [commitMsg, setCommitMsg] = useState('');

    const handleCommit = () => {
        if (!commitMsg) return;
        toast({ title: "Commit Créé", description: commitMsg });
        setCommitMsg('');
    };

    return (
        <div className="flex flex-col h-full bg-[#111114] p-5 space-y-6 overflow-y-auto scrollbar-hide">
            <div className="flex items-center justify-between">
                <h2 className="text-[11px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                    <GitBranch className="h-4 w-4 text-accent" /> Source Control
                </h2>
                <Button variant="ghost" size="icon" className="h-7 w-7"><RefreshCcw className="h-3.5 w-3.5" /></Button>
            </div>

            <div className="space-y-4">
                <div className="bg-black/40 border border-white/5 p-4 rounded-xl space-y-4">
                    <textarea 
                        value={commitMsg}
                        onChange={e => setCommitMsg(e.target.value)}
                        placeholder="Message de commit..."
                        className="w-full bg-black/60 border border-white/10 rounded-lg p-3 text-[11px] min-h-[80px] focus:border-accent/40"
                    />
                    <div className="flex gap-2">
                        <Button onClick={handleCommit} className="flex-1 h-9 bg-accent text-[9px] font-black uppercase">Commit</Button>
                        <Button className="h-9 px-4 bg-white/5 text-white text-[9px] font-black uppercase border border-white/10 hover:bg-white/10"><Send className="h-3 w-3" /></Button>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" className="h-9 border-white/5 bg-white/5 text-[8px] font-black uppercase hover:bg-accent hover:text-white"><Download className="h-3 w-3 mr-2" /> Pull</Button>
                    <Button variant="outline" className="h-9 border-white/5 bg-white/5 text-[8px] font-black uppercase hover:bg-accent hover:text-white"><Send className="h-3 w-3 mr-2" /> Push</Button>
                    <Button variant="outline" className="h-9 border-white/5 bg-white/5 text-[8px] font-black uppercase hover:bg-accent hover:text-white"><GitMerge className="h-3 w-3 mr-2" /> Merge</Button>
                    <Button variant="outline" className="h-9 border-white/5 bg-white/5 text-[8px] font-black uppercase hover:bg-accent hover:text-white"><Plus className="h-3 w-3 mr-2" /> Branch</Button>
                </div>

                <div className="space-y-3 pt-4 border-t border-white/5">
                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest px-1">Timeline & Historique</p>
                    {[1, 2, 3].map(i => (
                        <div key={i} className="p-3 bg-black/20 rounded-lg border border-white/5 flex items-center gap-3 hover:border-accent/40 cursor-pointer transition-all group">
                            <GitCommit className="h-3.5 w-3.5 text-gray-600 group-hover:text-accent" />
                            <div className="min-w-0">
                                <p className="text-[10px] text-gray-300 truncate font-bold uppercase tracking-tighter">feat: Update architecture schema</p>
                                <p className="text-[7px] text-gray-600 uppercase font-black">SHA: 7a2b9c1 • il y a 2h</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <Button className="w-full h-11 border border-white/10 bg-black/40 text-gray-400 hover:text-white hover:border-accent/40 text-[9px] font-black uppercase transition-all mt-auto">
                <Github className="h-4 w-4 mr-2.5" /> Synchroniser GitHub
            </Button>
        </div>
    );
};
