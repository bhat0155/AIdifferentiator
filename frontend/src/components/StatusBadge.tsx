"use client"

export default function StatusBadge({status}: {status: "idle" | "streaming" | "complete" | "error"}){
    const styles: Record<typeof status, string> ={
         idle: 'bg-gray-100 text-gray-700 border-gray-200',
    streaming: 'bg-blue-100 text-blue-700 border-blue-200',
    complete: 'bg-green-100 text-green-700 border-green-200',
    error: 'bg-red-100 text-red-700 border-red-200',
    } as const;

    return(
       <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${styles[status]}`}
      aria-label={`status: ${status}`}
      role="status"
    >
      {status}
    </span>
    )
}