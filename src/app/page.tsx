
'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { 
    Loader2, Wand2, BrainCircuit, 
    Smartphone, Landmark, Building2, Search, 
    Clock, Plus, History, ArrowRight, Share2, Users, UserCircle, ShieldCheck, Globe
} from 'lucide-react';
import { createJojoAiProject, getJojoAiSession, getProjectsForUser, inviteCollaborator } from '@/lib/actions/dev-portal.actions';
import { StudioIDE } from '@/components/StudioIDE';
import type { DevPortalUser } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { JojoBrand } from '@/components/brand/JojoBrand';

function DashboardContent() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [session, setSession] = useState<{ user: DevPortalUser } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [activeProject, setActiveProject] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [view, setView] = useState<'dashboard' | 'create'>('dashboard');

  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [appTemplate, setAppTemplate] = useState('fintech');

  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [invitingProject, setInvitingProject] = useState<any>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);

  const AUTH_CENTER_URL = 'http://localhost:8800'; 

  const fetchSessionAndProjects = useCallback(async (providedToken?: string) => {
    setLoading(true);
    try {
      const sessionData = await getJojoAiSession(providedToken);
      if (sessionData.success && sessionData.user) {
        setSession({ user: sessionData.user });
        if (providedToken) router.replace('/');

        const projectsResult = await getProjectsForUser();
        if (projectsResult.success) {
          const fetchedProjects = projectsResult.projects || [];
          setProjects(fetchedProjects);
          if (fetchedProjects.length > 0) {
            setActiveProject((prev: any) => prev || fetchedProjects[0]);
          }
        }
      } else {
        // En mode autonome / cloud preview sans IDP externe, on fournit une session développeur par défaut
        const defaultUser = {
          id: 1,
          username: 'admin',
          manager_name: 'Lead Architect',
          email: 'admin@jojoai.com',
          company_name: 'JOJO Elite Studio'
        };
        setSession({ user: defaultUser });
        
        const projectsResult = await getProjectsForUser();
        if (projectsResult.success && projectsResult.projects && projectsResult.projects.length > 0) {
          setProjects(projectsResult.projects);
          setActiveProject((prev: any) => prev || projectsResult.projects[0]);
        } else {
          const defaultProj = { id: 1, name: 'Projet Démo Fintech', description: 'Application financière souveraine', app_template: 'fintech', user_role: 'owner', updated_at: new Date().toISOString() };
          setProjects([defaultProj]);
          setActiveProject((prev: any) => prev || defaultProj);
        }
      }
    } catch (error) {
      console.error('Dashboard Sync Error:', error);
      const defaultUser = {
        id: 1,
        username: 'admin',
        manager_name: 'Lead Architect',
        email: 'admin@jojoai.com',
        company_name: 'JOJO Elite Studio'
      };
      setSession({ user: defaultUser });
      const defaultProj = { id: 1, name: 'Projet Démo Fintech', description: 'Application financière souveraine', app_template: 'fintech', user_role: 'owner', updated_at: new Date().toISOString() };
      setProjects([defaultProj]);
      setActiveProject((prev: any) => prev || defaultProj);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const tokenFromUrl = searchParams.get('token');
    fetchSessionAndProjects(tokenFromUrl || undefined);
  }, [searchParams, fetchSessionAndProjects]);

  const handleProjectCreation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim() || !projectDescription.trim()) {
      toast({ variant: 'destructive', title: 'Champs requis', description: "Veuillez nommer et décrire votre vision." });
      return;
    }

    setIsGenerating(true);
    const result = await createJojoAiProject({ name: projectName, description: projectDescription, template: appTemplate });
    setIsGenerating(false);

    if (result.success && result.data) {
      toast({ title: 'Architecture Matérialisée', description: `L'âme de "${projectName}" a été déployée.` });
      fetchSessionAndProjects();
      setActiveProject({ id: result.data.projectId, name: result.data.appName, user_role: 'owner' });
    } else {
      console.error('Failed to create project:', result.error);
      toast({ variant: 'destructive', title: 'Erreur Studio', description: result.error });
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail) return;
    setIsInviting(true);
    const res = await inviteCollaborator(invitingProject.id, inviteEmail);
    setIsInviting(false);
    if (res.success) {
      toast({ title: "Invitation Envoyée", description: `L'accès a été partagé avec ${inviteEmail}.` });
      setInviteDialogOpen(false);
      setInviteEmail('');
    } else {
      console.error('Failed to invite collaborator:', res.error);
      toast({ variant: "destructive", title: "Erreur Partage", description: res.error });
    }
  };

  const filteredProjects = projects.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  if (loading) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center text-white overflow-hidden">
        <div className="relative flex items-center justify-center">
            <div className="absolute h-36 w-36 border-2 border-purple-400/20 border-t-cyan-300 rounded-full owl-spinner shadow-[0_0_50px_rgba(168,85,247,0.35)]" />
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }} className="relative z-10">
                <Image src="/logos/icon.png" alt="JoJo AI" width={84} height={84} className="rounded-[22%] owl-glow" />
            </motion.div>
        </div>
        <p className="gradient-text text-xs font-bold uppercase tracking-[0.4em] mt-16 animate-pulse">Chargement de JoJo AI...</p>
      </div>
    );
  }

  if (activeProject && session) {
    return <StudioIDE project={activeProject} projects={projects} session={session} onProjectSwitch={setActiveProject} onProjectDeleted={() => { setActiveProject(null); fetchSessionAndProjects(); }} />;
  }

  return (
    <div className="min-h-screen w-full text-white p-6 md:p-12 relative overflow-hidden">
      <div className="max-w-7xl mx-auto space-y-12 relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <JojoBrand size={56} />
          <div className="flex items-center gap-3">
             <div className="relative group hidden md:block">
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-gray-400 group-focus-within:text-cyan-300 transition-colors" />
                <Input placeholder="Rechercher un projet..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="h-10 w-64 bg-white/10 border-white/20 rounded-full pl-10 text-sm focus:border-cyan-300/70" />
             </div>
             <Button onClick={() => setView('create')} className="btn-jojo h-10 px-6 rounded-full font-semibold text-sm">
                <Plus className="h-4 w-4 mr-2" /> Nouveau projet
             </Button>
          </div>
        </div>

        {view === 'dashboard' && (
          <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center space-y-5 py-6 md:py-10">
            <span className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-purple-500 px-5 py-2 text-sm font-semibold shadow-[0_8px_28px_rgba(124,58,237,0.5)]">
              <span className="h-2.5 w-2.5 rounded-full bg-cyan-300 shadow-[0_0_12px_#22d3ee] animate-pulse" />
              Bienvenue, {session?.user.manager_name}
            </span>
            <h1 className="font-bold tracking-tight text-4xl md:text-6xl leading-[1.05]" style={{ fontFamily: 'var(--font-display), system-ui, sans-serif' }}>
              Chattez avec <span className="gradient-text">JoJo AI</span>
            </h1>
            <p className="mx-auto max-w-2xl text-lg md:text-xl font-semibold text-cyan-300" style={{ fontFamily: 'var(--font-display), system-ui, sans-serif' }}>
              Expliquez-lui votre idée, il la réalise à votre place en quelques secondes.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Button onClick={() => setView('create')} className="btn-jojo h-12 px-8 rounded-full text-base font-semibold">
                <Wand2 className="h-5 w-5 mr-2" /> Créer une application
              </Button>
              <span className="rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm font-medium backdrop-blur">
                100 crédits offerts par jour
              </span>
            </div>
            <p className="text-xs font-medium text-gray-400">{projects.length} projet{projects.length > 1 ? 's' : ''} actif{projects.length > 1 ? 's' : ''}</p>
          </motion.section>
        )}

        <AnimatePresence mode="wait">
            {view === 'dashboard' ? (
                <motion.div key="list" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProjects.length === 0 ? (
                        <div className="col-span-full py-24 text-center border-2 border-dashed border-white/5 rounded-3xl opacity-20 bg-white/5">
                            <History className="h-16 w-16 mx-auto mb-4" />
                            <p className="text-[10px] font-black uppercase tracking-[0.5em]">Aucune architecture trouvée</p>
                        </div>
                    ) : (
                        filteredProjects.map((p, i) => (
                            <motion.div key={p.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }} className="jojo-card group relative p-6 rounded-3xl cursor-pointer overflow-hidden glass-panel">
                                <div onClick={() => setActiveProject(p)}>
                                    <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <ArrowRight className="h-5 w-5 text-accent" />
                                    </div>
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:bg-accent/10 transition-colors">
                                            {p.app_template === 'android' || p.app_template === 'react-native' ? <Smartphone className="h-6 w-6 text-cyan-400" /> : 
                                            p.app_template === 'shoelace-ts' ? <BrainCircuit className="h-6 w-6 text-amber-400" /> :
                                            p.app_template === 'fintech' ? <Landmark className="h-6 w-6 text-indigo-400" /> : 
                                            p.app_template === 'ecommerce' || p.app_template === 'e-commerce' ? <History className="h-6 w-6 text-emerald-400" /> :
                                            <Globe className="h-6 w-6 text-blue-400" />}
                                        </div>
                                        <div>
                                            <h3 className="font-black text-white uppercase text-sm tracking-tight">{p.name}</h3>
                                            <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest flex items-center gap-1.5">
                                                {p.user_role === 'owner' ? <ShieldCheck className="h-2.5 w-2.5 text-accent" /> : <Users className="h-2.5 w-2.5" />}
                                                {p.user_role === 'owner' ? 'Propriétaire' : `Partagé par ${p.owner_name}`}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 text-[9px] font-bold uppercase text-gray-600 mt-6">
                                        <span className="flex items-center gap-1.5"><Clock className="h-3 w-3" /> Mis à jour le {new Date(p.updated_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                
                                {p.user_role === 'owner' && (
                                    <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setInvitingProject(p); setInviteDialogOpen(true); }} className="absolute bottom-6 right-6 h-8 w-8 bg-white/5 rounded-lg hover:bg-accent hover:text-white transition-all">
                                        <Share2 className="h-4 w-4" />
                                    </Button>
                                )}
                                <div className="premium-border mt-4" />
                            </motion.div>
                        ))
                    )}
                </motion.div>
            ) : (
                <motion.div key="create" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="max-w-2xl mx-auto">
                    <Card className="bg-[#0c0a2c] border-white/10 shadow-2xl rounded-3xl overflow-hidden glass-panel">
                        <CardHeader className="p-8 pb-4">
                            <CardTitle className="text-2xl font-black uppercase tracking-tighter text-white">Nouvelle Vision</CardTitle>
                            <CardDescription className="text-gray-500 uppercase font-bold text-[9px] tracking-widest mt-1">L'IA déploiera l'architecture complète automatiquement.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-8 space-y-6">
                            <form onSubmit={handleProjectCreation} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">Nom de l'Application</label>
                                        <Input value={projectName} onChange={e => setProjectName(e.target.value)} placeholder="ex: ElitePay" className="h-11 bg-black/40 border-white/10 rounded-xl" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">Architecture Modèle</label>
                                        <Select value={appTemplate} onValueChange={setAppTemplate}>
                                            <SelectTrigger className="h-11 bg-black/40 border-white/10 rounded-xl"><SelectValue /></SelectTrigger>
                                            <SelectContent className="bg-[#15123b] border-white/10 text-white">
                                                <SelectItem value="android" className="text-[10px] font-bold uppercase"><div className="flex items-center gap-2"><Smartphone className="h-3.5 w-3.5 text-cyan-400" /> Android 14 Mobile (Émulateur Pixel 8)</div></SelectItem>
                                                <SelectItem value="react" className="text-[10px] font-bold uppercase"><div className="flex items-center gap-2"><Globe className="h-3.5 w-3.5 text-blue-400" /> React / Next.js Web</div></SelectItem>
                                                <SelectItem value="shoelace-ts" className="text-[10px] font-bold uppercase"><div className="flex items-center gap-2"><BrainCircuit className="h-3.5 w-3.5 text-amber-400" /> TypeScript & Shoelace HTML5</div></SelectItem>
                                                <SelectItem value="fintech" className="text-[10px] font-bold uppercase"><div className="flex items-center gap-2"><Landmark className="h-3.5 w-3.5 text-indigo-400" /> Fintech Sovereign Suite</div></SelectItem>
                                                <SelectItem value="ecommerce" className="text-[10px] font-bold uppercase"><div className="flex items-center gap-2"><History className="h-3.5 w-3.5 text-emerald-400" /> E-commerce Marketplace</div></SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">Description Technique</label>
                                    <Textarea value={projectDescription} onChange={e => setProjectDescription(e.target.value)} placeholder="Décrivez les fonctionnalités clés..." className="min-h-[120px] bg-black/40 border-white/10 rounded-2xl p-4 text-sm" />
                                </div>
                                <div className="flex gap-3 pt-4">
                                    <Button type="button" variant="ghost" onClick={() => setView('dashboard')} className="flex-1 h-11 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-500">Annuler</Button>
                                    <Button type="submit" disabled={isGenerating} className="btn-jojo flex-[2] h-11 rounded-full font-semibold text-sm">
                                        {isGenerating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Wand2 className="h-4 w-4 mr-2" />}
                                        Matérialiser
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </motion.div>
            )}
        </AnimatePresence>

        <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
            <DialogContent className="bg-[#0c0a2c] border-white/10 text-white glass-panel rounded-3xl">
                <DialogHeader>
                    <DialogTitle className="text-xl font-black uppercase tracking-tighter">Partager l'Architecture</DialogTitle>
                    <DialogDescription className="text-gray-500 uppercase font-bold text-[9px] tracking-widest mt-1">Invitez un collaborateur Elite à contribuer sur {invitingProject?.name}.</DialogDescription>
                </DialogHeader>
                <div className="py-6 space-y-4">
                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">E-mail du Collaborateur</label>
                        <div className="relative">
                            <Input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="collaborateur@email.com" className="h-12 bg-black/40 border-white/10 rounded-xl pl-4 pr-12" />
                            <Users className="absolute right-4 top-4 h-4 w-4 text-gray-600" />
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => setInviteDialogOpen(false)} className="h-11 rounded-xl text-[10px] font-black uppercase text-gray-500">Annuler</Button>
                    <Button onClick={handleInvite} disabled={isInviting} className="btn-jojo h-11 px-8 rounded-full font-semibold text-sm">
                        {isInviting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Share2 className="h-4 w-4 mr-2" />}
                        Inviter
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen w-full flex-col items-center justify-center text-white overflow-hidden">
        <p className="gradient-text text-xs font-bold uppercase tracking-[0.4em] animate-pulse">Chargement...</p>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
