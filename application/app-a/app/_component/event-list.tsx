'use client'

import { useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

interface EventList {
    event_id: string,
    event_type: string,
    processed_at: Date,
    result: string
}

function EventLists({event}: {event: EventList[]}) {
    const [page, setPage] = useState(1);

    const totalPages = Math.ceil(event.length / 1);

    const startIndex = (page - 1) * 1;
    const currentEvent = event.slice(
        startIndex,
        startIndex + 1
    );

  return (
    <div className='flex flex-col items-center justify-center p-6'>
        <h1 className="flex items-center justify-center text-2xl font-bold mb-4 pb-4 border-b-2 border-gray-300">
            Processed Events
        </h1>
        {
            currentEvent.length > 0 ? (
                currentEvent.map((event) => (
                    <div key={event.event_id} className="flex flex-col items-center justify-center text-lg mb-4 pb-4 border-b-2 border-gray-300">
                        <p>Event ID: {event.event_id}</p>
                        <p>Event Type: {event.event_type}</p>
                        <p>Processed At: {event.processed_at.toLocaleString()}</p>
                        <p>result: {event.result}</p>
                    </div>
                )
            )) : (
                <p>No Processed Event.</p>
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


export default EventLists