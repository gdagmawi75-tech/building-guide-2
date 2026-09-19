import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getFacilityById } from '../api/api';

import Header from '../components/Header';
import FloatingHelp from '../components/FloatingHelp';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';

import { useLanguage } from '../context/LanguageContext.jsx';

export default function FacilityPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();

  const [facility, setFacility] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchFacility() {
      try {
        setLoading(true);
        setError(null);

        const res = await getFacilityById(id);

        if (isMounted) {
          if (res && res.success) {
            setFacility(res.data);
          } else {
            setError('Facility not found.');
          }
        }
      } catch (err) {
        console.error('Failed to load facility:', err);

        if (isMounted) {
          setError('Failed to load facility details.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchFacility();

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

  if (error || !facility) {
    return (
      <>
        <Header />

        <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <ErrorState
              message={
                error ||
                'The requested facility does not exist or is unavailable.'
              }
            />

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

  // Get multilingual facility values
  const getLocalizedField = (object, field) => {
    if (!object) return '';

    if (language === 'am') {
      return object[`${field}_am`] || object[`${field}_en`] || '';
    }

    if (language === 'om') {
      return object[`${field}_om`] || object[`${field}_en`] || '';
    }

    return object[`${field}_en`] || '';
  };

  const facilityName =
    getLocalizedField(facility, 'name') || 'Facility';

  const description =
    getLocalizedField(facility, 'description');

  const buildingName =
    getLocalizedField(facility.building, 'name');

  const floorName =
    getLocalizedField(facility.floor, 'name');

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
              <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 mb-3 uppercase tracking-wide">
                Building Facility
              </span>

              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
                {facilityName}
              </h1>
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

              {/* Location */}
              {(facility.building || facility.floor) && (
                <section className="border-t border-slate-100 pt-8 mb-8">

                  <h2 className="text-lg font-semibold text-slate-900 mb-4">
                    Location
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                    {facility.building && (
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <span className="block text-xs text-slate-500 mb-1">
                          Building
                        </span>

                        <span className="font-medium text-slate-800">
                          {buildingName || 'Building'}
                        </span>
                      </div>
                    )}

                    {facility.floor && (
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <span className="block text-xs text-slate-500 mb-1">
                          Floor
                        </span>

                        <span className="font-medium text-slate-800">
                          Floor {facility.floor.floor_number}
                          {floorName ? ` — ${floorName}` : ''}
                        </span>
                      </div>
                    )}

                  </div>
                </section>
              )}

              {/* Opening Hours */}
              {facility.opening_hours &&
                facility.opening_hours.length > 0 && (
                  <section className="border-t border-slate-100 pt-8">

                    <h2 className="text-lg font-semibold text-slate-900 mb-4">
                      Opening Hours
                    </h2>

                    <div className="bg-slate-50 rounded-xl border border-slate-100 overflow-hidden">

                      {facility.opening_hours.map((oh, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between px-4 py-3 border-b last:border-b-0 border-slate-100"
                        >
                          <span className="font-medium text-slate-700">
                            Day {oh.day_of_week}
                          </span>

                          <span className="text-sm text-slate-600">
                            {oh.is_closed
                              ? 'Closed'
                              : `${oh.open_time || ''} - ${
                                  oh.close_time || ''
                                }`}
                          </span>
                        </div>
                      ))}

                    </div>
                  </section>
                )}

            </div>
          </div>
        </div>
      </main>

      <FloatingHelp />
    </>
  );
}