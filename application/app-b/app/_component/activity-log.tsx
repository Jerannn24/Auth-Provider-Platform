'use client'

import { useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

interface ActivityLog {
    id: string;
    correlation_id: string | null;
    state: string;
    status: string;
    metadata: any;
    performed_at: Date;
}

function ActivityLogItems({logs}: {logs: ActivityLog[]}) {
    const [page, setPage] = useState(1);

    const totalPages = Math.ceil(logs.length / 1);

    const startIndex = (page - 1) * 1;
    const currentLogs = logs.slice(
        startIndex,
        startIndex + 1
    );

  return (
    <div className='flex flex-col items-center justify-center p-6'>
        <h1 className="flex items-center justify-center text-2xl font-bold mb-4 pb-4 border-b-2 border-gray-300">
            Activity Logs
        </h1>
        {
            currentLogs.length > 0 ? (
                currentLogs.map((log) => (
                    <div key={log.id} className="flex flex-col items-center justify-center text-lg mb-4 pb-4 border-b-2 border-gray-300">
                        <p>Correlation ID: {log.correlation_id}</p>
                        <p>State: {log.state}</p>
                        <p>Status: {log.status}</p>
                        <p>Metadata: {JSON.stringify(log.metadata)}</p>
                        <p>Performed At: {new Date(log.performed_at).toLocaleString()}</p>
                    </div>
                )
            )) : (
                <p>No activity logs found.</p>
            )
        }
        <div className="flex items-center justify-center gap-4 mt-4">
            <button
                type="button"
                disabled={page === 1}
                onClick={() => setPage((prev) => prev - 1)}
                className="disabled:opacity-30 disabled:cursor-not-allowed"
            >
                <ArrowLeft size={24} />
            </button>

            <span>
                {page} / {totalPages}
            </span>

            <button
                type="button"
                disabled={page === totalPages}
                onClick={() => setPage((prev) => prev + 1)}
                className="disabled:opacity-30 disabled:cursor-not-allowed"
            >
                <ArrowRight size={24} />
            </button>
        </div>
    </div>
  )
}


export default ActivityLogItems