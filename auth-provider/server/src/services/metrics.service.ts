import { Request, Response, NextFunction} from 'express';
import { prisma } from '../../../db';
import client from 'prom-client'

export const register = new client.Registry();

const httpRequestCounter = new client.Counter({
    name: 'http_request_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code'],
});

const httpRequestDurationHistogram = new client.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.05, 0.1, 0.25, 0.5, 1, 2.5],
});

const queueDepthGauge = new client.Gauge({
    name: 'queue_depth',
    help: 'Current depth of the queue',
});

const dlqDepthGauge = new client.Gauge({
    name: 'dlq_depth',
    help: 'Current depth of the dead letter queue',
});

register.registerMetric(httpRequestCounter);
register.registerMetric(httpRequestDurationHistogram);
register.registerMetric(queueDepthGauge);
register.registerMetric(dlqDepthGauge);

export function metricsMiddleware(req: Request, res: Response, next: NextFunction) {
    const end = httpRequestDurationHistogram.startTimer();

    res.on('finish', () => {
        httpRequestCounter.inc({
            method: req.method,
            route: req.route ? req.route.path : req.path,
            status_code: res.statusCode.toString(),
        });

        end({
            method: req.method,
            route: req.route ? req.route.path : req.path,
            status_code: res.statusCode.toString(),
        });
    });

    next();
}

export async function getQueueMetricsFromDB(){
    const [waitingJobs, activeJobs, failedJobs] = await Promise.all([
        prisma.events.count({ where: { status: 'PENDING' } }),
        prisma.event_deliveries.count({ where: { status: 'RETRYING' } }),
        prisma.event_deliveries.count({ where: { status: 'FAILED' } }),
    ]);

    return [
        waitingJobs,
        activeJobs,
        failedJobs,
    ] as const;
}

export async function getFormattedMetrics() {
    const [waitingJobs, activeJobs, failedJobs] = await getQueueMetricsFromDB();

    queueDepthGauge.set(waitingJobs + activeJobs);
    dlqDepthGauge.set(failedJobs);

    const metricsJson = await register.getMetricsAsJSON();

    const reqMetrics = metricsJson.find(metric => metric.name === 'http_request_total');
    const durationMetrics = metricsJson.find(metric => metric.name === 'http_request_duration_seconds');

    let totalRequests = 0;
    let errorRequests = 0;

    if (reqMetrics && Array.isArray(reqMetrics.values)) {
        reqMetrics.values.forEach(metric => {
            totalRequests += metric.value;
            if (metric.labels.status_code >= "400") {
                errorRequests += metric.value;
            }
        });
    }

    let avgLatencyMs = 0;
    if (durationMetrics) {
        const sumVal = durationMetrics.values.find((v:any) => v.metricName?.endsWith('_sum'))?.value || 0;
        const countVal = durationMetrics.values.find((v:any) => v.metricName?.endsWith('_count'))?.value || 0;
        avgLatencyMs = countVal > 0 ? Math.round((sumVal / countVal) * 1000) : 0;
    }

    return {
        latencyMs: avgLatencyMs,
        errorRatePercent: totalRequests > 0 ? Number((errorRequests / totalRequests) * 100).toFixed(2) : 0,
        totalRequests,
        errorRequests,
        queueDepth: waitingJobs,
        dlqCount: failedJobs,
        timeStamp: new Date(Date.now()).toISOString(),
    };
}