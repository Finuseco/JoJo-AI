
# JOJO AI ELITE Studio - Architecture SQL Complète (VPS Ready)

Ce document détaille les relations entre les tables PostgreSQL pour l'infrastructure **JOJO AI ELITE Studio**.

---

## 1. Utilisateurs & Économie

### `dev_portal_users`
Profils développeurs (Elite Account).
```sql
CREATE TABLE dev_portal_users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    manager_name VARCHAR(100),
    company_name VARCHAR(100),
    phone VARCHAR(20),
    b2b_user_id INT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

### `jojo_ai_credits`
Gestion des pièces ELITE pour l'IA.
```sql
CREATE TABLE jojo_ai_credits (
    id SERIAL PRIMARY KEY,
    dev_portal_user_id INT UNIQUE REFERENCES dev_portal_users(id) ON DELETE CASCADE,
    generation_credits DECIMAL(10,2) DEFAULT 10.00,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

---

## 2. Collaboration & Projets

### `jojo_ai_projects`
Applications générées.
```sql
CREATE TABLE jojo_ai_projects (
    id SERIAL PRIMARY KEY,
    dev_portal_user_id INT REFERENCES dev_portal_users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    app_template VARCHAR(50),
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

### `project_collaborators`
Gère le partage sécurisé et les invitations.
```sql
CREATE TABLE project_collaborators (
    id SERIAL PRIMARY KEY,
    project_id INT REFERENCES jojo_ai_projects(id) ON DELETE CASCADE,
    user_id INT REFERENCES dev_portal_users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'collaborator',
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'accepted', 'rejected'
    invited_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    accepted_at TIMESTAMPTZ,
    UNIQUE(project_id, user_id)
);
```

---

## 3. Intelligence & Fichiers

### `jojo_ai_chat_history`
Discussion synchronisée.
```sql
CREATE TABLE jojo_ai_chat_history (
    id SERIAL PRIMARY KEY,
    project_id INT REFERENCES jojo_ai_projects(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL, -- 'user' ou 'model'
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

### `jojo_ai_project_files`
Contenu réel des fichiers.
```sql
CREATE TABLE jojo_ai_project_files (
    id SERIAL PRIMARY KEY,
    project_id INT REFERENCES jojo_ai_projects(id) ON DELETE CASCADE,
    file_path VARCHAR(512) NOT NULL,
    file_content TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (project_id, file_path)
);
```

---

## 4. Infrastructure & Debugging

### `project_databases`
Bases de données managées associées aux projets.
```sql
CREATE TABLE project_databases (
    id SERIAL PRIMARY KEY,
    project_id INT REFERENCES jojo_ai_projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL, -- 'pg' ou 'mysql'
    url TEXT,
    manager_url TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

### `project_pending_actions`
Modifications proposées par l'agent IA (Self-Healing).
```sql
CREATE TABLE project_pending_actions (
    id SERIAL PRIMARY KEY,
    project_id INT REFERENCES jojo_ai_projects(id) ON DELETE CASCADE,
    action_type VARCHAR(50), -- 'create_file', 'update_file'
    file_path VARCHAR(512),
    content TEXT,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

### `project_error_logs`
Logs capturés par le tunnel de rendu pour le debugging IA.
```sql
CREATE TABLE project_error_logs (
    id SERIAL PRIMARY KEY,
    project_id INT REFERENCES jojo_ai_projects(id) ON DELETE CASCADE,
    type VARCHAR(50), -- 'syntax', 'runtime', 'import'
    message TEXT,
    file_path VARCHAR(512),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

    