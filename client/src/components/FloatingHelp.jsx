import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext.jsx';

export default function FloatingHelp() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen && (
        <div className="absolute bottom-16 right-0 bg-white border border-slate-200 rounded-3xl p-5 shadow-xl w-80 mb-2 animate-fade-in">
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <span>💬</span>
              <span>Visitor Assistance</span>
            </h4>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-600 text-sm p-1"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          <p className="text-xs text-slate-600 mb-3 leading-relaxed">
            Need help finding a room or service? Visit the main reception desk on the ground floor or contact security.
          </p>

          <div className="text-xs font-semibold text-slate-800 bg-slate-50 p-2.5 rounded-xl text-center border border-slate-100 mb-3">
            Reception Desk: ext. 1000
          </div>

          <button
            onClick={() => {
              setIsOpen(false);
              navigate('/feedback');
            }}
            className="w-full py-2.5 px-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow-xs"
          >
            <span>⭐</span>
            <span>{t.giveFeedback || 'Leave Visitor Feedback'}</span>
          </button>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-slate-900 hover:bg-slate-800 text-white w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition text-lg cursor-pointer"
        title="Help & Feedback"
        aria-label="Open assistance and feedback"
      >
        ?
      </button>
    </div>
  );
}