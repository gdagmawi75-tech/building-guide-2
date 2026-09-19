import React from 'react';

export default function OfficeCard({ office, onClick }) {
  return (
    <div
      onClick={onClick}
      className="bg-white hover:border-slate-400 border border-slate-200 rounded-xl p-5 cursor-pointer transition shadow-sm flex flex-col justify-between"
    >
      <div>
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="text-lg font-semibold text-slate-800">
            {office.name_en || office.name || `Office ${office.office_number || ''}`}
          </h3>
          <span className="text-xs font-medium px-2 py-1 bg-slate-100 text-slate-600 rounded-md">
            Suite {office.suite_number || office.office_number || 'N/A'}
          </span>
        </div>
        <p className="text-sm text-slate-500 line-clamp-2">
          {office.description_en || office.description || 'No description provided for this office.'}
        </p>
      </div>
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
        <span className="font-medium text-indigo-600">
          {office.departments?.name || office.category || 'Office'}
        </span>
        <span className="font-medium text-slate-900 hover:underline">View Details →</span>
      </div>
    </div>
  );
}