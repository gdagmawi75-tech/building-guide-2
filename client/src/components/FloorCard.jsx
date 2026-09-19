import React from 'react';

export default function FloorCard({ floor, onClick }) {
  return (
    <div
      onClick={onClick}
      className="bg-slate-50 hover:bg-slate-900 hover:text-white border border-slate-200 rounded-xl p-5 text-center cursor-pointer transition group shadow-sm flex flex-col justify-between"
    >
      <div>
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 group-hover:text-slate-400">
          Floor
        </span>
        <h3 className="text-2xl font-bold text-slate-800 group-hover:text-white mt-1">
          {floor.floor_number}
        </h3>
      </div>
      <p className="text-xs text-slate-500 group-hover:text-slate-300 mt-3">
        {floor.name || `Level ${floor.floor_number}`}
      </p>
    </div>
  );
}