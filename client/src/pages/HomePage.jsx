import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import SearchBar from '../components/SearchBar';
import FloatingHelp from '../components/FloatingHelp';
import api from '../api/api';
import { useLanguage } from '../context/LanguageContext.jsx';

export default function HomePage() {
  const navigate = useNavigate();
  const { language, t } = useLanguage();

  const buildingId = '00cb589e-3a06-4902-828f-dd303720d6ab';

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);

  const handleSearch = async (value) => {
    setSearchQuery(value);

    const query = value.trim();

    if (!query) {
      setSearchResults(null);
      return;
    }

    try {
      setSearching(true);

      const response = await api.get('/search', {
        params: {
          q: query,
          building_id: buildingId,
        },
      });

      setSearchResults(response.data);
    } catch (error) {
      console.error('Search error:', error);

      setSearchResults({
        success: false,
        total_results: 0,
        data: {
          offices: [],
          services: [],
          employees: [],
          departments: [],
          facilities: [],
        },
      });
    } finally {
      setSearching(false);
    }
  };

  const handleExploreClick = () => {
    navigate(`/building/${buildingId}`);
  };

  const handleFloorsClick = () => {
    navigate(`/building/${buildingId}/floors`);
  };

  // Open the correct detail page based on result type
  const handleResultClick = (result) => {
    switch (result.type) {
      case 'office':
        navigate(`/office/${result.id}`);
        break;

      case 'service':
        navigate(`/service/${result.id}`);
        break;

      case 'employee':
        navigate(`/employee/${result.id}`);
        break;

      case 'department':
        navigate(`/department/${result.id}`);
        break;

      case 'facility':
        navigate(`/facility/${result.id}`);
        break;

      default:
        console.warn('Unknown search result type:', result.type);
    }
  };

  const allResults = searchResults
    ? [
        ...(searchResults.data?.offices || []),
        ...(searchResults.data?.services || []),
        ...(searchResults.data?.employees || []),
        ...(searchResults.data?.departments || []),
        ...(searchResults.data?.facilities || []),
      ]
    : [];

  const getTitle = (result) => {
    if (language === 'am' && result.title_am) {
      return result.title_am;
    }

    if (language === 'om' && result.title_om) {
      return result.title_om;
    }

    return result.title;
  };

  const getSubtitle = (result) => {
    if (language === 'am' && result.subtitle_am) {
      return result.subtitle_am;
    }

    if (language === 'om' && result.subtitle_om) {
      return result.subtitle_om;
    }

    if (result.type === 'office') return t.office;
    if (result.type === 'service') return t.service;
    if (result.type === 'employee') return t.employee;
    if (result.type === 'department') return t.department;
    if (result.type === 'facility') return t.facility;

    return result.subtitle;
  };

  const getTypeLabel = (type) => {
    if (type === 'office') return t.office;
    if (type === 'service') return t.service;
    if (type === 'employee') return t.employee;
    if (type === 'department') return t.department;
    if (type === 'facility') return t.facility;

    return type;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-12 flex flex-col items-center text-center">

        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
          {t.buildingGuide}
        </h1>

        <p className="text-slate-500 mb-8">
          {t.tagline}
        </p>

        <div className="w-full max-w-xl">
          <SearchBar
            value={searchQuery}
            onChange={handleSearch}
          />
        </div>

        {/* SEARCH RESULTS */}
        {searchQuery.trim() !== '' && (
          <div className="w-full max-w-xl mt-6 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 text-left">

            <h2 className="text-lg font-bold text-slate-900 mb-4">
              {searching
                ? t.searching
                : `${t.searchResults} (${searchResults?.total_results || 0})`}
            </h2>

            {/* NO RESULTS */}
            {!searching && allResults.length === 0 && (
              <p className="text-slate-500 text-sm">
                {t.noResults} "{searchQuery}".
              </p>
            )}

            {/* RESULTS */}
            {!searching && allResults.length > 0 && (
              <div className="space-y-3">

                {allResults.map((result) => (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => handleResultClick(result)}
                    className="w-full text-left p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100 hover:border-slate-200 hover:shadow-sm transition cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-3">

                      <div>
                        <h3 className="font-semibold text-slate-900">
                          {getTitle(result)}
                        </h3>

                        <p className="text-xs text-slate-500 mt-1">
                          {getSubtitle(result)}
                        </p>
                      </div>

                      <span className="text-xs font-medium text-slate-400 whitespace-nowrap">
                        {getTypeLabel(result.type)}
                      </span>

                    </div>
                  </button>
                ))}

              </div>
            )}

          </div>
        )}

        {/* DEFAULT HOME CARD */}
        {searchQuery.trim() === '' && (
          <div className="w-full max-w-xl space-y-4 mt-4">
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 p-8">
              <h2 className="text-xl font-bold text-slate-800 mb-2">
                {t.centralBusinessDistrict}
              </h2>

              <p className="text-slate-500 text-sm mb-6">
                {t.welcomeMessage}
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleExploreClick}
                  className="flex-1 py-3.5 px-6 bg-slate-900 text-white font-medium rounded-2xl shadow-sm hover:bg-slate-800 transition cursor-pointer text-sm"
                >
                  🏢 {t.exploreBuilding}
                </button>

                <button
                  onClick={handleFloorsClick}
                  className="py-3.5 px-6 bg-slate-100 text-slate-700 font-medium rounded-2xl hover:bg-slate-200 transition cursor-pointer text-sm"
                >
                  Floor Directory
                </button>
              </div>
            </div>

            {/* VISITOR FEEDBACK INVITATION CARD */}
            <div className="bg-gradient-to-br from-amber-500/10 via-amber-50/50 to-white rounded-3xl border border-amber-200/80 p-6 text-left flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 border border-amber-200 text-amber-600 flex items-center justify-center text-xl shrink-0">
                  ⭐
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    {t.giveFeedback || 'Share Your Feedback'}
                  </h3>
                  <p className="text-slate-600 text-xs mt-0.5 leading-relaxed">
                    {language === 'am'
                      ? 'የጉብኝትዎን ተሞክሮ ያካፍሉን፤ አገልግሎታችንን ለማሻሻል ይረዳናል።'
                      : language === 'om'
                      ? 'Muuxannoo keessan nuuf qoodaa; tajaajila fooyyessuuf nu gargaara.'
                      : 'How was your visit? Rate your experience and help us improve.'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => navigate('/feedback')}
                className="w-full sm:w-auto px-4 py-2.5 bg-slate-900 text-white text-xs font-semibold rounded-xl hover:bg-slate-800 transition whitespace-nowrap cursor-pointer shrink-0 shadow-xs"
              >
                {t.giveFeedback || 'Write Feedback'} →
              </button>
            </div>
          </div>
        )}

      </main>

      <FloatingHelp />
    </div>
  );
}