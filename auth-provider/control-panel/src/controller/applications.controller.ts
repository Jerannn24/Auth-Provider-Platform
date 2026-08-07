import { prisma, Effect } from "../../../db/";

// Mendapatkan semua aplikasi
export const getAllApplications = async () => {
    return await prisma.applications.findMany({
        select: { id: true, name: true, description: true, createdAt: true }
    });
}

// Membuat aplikasi baru
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

// Menambahkan group ke aplikasi
export const addGroupsToApplication = async (applicationId: string, groupId: string, effect: Effect) => {
    return await prisma.application_group_policies.createMany({
        data:{
            application_id: applicationId,
            group_id: groupId,
            effect
        }
    });
} 

// Menghapus group dari aplikasi
export const deleteGroupsFromApplication = async (applicationId: string, groupId: string) => {
    return await prisma.application_group_policies.deleteMany({
        where: {
            application_id: applicationId,
            group_id: groupId
        }
    });
}

// Memperbarui effect group dalam aplikasi
export const updateGroupsInApplication = async (applicationId: string, groupId: string, effect: Effect) => {
    return await prisma.application_group_policies.updateMany({
        where: {
            application_id: applicationId,
            group_id: groupId
        },
        data: {
            effect
        }
    });
}

// Mendapatkan semua policy dalam aplikasi
export const getPoliciesByApplicationId = async (applicationId: string) => {
    return await prisma.application_group_policies.findMany({
        where: { application_id: applicationId },
        select: { group: {
            select: { name: true}
        }, effect: true }
    });
}