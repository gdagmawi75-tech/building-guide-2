import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getDepartmentById } from '../api/api';
import Header from '../components/Header';
import FloatingHelp from '../components/FloatingHelp';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import { useLanguage } from '../context/LanguageContext.jsx';

export default function DepartmentPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language, t } = useLanguage();

  const [department, setDepartment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchDepartment() {
      try {
        setLoading(true);
        setError(null);

        const res = await getDepartmentById(id);

        if (!isMounted) return;

        if (res && res.success && res.data) {
          setDepartment(res.data);
        } else {
          setError(res?.error || 'Department not found.');
        }
      } catch (err) {
        console.error('Failed to load department:', err);

        if (isMounted) {
          setError('Failed to load department details.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchDepartment();

    return () => {
      isMounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center p-6">
          <LoadingState message="Loading department details..." />
        </div>
      </div>
    );
  }

  if (error || !department) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <ErrorState message={error || 'Department not found.'} />
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

  // Localized getters
  const getName = () => {
    if (language === 'am' && department.name_am) return department.name_am;
    if (language === 'om' && department.name_om) return department.name_om;
    return department.name_en || t.department;
  };

  const getDescription = () => {
    if (language === 'am' && department.description_am) return department.description_am;
    if (language === 'om' && department.description_om) return department.description_om;
    return department.description_en || '';
  };

  const getBuildingName = () => {
    if (!department.building) return null;
    if (language === 'am' && department.building.name_am) return department.building.name_am;
    if (language === 'om' && department.building.name_om) return department.building.name_om;
    return department.building.name_en || 'Main Building';
  };

  const offices = Array.isArray(department.offices) ? department.offices : [];
  const services = Array.isArray(department.services) ? department.services : [];
  const employees = Array.isArray(department.employees) ? department.employees : [];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="text-sm font-medium text-slate-600 hover:text-slate-900 mb-6 inline-flex items-center gap-1.5 transition"
        >
          ← {t.backToHome || 'Back'}
        </button>

        {/* Department Hero Card */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-2xl text-indigo-600 shrink-0">
                🏛️
              </div>
              <div>
                <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
                  {t.department}
                </span>
                <h1 className="text-3xl font-bold text-slate-900 mt-1">
                  {getName()}
                </h1>
                {getBuildingName() && (
                  <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5">
                    <span>🏢</span>
                    <span>{getBuildingName()}</span>
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 self-start">
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                Active Department
              </span>
            </div>
          </div>

          {/* Description */}
          {getDescription() && (
            <div className="mt-6 pt-6 border-t border-slate-100">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                About this Department
              </h2>
              <p className="text-slate-600 leading-relaxed text-sm sm:text-base">
                {getDescription()}
              </p>
            </div>
          )}

          {/* Contact Details */}
          {(department.phone || department.email) && (
            <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {department.phone && (
                <a
                  href={`tel:${department.phone}`}
                  className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition text-slate-700"
                >
                  <span className="text-lg">📞</span>
                  <div>
                    <span className="block text-[11px] font-semibold text-slate-400 uppercase">
                      Phone
                    </span>
                    <span className="text-sm font-medium text-slate-900">
                      {department.phone}
                    </span>
                  </div>
                </a>
              )}

              {department.email && (
                <a
                  href={`mailto:${department.email}`}
                  className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition text-slate-700"
                >
                  <span className="text-lg">✉️</span>
                  <div>
                    <span className="block text-[11px] font-semibold text-slate-400 uppercase">
                      Email
                    </span>
                    <span className="text-sm font-medium text-slate-900 break-all">
                      {department.email}
                    </span>
                  </div>
                </a>
              )}
            </div>
          )}
        </div>

        {/* Offices / Rooms Grid */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <span>🚪</span>
              <span>{t.office}s & Rooms ({offices.length})</span>
            </h2>
          </div>

          {offices.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center text-slate-500 text-sm">
              No offices or rooms currently listed under this department.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {offices.map((office) => {
                const officeTitle =
                  (language === 'am' && office.name_am) ||
                  (language === 'om' && office.name_om) ||
                  office.name_en ||
                  `Office ${office.office_number || ''}`;

                return (
                  <Link
                    key={office.id}
                    to={`/office/${office.id}`}
                    className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-md transition flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-semibold text-slate-900 group-hover:text-indigo-600 transition">
                          {officeTitle}
                        </h3>
                        {office.office_number && (
                          <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-600">
                            #{office.office_number}
                          </span>
                        )}
                      </div>
                      {(office.description_en || office.description_am) && (
                        <p className="text-xs text-slate-500 line-clamp-2">
                          {(language === 'am' && office.description_am) ||
                            office.description_en}
                        </p>
                      )}
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                      <span className="capitalize">{office.status || 'Available'}</span>
                      <span className="font-medium text-indigo-600 group-hover:translate-x-0.5 transition-transform">
                        View Room →
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* Services Grid */}
        {services.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <span>📋</span>
              <span>Offered {t.service}s ({services.length})</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {services.map((service) => {
                const serviceTitle =
                  (language === 'am' && service.name_am) ||
                  (language === 'om' && service.name_om) ||
                  service.name_en;

                const serviceDesc =
                  (language === 'am' && service.description_am) ||
                  (language === 'om' && service.description_om) ||
                  service.description_en;

                return (
                  <Link
                    key={service.id}
                    to={`/service/${service.id}`}
                    className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-md transition group"
                  >
                    <h3 className="font-semibold text-slate-900 group-hover:text-indigo-600 transition mb-1">
                      {serviceTitle}
                    </h3>
                    {serviceDesc && (
                      <p className="text-xs text-slate-500 line-clamp-2 mb-3">
                        {serviceDesc}
                      </p>
                    )}
                    <span className="text-xs font-medium text-indigo-600">
                      View Service Details →
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Employees Grid */}
        {employees.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <span>👥</span>
              <span>{t.employee}s ({employees.length})</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {employees.map((emp) => {
                const empName = `${emp.first_name_en || ''} ${emp.last_name_en || ''}`.trim();
                const empTitle = emp.job_title_en || 'Staff Member';

                return (
                  <Link
                    key={emp.id}
                    to={`/employee/${emp.id}`}
                    className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-md transition flex items-center gap-3 group"
                  >
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-semibold text-slate-600 text-sm shrink-0">
                      {emp.first_name_en?.[0] || 'U'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium text-slate-900 text-sm truncate group-hover:text-indigo-600 transition">
                        {empName}
                      </h3>
                      <p className="text-xs text-slate-500 truncate">
                        {empTitle}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Feedback invitation footer on department page */}
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white flex flex-col sm:flex-row items-center justify-between gap-4 mt-12 shadow-sm">
          <div>
            <h3 className="text-lg font-bold">Have feedback about this department?</h3>
            <p className="text-slate-300 text-xs sm:text-sm mt-1">
              Help us enhance visitor services by sharing your experience.
            </p>
          </div>
          <button
            onClick={() => navigate('/feedback')}
            className="px-5 py-2.5 bg-white text-slate-900 font-semibold text-sm rounded-xl hover:bg-slate-100 transition whitespace-nowrap"
          >
            ⭐ {t.giveFeedback || 'Give Feedback'}
          </button>
        </div>
      </main>

      <FloatingHelp />
    </div>
  );
}