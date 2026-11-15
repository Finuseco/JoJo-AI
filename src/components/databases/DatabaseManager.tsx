'use client';

import { FC, useState, useEffect, useCallback } from 'react';
import { Database, Plus, Loader2, DatabaseZap, Terminal, Trash2, ExternalLink, User, Key, Server } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { getProjectDatabases, provisionNewDatabase, runSqlQuery } from '@/lib/actions/dev-portal.actions';
import { cn } from '@/lib/utils';

export const DatabaseManager: FC<{ projectId: number }> = ({ projectId }) => {
    const { toast } = useToast();
    const [dbs, setDbs] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [view, setView] = useState<'list' | 'create' | 'sql'>('list');
    const [selectedDb, setSelectedDb] = useState<any>(null);
    const [sqlScript, setSqlScript] = useState('');
    
    const [dbType, setDbType] = useState<'pg' | 'mysql'>('pg');
    const [newDbConfig, setNewDbConfig] = useState({ name: '', user: '', pass: '' });
    const [isProvisioning, setIsProvisioning] = useState(false);

    const loadDbs = useCallback(async () => {
        setIsLoading(true);
        const res = await getProjectDatabases(projectId);
        if (res.success) setDbs(res.databases);
        setIsLoading(false);
    }, [projectId]);

    useEffect(() => { loadDbs(); }, [loadDbs]);

    const handleCreateDb = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newDbConfig.name || !newDbConfig.user || !newDbConfig.pass) {
            toast({ variant: "destructive", title: "Champs requis", description: "Veuillez remplir tous les identifiants (Nom, User, Password)." });
            return;
        }
        setIsProvisioning(true);
        const res = await provisionNewDatabase(projectId, { ...newDbConfig, type: dbType });
        setIsProvisioning(false);
        if (res.success) {
            toast({ title: "Base Elite Créée", description: `L'instance ${dbType.toUpperCase()} est prête avec vos identifiants.` });
            setView('list');
            loadDbs();
            setNewDbConfig({ name: '', user: '', pass: '' });
        } else {
            console.error('Database provisioning error:', res.error);
            toast({ variant: "destructive", title: "Erreur de Provisioning", description: res.error });
        }
    };

    if (view === 'create') {
        return (
            <div className="flex flex-col h-full bg-[#16161a] p-6 space-y-6 overflow-y-auto scrollbar-hide">
                <h2 className="text-lg font-black text-white uppercase tracking-tighter flex items-center gap-2"><Plus className="h-5 w-5 text-accent" /> CONFIGURATION MANUELLE</h2>
                <div className="flex gap-2 p-1 bg-black/40 rounded-xl border border-white/5">
                    <button className={cn("flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all", dbType === 'pg' ? "bg-accent text-white shadow-lg" : "text-gray-500")} onClick={() => setDbType('pg')}>PostgreSQL</button>
                    <button className={cn("flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all", dbType === 'mysql' ? "bg-accent text-white shadow-lg" : "text-gray-500")} onClick={() => setDbType('mysql')}>MySQL</button>
                </div>
                <form onSubmit={handleCreateDb} className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">Database Name</label>
                        <Input value={newDbConfig.name} onChange={e => setNewDbConfig({...newDbConfig, name: e.target.value})} placeholder="ex: jojo_fintech_db" className="h-11 bg-black/50 border-white/10 rounded-xl" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">DB User</label>
                        <div className="relative">
                            <Input value={newDbConfig.user} onChange={e => setNewDbConfig({...newDbConfig, user: e.target.value})} placeholder="Utilisateur" className="h-11 bg-black/50 border-white/10 pl-10 rounded-xl" />
                            <User className="absolute left-3 top-3.5 h-4 w-4 text-gray-600" />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">DB Password</label>
                        <div className="relative">
                            <Input type="password" value={newDbConfig.pass} onChange={e => setNewDbConfig({...newDbConfig, pass: e.target.value})} placeholder="••••••••" className="h-11 bg-black/50 border-white/10 pl-10 rounded-xl" />
                            <Key className="absolute left-3 top-3.5 h-4 w-4 text-gray-600" />
                        </div>
                    </div>
                    <Button type="submit" disabled={isProvisioning} className="w-full h-11 bg-accent text-white font-black text-[10px] uppercase rounded-xl shadow-xl mt-4 transition-all active:scale-95">
                        {isProvisioning ? <Loader2 className="h-4 w-4 animate-spin" /> : "GÉNÉRER L'INSTANCE ELITE"}
                    </Button>
                </form>
                <Button variant="ghost" onClick={() => setView('list')} className="w-full h-11 text-[9px] font-bold text-gray-500 uppercase hover:text-white transition-colors">Annuler</Button>
            </div>
        );
    }

    if (view === 'sql') {
        return (
            <div className="flex flex-col h-full bg-[#16161a] p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-black text-white uppercase tracking-tighter flex items-center gap-2"><Terminal className="h-5 w-5 text-accent" /> SQL RUNNER</h2>
                    <span className="text-[8px] font-black text-accent bg-accent/10 px-2 py-0.5 rounded-full uppercase tracking-widest border border-accent/20">{selectedDb?.name}</span>
                </div>
                <Textarea value={sqlScript} onChange={e => setSqlScript(e.target.value)} placeholder="CREATE TABLE jojo_elite_users (id SERIAL PRIMARY KEY, full_name VARCHAR(100));" className="flex-1 bg-black/50 border-white/10 font-mono text-[11px] p-4 leading-relaxed rounded-2xl shadow-inner resize-none focus:border-accent/50" />
                <div className="flex gap-3">
                    <Button variant="ghost" onClick={() => setView('list')} className="flex-1 h-11 text-[9px] font-black uppercase text-gray-500">Retour</Button>
                    <Button onClick={async () => {
                        const res = await runSqlQuery(projectId, selectedDb.id, sqlScript);
                        if (res.success) { 
                            toast({ title: "Opération Réussie", description: "Le script SQL a été injecté dans l'architecture." }); 
                            setSqlScript(''); 
                            setView('list'); 
                        } else {
                            console.error('SQL query execution error:', res.error);
                            toast({ variant: "destructive", title: "Erreur SQL", description: res.error || "Échec d'exécution de la requête." });
                        }
                    }} className="flex-[2] h-11 bg-white text-black font-black text-[10px] uppercase rounded-xl shadow-2xl active:scale-95 transition-all">EXÉCUTER DANS LE TUNNEL</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-[#16161a] p-6 space-y-8 overflow-y-auto scrollbar-hide">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-black text-white flex items-center gap-3 uppercase tracking-tighter"><DatabaseZap className="h-6 w-6 text-accent" /> GESTION DB ELITE</h2>
                    <p className="text-[10px] text-gray-500 uppercase font-bold italic tracking-wider">Instances Managées Studio</p>
                </div>
                <Button size="icon" onClick={() => setView('create')} className="h-11 w-11 bg-accent rounded-xl shadow-2xl active:scale-95 transition-all"><Plus className="h-6 w-6" /></Button>
            </div>
            <div className="grid gap-5">
                {isLoading ? [1,2].map(i => <div key={i} className="h-32 bg-black/20 rounded-2xl animate-pulse border border-white/5" />) : dbs.length === 0 ? (
                    <div className="text-center py-16 opacity-30">
                        <Database className="h-16 w-16 mx-auto mb-4 text-gray-600" />
                        <p className="text-[10px] font-black uppercase tracking-[0.3em]">Aucune architecture data détectée</p>
                    </div>
                ) : dbs.map((dbItem, i) => (
                    <Card key={i} className="bg-black/30 border-white/5 rounded-2xl overflow-hidden transition-all hover:border-accent/30 group shadow-xl">
                        <CardContent className="p-5 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="h-11 w-11 rounded-xl bg-accent/10 flex items-center justify-center border border-accent/20 group-hover:bg-accent/20 transition-all shadow-inner"><Database className="h-5 w-5 text-accent" /></div>
                                    <div>
                                        <p className="text-[13px] font-black text-white uppercase tracking-tighter">{dbItem.name}</p>
                                        <p className="text-[8px] text-gray-600 font-bold uppercase flex items-center gap-1.5"><Server className="h-2 w-2" /> {dbItem.type === 'pg' ? 'PostgreSQL 16' : 'MariaDB 10.11'}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button size="icon" variant="ghost" onClick={() => { setSelectedDb(dbItem); setView('sql'); }} className="h-9 w-9 bg-white/5 text-gray-500 hover:text-accent hover:bg-accent/10 transition-all rounded-lg"><Terminal className="h-4 w-4" /></Button>
                                    <Button size="icon" variant="ghost" className="h-9 w-9 bg-white/5 text-gray-700 hover:text-red-500 hover:bg-red-500/10 transition-all rounded-lg"><Trash2 className="h-4 w-4" /></Button>
                                </div>
                            </div>
                            <div className="p-4 bg-black/50 rounded-xl border border-white/5 font-mono text-[9px] text-gray-400 break-all select-all shadow-inner leading-relaxed">
                                {dbItem.url}
                            </div>
                            <Button className="w-full h-11 text-[9px] font-black uppercase bg-white/5 text-gray-400 hover:bg-accent hover:text-white rounded-xl transition-all shadow-md group-hover:shadow-accent/10" asChild>
                                <a href={dbItem.manager_url} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-3.5 w-3.5 mr-2.5" /> OUVRIR DANS L'ADMINER ELITE</a>
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
};
