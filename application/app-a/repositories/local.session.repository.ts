import { prisma, SSOStatus } from "@/lib/db";
import { cookies } from "next/headers";
import crypto from "crypto";

export const createLocalSession = async function (session_token_hash: string, user_id: string, session_id: string) {
    try{
        const session = await prisma.local_sessions.create({
            data:{
                session_token_hash: session_token_hash,
                external_user_id: user_id,
                central_session_id: session_id,
                expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000)
            }
        })
        return session;
    } catch (error) {
        return null;
    }
}

export const getLocalSession = async function (session_token_hash: string) {
    try {
        return await prisma.local_sessions.findFirst({
            where: {
                session_token_hash: session_token_hash,
                status: SSOStatus.ACTIVE
            }
        });
    } catch (error) {
        return null;
    }
}

export const revokedLocalSession = async function (session_token_hash: string, reason: string) {
    try {
        return await prisma.local_sessions.updateMany({
            where: {
                session_token_hash: session_token_hash

            },
            data: {
                status: SSOStatus.REVOKED,
                revoked_at: new Date(),
                revoke_reason: reason
            }
        });
    } catch (error) {
        return null;
    }
}
export const expiredLocalSession = async function (session_token_hash: string) {
    try {
        return await prisma.local_sessions.updateMany({
            where: {
                session_token_hash: session_token_hash
            },
            data: {
                status: SSOStatus.EXPIRED
            }
        });
    } catch (error) {
        return null;
    }
}


export const getSession = async function () {
    const cookiesStore = await cookies();
    const sessionToken = cookiesStore.get("session_token")?.value;

    if (!sessionToken) {
        return null;
    }

    const sessionTokenHash = crypto.createHash('sha256').update(sessionToken).digest('hex');
    const session = await getLocalSession(sessionTokenHash);

    if (!session) {
        return null;
    }

    if (session.expires_at < new Date()) {
        await expiredLocalSession(sessionTokenHash);
        return null;
    }
    
    return session;
}