import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface SystemMetrics {
  latencyMs: number;
  errorRatePercent: number;
  totalRequests: number;
  errorRequests: number;
  queueDepth: number;
  dlqCount: number;
  timeStamp: string;
}

interface ChartMetricPoint extends SystemMetrics {
  formattedTime: string;
}

export default function ObservabilityDashboard() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [history, setHistory] = useState<ChartMetricPoint[]>([]);

  const fetchMetrics = async () => {
    try {
      const res = await fetch("http://localhost:8080/metrics", {
        credentials: "include",
      });
      if (res.ok) {
        const data: SystemMetrics = await res.json();
        setMetrics(data);

        const newPoint: ChartMetricPoint = {
          ...data,
          formattedTime: new Date(data.timeStamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          }),
        };

        setHistory((prev) => [...prev.slice(-19), newPoint]);
      }
    } catch (err) {
      console.error("Gagal melakukan polling metrics:", err);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!metrics) {
    return <div className="p-8 text-gray-500">Memuat dashboard observabilitas...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">System Metrics Dashboard</h1>
          <span className="text-xs font-mono bg-green-100 text-green-700 px-3 py-1 rounded-full border border-green-300">
            ● Live Sync ({new Date(metrics.timeStamp).toLocaleTimeString()})
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h3 className="text-xs font-semibold text-gray-400 uppercase">Avg Latency</h3>
            <p className="text-3xl font-bold text-blue-600 mt-2">
              {metrics.latencyMs} <span className="text-sm font-normal text-gray-500">ms</span>
            </p>
            <p className="text-xs text-gray-400 mt-1">{metrics.totalRequests} total requests</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h3 className="text-xs font-semibold text-gray-400 uppercase">Error Rate</h3>
            <p className={`text-3xl font-bold mt-2 ${metrics.errorRatePercent > 0 ? "text-red-600" : "text-green-600"}`}>
              {metrics.errorRatePercent}%
            </p>
            <p className="text-xs text-gray-400 mt-1">{metrics.errorRequests} failed requests</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h3 className="text-xs font-semibold text-gray-400 uppercase">Queue Depth</h3>
            <p className={`text-3xl font-bold mt-2 ${metrics.queueDepth > 0 ? "text-amber-600" : "text-indigo-600"}`}>
              {metrics.queueDepth} <span className="text-sm font-normal text-gray-500">jobs</span>
            </p>
            <p className="text-xs text-gray-400 mt-1">Pending background jobs</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h3 className="text-xs font-semibold text-gray-400 uppercase">DLQ Jobs</h3>
            <p className={`text-3xl font-bold mt-2 ${metrics.dlqCount > 0 ? "text-red-600" : "text-gray-700"}`}>
              {metrics.dlqCount}
            </p>
            <p className="text-xs text-gray-400 mt-1">Permanent failures</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Latency & Queue Depth Trend (Real-time)</h2>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="formattedTime" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="latencyMs"
                    name="Latency (ms)"
                    stroke="#2563eb"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="queueDepth"
                    name="Queue Depth"
                    stroke="#d97706"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Request & Error Distribution</h2>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history} barCategoryGap={history.length > 10 ? 2 : 10}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="formattedTime" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="totalRequests"
                    name="Total Requests"
                    stroke="#93c5fd"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="errorRequests"
                    name="Failed Requests"
                    stroke="#ef4444"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}