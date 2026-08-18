import { prisma } from "../../../db";

export const createSession = async (userId: string, sessionTokenHash: string, expiresAt: Date, ip_address: string) => {
    return await prisma.sso_sessions.create({
        data: {
            user_id: userId,
            session_token_hash: sessionTokenHash,
            expires_at: expiresAt,
            ip_address: ip_address
        },
    });
}

export const getSessionByToken = async (sessionTokenHash: string) => {
    return await prisma.sso_sessions.findFirst({
        where: {
            session_token_hash: sessionTokenHash,
        },
    });
}

export const updateSessionByToken = async (sessionTokenHash: string) => {
    return await prisma.sso_sessions.updateMany({
        where: {
            session_token_hash: sessionTokenHash,
        },
        data: {
            status: "REVOKED"
        }
    });
}

export const revokeAllSessionsByUserId = async (userId: string) => {
    return await prisma.sso_sessions.updateMany({
        where: {
            user_id: userId,
        },
        data: {
            status: "REVOKED"
        }
    });
}