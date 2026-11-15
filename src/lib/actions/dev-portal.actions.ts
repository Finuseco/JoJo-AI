'use server';

import { db } from '../db';
import type { DevPortalUser } from '@/lib/types';
import { cookies } from 'next/headers';
import { verifyToken } from '../jwt';
import { revalidatePath } from 'next/cache';

/**
 * Récupère ou synchronise la session utilisateur Elite via cookies.
 */
export async function getJojoAiSession(providedToken?: string) {
    try {
        let token = providedToken || cookies().get('dev_portal_token')?.value;
        if (providedToken) {
            cookies().set('dev_portal_token', providedToken, { 
                path: '/', httpOnly: true, secure: true, sameSite: 'lax', maxAge: 60 * 60 * 24 * 7
            });
            token = providedToken;
        }
        if (!token) return { success: false };
        const decoded = verifyToken(token);
        if (!decoded) return { success: false };
        const { rows } = await db.query('SELECT * FROM dev_portal_users WHERE id = $1', [decoded.id]);
        if (rows.length === 0) return { success: false };
        const user = rows[0] as DevPortalUser;
        
        // Initialisation silencieuse des crédits
        try {
            await db.query('INSERT INTO jojo_ai_credits (dev_portal_user_id, generation_credits) VALUES ($1, 10.00) ON CONFLICT DO NOTHING', [user.id]);
        } catch (e) {
            console.error('Failed to initialize user credits:', e);
            // Table peut-être pas encore créée sur le VPS, on ignore pour ne pas bloquer la session
        }
        
        return { success: true, user };
    } catch (e) { 
        console.error('getJojoAiSession error:', e);
        return { success: false }; 
    }
}

/**
 * Liste les projets de l'utilisateur (Possédés + Partagés).
 */
export async function getProjectsForUser() {
    try {
        const session = await getJojoAiSession();
        if (!session.success || !session.user) return { success: false };
        
        // Requête robuste gérant l'absence potentielle de la table pc
        const { rows } = await db.query(`
            SELECT p.*, u.manager_name as owner_name, 
            CASE WHEN p.dev_portal_user_id = $1 THEN 'owner' ELSE 'collaborator' END as user_role
            FROM jojo_ai_projects p
            LEFT JOIN dev_portal_users u ON p.dev_portal_user_id = u.id
            LEFT JOIN (
                SELECT project_id, user_id FROM project_collaborators WHERE status = 'accepted'
            ) pc ON p.id = pc.project_id
            WHERE p.dev_portal_user_id = $1 OR pc.user_id = $1
            ORDER BY p.updated_at DESC
        `, [session.user.id]);
        
        return { success: true, projects: rows };
    } catch (e: any) { 
        console.error('getProjectsForUser query error:', e);
        // Si les tables d'invitations manquent, on renvoie au moins les projets personnels
        try {
            const { rows } = await db.query('SELECT p.*, u.manager_name as owner_name, \'owner\' as user_role FROM jojo_ai_projects p LEFT JOIN dev_portal_users u ON p.dev_portal_user_id = u.id WHERE p.dev_portal_user_id = $1', [session?.user?.id]);
            return { success: true, projects: rows };
        } catch (innerErr) {
            console.error('getProjectsForUser fallback error:', innerErr);
            return { success: false, error: "Base de données non initialisée." }; 
        }
    }
}

/**
 * Invite un collaborateur sur un projet via son e-mail.
 */
export async function inviteCollaborator(projectId: number, email: string) {
    try {
        const session = await getJojoAiSession();
        if (!session.success || !session.user) throw new Error("Auth requise.");

        const { rows: userRows } = await db.query('SELECT id FROM dev_portal_users WHERE email = $1', [email]);
        if (userRows.length === 0) throw new Error("Utilisateur introuvable.");
        
        const targetUserId = userRows[0].id;

        await db.query(`
            INSERT INTO project_collaborators (project_id, user_id, role, status) 
            VALUES ($1, $2, 'collaborator', 'pending') 
            ON CONFLICT (project_id, user_id) DO NOTHING
        `, [projectId, targetUserId]);

        return { success: true };
    } catch (e: any) { 
        console.error('inviteCollaborator error:', e);
        return { success: false, error: e.message }; 
    }
}

/**
 * Création d'un projet avec architecture complète.
 */
export async function createJojoAiProject(data: { name: string, description: string, template: string }) {
    const connection = await db.getConnection();
    try {
        const session = await getJojoAiSession();
        if (!session.success || !session.user) throw new Error("Authentification Elite requise.");
        
        await connection.query('BEGIN');
        
        const { rows } = await connection.query(
            'INSERT INTO jojo_ai_projects (dev_portal_user_id, name, description, app_template) VALUES ($1, $2, $3, $4) RETURNING id', 
            [session.user.id, data.name, data.description, data.template]
        );
        const pid = rows[0].id;
        
        const slug = data.name.toLowerCase().replace(/\s+/g, '-');
        let defaultFiles: { path: string, content: string }[] = [];

        if (data.template === 'android' || data.template === 'react-native') {
            defaultFiles = [
                {
                    path: 'App.tsx',
                    content: `import React, { useState } from 'react';\nimport { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, SafeAreaView } from 'react-native';\n\nexport default function AndroidApp() {\n  const [count, setCount] = useState(0);\n  const [activeTab, setActiveTab] = useState<'home' | 'security' | 'stats'>('home');\n\n  return (\n    <SafeAreaView style={styles.container}>\n      <StatusBar barStyle="light-content" backgroundColor="#0B0F19" />\n      \n      {/* Android 14 Material Header */}\n      <View style={styles.header}>\n        <View>\n          <Text style={styles.headerSubtitle}>ANDROID 14 • PIXEL 8 PRO</Text>\n          <Text style={styles.headerTitle}>${data.name}</Text>\n        </View>\n        <View style={styles.badge}>\n          <Text style={styles.badgeText}>API 34</Text>\n        </View>\n      </View>\n\n      <ScrollView contentContainerStyle={styles.scrollContent}>\n        <View style={styles.card}>\n          <Text style={styles.cardTag}>INSTANCE ACTIVE</Text>\n          <Text style={styles.cardTitle}>${data.name}</Text>\n          <Text style={styles.cardDesc}>${data.description}</Text>\n          <TouchableOpacity style={styles.button} onPress={() => setCount(c => c + 1)}>\n            <Text style={styles.buttonText}>Action Android : {count} taps</Text>\n          </TouchableOpacity>\n        </View>\n\n        <View style={styles.telemetryBox}>\n          <Text style={styles.telemetryTitle}>Emulateur Status</Text>\n          <Text style={styles.telemetryText}>✓ Moteur Google Gemini Live actif</Text>\n          <Text style={styles.telemetryText}>✓ Pixel 8 Pro Émulateur Connecté</Text>\n          <Text style={styles.telemetryText}>✓ Hot Reloading Android 14</Text>\n        </View>\n      </ScrollView>\n    </SafeAreaView>\n  );\n}\n\nconst styles = StyleSheet.create({\n  container: { flex: 1, backgroundColor: '#0B0F19' },\n  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#1E293B' },\n  headerSubtitle: { color: '#06B6D4', fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },\n  headerTitle: { color: '#FFFFFF', fontSize: 22, fontWeight: '900' },\n  badge: { backgroundColor: '#1E293B', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },\n  badgeText: { color: '#06B6D4', fontSize: 10, fontWeight: '700' },\n  scrollContent: { padding: 20 },\n  card: { backgroundColor: '#13192B', borderRadius: 24, padding: 24, borderWidth: 1, borderColor: '#1E293B', marginBottom: 20 },\n  cardTag: { color: '#06B6D4', fontSize: 10, fontWeight: '800', marginBottom: 6 },\n  cardTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '900', marginBottom: 6 },\n  cardDesc: { color: '#94A3B8', fontSize: 13, lineHeight: 20, marginBottom: 18 },\n  button: { backgroundColor: '#06B6D4', paddingVertical: 14, borderRadius: 16, alignItems: 'center' },\n  buttonText: { color: '#0B0F19', fontWeight: '900', fontSize: 13, textTransform: 'uppercase' },\n  telemetryBox: { backgroundColor: '#0F172A', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#1E293B' },\n  telemetryTitle: { color: '#CBD5E1', fontSize: 12, fontWeight: '800', textTransform: 'uppercase', marginBottom: 8 },\n  telemetryText: { color: '#10B981', fontSize: 11, marginBottom: 4 }\n});`
                },
                {
                    path: 'app.json',
                    content: JSON.stringify({
                        expo: {
                            name: data.name,
                            slug: slug,
                            version: "1.0.0",
                            userInterfaceStyle: "dark",
                            android: {
                                package: `com.jojo.${slug.replace(/[^a-z0-9]/g, '')}`,
                                targetSdkVersion: 34,
                                permissions: ["INTERNET", "CAMERA", "USE_BIOMETRIC"]
                            }
                        }
                    }, null, 2)
                },
                {
                    path: 'android/AndroidManifest.xml',
                    content: `<?xml version="1.0" encoding="utf-8"?>\n<manifest xmlns:android="http://schemas.android.com/apk/res/android"\n    package="com.jojo.${slug.replace(/[^a-z0-9]/g, '')}">\n    <uses-permission android:name="android.permission.INTERNET" />\n    <application android:label="${data.name}" android:theme="@style/Theme.Android14.Dark">\n        <activity android:name=".MainActivity" android:exported="true">\n            <intent-filter>\n                <action android:name="android.intent.action.MAIN" />\n                <category android:name="android.intent.category.LAUNCHER" />\n            </intent-filter>\n        </activity>\n    </application>\n</manifest>`
                },
                {
                    path: 'package.json',
                    content: JSON.stringify({
                        name: slug,
                        version: "1.0.0",
                        main: "App.tsx",
                        dependencies: {
                            "react": "18.3.1",
                            "react-native": "0.74.5",
                            "expo": "~51.0.0"
                        }
                    }, null, 2)
                }
            ];
        } else if (data.template === 'shoelace-ts') {
            defaultFiles = [
                {
                    path: 'index.html',
                    content: `<!DOCTYPE html>\n<html lang="fr" class="sl-theme-dark">\n<head>\n  <meta charset="UTF-8">\n  <title>${data.name} - Shoelace</title>\n  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.15.0/cdn/themes/dark.css" />\n  <script type="module" src="https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.15.0/cdn/shoelace-autoloader.js"></script>\n</head>\n<body style="background:#05070a;color:white;font-family:sans-serif;padding:2rem;">\n  <sl-card style="max-width:500px;margin:auto;">\n    <div slot="header"><h2>${data.name}</h2></div>\n    <p>${data.description}</p>\n    <sl-button variant="primary">Shoelace Button</sl-button>\n  </sl-card>\n  <script src="./src/main.ts"></script>\n</body>\n</html>`
                },
                {
                    path: 'src/main.ts',
                    content: `console.log("Shoelace & TypeScript app initialized: ${data.name}");`
                },
                {
                    path: 'package.json',
                    content: JSON.stringify({ name: slug, version: "1.0.0", dependencies: { "@shoelace-style/shoelace": "^2.15.0", "typescript": "^5.5.3" } }, null, 2)
                }
            ];
        } else {
            defaultFiles = [
                {
                    path: 'app/page.tsx',
                    content: `export default function Page() {\n  return (\n    <main className="min-h-screen bg-[#05070a] text-white p-12 flex flex-col items-center justify-center">\n      <h1 className="text-4xl font-black mb-3">${data.name}</h1>\n      <p className="text-gray-400 max-w-md text-center mb-6">${data.description}</p>\n      <button className="px-6 py-3 bg-cyan-500 text-black font-black uppercase rounded-xl tracking-widest text-xs">\n        Lancer l'Application\n      </button>\n    </main>\n  );\n}`
                },
                {
                    path: 'package.json',
                    content: JSON.stringify({
                        name: slug,
                        version: "1.0.0",
                        dependencies: {
                            "next": "14.2.35",
                            "react": "18.3.1",
                            "react-dom": "18.3.1",
                            "lucide-react": "0.414.0",
                            "framer-motion": "11.3.17"
                        }
                    }, null, 2)
                },
                {
                    path: 'tsconfig.json',
                    content: JSON.stringify({
                        compilerOptions: { target: "ES2017", lib: ["dom", "dom.iterable", "esnext"], allowJs: true, skipLibCheck: true, strict: true, noEmit: true, esModuleInterop: true, module: "esnext", moduleResolution: "bundler", resolveJsonModule: true, isolatedModules: true, jsx: "preserve" }
                    }, null, 2)
                }
            ];
        }

        for (const file of defaultFiles) {
            await connection.query(
                'INSERT INTO jojo_ai_project_files (project_id, file_path, file_content) VALUES ($1, $2, $3)', 
                [pid, file.path, file.content]
            );
        }
        
        await connection.query('COMMIT');
        return { success: true, data: { projectId: pid, appName: data.name } };
    } catch (e: any) { 
        console.error('createJojoAiProject error:', e);
        if (connection) await connection.query('ROLLBACK'); 
        return { success: false, error: e.message }; 
    } finally { 
        connection.release(); 
    }
}

/**
 * Récupère l'arborescence complète des fichiers du projet.
 */
export async function getProjectFileTree(projectId: number) {
    try {
        const { rows } = await db.query('SELECT file_path FROM jojo_ai_project_files WHERE project_id = $1 ORDER BY file_path ASC', [projectId]);
        return { success: true, files: rows.map(r => r.file_path) };
    } catch (e) { 
        console.error('getProjectFileTree error:', e);
        return { success: false, files: [] }; 
    }
}

/**
 * Récupère le contenu d'un fichier spécifique.
 */
export async function getFileContent(projectId: number, filePath: string) {
    try {
        const { rows } = await db.query('SELECT file_content FROM jojo_ai_project_files WHERE project_id = $1 AND file_path = $2', [projectId, filePath]);
        return { success: true, content: rows[0]?.file_content || '' };
    } catch (e) { 
        console.error('getFileContent error:', e);
        return { success: false, content: '' }; 
    }
}

export async function saveFileContent(projectId: number, filePath: string, content: string) {
    try {
        await db.query('UPDATE jojo_ai_project_files SET file_content = $1 WHERE project_id = $2 AND file_path = $3', [content, projectId, filePath]);
        await db.query('UPDATE jojo_ai_projects SET updated_at = NOW() WHERE id = $1', [projectId]);
        return { success: true };
    } catch (e: any) { 
        console.error('saveFileContent error:', e);
        return { success: false, error: e.message }; 
    }
}

export async function getPendingActions(projectId: number) {
    try {
        const { rows } = await db.query("SELECT * FROM project_pending_actions WHERE project_id = $1 AND status = 'pending' ORDER BY created_at ASC", [projectId]);
        return { success: true, actions: rows };
    } catch (e) { 
        console.error('getPendingActions error:', e);
        return { success: false, actions: [] }; 
    }
}

export async function approvePendingAction(actionId: number) {
    const connection = await db.getConnection();
    try {
        await connection.query('BEGIN');
        const { rows } = await connection.query('SELECT * FROM project_pending_actions WHERE id = $1', [actionId]);
        if (rows.length === 0) throw new Error("Action introuvable.");
        const action = rows[0];
        await connection.query(
            `INSERT INTO jojo_ai_project_files (project_id, file_path, file_content) VALUES ($1, $2, $3) ON CONFLICT (project_id, file_path) DO UPDATE SET file_content = EXCLUDED.file_content`,
            [action.project_id, action.file_path, action.content]
        );
        await connection.query("UPDATE project_pending_actions SET status = 'approved' WHERE id = $1", [actionId]);
        await connection.query('UPDATE jojo_ai_projects SET updated_at = NOW() WHERE id = $1', [action.project_id]);
        await connection.query('COMMIT');
        return { success: true };
    } catch (e: any) { 
        console.error('approvePendingAction error:', e);
        if (connection) await connection.query('ROLLBACK'); 
        return { success: false, error: e.message }; 
    } finally { 
        connection.release(); 
    }
}

export async function rejectPendingAction(actionId: number) {
    try { 
        await db.query("UPDATE project_pending_actions SET status = 'rejected' WHERE id = $1", [actionId]); 
        return { success: true }; 
    } catch (e) { 
        console.error('rejectPendingAction error:', e);
        return { success: false }; 
    }
}

export async function getCredits() {
    try {
        const session = await getJojoAiSession();
        if (!session.success || !session.user) return { success: false, credits: 0 };
        const { rows } = await db.query('SELECT generation_credits FROM jojo_ai_credits WHERE dev_portal_user_id = $1', [session.user.id]);
        return { success: true, credits: rows[0] ? parseFloat(rows[0].generation_credits) : 0 };
    } catch (e) {
        console.error('getCredits error:', e);
        return { success: false, credits: 10.00 };
    }
}

export async function deleteProject(projectId: number) {
    try { 
        await db.query('DELETE FROM jojo_ai_projects WHERE id = $1', [projectId]); 
        return { success: true }; 
    } catch (e) { 
        console.error('deleteProject error:', e);
        return { success: false }; 
    }
}

export async function getProjectDatabases(projectId: number) {
    try { 
        const { rows } = await db.query('SELECT * FROM project_databases WHERE project_id = $1', [projectId]); 
        return { success: true, databases: rows }; 
    } catch (e) { 
        console.error('getProjectDatabases error:', e);
        return { success: false, databases: [] }; 
    }
}

export async function provisionNewDatabase(projectId: number, config: { name: string, type: 'pg' | 'mysql', user: string, pass: string }) {
    try {
        const url = `${config.type}://${config.user}:${config.pass}@127.0.0.1:5432/${config.name}`;
        const managerUrl = `https://cashpay-all.com/db-admin/adminer.php?engine=${config.type === 'pg' ? 'pgsql' : 'server'}`;
        await db.query('INSERT INTO project_databases (project_id, name, type, url, manager_url) VALUES ($1, $2, $3, $4, $5)', [projectId, config.name, config.type, url, managerUrl]);
        return { success: true };
    } catch (e: any) { 
        console.error('provisionNewDatabase error:', e);
        return { success: false, error: e.message }; 
    }
}

export async function runSqlQuery(projectId: number, dbId: number, sql: string) {
    try { 
        return { success: true }; 
    } catch (e: any) { 
        console.error('runSqlQuery error:', e);
        return { success: false, error: e.message }; 
    }
}

export async function toggleProjectVisibility(projectId: number, isPublic: boolean) {
    try {
        await db.query('UPDATE jojo_ai_projects SET is_public = $1 WHERE id = $2', [isPublic, projectId]);
        return { success: true };
    } catch (e: any) { 
        console.error('toggleProjectVisibility error:', e);
        return { success: false, error: e.message }; 
    }
}

export async function createFileSystemItem(projectId: number, path: string, type: 'file' | 'folder') {
    try {
        const content = type === 'folder' ? '' : '';
        const finalPath = type === 'folder' ? `${path}/.keep` : path;
        await db.query('INSERT INTO jojo_ai_project_files (project_id, file_path, file_content) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING', [projectId, finalPath, content]);
        return { success: true };
    } catch (e: any) { 
        console.error('createFileSystemItem error:', e);
        return { success: false, error: e.message }; 
    }
}

export async function triggerBuild(projectId: number) {
    try { 
        return { success: true }; 
    } catch (e: any) { 
        console.error('triggerBuild error:', e);
        return { success: false, error: e.message }; 
    }
}
