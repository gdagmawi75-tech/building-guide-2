import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getServiceById } from '../api/api';
import Header from '../components/Header';
import FloatingHelp from '../components/FloatingHelp';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import { useLanguage } from '../context/LanguageContext.jsx';

export default function ServicePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();

  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchService() {
      try {
        setLoading(true);
        setError(null);

        const res = await getServiceById(id);

        if (isMounted) {
          if (res && res.success) {
            setService(res.data);
          } else {
            setError('Service not found.');
          }
        }
      } catch (err) {
        console.error('Failed to load service:', err);

        if (isMounted) {
          setError('Failed to load service details.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchService();

    return () => {
      isMounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <>
        <Header />
        <LoadingState />
      </>
    );
  }

  if (error || !service) {
    return (
      <>
        <Header />

        <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
          <div className="text-center">
            <ErrorState message={error || 'Service not found.'} />

            <button
              onClick={() => navigate(-1)}
              className="mt-6 px-5 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition"
            >
              ← Back
            </button>
          </div>
        </div>

        <FloatingHelp />
      </>
    );
  }

  // --------------------------------------------------
  // Multilingual helper
  // --------------------------------------------------

  const getLocalizedValue = (field) => {
    if (!service) return '';

    const suffix =
      language === 'am'
        ? '_am'
        : language === 'om'
        ? '_om'
        : '_en';

    return (
      service[`${field}${suffix}`] ||
      service[`${field}_en`] ||
      ''
    );
  };

  const serviceName = getLocalizedValue('name');
  const description = getLocalizedValue('description');
  const requirements = getLocalizedValue('requirements');
  const fees = getLocalizedValue('fees');
  const processingInfo = getLocalizedValue('processing_info');

  // --------------------------------------------------
  // Building name
  // --------------------------------------------------

  const getBuildingName = () => {
    if (!service.building) return '';

    if (language === 'am') {
      return (
        service.building.name_am ||
        service.building.name_en
      );
    }

    if (language === 'om') {
      return (
        service.building.name_om ||
        service.building.name_en
      );
    }

    return service.building.name_en;
  };

  // --------------------------------------------------
  // Floor name
  // --------------------------------------------------

  const getFloorName = () => {
    if (!service.floor) return '';

    if (language === 'am') {
      return (
        service.floor.name_am ||
        service.floor.name_en
      );
    }

    if (language === 'om') {
      return (
        service.floor.name_om ||
        service.floor.name_en
      );
    }

    return service.floor.name_en;
  };

  // --------------------------------------------------
  // Office name
  // --------------------------------------------------

  const getOfficeName = () => {
    if (!service.office) return '';

    if (language === 'am') {
      return (
        service.office.name_am ||
        service.office.name_en ||
        `Office ${service.office.office_number}`
      );
    }

    if (language === 'om') {
      return (
        service.office.name_om ||
        service.office.name_en ||
        `Office ${service.office.office_number}`
      );
    }

    return (
      service.office.name_en ||
      `Office ${service.office.office_number}`
    );
  };

  // --------------------------------------------------
  // Current visitor-facing status
  //
  // The backend already decides which status has priority.
  // We display ONLY current_status.
  // --------------------------------------------------

  const getCurrentStatusBadge = () => {
    const currentStatus = service.current_status;

    if (!currentStatus) {
      return null;
    }

    switch (currentStatus.status) {
      case 'open':
        return (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 border border-green-200">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>

            <span className="text-sm font-semibold text-green-800">
              🟢 {currentStatus.label}
            </span>
          </div>
        );

      case 'closed':
        return (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-50 border border-red-200">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>

            <span className="text-sm font-semibold text-red-800">
              🔴 {currentStatus.label}
            </span>
          </div>
        );

      case 'temporarily_unavailable':
        return (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-50 border border-yellow-200">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span>

            <span className="text-sm font-semibold text-yellow-800">
              🟡 {currentStatus.label}
            </span>
          </div>
        );

      case 'unknown':
        return (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-50 border border-slate-200">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>

            <span className="text-sm font-semibold text-slate-700">
              {currentStatus.label}
            </span>
          </div>
        );

      default:
        return (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-50 border border-slate-200">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>

            <span className="text-sm font-semibold text-slate-700">
              {currentStatus.label}
            </span>
          </div>
        );
    }
  };

  // --------------------------------------------------
  // Format database time
  // Example: "08:30:00" → "8:30 AM"
  // --------------------------------------------------

  const formatTime = (time) => {
    if (!time) return '';

    const [hours, minutes] = time.split(':');

    const date = new Date();

    date.setHours(
      Number(hours),
      Number(minutes),
      0,
      0
    );

    return date.toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  // --------------------------------------------------
  // Day names
  // --------------------------------------------------

  const dayNames = {
    en: [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday'
    ],

    am: [
      'እሁድ',
      'ሰኞ',
      'ማክሰኞ',
      'ረቡዕ',
      'ሐሙስ',
      'ዓርብ',
      'ቅዳሜ'
    ],

    om: [
      'Dilbata',
      'Wiixata',
      'Kibxata',
      'Roobii',
      'Kamisa',
      'Jimaata',
      'Sanbata'
    ]
  };

  const getDayName = (day) => {
    return (
      dayNames[language]?.[day] ||
      dayNames.en[day]
    );
  };

  return (
    <>
      <Header />

      <main className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">

          {/* Back */}
          <button
            onClick={() => navigate(-1)}
            className="mb-6 inline-flex items-center text-sm font-medium text-slate-600 hover:text-slate-900 transition"
          >
            ← Back
          </button>

          {/* Main Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">

            {/* Header */}
            <div className="p-6 sm:p-8 border-b border-slate-100">

              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">

                <div>
                  <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 mb-3 uppercase tracking-wide">
                    Service
                  </span>

                  <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
                    {serviceName}
                  </h1>
                </div>

              </div>

              {/* SINGLE Current Status */}
              {service.current_status && (
                <div className="mt-5">
                  {getCurrentStatusBadge()}
                </div>
              )}

            </div>

            {/* Content */}
            <div className="p-6 sm:p-8">

              {/* Description */}
              {description && (
                <section className="mb-8">

                  <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Description
                  </h2>

                  <p className="text-slate-700 leading-relaxed">
                    {description}
                  </p>

                </section>
              )}

              {/* Requirements + Fees */}
              {(requirements || fees) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">

                  {requirements && (
                    <div className="bg-slate-50 p-5 rounded-xl border border-slate-100">

                      <h3 className="font-semibold text-slate-900 mb-2">
                        Requirements
                      </h3>

                      <p className="text-sm text-slate-600 leading-relaxed">
                        {requirements}
                      </p>

                    </div>
                  )}

                  {fees && (
                    <div className="bg-slate-50 p-5 rounded-xl border border-slate-100">

                      <h3 className="font-semibold text-slate-900 mb-2">
                        Fees
                      </h3>

                      <p className="text-sm text-slate-600 leading-relaxed">
                        {fees}
                      </p>

                    </div>
                  )}

                </div>
              )}

              {/* Processing Information */}
              {processingInfo && (
                <section className="mb-8 bg-indigo-50 p-5 rounded-xl border border-indigo-100">

                  <h3 className="font-semibold text-indigo-900 mb-2">
                    Processing Information
                  </h3>

                  <p className="text-sm text-indigo-700 leading-relaxed">
                    {processingInfo}
                  </p>

                </section>
              )}

              {/* Location */}
              {(service.building ||
                service.floor ||
                service.office) && (

                <section className="border-t border-slate-100 pt-8 mb-8">

                  <h2 className="text-lg font-semibold text-slate-900 mb-4">
                    Location & Context
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

                    {/* Building */}
                    {service.building && (
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">

                        <span className="block text-xs text-slate-500 mb-1">
                          Building
                        </span>

                        <span className="font-medium text-slate-800">
                          {getBuildingName()}
                        </span>

                      </div>
                    )}

                    {/* Floor */}
                    {service.floor && (
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">

                        <span className="block text-xs text-slate-500 mb-1">
                          Floor
                        </span>

                        <span className="font-medium text-slate-800">

                          Floor {service.floor.floor_number}

                          {getFloorName()
                            ? ` — ${getFloorName()}`
                            : ''}

                        </span>

                      </div>
                    )}

                    {/* Office */}
                    {service.office && (
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">

                        <span className="block text-xs text-slate-500 mb-1">
                          Office
                        </span>

                        <Link
                          to={`/office/${service.office.id}`}
                          className="font-medium text-indigo-600 hover:text-indigo-800 hover:underline"
                        >
                          {getOfficeName()}
                        </Link>

                      </div>
                    )}

                  </div>

                </section>
              )}

              {/* Opening Hours */}
              <section className="border-t border-slate-100 pt-8">

                <h2 className="text-lg font-semibold text-slate-900 mb-4">
                  Opening Hours
                </h2>

                {service.opening_hours &&
                service.opening_hours.length > 0 ? (

                  <div className="bg-slate-50 rounded-xl border border-slate-100 overflow-hidden">

                    {service.opening_hours.map((oh) => (

                      <div
                        key={oh.id}
                        className="flex items-center justify-between px-4 py-3 border-b last:border-b-0 border-slate-100"
                      >

                        {/* Day */}
                        <span className="font-medium text-slate-700">
                          {getDayName(oh.day_of_week)}
                        </span>

                        {/* Hours */}
                        {oh.is_closed ? (

                          <span className="text-sm font-medium text-red-600">
                            Closed
                          </span>

                        ) : (

                          <div className="text-right">

                            <div className="text-sm font-medium text-slate-700">

                              {formatTime(oh.opening_time)}

                              {' – '}

                              {formatTime(oh.closing_time)}

                            </div>

                            {/* Break */}
                            {oh.break_start &&
                            oh.break_end && (

                              <div className="text-xs text-slate-500 mt-1">

                                Break:{' '}

                                {formatTime(oh.break_start)}

                                {' – '}

                                {formatTime(oh.break_end)}

                              </div>

                            )}

                          </div>

                        )}

                      </div>

                    ))}

                  </div>

                ) : (

                  <p className="text-sm text-slate-500 bg-slate-50 rounded-xl p-4 border border-slate-100">
                    Opening hours are not configured for this service.
                  </p>

                )}

              </section>

            </div>
          </div>
        </div>
      </main>

      <FloatingHelp />
    </>
  );
}