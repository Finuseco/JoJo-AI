import { Pool } from 'pg';
import { loadStore, saveStore, LocalFile, LocalChatMessage, LocalPendingAction, LocalDatabase, LocalProject } from './local-store';

const isServer = typeof window === 'undefined';

let pool: Pool | null = null;
let useLocalStore = true; // Par défaut actif pour éviter tout ECONNREFUSED dans les environnements de preview

const getDbConfig = () => {
  if (!isServer) return null;
  if (!process.env.DB_HOST || process.env.DB_HOST === 'localhost' || process.env.DB_HOST === '127.0.0.1') {
    // Si aucun host distant spécifié, rester sur le stockage local haute performance
    return null;
  }

  const sslConfig = process.env.DB_SSL_CA
    ? { ssl: { ca: process.env.DB_SSL_CA, rejectUnauthorized: true } }
    : undefined;

  return {
    host: process.env.DB_HOST,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'cashpay',
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
    max: 10,
    connectionTimeoutMillis: 3000,
    ...sslConfig,
  };
};

try {
  const config = getDbConfig();
  if (config) {
    pool = new Pool(config);
    pool.on('error', (err) => {
      console.warn('PostgreSQL pool error, switching to local store:', err.message);
      useLocalStore = true;
    });
    useLocalStore = false;
  }
} catch (e) {
  useLocalStore = true;
}

// Moteur de requête local simulant PostgreSQL pour l'environnement sans serveur SQL dédié
async function executeLocalQuery(sql: string, params: any[] = []): Promise<{ rows: any[]; rowCount: number }> {
  const store = loadStore();
  const trimmed = sql.trim();
  const upper = trimmed.toUpperCase();

  // Transactions
  if (upper === 'BEGIN' || upper === 'COMMIT' || upper === 'ROLLBACK') {
    return { rows: [], rowCount: 0 };
  }

  // 1. dev_portal_users
  if (upper.includes('FROM DEV_PORTAL_USERS')) {
    if (upper.includes('WHERE ID = $1')) {
      const user = store.users.find(u => u.id === Number(params[0])) || store.users[0];
      return { rows: user ? [user] : [], rowCount: user ? 1 : 0 };
    }
    if (upper.includes('WHERE EMAIL = $1')) {
      const user = store.users.find(u => u.email.toLowerCase() === String(params[0]).toLowerCase()) || store.users[0];
      return { rows: user ? [user] : [], rowCount: user ? 1 : 0 };
    }
    return { rows: store.users, rowCount: store.users.length };
  }

  // 2. jojo_ai_credits
  if (upper.includes('INTO JOJO_AI_CREDITS')) {
    const userId = Number(params[0]);
    if (!store.credits[userId]) {
      store.credits[userId] = 95.50;
      saveStore(store);
    }
    return { rows: [], rowCount: 1 };
  }
  if (upper.includes('FROM JOJO_AI_CREDITS')) {
    const userId = Number(params[0]) || 1;
    const cred = store.credits[userId] ?? 95.50;
    return { rows: [{ generation_credits: cred.toString() }], rowCount: 1 };
  }
  if (upper.includes('UPDATE JOJO_AI_CREDITS')) {
    const userId = Number(params[params.length - 1]) || 1;
    const current = store.credits[userId] ?? 95.50;
    store.credits[userId] = Math.max(0, current - 0.05);
    saveStore(store);
    return { rows: [], rowCount: 1 };
  }

  // 3. jojo_ai_projects
  if (upper.includes('FROM JOJO_AI_PROJECTS')) {
    if (upper.includes('WHERE ID = $1')) {
      const pid = Number(params[0]);
      const project = store.projects.find(p => p.id === pid);
      return { rows: project ? [project] : [], rowCount: project ? 1 : 0 };
    }
    // Tous les projets pour l'utilisateur
    const list = store.projects.map(p => ({
      ...p,
      owner_name: p.owner_name || 'Lead Architect',
      user_role: p.user_role || 'owner'
    }));
    return { rows: list, rowCount: list.length };
  }
  if (upper.includes('INSERT INTO JOJO_AI_PROJECTS')) {
    const nextId = store.projects.reduce((max, p) => Math.max(max, p.id), 0) + 1;
    const newProject: LocalProject = {
      id: nextId,
      dev_portal_user_id: Number(params[0]) || 1,
      name: String(params[1]),
      description: String(params[2] || ''),
      app_template: String(params[3] || 'android'),
      is_public: true,
      user_role: 'owner',
      owner_name: 'Lead Architect',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    store.projects.unshift(newProject);
    saveStore(store);
    return { rows: [{ id: nextId }], rowCount: 1 };
  }
  if (upper.includes('UPDATE JOJO_AI_PROJECTS')) {
    if (upper.includes('IS_PUBLIC = $1')) {
      const isPublic = Boolean(params[0]);
      const pid = Number(params[1]);
      const p = store.projects.find(item => item.id === pid);
      if (p) p.is_public = isPublic;
    } else if (upper.includes('UPDATED_AT = NOW()')) {
      const pid = Number(params[0]);
      const p = store.projects.find(item => item.id === pid);
      if (p) p.updated_at = new Date().toISOString();
    }
    saveStore(store);
    return { rows: [], rowCount: 1 };
  }
  if (upper.includes('DELETE FROM JOJO_AI_PROJECTS')) {
    const pid = Number(params[0]);
    store.projects = store.projects.filter(p => p.id !== pid);
    store.files = store.files.filter(f => f.project_id !== pid);
    store.chatHistory = store.chatHistory.filter(c => c.project_id !== pid);
    saveStore(store);
    return { rows: [], rowCount: 1 };
  }

  // 4. jojo_ai_project_files
  if (upper.includes('SELECT FILE_PATH FROM JOJO_AI_PROJECT_FILES')) {
    const pid = Number(params[0]);
    const files = store.files
      .filter(f => f.project_id === pid)
      .sort((a, b) => a.file_path.localeCompare(b.file_path));
    return { rows: files.map(f => ({ file_path: f.file_path })), rowCount: files.length };
  }
  if (upper.includes('SELECT FILE_CONTENT FROM JOJO_AI_PROJECT_FILES')) {
    const pid = Number(params[0]);
    const fpath = String(params[1]);
    const file = store.files.find(f => f.project_id === pid && f.file_path === fpath);
    return { rows: file ? [{ file_content: file.file_content }] : [], rowCount: file ? 1 : 0 };
  }
  if (upper.includes('INSERT INTO JOJO_AI_PROJECT_FILES')) {
    const pid = Number(params[0]);
    const fpath = String(params[1]);
    const content = String(params[2] ?? '');
    const existingIndex = store.files.findIndex(f => f.project_id === pid && f.file_path === fpath);
    if (existingIndex >= 0) {
      store.files[existingIndex].file_content = content;
    } else {
      const nextFileId = store.files.reduce((max, f) => Math.max(max, f.id), 0) + 1;
      store.files.push({
        id: nextFileId,
        project_id: pid,
        file_path: fpath,
        file_content: content,
        created_at: new Date().toISOString()
      });
    }
    saveStore(store);
    return { rows: [], rowCount: 1 };
  }
  if (upper.includes('UPDATE JOJO_AI_PROJECT_FILES')) {
    const content = String(params[0] ?? '');
    const pid = Number(params[1]);
    const fpath = String(params[2]);
    const existing = store.files.find(f => f.project_id === pid && f.file_path === fpath);
    if (existing) {
      existing.file_content = content;
    } else {
      const nextFileId = store.files.reduce((max, f) => Math.max(max, f.id), 0) + 1;
      store.files.push({
        id: nextFileId,
        project_id: pid,
        file_path: fpath,
        file_content: content,
        created_at: new Date().toISOString()
      });
    }
    saveStore(store);
    return { rows: [], rowCount: 1 };
  }
  if (upper.includes('DELETE FROM JOJO_AI_PROJECT_FILES')) {
    const pid = Number(params[0]);
    const fpath = String(params[1]);
    store.files = store.files.filter(f => !(f.project_id === pid && f.file_path === fpath));
    saveStore(store);
    return { rows: [], rowCount: 1 };
  }

  // 5. jojo_ai_chat_history
  if (upper.includes('FROM JOJO_AI_CHAT_HISTORY')) {
    const pid = Number(params[0]);
    const history = store.chatHistory
      .filter(c => c.project_id === pid)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    return { rows: history, rowCount: history.length };
  }
  if (upper.includes('INSERT INTO JOJO_AI_CHAT_HISTORY')) {
    // Peut insérer 1 ou 2 messages (ex: user + model)
    const pid = Number(params[0]);
    if (params.length >= 5) {
      // ($1, $2, $3), ($1, $4, $5)
      store.chatHistory.push({
        id: store.chatHistory.length + 1,
        project_id: pid,
        role: params[1],
        content: params[2],
        created_at: new Date().toISOString()
      });
      store.chatHistory.push({
        id: store.chatHistory.length + 2,
        project_id: pid,
        role: params[3],
        content: params[4],
        created_at: new Date().toISOString()
      });
    } else if (params.length >= 3) {
      store.chatHistory.push({
        id: store.chatHistory.length + 1,
        project_id: pid,
        role: params[1],
        content: params[2],
        created_at: new Date().toISOString()
      });
    }
    saveStore(store);
    return { rows: [], rowCount: 1 };
  }

  // 6. project_pending_actions
  if (upper.includes('FROM PROJECT_PENDING_ACTIONS')) {
    if (upper.includes('WHERE PROJECT_ID = $1')) {
      const pid = Number(params[0]);
      const actions = store.pendingActions.filter(a => a.project_id === pid && a.status === 'pending');
      return { rows: actions, rowCount: actions.length };
    }
    if (upper.includes('WHERE ID = $1')) {
      const aid = Number(params[0]);
      const action = store.pendingActions.find(a => a.id === aid);
      return { rows: action ? [action] : [], rowCount: action ? 1 : 0 };
    }
    return { rows: store.pendingActions, rowCount: store.pendingActions.length };
  }
  if (upper.includes('UPDATE PROJECT_PENDING_ACTIONS')) {
    const statusMatch = trimmed.match(/status\s*=\s*'([^']+)'/i);
    const newStatus = statusMatch ? (statusMatch[1] as any) : 'approved';
    const aid = Number(params[0]);
    const action = store.pendingActions.find(a => a.id === aid);
    if (action) action.status = newStatus;
    saveStore(store);
    return { rows: [], rowCount: 1 };
  }

  // 7. project_databases
  if (upper.includes('FROM PROJECT_DATABASES')) {
    const pid = Number(params[0]);
    const dbs = store.databases.filter(d => d.project_id === pid);
    return { rows: dbs, rowCount: dbs.length };
  }
  if (upper.includes('INSERT INTO PROJECT_DATABASES')) {
    const pid = Number(params[0]);
    const nextDbId = store.databases.length + 1;
    store.databases.push({
      id: nextDbId,
      project_id: pid,
      name: String(params[1]),
      type: params[2] || 'pg',
      url: String(params[3]),
      manager_url: String(params[4]),
      created_at: new Date().toISOString()
    });
    saveStore(store);
    return { rows: [], rowCount: 1 };
  }

  // 8. project_error_logs
  if (upper.includes('FROM PROJECT_ERROR_LOGS')) {
    return { rows: [], rowCount: 0 };
  }

  return { rows: [], rowCount: 0 };
}

export const db = {
  query: async (sql: string, params?: any[]) => {
    if (!useLocalStore && pool) {
      try {
        return await pool.query(sql, params);
      } catch (err: any) {
        if (err.code === 'ECONNREFUSED' || err.message?.includes('ECONNREFUSED')) {
          console.warn('PostgreSQL connection refused, gracefully using Local Store fallback.');
          useLocalStore = true;
          return await executeLocalQuery(sql, params);
        }
        throw err;
      }
    }
    return await executeLocalQuery(sql, params);
  },
  getConnection: async () => {
    if (!useLocalStore && pool) {
      try {
        return await pool.connect();
      } catch (err: any) {
        useLocalStore = true;
      }
    }
    // Pseudo client connection
    return {
      query: (sql: string, params?: any[]) => executeLocalQuery(sql, params),
      release: () => {}
    };
  },
};
