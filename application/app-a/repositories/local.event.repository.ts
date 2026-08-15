import { prisma } from "@/lib/db";

export const getAllLocalEvent = async function () {
    try {
        return await prisma.processed_events.findMany({
            orderBy: {
                processed_at: 'desc'
            }
        });
    } catch (error) {
        return null;
    }
}
