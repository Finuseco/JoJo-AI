import jwt from 'jsonwebtoken';

/**
 * Secret unifié pour l'écosystème Elite.
 * DOIT ÊTRE RIGOUREUSEMENT IDENTIQUE AU CENTRE AUTH.
 */
const AUTH_SECRET = 'CASH-PAY-ELITE-SECURE-TUNNEL-SIGNATURE-KEY-2024-V3';

export interface JwtPayload {
    id: number;
    username: string;
    manager_name: string;
    b2b_user_id?: number | null;
}

/**
 * Vérifie la validité du token émis par l'IDP.
 */
export function verifyToken(token: string): JwtPayload | null {
    try {
        const decoded = jwt.verify(token, AUTH_SECRET);
        if (typeof decoded === 'object' && 'id' in decoded) {
            return decoded as JwtPayload;
        }
        return null;
    } catch (error) {
        console.error(`[JWT Studio Error] Invalid signature or expired token:`, error);
        return null;
    }
}
