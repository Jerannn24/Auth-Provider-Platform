import { prisma } from "@/lib/db";

export const createLocalUser = async function (id: string, name: string, email: string, groups: string[]) {
    try {
        const profile = await prisma.profil_cache.upsert({
            where: {
                external_user_id: id
            },
            update: {
                name: name,
                email: email,
                groups: groups
            },
            create: {
                external_user_id: id,
                name: name,
                email: email,
                groups: groups
            }
        });
        return profile;
    } catch (error) {
        return null;
    }
}

export const getLocalUser = async function (id: string) {
    try {
        return await prisma.profil_cache.findUnique({
            where: {
                external_user_id: id
            }
        });
    } catch (error) {
        return null;
    }
}