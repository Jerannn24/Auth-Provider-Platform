import { prisma, ActivityStatus } from "@/lib/db";

export const createActivityLog = async function (correlation_id: string, state:string, statusInput: string, metadata?: any) {
    try{
        const status = statusInput === "SUCCESS" ? ActivityStatus.SUCCESS : ActivityStatus.FAILURE;
        const log = await prisma.activity_logs.create({
            data: {
                correlation_id: correlation_id,
                state: state,
                status: status,
                metadata: metadata
            }
        });
        return log;
    } catch (error) {
        return null;
    }
}


export const getActivityLogsByCorrelationId = async function (correlation_id: string) {
    try {
        return await prisma.activity_logs.findMany({
            where: {
                correlation_id: correlation_id
            },
            orderBy: {
                performed_at: 'desc'
            }
        });
    } catch (error) {
        return null;
    }
}

export const getActivityLogsPerPage = async function (correlation_id: string, page: number, pageSize: number) {
    try {
        const logs = await prisma.activity_logs.findMany({
            where: {
                correlation_id: correlation_id
            },
            orderBy: {
                performed_at: 'desc'
            },
            skip: (page - 1) * pageSize,
            take: pageSize
        });
        return logs;
    } catch (error) {
        return null;
    }   
}