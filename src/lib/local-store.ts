import fs from 'fs';
import path from 'path';

export interface LocalUser {
  id: number;
  username: string;
  email: string;
  manager_name: string;
  company_name: string;
}

export interface LocalProject {
  id: number;
  dev_portal_user_id: number;
  name: string;
  description: string;
  app_template: string; // 'android' | 'react' | 'shoelace-ts' | 'fintech' | 'ecommerce'
  is_public: boolean;
  user_role?: string;
  owner_name?: string;
  created_at: string;
  updated_at: string;
}

export interface LocalFile {
  id: number;
  project_id: number;
  file_path: string;
  file_content: string;
  created_at: string;
}

export interface LocalChatMessage {
  id: number;
  project_id: number;
  role: 'user' | 'model';
  content: string;
  created_at: string;
}

export interface LocalPendingAction {
  id: number;
  project_id: number;
  action_type: string;
  file_path: string;
  content: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export interface LocalDatabase {
  id: number;
  project_id: number;
  name: string;
  type: 'pg' | 'mysql';
  url: string;
  manager_url: string;
  created_at: string;
}

export interface LocalStoreData {
  users: LocalUser[];
  credits: Record<number, number>;
  projects: LocalProject[];
  files: LocalFile[];
  chatHistory: LocalChatMessage[];
  pendingActions: LocalPendingAction[];
  databases: LocalDatabase[];
}

const DATA_FILE = path.join(process.cwd(), '.store_data.json');

const INITIAL_ANDROID_FILES = [
  {
    path: 'App.tsx',
    content: `import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, SafeAreaView } from 'react-native';
import { LucideShield, LucideWallet, LucideArrowUpRight, LucideArrowDownLeft, LucideSmartphone, LucideCpu, LucideSparkles } from 'lucide-react-native';

export default function AndroidApp() {
  const [balance, setBalance] = useState(12450.80);
  const [activeTab, setActiveTab] = useState<'home' | 'cards' | 'ai'>('home');

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0F19" />
      
      {/* Android Top App Bar */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSubtitle}>JOJO AI EMULATOR • ANDROID 14</Text>
          <Text style={styles.headerTitle}>Nexus Mobile OS</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>API 34</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Card Section */}
        <View style={styles.card}>
          <View style={styles.cardTop}>
            <Text style={styles.cardLabel}>Solde Actif (USD)</Text>
            <Text style={styles.cardChip}>NFC ACTIVE</Text>
          </View>
          <Text style={styles.cardBalance}>\${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text>
          <View style={styles.cardBottom}>
            <Text style={styles.cardNumber}>•••• •••• •••• 8842</Text>
            <Text style={styles.cardExp}>12/28</Text>
          </View>
        </View>

        {/* Action Grid */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionButton} onPress={() => setBalance(b => b + 500)}>
            <View style={[styles.iconCircle, { backgroundColor: '#10B98120' }]}>
              <Text style={{ color: '#10B981', fontSize: 18 }}>↓</Text>
            </View>
            <Text style={styles.actionText}>Recevoir</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={() => setBalance(b => Math.max(0, b - 120))}>
            <View style={[styles.iconCircle, { backgroundColor: '#F59E0B20' }]}>
              <Text style={{ color: '#F59E0B', fontSize: 18 }}>↑</Text>
            </View>
            <Text style={styles.actionText}>Envoyer</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <View style={[styles.iconCircle, { backgroundColor: '#8B5CF620' }]}>
              <Text style={{ color: '#8B5CF6', fontSize: 18 }}>⚡</Text>
            </View>
            <Text style={styles.actionText}>IA Scanner</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <View style={[styles.iconCircle, { backgroundColor: '#06B6D420' }]}>
              <Text style={{ color: '#06B6D4', fontSize: 18 }}>★</Text>
            </View>
            <Text style={styles.actionText}>Sécurité</Text>
          </TouchableOpacity>
        </View>

        {/* Live System Diagnostics */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Télémétrie Système</Text>
          <Text style={styles.sectionTag}>KERNEL 6.1</Text>
        </View>

        <View style={styles.telemetryBox}>
          <View style={styles.telemetryItem}>
            <Text style={styles.telemetryLabel}>Émulateur</Text>
            <Text style={styles.telemetryValue}>Pixel 8 Pro (ARM64)</Text>
          </View>
          <View style={styles.telemetryDivider} />
          <View style={styles.telemetryItem}>
            <Text style={styles.telemetryLabel}>Moteur IA</Text>
            <Text style={styles.telemetryValue}>Gemini Studio Live</Text>
          </View>
          <View style={styles.telemetryDivider} />
          <View style={styles.telemetryItem}>
            <Text style={styles.telemetryLabel}>FPS Émulation</Text>
            <Text style={styles.telemetryValue}>60.0 FPS Sync</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0F19' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  headerSubtitle: { color: '#06B6D4', fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  headerTitle: { color: '#FFFFFF', fontSize: 22, fontWeight: '900' },
  badge: { backgroundColor: '#1E293B', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: '#334155' },
  badgeText: { color: '#94A3B8', fontSize: 10, fontWeight: '700' },
  scrollContent: { padding: 20 },
  card: { backgroundColor: '#13192B', borderRadius: 24, padding: 24, borderWidth: 1, borderColor: '#1E293B', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 8, marginBottom: 24 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardLabel: { color: '#94A3B8', fontSize: 12, fontWeight: '600', textTransform: 'uppercase' },
  cardChip: { backgroundColor: '#06B6D420', color: '#06B6D4', fontSize: 9, fontWeight: '800', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  cardBalance: { color: '#FFFFFF', fontSize: 34, fontWeight: '900', letterSpacing: -0.5, marginBottom: 18 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardNumber: { color: '#CBD5E1', fontSize: 14, fontFamily: 'monospace' },
  cardExp: { color: '#64748B', fontSize: 12, fontWeight: '700' },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 28 },
  actionButton: { alignItems: 'center', width: '22%' },
  iconCircle: { width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 8, borderWidth: 1, borderColor: '#334155' },
  actionText: { color: '#E2E8F0', fontSize: 11, fontWeight: '700' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { color: '#FFFFFF', fontSize: 14, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  sectionTag: { color: '#64748B', fontSize: 9, fontWeight: '700' },
  telemetryBox: { backgroundColor: '#0F172A', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#1E293B' },
  telemetryItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  telemetryLabel: { color: '#94A3B8', fontSize: 12 },
  telemetryValue: { color: '#06B6D4', fontSize: 12, fontWeight: '700' },
  telemetryDivider: { height: 1, backgroundColor: '#1E293B', marginVertical: 4 }
});`
  },
  {
    path: 'app.json',
    content: JSON.stringify({
      expo: {
        name: "Nexus Mobile",
        slug: "nexus-mobile-android",
        version: "1.0.0",
        orientation: "portrait",
        icon: "./assets/icon.png",
        userInterfaceStyle: "dark",
        android: {
          package: "com.jojo.nexusmobile",
          adaptiveIcon: {
            foregroundImage: "./assets/adaptive-icon.png",
            backgroundColor: "#0B0F19"
          },
          targetSdkVersion: 34,
          permissions: ["CAMERA", "USE_BIOMETRIC", "INTERNET"]
        }
      }
    }, null, 2)
  },
  {
    path: 'android/AndroidManifest.xml',
    content: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.jojo.nexusmobile">
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.USE_BIOMETRIC" />
    <application
        android:label="Nexus Mobile"
        android:icon="@mipmap/ic_launcher"
        android:theme="@style/Theme.Nexus.Dark">
        <activity
            android:name=".MainActivity"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>`
  },
  {
    path: 'package.json',
    content: JSON.stringify({
      name: "nexus-mobile-android",
      version: "1.0.0",
      main: "App.tsx",
      dependencies: {
        "react": "18.3.1",
        "react-native": "0.74.5",
        "expo": "~51.0.0",
        "lucide-react-native": "^0.414.0"
      }
    }, null, 2)
  },
  {
    path: 'README.md',
    content: `# Nexus Mobile - Application Android 14

Cette architecture est configurée pour l'émulateur standard Android 14 (API 34 / Pixel 8 Pro).
- Compatible Expo SDK 51 & React Native 0.74
- Émulateur interactif intégré dans JOJO AI Studio
- Prêt pour export APK via EAS Build
`
  }
];

function getInitialStore(): LocalStoreData {
  return {
    users: [
      {
        id: 1,
        username: 'admin',
        email: 'admin@jojoai.com',
        manager_name: 'Lead Architect',
        company_name: 'JOJO Elite Studio'
      }
    ],
    credits: {
      1: 95.50
    },
    projects: [
      {
        id: 1,
        dev_portal_user_id: 1,
        name: 'Nexus Mobile Android',
        description: 'Application mobile native Android 14 avec émulateur Pixel 8 Pro et IA intégrée',
        app_template: 'android',
        is_public: true,
        user_role: 'owner',
        owner_name: 'Lead Architect',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 2,
        dev_portal_user_id: 1,
        name: 'Sovereign Web React',
        description: 'Architecture Web Next.js 14 & Tailwind CSS pour dashboard souverain',
        app_template: 'react',
        is_public: false,
        user_role: 'owner',
        owner_name: 'Lead Architect',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ],
    files: [
      ...INITIAL_ANDROID_FILES.map((f, i) => ({
        id: i + 1,
        project_id: 1,
        file_path: f.path,
        file_content: f.content,
        created_at: new Date().toISOString()
      })),
      {
        id: 101,
        project_id: 2,
        file_path: 'app/page.tsx',
        file_content: `export default function Page() {\n  return (\n    <main className="min-h-screen bg-[#05070a] text-white p-12 flex flex-col items-center justify-center">\n      <h1 className="text-4xl font-black">Sovereign Web React</h1>\n      <p className="text-cyan-400 mt-2 font-bold uppercase tracking-widest text-xs">Propulsé par JOJO AI Studio</p>\n    </main>\n  );\n}`,
        created_at: new Date().toISOString()
      },
      {
        id: 102,
        project_id: 2,
        file_path: 'package.json',
        file_content: JSON.stringify({
          name: "sovereign-web-react",
          version: "1.0.0",
          dependencies: {
            "next": "14.2.35",
            "react": "18.3.1",
            "react-dom": "18.3.1"
          }
        }, null, 2),
        created_at: new Date().toISOString()
      }
    ],
    chatHistory: [
      {
        id: 1,
        project_id: 1,
        role: 'user',
        content: "Génère l'architecture de départ Android 14 avec un émulateur Pixel 8 Pro.",
        created_at: new Date().toISOString()
      },
      {
        id: 2,
        project_id: 1,
        role: 'model',
        content: "✨ Architecture Android 14 (API 34) initialisée avec succès ! Le fichier principal App.tsx, app.json et le Manifest Android ont été générés. L'émulateur interactif Pixel 8 Pro est actif avec support tactile et télémétrie en temps réel.",
        created_at: new Date().toISOString()
      }
    ],
    pendingActions: [],
    databases: [
      {
        id: 1,
        project_id: 1,
        name: 'nexus_mobile_db',
        type: 'pg',
        url: 'postgresql://nexus_user:pass@127.0.0.1:5432/nexus_mobile_db',
        manager_url: 'https://adminer.jojoai.com?db=nexus_mobile_db',
        created_at: new Date().toISOString()
      }
    ]
  };
}

let storeMemory: LocalStoreData | null = null;

export function loadStore(): LocalStoreData {
  if (storeMemory) return storeMemory;
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      storeMemory = JSON.parse(raw);
      return storeMemory!;
    }
  } catch (err) {
    console.error('Failed to read .store_data.json, fallback to initial store:', err);
  }
  storeMemory = getInitialStore();
  saveStore(storeMemory);
  return storeMemory;
}

export function saveStore(data: LocalStoreData): void {
  storeMemory = data;
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save .store_data.json:', err);
  }
}
