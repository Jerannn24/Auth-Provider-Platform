import { prisma } from "@/lib/db";

export const createLocalUser = async function (id: string, name: string, email: string, groups: string[]) {
    return await prisma.profil_cache.upsert({
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
}