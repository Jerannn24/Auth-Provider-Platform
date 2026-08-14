import { prisma } from "@/lib/db";

export const createLocalSession = async function (session_token_hash: string, user_id: string, session_id: string, application_id: string) {
    return await prisma.local_sessions.create({
        data:{
            session_token_hash: session_token_hash,
            external_user_id: user_id,
            central_session_id: session_id,
            application_id: application_id,
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000)
        }
    })
}