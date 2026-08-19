import http from "http";
import { prisma } from "../../db";

const PORT = 9090;

export function startWorkerHealthServer() {
  const server = http.createServer(async (req, res) => {
    if (req.url === "/health/live" && req.method === "GET") {
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ status: "ok", service: "sync-worker" }));
    }

    if (req.url === "/health/ready" && req.method === "GET") {
      try {
        // Cek apakah worker bisa membaca tabel event_deliveries[cite: 1]
        await prisma.event_deliveries.findFirst({ select: { id: true } });

        res.writeHead(200, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({
          status: "ready",
          service: "sync-worker",
          checks: { queueDatabase: "up" },
        }));
      } catch {
        res.writeHead(503, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({
          status: "not_ready",
          service: "sync-worker",
          checks: { queueDatabase: "down" },
        }));
      }
    }

    res.writeHead(404);
    res.end();
  });

  server.listen(PORT, () => {
    console.log(`[Sync Worker Health] Running on port ${PORT}`);
  });
}