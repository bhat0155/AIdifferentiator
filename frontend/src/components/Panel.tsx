'use client';

import React from 'react';

/**
 * Panel — card wrapper for each model column.
 * Change: add robust word-wrapping so very long tokens never overflow.
 */
export default function Panel({
  title,
  right,
  children,
}: {
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border bg-white p-4 shadow-sm">
      <header className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-800">{title}</h2>
        {right}
      </header>
      <div className="min-h-[140px] text-sm text-gray-900 whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
        {children}
      </div>
    </section>
  );
}