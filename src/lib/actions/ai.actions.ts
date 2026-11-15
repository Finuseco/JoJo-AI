'use server';
import { db } from '../db';
import { getJojoAiSession } from './dev-portal.actions';
import { studioChat } from '@/ai/flows/studio-chat-flow';

/**
 * Envoie un message à JOJO AI et gère l'exécution autonome.
 */
export async function sendChatMessage(projectId: number, message: string, attachments?: { url: string, contentType: string }[]) {
  const session = await getJojoAiSession();
  if (!session.success || !session.user) return { success: false, error: "Session Elite requise." };

  try {
    const { rows: creditRows } = await db.query('SELECT generation_credits FROM jojo_ai_credits WHERE dev_portal_user_id = $1', [session.user.id]);
    const currentCredits = parseFloat(creditRows[0]?.generation_credits || '0');
    
    // Coût fixe par interaction
    if (currentCredits < 0.05) return { success: false, error: "Pièces ELITE insuffisantes." };

    const { rows: historyRows } = await db.query('SELECT role, content FROM jojo_ai_chat_history WHERE project_id = $1 ORDER BY created_at ASC LIMIT 10', [projectId]);

    const aiResponse = await studioChat({
      projectId,
      message,
      attachments,
      history: historyRows.map(h => ({ role: h.role as any, content: h.content }))
    });

    // Déduction des crédits
    await db.query('UPDATE jojo_ai_credits SET generation_credits = generation_credits - 0.05, updated_at = NOW() WHERE dev_portal_user_id = $1', [session.user.id]);
    
    // Sauvegarde de l'historique Elite
    await db.query('INSERT INTO jojo_ai_chat_history (project_id, role, content) VALUES ($1, $2, $3), ($1, $4, $5)', [projectId, 'user', message, 'model', aiResponse]);

    const { rows: newBalanceRows } = await db.query('SELECT generation_credits FROM jojo_ai_credits WHERE dev_portal_user_id = $1', [session.user.id]);

    return { 
      success: true, 
      text: aiResponse,
      newBalance: parseFloat(newBalanceRows[0].generation_credits),
      refreshFiles: true
    };
  } catch (error: any) {
    console.error('[Elite Engine Chat Error]', error);
    return { success: false, error: "Nexus AI : Erreur de traitement souverain." };
  }
}

export async function getChatHistory(projectId: number) {
    try {
        const { rows } = await db.query('SELECT role, content, created_at FROM jojo_ai_chat_history WHERE project_id = $1 ORDER BY created_at ASC', [projectId]);
        return { success: true, history: rows };
    } catch (e) { 
        console.error('getChatHistory error:', e);
        return { success: false, history: [] }; 
    }
}