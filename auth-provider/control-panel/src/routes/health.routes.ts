import Router from "express";
import { prisma } from "../../../db";

const router = Router();

router.get("/health/live", (req, res) => {
    res.status(200).json({ status: "ok" });
});

router.get("/health/ready", async (req, res) => {
    try {
        await prisma.$queryRaw`SELECT 1`;

        res.status(200).json({
        status: "ready",
        checks: {
            database: "up",
        },
        });
    } catch (error) {
            res.status(503).json({
        status: "not_ready",
        checks: {
            database: "down",
        },
        });
    }
});

export default router;