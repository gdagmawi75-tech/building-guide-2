import React from 'react';

export default function EmptyState({ message = 'No results found.' }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center max-w-md mx-auto my-6 shadow-sm">
      <p className="text-sm text-slate-500">{message}</p>
    </div>
  );
}