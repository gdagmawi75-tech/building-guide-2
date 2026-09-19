import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Header from '../components/Header';
import FloatingHelp from '../components/FloatingHelp';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import { getOfficeById } from '../api/api';
import { useLanguage } from '../context/LanguageContext.jsx';

function VisitorOfficePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language, t } = useLanguage();

  const [office, setOffice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadOffice() {
      try {
        setLoading(true);
        setError('');

        const officeData = await getOfficeById(id);

        if (!isMounted) return;

        if (officeData) {
          setOffice(officeData);
        } else {
          setError('Office not found.');
        }
      } catch (err) {
        console.error('Failed to load visitor office:', err);
        if (isMounted) {
          setError(err?.response?.data?.error || err.message || 'Failed to load office details.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadOffice();

    return () => {
      isMounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center p-6">
          <LoadingState message="Loading office details..." />
        </div>
      </div>
    );
  }

  if (error || !office) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <ErrorState message={error || 'Office not found.'} />
          <button
            onClick={() => navigate(-1)}
            className="mt-6 px-5 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition font-medium"
          >
            ← {t.backToHome || 'Go Back'}
          </button>
        </div>
        <FloatingHelp />
      </div>
    );
  }

  const title =
    (language === 'am' && office.name_am) ||
    (language === 'om' && office.name_om) ||
    office.name_en ||
    office.office_number ||
    t.office;

  const description =
    (language === 'am' && office.description_am) ||
    (language === 'om' && office.description_om) ||
    office.description_en ||
    '';

  const department = office.departments;
  const openingHours = Array.isArray(office.opening_hours) ? office.opening_hours : [];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8">
        <button
          onClick={() => navigate(-1)}
          className="text-sm font-medium text-slate-600 hover:text-slate-900 mb-6 inline-flex items-center gap-1.5 transition"
        >
          ← {t.backToHome || 'Back'}
        </button>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-8 sm:px-8 bg-gradient-to-br from-white to-slate-50">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <span className="inline-block px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-semibold uppercase tracking-wider mb-2">
                  {t.office} Room
                </span>

                <h1 className="text-3xl font-bold text-slate-900">
                  {title}
                </h1>

                {office.office_number && (
                  <p className="mt-2 text-sm text-slate-500 font-medium">
                    Room / Suite Number: <span className="text-slate-900 font-semibold">{office.office_number}</span>
                  </p>
                )}
              </div>

              <span
                className={
                  office.status === 'open'
                    ? 'rounded-full bg-green-100 px-3 py-1.5 text-xs font-semibold text-green-700 self-start'
                    : 'rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 self-start'
                }
              >
                {office.status ? office.status.toUpperCase() : 'AVAILABLE'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8 p-6 sm:p-8 lg:grid-cols-2">
            <div>
              <h2 className="text-base font-bold text-slate-900 uppercase tracking-wide text-xs text-slate-400 mb-2">
                About this Room
              </h2>

              <p className="text-sm leading-relaxed text-slate-600">
                {description || 'No additional information is available.'}
              </p>

              {department && (
                <div className="mt-6 rounded-2xl bg-slate-50 p-4 border border-slate-100">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Associated {t.department}
                  </p>

                  <Link
                    to={`/department/${department.id}`}
                    className="mt-1 font-semibold text-indigo-600 hover:text-indigo-800 hover:underline block text-base transition"
                  >
                    {(language === 'am' && department.name_am) ||
                      (language === 'om' && department.name_om) ||
                      department.name_en ||
                      'Department Details'} →
                  </Link>
                </div>
              )}
            </div>

            <div>
              <h2 className="text-base font-bold text-slate-900 uppercase tracking-wide text-xs text-slate-400 mb-2">
                Contact Information
              </h2>

              <div className="space-y-3">
                {office.phone ? (
                  <a
                    href={`tel:${office.phone}`}
                    className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 hover:bg-slate-50 transition"
                  >
                    <span className="text-lg">📞</span>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Phone
                      </p>
                      <p className="text-sm font-semibold text-slate-900">
                        {office.phone}
                      </p>
                    </div>
                  </a>
                ) : null}

                {office.email ? (
                  <a
                    href={`mailto:${office.email}`}
                    className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 hover:bg-slate-50 transition"
                  >
                    <span className="text-lg">✉️</span>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Email
                      </p>
                      <p className="break-all text-sm font-semibold text-slate-900">
                        {office.email}
                      </p>
                    </div>
                  </a>
                ) : null}

                {!office.phone && !office.email && (
                  <p className="text-sm text-slate-400 italic">
                    No direct contact details registered for this room.
                  </p>
                )}
              </div>
            </div>
          </div>

          {openingHours.length > 0 && (
            <div className="border-t border-slate-200 px-6 py-6 sm:px-8">
              <h2 className="text-base font-bold text-slate-900 mb-3">
                Operating Hours
              </h2>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {openingHours.map((item, index) => (
                  <div
                    key={item.id || index}
                    className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 border border-slate-100"
                  >
                    <span className="text-sm font-medium text-slate-700">
                      Day {item.day_of_week}
                    </span>

                    <span className="text-sm text-slate-600 font-medium">
                      {item.is_closed
                        ? 'Closed'
                        : `${item.opening_time || ''} – ${item.closing_time || ''}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Feedback Bar for this Office */}
          <div className="border-t border-slate-200 bg-slate-50 px-6 py-5 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-center sm:text-left">
              <p className="text-sm font-semibold text-slate-800">
                Visited this office?
              </p>
              <p className="text-xs text-slate-500">
                Share your feedback or report an issue with this room.
              </p>
            </div>
            <Link
              to={`/feedback?office_id=${office.id}`}
              className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition whitespace-nowrap"
            >
              ⭐ {t.giveFeedback || 'Leave Feedback'}
            </Link>
          </div>
        </div>
      </main>

      <FloatingHelp />
    </div>
  );
}

export default VisitorOfficePage;
