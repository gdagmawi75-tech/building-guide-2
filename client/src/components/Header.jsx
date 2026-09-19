import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext.jsx';

export default function Header() {
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLanguage();

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm">

      {/* Logo */}
      <div
        className="flex items-center gap-2 cursor-pointer"
        onClick={() => navigate('/')}
      >
        <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-sm">
          BG
        </div>

        <span className="font-semibold text-slate-800 text-lg tracking-tight">
          {t.buildingGuide}
        </span>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2.5 text-xs font-medium text-slate-500">

        {/* Feedback Link */}
        <button
          onClick={() => navigate('/feedback')}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200/70 text-amber-900 text-xs sm:text-sm font-semibold transition cursor-pointer shadow-2xs"
          title={t.giveFeedback || 'Feedback'}
        >
          <span className="text-amber-500">⭐</span>
          <span>{t.feedback || 'Feedback'}</span>
        </button>

        {/* Language Selector */}
        <div className="relative">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="
              appearance-none
              bg-white
              border border-slate-200
              text-slate-700
              text-sm
              font-medium
              rounded-xl
              pl-3
              pr-9
              py-2
              shadow-sm
              cursor-pointer
              transition
              hover:border-slate-300
              focus:outline-none
              focus:ring-2
              focus:ring-slate-900/10
              focus:border-slate-300
            "
            aria-label="Select language"
          >
            <option value="en">🌐 English</option>
            <option value="am">🌐 አማርኛ</option>
            <option value="om">🌐 Afaan Oromoo</option>
          </select>

          <span
            className="
              pointer-events-none
              absolute
              right-3
              top-1/2
              -translate-y-1/2
              text-slate-400
              text-[9px]
            "
          >
            ▼
          </span>
        </div>

        {/* Secure Visitor Portal */}
        <span className="hidden md:flex px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200 items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          {t.secureVisitorPortal}
        </span>

      </div>
    </header>
  );
}