import { prisma } from "../../../db/";


export const getAllApplications = async () => {
    return await prisma.applications.findMany({
        select: { id: true, name: true, description: true, createdAt: true }
    });
}

export const createApplication = async (name: string, client_id: 
    string, redirect_uris: 
    string[], 
    launch_url?: string, 
    logout_notification_url?: string) => {
    return await prisma.applications.create({
        data: { name, 
            client_id, 
            application_redirect_uris: 
                { create: redirect_uris.map(uri => ({ redirect_uri: uri })) }, 
            launch_url, 
            logout_notification_url },
        select: { id: true, name: true, client_id: true, launch_url: true, created_at: true }
    });
}