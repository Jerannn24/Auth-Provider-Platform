import Router from "express";
import { prisma } from "../../../db";

const router = Router();

router.get("/health/live", (req, res) => {
    res.status(200).json({ status: "ok" });
});

router.get("/health/ready", async (req, res) => {
    try {
        // Memastikan database dan queue service dapat diakses
        await prisma.$queryRaw`SELECT 1`;
        await prisma.events.findFirst({ select: { id: true } });

        
        res.status(200).json({
        status: "ready",
        checks: {
            database: "up",
            queue: "up",
        },
        });
    } catch (error) {
            res.status(503).json({
        status: "not_ready",
        checks: {
            database: "down",
            queue: "down",
        },
        });
    }
});

export default router;