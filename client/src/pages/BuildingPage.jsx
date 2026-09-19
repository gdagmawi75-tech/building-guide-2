import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import Header from '../components/Header';
import SearchBar from '../components/SearchBar';
import FloorCard from '../components/FloorCard';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import FloatingHelp from '../components/FloatingHelp';

import {
  getBuildingById,
  getFloorsByBuildingId,
  getAnnouncementsByBuildingId,
  submitFeedback
} from '../api/api';

import { useLanguage } from '../context/LanguageContext.jsx';

export default function BuildingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, language } = useLanguage();

  const [building, setBuilding] = useState(null);
  const [floors, setFloors] = useState([]);
  const [announcements, setAnnouncements] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ==========================================
  // FEEDBACK STATE
  // ==========================================

  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState('');
  const [feedbackError, setFeedbackError] = useState('');

  // ==========================================
  // LOAD DATA
  // ==========================================

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [
        buildingData,
        floorsData,
        announcementsData
      ] = await Promise.all([
        getBuildingById(id),
        getFloorsByBuildingId(id),
        getAnnouncementsByBuildingId(id)
      ]);

      console.log('Building data:', buildingData);
      console.log('Floors data:', floorsData);
      console.log('Announcements data:', announcementsData);

      setBuilding(buildingData);

      setFloors(
        Array.isArray(floorsData)
          ? floorsData
          : []
      );

      setAnnouncements(
        Array.isArray(announcementsData)
          ? announcementsData
          : []
      );

    } catch (err) {
      console.error('Failed to load building:', err);

      setError(
        'Failed to load building information.'
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // LOCALIZED CONTENT
  // ==========================================

  const getLocalizedField = (item, field) => {
    if (!item) return '';

    const languageField = `${field}_${language}`;

    return (
      item[languageField] ||
      item[`${field}_en`] ||
      item[`${field}_am`] ||
      item[`${field}_om`] ||
      ''
    );
  };

  // ==========================================
  // DAY NAMES
  // ==========================================

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
      'Kamiisa',
      'Jimaata',
      'Sanbata'
    ]
  };

  const currentDayNames =
    dayNames[language] || dayNames.en;

  // ==========================================
  // TIME FORMAT
  // ==========================================

  const formatTime = (time) => {
    if (!time) return '';

    const [
      hourString,
      minuteString
    ] = time.split(':');

    const hour = Number(hourString);
    const minute = minuteString || '00';

    const period =
      hour >= 12 ? 'PM' : 'AM';

    const displayHour =
      hour % 12 || 12;

    return `${displayHour}:${minute} ${period}`;
  };

  // ==========================================
  // BUILDING OPENING HOURS
  // ==========================================

  const getOpeningHourForDay = (dayIndex) => {
    return (
      building?.opening_hours?.find(
        (hours) =>
          hours.day_of_week === dayIndex
      ) || null
    );
  };

  // ==========================================
  // ANNOUNCEMENT CONTENT
  // ==========================================

  const getAnnouncementTitle = (
    announcement
  ) => {
    return getLocalizedField(
      announcement,
      'title'
    );
  };

  const getAnnouncementDescription = (
    announcement
  ) => {
    return getLocalizedField(
      announcement,
      'description'
    );
  };

  // ==========================================
  // ANNOUNCEMENT PRIORITY
  // ==========================================

  const getPriorityStyle = (priority) => {
    switch (priority) {

      case 'urgent':
        return {
          container:
            'border-red-300 bg-red-50',

          icon:
            'bg-red-100 text-red-600',

          badge:
            'bg-red-100 text-red-700',

          label:
            language === 'am'
              ? 'አስቸኳይ'
              : language === 'om'
                ? 'Ariifachiisaa'
                : 'Urgent'
        };

      case 'high':
        return {
          container:
            'border-orange-300 bg-orange-50',

          icon:
            'bg-orange-100 text-orange-600',

          badge:
            'bg-orange-100 text-orange-700',

          label:
            language === 'am'
              ? 'አስፈላጊ'
              : language === 'om'
                ? 'Barbaachisaa'
                : 'Important'
        };

      case 'low':
        return {
          container:
            'border-slate-200 bg-slate-50',

          icon:
            'bg-slate-100 text-slate-600',

          badge:
            'bg-slate-100 text-slate-600',

          label:
            language === 'am'
              ? 'ዝቅተኛ ቅድሚያ'
              : language === 'om'
                ? 'Dursa xiqqaa'
                : 'Low priority'
        };

      default:
        return {
          container:
            'border-blue-200 bg-blue-50',

          icon:
            'bg-blue-100 text-blue-600',

          badge:
            'bg-blue-100 text-blue-700',

          label:
            language === 'am'
              ? 'ማስታወቂያ'
              : language === 'om'
                ? 'Beeksisa'
                : 'Notice'
        };
    }
  };

  // ==========================================
  // FEEDBACK TRANSLATIONS
  // ==========================================

  const feedbackText = {
    title:
      language === 'am'
        ? 'አስተያየት ይስጡ'
        : language === 'om'
          ? 'Yaada keessan nuuf kennaa'
          : 'Give us feedback',

    subtitle:
      language === 'am'
        ? 'የልምድዎን አስተያየት ያካፍሉን'
        : language === 'om'
          ? 'Muuxannoo keessan nuuf qoodaa'
          : 'Tell us about your experience',

    rating:
      language === 'am'
        ? 'እባክዎ ልምድዎን ደረጃ ይስጡ'
        : language === 'om'
          ? 'Maaloo muuxannoo keessan madaalaa'
          : 'Please rate your experience',

    message:
      language === 'am'
        ? 'አስተያየትዎ (አማራጭ)'
        : language === 'om'
          ? 'Yaada keessan (filannoo)'
          : 'Your message (optional)',

    placeholder:
      language === 'am'
        ? 'እባክዎ አስተያየትዎን ያስገቡ...'
        : language === 'om'
          ? 'Maaloo yaada keessan barreessaa...'
          : 'Tell us what you think...',

    submit:
      language === 'am'
        ? 'አስተያየት ላክ'
        : language === 'om'
          ? 'Yaada ergaa'
          : 'Submit feedback',

    submitting:
      language === 'am'
        ? 'በመላክ ላይ...'
        : language === 'om'
          ? 'Ergaa jira...'
          : 'Submitting...',

    success:
      language === 'am'
        ? 'አስተያየትዎ በተሳካ ሁኔታ ተልኳል። እናመሰግናለን!'
        : language === 'om'
          ? 'Yaada keessan milkaa’inaan ergamameera. Galatoomaa!'
          : 'Your feedback was submitted successfully. Thank you!',

    validation:
      language === 'am'
        ? 'እባክዎ ደረጃ ወይም አስተያየት ይስጡ።'
        : language === 'om'
          ? 'Maaloo madaallii ykn yaada kennaa.'
          : 'Please provide a rating or message.'
  };

  // ==========================================
  // SUBMIT FEEDBACK
  // ==========================================

  const handleSubmitFeedback = async (event) => {
    event.preventDefault();

    setFeedbackSuccess('');
    setFeedbackError('');

    const trimmedMessage =
      feedbackMessage.trim();

    if (
      feedbackRating === 0 &&
      !trimmedMessage
    ) {
      setFeedbackError(
        feedbackText.validation
      );

      return;
    }

    try {
      setFeedbackSubmitting(true);

      const result = await submitFeedback({
        building_id: id,
        rating:
          feedbackRating > 0
            ? feedbackRating
            : undefined,
        message:
          trimmedMessage || undefined
      });

      if (!result?.success) {
        throw new Error(
          result?.error ||
          'Failed to submit feedback.'
        );
      }

      setFeedbackRating(0);
      setFeedbackMessage('');

      setFeedbackSuccess(
        feedbackText.success
      );

    } catch (err) {
      console.error(
        'Failed to submit feedback:',
        err
      );

      setFeedbackError(
        err?.response?.data?.error ||
        err?.message ||
        'Failed to submit feedback.'
      );

    } finally {
      setFeedbackSubmitting(false);
    }
  };

  // ==========================================
  // PAGE
  // ==========================================

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">

      <div>

        <Header />

        <main className="max-w-4xl mx-auto px-4 py-8">

          {/* ==================================
              BACK BUTTON
          ================================== */}

          <button
            onClick={() => navigate('/')}
            className="text-sm font-medium text-slate-600 hover:text-slate-900 mb-6 flex items-center gap-1"
          >
            ← Back to Home
          </button>

          {/* ==================================
              BUILDING HEADER
          ================================== */}

          <div className="text-center mb-6">

            <h1 className="text-2xl font-bold text-slate-800">
              {getLocalizedField(
                building,
                'name'
              ) || t.buildingGuide}
            </h1>

            <p className="text-slate-500 text-sm">
              Select a floor to explore available offices.
            </p>

          </div>

          {/* ==================================
              SEARCH
          ================================== */}

          <SearchBar />

          {/* ==================================
              LOADING
          ================================== */}

          {loading && (
            <LoadingState
              message="Loading building information..."
            />
          )}

          {/* ==================================
              ERROR
          ================================== */}

          {error && (
            <ErrorState
              message={error}
              onRetry={loadData}
            />
          )}

          {/* ==================================
              MAIN CONTENT
          ================================== */}

          {!loading && !error && (
            <>

              {/* ==================================
                  ANNOUNCEMENTS
              ================================== */}

              {announcements.length > 0 && (
                <section className="mb-6">

                  <div className="flex items-center gap-3 mb-4">

                    <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-xl">
                      📢
                    </div>

                    <div>

                      <h2 className="text-lg font-semibold text-slate-800">
                        {language === 'am'
                          ? 'ማስታወቂያዎች'
                          : language === 'om'
                            ? 'Beeksisawwan'
                            : 'Announcements'}
                      </h2>

                      <p className="text-sm text-slate-500">
                        {language === 'am'
                          ? 'አስፈላጊ የሕንፃ ማሻሻያዎች'
                          : language === 'om'
                            ? 'Odeeffannoo barbaachisaa ijaarsaa'
                            : 'Important building updates'}
                      </p>

                    </div>

                  </div>

                  <div className="space-y-3">

                    {announcements.map(
                      (announcement) => {

                        const priorityStyle =
                          getPriorityStyle(
                            announcement.priority
                          );

                        const title =
                          getAnnouncementTitle(
                            announcement
                          );

                        const description =
                          getAnnouncementDescription(
                            announcement
                          );

                        return (
                          <article
                            key={announcement.id}
                            className={`
                              rounded-2xl
                              border
                              p-5
                              shadow-sm
                              ${priorityStyle.container}
                            `}
                          >

                            <div className="flex items-start gap-4">

                              <div
                                className={`
                                  w-11
                                  h-11
                                  rounded-xl
                                  flex
                                  items-center
                                  justify-center
                                  text-xl
                                  flex-shrink-0
                                  ${priorityStyle.icon}
                                `}
                              >
                                📢
                              </div>

                              <div className="flex-1 min-w-0">

                                <div className="flex flex-wrap items-center gap-2 mb-2">

                                  <h3 className="font-semibold text-slate-800">
                                    {title}
                                  </h3>

                                  <span
                                    className={`
                                      text-xs
                                      font-medium
                                      px-2
                                      py-1
                                      rounded-full
                                      ${priorityStyle.badge}
                                    `}
                                  >
                                    {priorityStyle.label}
                                  </span>

                                </div>

                                {description && (
                                  <p className="text-sm text-slate-600 leading-relaxed">
                                    {description}
                                  </p>
                                )}

                              </div>

                            </div>

                          </article>
                        );
                      }
                    )}

                  </div>

                </section>
              )}

              {/* ==================================
                  BUILDING OPENING HOURS
              ================================== */}

              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 max-w-2xl mx-auto mb-6">

                <div className="flex items-center gap-3 mb-5">

                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-xl">
                    🕐
                  </div>

                  <div>

                    <h2 className="text-lg font-semibold text-slate-800">
                      Opening Hours
                    </h2>

                    <p className="text-sm text-slate-500">
                      Building operating schedule
                    </p>

                  </div>

                </div>

                <div className="space-y-2">

                  {currentDayNames.map(
                    (dayName, index) => {

                      const hours =
                        getOpeningHourForDay(
                          index
                        );

                      return (
                        <div
                          key={dayName}
                          className="flex items-center justify-between px-4 py-3 rounded-xl bg-slate-50 border border-slate-100"
                        >

                          <span className="font-medium text-slate-700">
                            {dayName}
                          </span>

                          {!hours ? (

                            <span className="text-sm text-slate-400">
                              Not configured
                            </span>

                          ) : hours.is_closed ? (

                            <span className="text-sm font-medium text-red-600">
                              Closed
                            </span>

                          ) : (

                            <div className="text-right">

                              <div className="text-sm font-medium text-slate-700">
                                {formatTime(
                                  hours.opening_time
                                )}
                                {' – '}
                                {formatTime(
                                  hours.closing_time
                                )}
                              </div>

                              {hours.break_start &&
                                hours.break_end && (
                                  <div className="text-xs text-slate-500 mt-1">
                                    Break:{' '}
                                    {formatTime(
                                      hours.break_start
                                    )}
                                    {' – '}
                                    {formatTime(
                                      hours.break_end
                                    )}
                                  </div>
                                )}

                            </div>

                          )}

                        </div>
                      );
                    }
                  )}

                </div>

              </div>

              {/* ==================================
                  FLOOR DIRECTORY
              ================================== */}

              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 max-w-2xl mx-auto">

                <div className="text-center mb-6">

                  <h2 className="text-xl font-semibold text-slate-800">
                    Choose Your Floor
                  </h2>

                  <p className="text-slate-500 text-sm mt-1">
                    Select a floor to explore the offices and information available there.
                  </p>

                </div>

                {floors.length === 0 ? (

                  <EmptyState
                    message="No floors are available yet."
                  />

                ) : (

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">

                    {floors.map(
                      (floor) => (

                        <FloorCard
                          key={floor.id}
                          floor={floor}
                          onClick={() =>
                            navigate(
                              `/floor/${floor.id}`
                            )
                          }
                        />

                      )
                    )}

                  </div>

                )}

                <p className="text-xs text-center text-slate-400 mt-8">
                  Select a floor to see the offices and information available there.
                </p>

              </div>

              {/* ==================================
                  FEEDBACK
              ================================== */}

              <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 max-w-2xl mx-auto mt-6">

                <div className="text-center mb-6">

                  <div className="w-12 h-12 rounded-2xl bg-yellow-100 flex items-center justify-center text-2xl mx-auto mb-3">
                    ⭐
                  </div>

                  <h2 className="text-xl font-semibold text-slate-800">
                    {feedbackText.title}
                  </h2>

                  <p className="text-sm text-slate-500 mt-1">
                    {feedbackText.subtitle}
                  </p>

                </div>

                <form
                  onSubmit={handleSubmitFeedback}
                  className="space-y-5"
                >

                  {/* Rating */}

                  <div>

                    <p className="text-sm font-medium text-slate-700 mb-3 text-center">
                      {feedbackText.rating}
                    </p>

                    <div className="flex justify-center gap-2">

                      {[1, 2, 3, 4, 5].map(
                        (star) => (

                          <button
                            key={star}
                            type="button"
                            onClick={() =>
                              setFeedbackRating(star)
                            }
                            aria-label={`Rate ${star} out of 5`}
                            className={`
                              text-3xl
                              transition
                              transform
                              hover:scale-110
                              focus:outline-none
                              ${
                                star <= feedbackRating
                                  ? 'text-yellow-400'
                                  : 'text-slate-300'
                              }
                            `}
                          >
                            ★
                          </button>

                        )
                      )}

                    </div>

                  </div>

                  {/* Message */}

                  <div>

                    <label
                      htmlFor="feedback-message"
                      className="block text-sm font-medium text-slate-700 mb-2"
                    >
                      {feedbackText.message}
                    </label>

                    <textarea
                      id="feedback-message"
                      value={feedbackMessage}
                      onChange={(event) =>
                        setFeedbackMessage(
                          event.target.value
                        )
                      }
                      rows={4}
                      placeholder={
                        feedbackText.placeholder
                      }
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                    />

                  </div>

                  {/* Error */}

                  {feedbackError && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {feedbackError}
                    </div>
                  )}

                  {/* Success */}

                  {feedbackSuccess && (
                    <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                      {feedbackSuccess}
                    </div>
                  )}

                  {/* Submit */}

                  <button
                    type="submit"
                    disabled={feedbackSubmitting}
                    className="w-full rounded-xl bg-slate-900 text-white py-3 px-4 text-sm font-medium hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    {feedbackSubmitting
                      ? feedbackText.submitting
                      : feedbackText.submit}
                  </button>

                </form>

              </section>

            </>
          )}

        </main>

      </div>

      {/* ==========================================
          FLOATING HELP
      ========================================== */}

      <FloatingHelp />

    </div>
  );
}