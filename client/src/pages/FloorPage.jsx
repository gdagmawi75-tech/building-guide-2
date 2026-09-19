import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getFloorsByBuildingId, getOfficesByFloorId } from '../api/api';
import Header from '../components/Header';
import SearchBar from '../components/SearchBar';
import { useLanguage } from '../context/LanguageContext.jsx';

export default function FloorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language, t } = useLanguage();

  const isBuildingRoute = window.location.pathname.includes('/building');

  const [floors, setFloors] = useState([]);
  const [selectedFloorId, setSelectedFloorId] = useState(null);
  const [offices, setOffices] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    loadData();
  }, [id, isBuildingRoute]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(false);

      if (isBuildingRoute) {
        const fetchedFloors = await getFloorsByBuildingId(id);

        if (fetchedFloors && fetchedFloors.length > 0) {
          setFloors(fetchedFloors);
          setSelectedFloorId(fetchedFloors[0].id);

          const fetchedOffices = await getOfficesByFloorId(
            fetchedFloors[0].id
          );

          setOffices(fetchedOffices || []);
        } else {
          setFloors([]);
          setOffices([]);
        }
      } else {
        setSelectedFloorId(id);

        const fetchedOffices = await getOfficesByFloorId(id);

        setOffices(fetchedOffices || []);
      }
    } catch (err) {
      console.error('Failed to load floor:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleFloorChange = async (floorId) => {
    try {
      setSelectedFloorId(floorId);
      setLoading(true);
      setError(false);
      setSearchQuery('');

      const fetchedOffices = await getOfficesByFloorId(floorId);

      setOffices(fetchedOffices || []);
    } catch (err) {
      console.error('Failed to load offices:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const getOfficeName = (office) => {
    if (language === 'am' && office.name_am) {
      return office.name_am;
    }

    if (language === 'om' && office.name_om) {
      return office.name_om;
    }

    return office.name_en || t.office;
  };

  const getOfficeDescription = (office) => {
    if (language === 'am' && office.description_am) {
      return office.description_am;
    }

    if (language === 'om' && office.description_om) {
      return office.description_om;
    }

    return office.description_en || '';
  };

  const getFloorName = (floor) => {
    if (language === 'am' && floor.name_am) {
      return floor.name_am;
    }

    if (language === 'om' && floor.name_om) {
      return floor.name_om;
    }

    return floor.name_en || `Floor ${floor.floor_number}`;
  };

  const filteredOffices = offices.filter((office) => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return true;
    }

    const nameEn = (office.name_en || '').toLowerCase();
    const nameAm = (office.name_am || '').toLowerCase();
    const nameOm = (office.name_om || '').toLowerCase();

    const descriptionEn = (office.description_en || '').toLowerCase();
    const descriptionAm = (office.description_am || '').toLowerCase();
    const descriptionOm = (office.description_om || '').toLowerCase();

    const officeNumber = (office.office_number || '').toLowerCase();

    return (
      nameEn.includes(query) ||
      nameAm.includes(query) ||
      nameOm.includes(query) ||
      descriptionEn.includes(query) ||
      descriptionAm.includes(query) ||
      descriptionOm.includes(query) ||
      officeNumber.includes(query)
    );
  });

  if (loading && offices.length === 0 && floors.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Header />

        <div className="flex-1 flex items-center justify-center text-slate-500">
          Loading floor directory...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Header />

        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">
            Failed to load office directory.
          </h2>

          <button
            onClick={loadData}
            className="px-5 py-2.5 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6">

        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="text-slate-600 font-medium mb-4 inline-flex items-center hover:text-slate-900"
        >
          ← Back
        </button>

        {/* Floor Directory Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">

          <h1 className="text-3xl font-bold text-slate-900">
            Floor Directory
          </h1>

          <p className="text-slate-500 mt-1">
            Offices and services located on this floor
          </p>

          {/* Search */}
          <div className="mt-4">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
            />
          </div>

          {/* Floor Switcher */}
          {floors.length > 1 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {floors.map((floor) => (
                <button
                  key={floor.id}
                  onClick={() => handleFloorChange(floor.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    selectedFloorId === floor.id
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {getFloorName(floor)}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Offices */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">

          <h2 className="text-xl font-bold text-slate-900 mb-4">
            {t.office}s ({filteredOffices.length})
          </h2>

          {loading ? (
            <p className="text-slate-500 py-4">
              Loading...
            </p>
          ) : filteredOffices.length === 0 ? (
            <p className="text-slate-500 py-4">
              No matching offices found on this floor.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">

              {filteredOffices.map((office) => (
                <button
                  key={office.id}
                  onClick={() => navigate(`/office/${office.id}`)}
                  className="w-full text-left p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100 hover:border-slate-200 transition cursor-pointer"
                >
                  <h3 className="font-semibold text-slate-900">
                    {getOfficeName(office)}
                  </h3>

                  {office.office_number && (
                    <p className="text-xs text-slate-500 mt-1">
                      {t.office} {office.office_number}
                    </p>
                  )}

                  {getOfficeDescription(office) && (
                    <p className="text-sm text-slate-600 mt-2">
                      {getOfficeDescription(office)}
                    </p>
                  )}
                </button>
              ))}

            </div>
          )}

        </div>

      </main>
    </div>
  );
}