import { prisma } from "../../../db";

// Mendapatkan semua group
export const getAllGroups = async () => {
    return await prisma.groups.findMany({
        select: { id: true, name: true, description: true, created_at: true }
    })
}

export const createGroup = async (name: string, description?: string) => {
    return await prisma.groups.create({
        data: { name, description },
        select: { id: true, name: true, description: true, created_at: true }
    });
}

export const getGroupById = async (id: string) => {
    return await prisma.groups.findUnique({
        where: { id },
        select: { id: true, name: true, description: true, created_at: true }
    });
}

export const updateGroupById = async (id: string, name: string, description?: string) => {
    return await prisma.groups.update({
        where: { id },
        data: { name, description },
        select: { id: true, name: true, description: true, created_at: true }
    });
}

export const deleteGroupById = async (id: string) => {
    return await prisma.groups.delete({
        where: { id },
        select: { id: true, name: true, description: true, created_at: true }
    });
}

export const getUsersByGroupId = async (groupId: string) => {
    const users_id = await prisma.user_groups.findMany({
        where: { group_id: groupId },
        select: { user_id: true }
    });

    return await prisma.users.findMany({
        where: { id: { in: users_id.map(ug => ug.user_id) } },
        select: { id: true, name: true, email: true, status: true, created_at: true }
    });
}