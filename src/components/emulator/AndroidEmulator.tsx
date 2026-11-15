'use client';

import React, { useState, useEffect } from 'react';
import { 
  Wifi, BatteryMedium, Signal, RotateCcw, Power, Volume2, 
  VolumeX, Camera, Smartphone, Tablet, RefreshCw, Sparkles, 
  Sliders, Terminal, Play, CheckCircle2, AlertTriangle, Layers, Maximize2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface AndroidEmulatorProps {
  projectId: number;
  projectName: string;
  appCode?: string;
  template?: string;
}

export function AndroidEmulator({ projectId, projectName, appCode, template }: AndroidEmulatorProps) {
  const [deviceModel, setDeviceModel] = useState<'pixel8' | 'galaxy24' | 'tablet'>('pixel8');
  const [isPoweredOn, setIsPoweredOn] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const [volume, setVolume] = useState(70);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [currentTime, setCurrentTime] = useState('09:41');
  const [activeTab, setActiveTab] = useState<'home' | 'wallet' | 'analytics' | 'settings'>('home');
  const [accountBalance, setAccountBalance] = useState(14850.50);
  const [transactions, setTransactions] = useState([
    { id: 1, title: 'Transfert Gemini Cloud', amount: -45.00, date: 'Aujourd’hui 15:32', type: 'out' },
    { id: 2, title: 'Crédit Reçu (JOJO Studio)', amount: +500.00, date: 'Hier 11:20', type: 'in' },
    { id: 3, title: 'Abonnement Android Dev', amount: -25.00, date: '08 Oct 09:15', type: 'out' }
  ]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [counter, setCounter] = useState(0);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    updateClock();
    const interval = setInterval(updateClock, 30000);
    return () => clearInterval(interval);
  }, []);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleVolumeUp = () => {
    setVolume(v => Math.min(100, v + 10));
    setShowVolumeSlider(true);
    setTimeout(() => setShowVolumeSlider(false), 2000);
  };

  const handleVolumeDown = () => {
    setVolume(v => Math.max(0, v - 10));
    setShowVolumeSlider(true);
    setTimeout(() => setShowVolumeSlider(false), 2000);
  };

  return (
    <div className="h-full w-full bg-[#07090e] flex flex-col items-center justify-center p-4 relative select-none overflow-hidden">
      {/* Top Emulator Control Bar */}
      <div className="w-full max-w-md mb-3 flex items-center justify-between px-3 py-1.5 bg-[#0f121d] border border-white/10 rounded-2xl text-[10px] font-bold text-gray-300 shadow-xl">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="uppercase tracking-wider text-cyan-400 font-black">
            {deviceModel === 'pixel8' ? 'Google Pixel 8 Pro' : deviceModel === 'galaxy24' ? 'Samsung S24 Ultra' : 'Pixel Tablet'}
          </span>
          <span className="text-[9px] bg-white/5 px-2 py-0.5 rounded text-gray-400">Android 14 (API 34)</span>
        </div>

        <div className="flex items-center gap-1.5">
          <button 
            onClick={() => setDeviceModel(m => m === 'pixel8' ? 'galaxy24' : m === 'galaxy24' ? 'tablet' : 'pixel8')}
            className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
            title="Changer de modèle Android"
          >
            {deviceModel === 'tablet' ? <Tablet className="h-3.5 w-3.5 text-cyan-400" /> : <Smartphone className="h-3.5 w-3.5" />}
          </button>
          <button 
            onClick={() => triggerToast("Émulateur Android 14 rechargé à chaud")}
            className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-cyan-400 transition-colors"
            title="Hot Reload"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
          <button 
            onClick={() => setIsPoweredOn(p => !p)}
            className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-red-400 transition-colors"
            title="Allumer / Éteindre"
          >
            <Power className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Android Device Outer Chassis */}
      <div className="relative flex items-center justify-center">
        {/* Hardware Side Buttons */}
        <div className="absolute -left-3 top-24 flex flex-col gap-3">
          <button 
            onClick={handleVolumeUp}
            className="w-1.5 h-10 bg-slate-700 hover:bg-cyan-500 rounded-l transition-colors cursor-pointer shadow-md"
            title="Volume +"
          />
          <button 
            onClick={handleVolumeDown}
            className="w-1.5 h-10 bg-slate-700 hover:bg-cyan-500 rounded-l transition-colors cursor-pointer shadow-md"
            title="Volume -"
          />
        </div>

        <div className="absolute -right-3 top-20">
          <button 
            onClick={() => setIsLocked(l => !l)}
            className="w-1.5 h-12 bg-slate-700 hover:bg-cyan-500 rounded-r transition-colors cursor-pointer shadow-md"
            title="Bouton Verrouillage"
          />
        </div>

        {/* Chassis Frame */}
        <div 
          className={cn(
            "relative transition-all duration-300 bg-[#161a24] p-[10px] rounded-[48px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),0_0_20px_rgba(6,182,212,0.15)] border-2 border-slate-700/80",
            deviceModel === 'tablet' ? "w-[540px] h-[380px]" : "w-[320px] h-[640px]"
          )}
        >
          {/* Inner Bezel Screen */}
          <div className="relative w-full h-full bg-[#0b0f19] rounded-[38px] overflow-hidden flex flex-col border border-black/60 shadow-inner">
            
            {/* Camera Punch Hole & Sensor Bar */}
            <div className="absolute top-2.5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2">
              <div className="w-3.5 h-3.5 rounded-full bg-black border border-white/10 flex items-center justify-center">
                <div className="w-1 h-1 rounded-full bg-[#06b6d4]/40" />
              </div>
            </div>

            {/* Volume Overlay Graphic */}
            <AnimatePresence>
              {showVolumeSlider && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  exit={{ opacity: 0, x: -10 }}
                  className="absolute left-3 top-20 z-50 bg-black/80 backdrop-blur-md px-3 py-2 rounded-2xl flex items-center gap-2 border border-white/10"
                >
                  <Volume2 className="h-3.5 w-3.5 text-cyan-400" />
                  <div className="w-16 h-1.5 bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-400" style={{ width: `${volume}%` }} />
                  </div>
                  <span className="text-[9px] font-mono text-white">{volume}%</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Android Toast Notification */}
            <AnimatePresence>
              {toastMessage && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0, y: 20 }}
                  className="absolute bottom-16 left-4 right-4 z-50 bg-slate-900/95 backdrop-blur-md border border-cyan-500/30 text-white text-[11px] font-bold py-2.5 px-4 rounded-2xl text-center shadow-2xl"
                >
                  {toastMessage}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Power Off State */}
            {!isPoweredOn ? (
              <div className="h-full w-full bg-black flex flex-col items-center justify-center text-center p-6 text-gray-600">
                <Power className="h-10 w-10 mb-3 text-slate-800" />
                <p className="text-[10px] uppercase tracking-widest font-black">Émulateur Éteint</p>
                <button 
                  onClick={() => setIsPoweredOn(true)} 
                  className="mt-4 px-4 py-2 bg-white/10 hover:bg-cyan-500 hover:text-black rounded-xl text-[9px] font-bold uppercase transition-all"
                >
                  Démarrer Pixel 8
                </button>
              </div>
            ) : isLocked ? (
              /* Android 14 Lock Screen */
              <div 
                onClick={() => setIsLocked(false)}
                className="h-full w-full bg-gradient-to-b from-[#0e1726] to-[#050811] flex flex-col justify-between p-6 cursor-pointer"
              >
                <div className="pt-8 text-center">
                  <span className="text-6xl font-black text-white/90 tracking-tighter block font-mono">{currentTime}</span>
                  <span className="text-xs text-cyan-400 uppercase tracking-widest font-bold">Dimanche 11 Octobre</span>
                </div>

                <div className="flex flex-col items-center gap-2 pb-6 text-gray-500 animate-bounce">
                  <div className="w-8 h-1 bg-white/30 rounded-full" />
                  <span className="text-[9px] font-bold tracking-widest uppercase">Glisser pour déverrouiller</span>
                </div>
              </div>
            ) : (
              /* Android 14 Live OS & Native App */
              <div className="h-full w-full flex flex-col justify-between bg-[#0B0F19] text-white">
                
                {/* Android Status Bar */}
                <div className="h-7 px-4 pt-1 flex items-center justify-between text-[11px] font-bold text-gray-300 z-40 select-none">
                  <span className="font-mono text-[10px] pl-1">{currentTime}</span>
                  <div className="flex items-center gap-2 text-[10px]">
                    <span className="text-[8px] bg-cyan-500/20 text-cyan-400 px-1 py-0.2 rounded font-black">5G</span>
                    <Signal className="h-3 w-3" />
                    <Wifi className="h-3 w-3" />
                    <div className="flex items-center gap-0.5">
                      <BatteryMedium className="h-3.5 w-3.5 text-emerald-400" />
                      <span className="text-[9px]">98%</span>
                    </div>
                  </div>
                </div>

                {/* Android App Viewport */}
                <div className="flex-1 overflow-y-auto px-4 py-2 scrollbar-hide text-left">
                  
                  {/* Top Bar inside Application */}
                  <div className="flex items-center justify-between pb-3 mb-2 border-b border-white/5">
                    <div>
                      <span className="text-[9px] text-cyan-400 font-black tracking-widest uppercase block">
                        JOJO EMULATOR • ANDROID 14
                      </span>
                      <h2 className="text-base font-black text-white tracking-tight">{projectName}</h2>
                    </div>
                    <div className="h-7 w-7 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 text-[10px] font-black">
                      AI
                    </div>
                  </div>

                  {activeTab === 'home' && (
                    <div className="space-y-3.5">
                      {/* Virtual Card */}
                      <div className="p-4 rounded-3xl bg-gradient-to-br from-[#151c2e] to-[#0f1422] border border-cyan-500/20 shadow-xl relative overflow-hidden">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Solde Actif (USD)</span>
                          <span className="text-[8px] bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded-full font-black">NFC ACTIF</span>
                        </div>
                        <div className="text-2xl font-black text-white tracking-tight my-1">
                          ${accountBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </div>
                        <div className="flex justify-between items-center text-[10px] font-mono text-gray-400 mt-3 pt-2 border-t border-white/5">
                          <span>•••• •••• •••• 8842</span>
                          <span className="text-cyan-400 font-bold">EXP 12/28</span>
                        </div>
                      </div>

                      {/* Native Action Grid */}
                      <div className="grid grid-cols-4 gap-2 text-center">
                        <button 
                          onClick={() => { setAccountBalance(b => b + 250); triggerToast("Crédit +250$ reçu avec succès"); }}
                          className="flex flex-col items-center gap-1.5 p-2 rounded-2xl bg-white/5 hover:bg-emerald-500/20 active:scale-95 transition-all border border-white/5"
                        >
                          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-sm font-black">↓</div>
                          <span className="text-[9px] font-bold text-gray-300">Recevoir</span>
                        </button>

                        <button 
                          onClick={() => { setAccountBalance(b => Math.max(0, b - 50)); triggerToast("Débit -50$ envoyé"); }}
                          className="flex flex-col items-center gap-1.5 p-2 rounded-2xl bg-white/5 hover:bg-amber-500/20 active:scale-95 transition-all border border-white/5"
                        >
                          <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400 text-sm font-black">↑</div>
                          <span className="text-[9px] font-bold text-gray-300">Envoyer</span>
                        </button>

                        <button 
                          onClick={() => { setCounter(c => c + 1); triggerToast(`Action IA déclenchée (#${counter + 1})`); }}
                          className="flex flex-col items-center gap-1.5 p-2 rounded-2xl bg-white/5 hover:bg-cyan-500/20 active:scale-95 transition-all border border-white/5"
                        >
                          <div className="w-9 h-9 rounded-xl bg-cyan-500/20 flex items-center justify-center text-cyan-400 text-sm font-black">⚡</div>
                          <span className="text-[9px] font-bold text-gray-300">IA Scan</span>
                        </button>

                        <button 
                          onClick={() => triggerToast("Sécurité biométrique activée")}
                          className="flex flex-col items-center gap-1.5 p-2 rounded-2xl bg-white/5 hover:bg-purple-500/20 active:scale-95 transition-all border border-white/5"
                        >
                          <div className="w-9 h-9 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400 text-sm font-black">★</div>
                          <span className="text-[9px] font-bold text-gray-300">Shield</span>
                        </button>
                      </div>

                      {/* Recent Activities */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-[10px] font-black uppercase text-gray-400">
                          <span>Dernières Activités</span>
                          <span className="text-cyan-400 cursor-pointer">Voir tout</span>
                        </div>

                        {transactions.map(tx => (
                          <div key={tx.id} className="p-2.5 rounded-2xl bg-[#111624] border border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <div className={cn("w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black", tx.type === 'in' ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400")}>
                                {tx.type === 'in' ? '+' : '-'}
                              </div>
                              <div>
                                <p className="text-[10px] font-bold text-white">{tx.title}</p>
                                <p className="text-[8px] text-gray-500">{tx.date}</p>
                              </div>
                            </div>
                            <span className={cn("text-[11px] font-black", tx.type === 'in' ? "text-emerald-400" : "text-gray-300")}>
                              {tx.type === 'in' ? `+$${tx.amount.toFixed(2)}` : `-$${Math.abs(tx.amount).toFixed(2)}`}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeTab === 'wallet' && (
                    <div className="space-y-3 p-2">
                      <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-center">
                        <span className="text-xs font-black uppercase text-cyan-400">Portefeuille Multi-Devises</span>
                        <p className="text-[10px] text-gray-300 mt-1">USD, EUR, BTC, et Jetons ELITE pris en charge</p>
                      </div>
                      <div className="p-3 bg-black/40 rounded-xl border border-white/10 text-[10px] space-y-1.5 font-mono">
                        <div className="flex justify-between"><span>USD Balance:</span><span className="text-white">${accountBalance.toFixed(2)}</span></div>
                        <div className="flex justify-between"><span>BTC Vault:</span><span className="text-amber-400">0.2458 BTC</span></div>
                        <div className="flex justify-between"><span>ELITE Coins:</span><span className="text-cyan-400">950 COINS</span></div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'analytics' && (
                    <div className="space-y-3 p-2">
                      <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                        <p className="text-[10px] font-black uppercase text-cyan-400 mb-2">Télémétrie Android 14</p>
                        <div className="space-y-1 text-[9px] text-gray-300">
                          <p>• Résolution: 1344 x 2992 px (489 ppi)</p>
                          <p>• GPU: Mali-G715 Immortalis (Simulé)</p>
                          <p>• Latence tactile: 4.2ms</p>
                          <p>• RAM Allouée: 12GB LPDDR5X</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'settings' && (
                    <div className="space-y-3 p-2 text-[10px]">
                      <div className="p-3 bg-[#111624] rounded-2xl border border-white/5 space-y-2">
                        <p className="font-black text-cyan-400 uppercase">Configuration Émulateur</p>
                        <div className="flex justify-between items-center text-gray-300">
                          <span>Mode Sombre Natif</span>
                          <span className="text-emerald-400 font-bold">Activé</span>
                        </div>
                        <div className="flex justify-between items-center text-gray-300">
                          <span>Google Play Services</span>
                          <span className="text-emerald-400 font-bold">v24.12 Live</span>
                        </div>
                        <div className="flex justify-between items-center text-gray-300">
                          <span>Compilateur JIT</span>
                          <span className="text-cyan-400 font-bold">ART Ultra</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Navigation Bar */}
                <div className="h-12 bg-[#0c101a] border-t border-white/5 flex items-center justify-around px-2 z-40 select-none">
                  <button 
                    onClick={() => setActiveTab('home')}
                    className={cn("flex flex-col items-center gap-0.5", activeTab === 'home' ? "text-cyan-400" : "text-gray-500 hover:text-gray-300")}
                  >
                    <Smartphone className="h-4 w-4" />
                    <span className="text-[8px] font-bold">Accueil</span>
                  </button>
                  <button 
                    onClick={() => setActiveTab('wallet')}
                    className={cn("flex flex-col items-center gap-0.5", activeTab === 'wallet' ? "text-cyan-400" : "text-gray-500 hover:text-gray-300")}
                  >
                    <Sliders className="h-4 w-4" />
                    <span className="text-[8px] font-bold">Solde</span>
                  </button>
                  <button 
                    onClick={() => setActiveTab('analytics')}
                    className={cn("flex flex-col items-center gap-0.5", activeTab === 'analytics' ? "text-cyan-400" : "text-gray-500 hover:text-gray-300")}
                  >
                    <Terminal className="h-4 w-4" />
                    <span className="text-[8px] font-bold">Système</span>
                  </button>
                  <button 
                    onClick={() => setActiveTab('settings')}
                    className={cn("flex flex-col items-center gap-0.5", activeTab === 'settings' ? "text-cyan-400" : "text-gray-500 hover:text-gray-300")}
                  >
                    <Layers className="h-4 w-4" />
                    <span className="text-[8px] font-bold">Options</span>
                  </button>
                </div>

                {/* Android Gestural Pill Handle */}
                <div className="h-4 flex items-center justify-center bg-[#0c101a]">
                  <div className="w-24 h-1 bg-white/40 rounded-full" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
