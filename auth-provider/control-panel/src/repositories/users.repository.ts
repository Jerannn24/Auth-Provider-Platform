import { prisma, Status } from "../../../db";

// Mendapatkan semua user
export const getAllUsers = async () => {
    return await prisma.users.findMany({
        select: { id: true, name: true, email: true, status: true, created_at: true }
    });
}

// Membuat user baru
export const createUser = async (name: string, email: string, password_hash: string) => {
    return await prisma.users.create({
        data: { name, email, password_hash },
        select: { id: true, name: true, email: true, status: true, created_at: true }
    });;
};

// Mendapatkan user berdasarkan ID
export const getUserById = async (id: string) => {
    return await prisma.users.findUnique({
        where: { id },
        select: { id: true, name: true, email: true, status: true, created_at: true }
    });
}

// Mengupdate data user berdasarkan ID
export const updateUserById = async (id: string, name: string, email: string) => {
    return await prisma.users.update({
        where: { id },
        data: { name, email },
        select: { id: true, name: true, email: true, status: true, created_at: true }
    });
}

// Menghapus user berdasarkan ID
export const deleteUserById = async (id: string) => {
    return await prisma.users.delete({
        where: { id },
        select: { id: true, name: true, email: true, status: true, created_at: true }
    });
}

// Mengupdate status user
export const updateUserStatusById = async (id: string, status: boolean) => {
    const active = status ? Status.ACTIVE : Status.INACTIVE;

    return await prisma.users.update({
        where: { id },
        data: { status: active },
        select: { id: true, name: true, email: true, status: true, created_at: true }
    });
}

// Mendapatkan status user
export const getUserStatusById = async (id: string) => {
    const user = await prisma.users.findUnique({
        where: { id },
        select: { status: true }
    });

    return user?.status;
}