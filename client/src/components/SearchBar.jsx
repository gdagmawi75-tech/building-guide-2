import React from 'react';
import { useLanguage } from '../context/LanguageContext.jsx';

export default function SearchBar({
  value = '',
  onChange = () => {},
}) {
  const { t } = useLanguage();

  return (
    <div className="max-w-xl mx-auto mb-6">
      <div className="relative">
        <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
          🔍
        </span>

        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={t.searchPlaceholder}
          className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition"
        />
      </div>
    </div>
  );
}