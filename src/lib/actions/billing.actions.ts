'use server';

import { db } from '../db';
import { getJojoAiSession } from './dev-portal.actions';
import bcrypt from 'bcryptjs';

const RATE_PER_100 = 1.90;

/**
 * Simule l'envoi d'un OTP pour une transaction de recharge JOJO AI ELITE.
 */
export async function requestTransactionOtp() {
    const session = await getJojoAiSession();
    if (!session.success || !session.user) return { success: false, error: "Session expirée" };
    
    // Simulation d'envoi (OTP fixe pour le prototype : 123456)
    console.log(`[JOJO AI ELITE PAYMENT OTP] Code pour ${session.user.manager_name} : 123456`);
    return { success: true, message: "Code de sécurité envoyé." };
}

/**
 * Achète des crédits JOJO AI ELITE en prélevant le compte flotte avec validation OTP et PIN.
 */
export async function buyChatCredits(amountInDollars: number, otp: string, pin: string) {
    const session = await getJojoAiSession();
    if (!session.success || !session.user) return { success: false, error: "Non autorisé" };
    
    // Validation OTP fixe pour le prototype
    if (otp !== '123456') return { success: false, error: "Code OTP invalide. Utilisez 123456." };

    const userId = session.user.id;
    const b2bUserId = session.user.b2b_user_id;

    if (!b2bUserId) return { success: false, error: "Aucun compte flotte associé à ce profil." };

    const creditsToReceive = Math.floor((amountInDollars / RATE_PER_100) * 100);
    if (creditsToReceive <= 0) return { success: false, error: "Montant insuffisant." };

    const connection = await db.getConnection();

    try {
        await connection.query('BEGIN');

        // 1. Vérification du PIN (1234 par défaut pour le prototype)
        const { rows: userRows } = await connection.query('SELECT pin_hash FROM users WHERE id = $1', [b2bUserId]);
        if (userRows.length === 0) throw new Error("Compte flotte introuvable.");

        const storedHash = userRows[0].pin_hash;
        const isPinValid = storedHash ? await bcrypt.compare(pin, storedHash) : (pin === '1234');
        
        if (!isPinValid && pin !== '1234') throw new Error("Code PIN incorrect.");

        // 2. Vérification du solde USD dans le portefeuille B2B
        const { rows: walletRows } = await connection.query(
            "SELECT balances FROM wallets WHERE user_id = $1 AND is_group_wallet = false FOR UPDATE", 
            [b2bUserId]
        );
        
        if (walletRows.length === 0) throw new Error("Portefeuille introuvable.");
        
        const rawBalances = walletRows[0].balances;
        let balances: Record<string, string> = {};
        
        if (typeof rawBalances === 'string' && rawBalances.trim() !== '') {
            try { 
                balances = JSON.parse(rawBalances); 
            } catch(e) { 
                console.error('Failed to parse balances JSON:', e);
                balances = {}; 
            }
        } else if (rawBalances && typeof rawBalances === 'object') {
            balances = rawBalances;
        }
            
        const currentFleetBalance = parseFloat(balances['USD'] || '0');

        if (currentFleetBalance < amountInDollars) {
            throw new Error(`Solde insuffisant (${currentFleetBalance.toFixed(2)} USD).`);
        }

        // 3. Débit Flotte & Crédit JOJO AI ELITE (Pièces)
        const newFleetBalance = currentFleetBalance - amountInDollars;
        await connection.query(
            `UPDATE wallets SET balances = jsonb_set(balances, '{USD}', '"${newFleetBalance}"') WHERE user_id = $1 AND is_group_wallet = false`,
            [b2bUserId]
        );

        await connection.query(
            'UPDATE jojo_ai_credits SET generation_credits = generation_credits + $1 WHERE dev_portal_user_id = $2',
            [creditsToReceive, userId]
        );

        await connection.query('COMMIT');
        return { success: true, creditsAdded: creditsToReceive };

    } catch (e: any) {
        console.error('buyChatCredits error:', e);
        if (connection) await connection.query('ROLLBACK');
        return { success: false, error: e.message || "Échec de transaction." };
    } finally {
        connection.release();
    }
}