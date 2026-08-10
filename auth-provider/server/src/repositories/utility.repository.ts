import { prisma, Result } from '../../../db'
import { Prisma } from '@prisma/client'

export const getUserInfo = async (userId: string) => {
    return await prisma.users.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true, status: true, created_at: true }
    });
}

export const createAuditLogs = 
    async (event_type: string,
        result: Result,
        actor_id?: string,
        user_id?: string,
        application_id?: string,
        session_id?: string,
        metadata?: Prisma.NullableJsonNullValueInput,
        ip_address?: string) => {
            
        return await prisma.audit_logs.create({
            data: {
                    event_type,
                    actor_id,
                    user_id,
                    application_id,
                    session_id,
                    result,
                    metadata,
                    ip_address
            },
            select: {
                id: true,
                event_type: true,
                actor_id: true,
                user_id: true,  
                application_id: true,
                session_id: true,
                result: true,
                metadata: true,
                ip_address: true,
                created_at: true
            }
        });
    }

export const updateUserPasswordHash = async (userId: string, newPasswordHash: string) => {
    return await prisma.users.update({
        where: { id: userId },
        data: { password_hash: newPasswordHash },
        select: { id: true, name: true, email: true, status: true, created_at: true }
    });
}
