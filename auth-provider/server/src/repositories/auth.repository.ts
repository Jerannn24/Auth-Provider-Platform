import { prisma, Effect } from "../../../db";
import bcrypt from "bcrypt";

export const findUserByEmail = async (email: string) => {
    return await prisma.users.findUnique({
        where: { email: email },
    });
};

export const findUserById = async (id: string) => {
    return await prisma.users.findUnique({
        where: { id: id },
    });
}

export const verifyPassword = async (password: string, password_hash: string) => {
    return await bcrypt.compare(password, password_hash);
};

export const isActiveUser = async (userId: string) => {
    const user = await prisma.users.findUnique({
        where: { id: userId },
        select: { status: true }
    });
    return user?.status === "ACTIVE";
}

export const isUserHasAccessToApplication = async (userId: string, applicationId: string) => {
    const userGroups = await prisma.user_groups.findMany({
        where: { user_id: userId },
        select: { group_id: true }
    });

    const applicationGroups = await prisma.application_group_policies.findMany({
        where: { application_id: applicationId, group_id: { in: userGroups.map(ug => ug.group_id) } },
        select: { effect: true }
    });

    return applicationGroups.some(ag => ag.effect === Effect.ALLOW);
}

