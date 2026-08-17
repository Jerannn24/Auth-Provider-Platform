import { prisma } from "../../../db";

export const getAllApplicationLogoutNotification = async function () {
    return await prisma.applications.findMany({
        where: {
            logout_notification_url: {
                not: null
            }
        }
    });
};

export const getApplicationLogoutNotificationById = async function (application_id: string) {
    return await prisma.applications.findUnique({
        where: {
            id: application_id
        },
        select: {
            logout_notification_url: true
        }
    });
}