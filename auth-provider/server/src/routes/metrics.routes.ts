import { Router } from "express";
import { getFormattedMetrics } from "../services/metrics.service";

const router = Router();

router.get('/metrics', async (req, res) => {
    try {
        const metrics = await getFormattedMetrics();
        res.json(metrics);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch metrics' });
    }
})

export default router;