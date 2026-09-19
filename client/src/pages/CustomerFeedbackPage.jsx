import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Header from '../components/Header';
import FloatingHelp from '../components/FloatingHelp';
import { submitFeedback, getBuildings } from '../api/api';
import { useLanguage } from '../context/LanguageContext.jsx';

export default function CustomerFeedbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { language, t } = useLanguage();

  const defaultBuildingId = '00cb589e-3a06-4902-828f-dd303720d6ab';
  const paramBuildingId = searchParams.get('building_id') || defaultBuildingId;
  const paramOfficeId = searchParams.get('office_id') || '';

  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [category, setCategory] = useState('General Experience');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const categories = [
    { en: 'General Experience', am: 'አጠቃላይ ተሞክሮ', om: 'Muuxannoo Waliigalaa' },
    { en: 'Office & Room', am: 'ቢሮ እና ክፍል', om: 'Waajjira fi Kutaa' },
    { en: 'Staff & Service', am: 'ሰራተኞች እና አገልግሎት', om: 'Hojjettoota fi Tajaajila' },
    { en: 'Signage & Navigation', am: 'ምልክቶች እና አቅጣጫ', om: 'Mallattoo fi Kallattii' },
    { en: 'Facility & Cleanliness', am: 'ንፅህና እና ምቾት', om: 'Qulqullina fi Mijaawina' },
  ];

  const ratingDescriptions = {
    1: { en: 'Poor', am: 'ደካማ', om: 'Gadaanaa' },
    2: { en: 'Fair', am: 'መካከለኛ', om: 'Giddu-galeessa' },
    3: { en: 'Good', am: 'ጥሩ', om: 'Gaarii' },
    4: { en: 'Very Good', am: 'በጣም ጥሩ', om: 'Baay’ee Gaarii' },
    5: { en: 'Excellent', am: 'እጅግ በጣም ጥሩ', om: 'Baay’ee Caalaa' },
  };

  const getCategoryLabel = (cat) => {
    if (language === 'am') return cat.am;
    if (language === 'om') return cat.om;
    return cat.en;
  };

  const getRatingLabel = (val) => {
    if (!val || !ratingDescriptions[val]) return '';
    return ratingDescriptions[val][language] || ratingDescriptions[val].en;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const trimmedMsg = message.trim();

    if (rating === 0 && !trimmedMsg) {
      setError(
        language === 'am'
          ? 'እባክዎ ደረጃ ይምረጡ ወይም አስተያየትዎን ይፃፉ።'
          : language === 'om'
          ? 'Maaloo madaallii filadhaa ykn yaada keessan barreessaa.'
          : 'Please select a star rating or write a message.'
      );
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        building_id: paramBuildingId,
        rating: rating > 0 ? rating : undefined,
        message: trimmedMsg ? `[Category: ${category}] ${trimmedMsg}` : `[Category: ${category}]`,
      };

      if (paramOfficeId) {
        payload.office_id = paramOfficeId;
      }

      const res = await submitFeedback(payload);

      if (res && res.success) {
        setSubmitted(true);
      } else {
        throw new Error(res?.error || 'Failed to submit feedback.');
      }
    } catch (err) {
      console.error('Feedback submit error:', err);
      setError(
        err?.response?.data?.error ||
        err?.message ||
        'Unable to submit feedback at this time. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setRating(0);
    setHoveredRating(0);
    setMessage('');
    setCategory('General Experience');
    setSubmitted(false);
    setError('');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-8">
        <button
          onClick={() => navigate(-1)}
          className="text-sm font-medium text-slate-600 hover:text-slate-900 mb-6 inline-flex items-center gap-1.5 transition"
        >
          ← {t.backToHome || 'Back'}
        </button>

        {submitted ? (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 text-center animate-fade-in">
            <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-3xl mx-auto mb-4">
              ✓
            </div>

            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              {language === 'am'
                ? 'እናመሰግናለን!'
                : language === 'om'
                ? 'Galatoomaa!'
                : 'Thank You!'}
            </h1>

            <p className="text-slate-600 text-sm max-w-md mx-auto mb-8">
              {t.feedbackSuccess || 'Your feedback has been received and helps us continuously improve the visitor experience.'}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={handleReset}
                className="w-full sm:w-auto px-6 py-3 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200 transition text-sm"
              >
                {language === 'am'
                  ? 'ተጨማሪ አስተያየት ይስጡ'
                  : language === 'om'
                  ? 'Yaada Dabalataa Ergaa'
                  : 'Submit Another Response'}
              </button>

              <button
                onClick={() => navigate('/')}
                className="w-full sm:w-auto px-6 py-3 bg-slate-900 text-white font-medium rounded-xl hover:bg-slate-800 transition text-sm"
              >
                {t.backToHome || 'Return to Guide'}
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-10">
            <div className="text-center mb-8">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-100 text-amber-500 flex items-center justify-center text-2xl mx-auto mb-3">
                ⭐
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                {t.giveFeedback || 'Share Your Feedback'}
              </h1>

              <p className="text-slate-500 text-sm mt-1 max-w-md mx-auto">
                {language === 'am'
                  ? 'የጉብኝትዎን ተሞክሮ ያካፍሉን፤ አገልግሎታችንን ለማሻሻል ይረዳናል።'
                  : language === 'om'
                  ? 'Muuxannoo daawwannaakee nuuf qoodi; tajaajila fooyyessuuf nu gargaara.'
                  : 'Tell us how your visit went. Your feedback helps make the building guide better for everyone.'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Star Rating Section */}
              <div className="text-center p-5 rounded-2xl bg-slate-50 border border-slate-100">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                  {t.rateYourVisit || 'Rate Your Experience'}
                </label>

                <div className="flex justify-center items-center gap-2 sm:gap-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(0)}
                      className="p-1 focus:outline-none transition-transform hover:scale-125 cursor-pointer"
                      aria-label={`Rate ${star} stars`}
                    >
                      <span
                        className={`text-3xl sm:text-4xl transition-colors ${
                          star <= (hoveredRating || rating)
                            ? 'text-amber-400'
                            : 'text-slate-200'
                        }`}
                      >
                        ★
                      </span>
                    </button>
                  ))}
                </div>

                <div className="h-5 mt-2">
                  {(hoveredRating || rating) > 0 && (
                    <span className="text-xs font-semibold text-slate-700 animate-fade-in">
                      {getRatingLabel(hoveredRating || rating)}
                    </span>
                  )}
                </div>
              </div>

              {/* Category Pills */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
                  {language === 'am'
                    ? 'አስተያየት የሚመለከተው ርዕስ'
                    : language === 'om'
                    ? 'Mata Duree Yaadaa'
                    : 'What is this feedback about?'}
                </label>

                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => {
                    const active = category === cat.en;
                    return (
                      <button
                        key={cat.en}
                        type="button"
                        onClick={() => setCategory(cat.en)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                          active
                            ? 'bg-slate-900 text-white shadow-sm'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {getCategoryLabel(cat)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Message Textarea */}
              <div>
                <label
                  htmlFor="feedback-comment"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2"
                >
                  {language === 'am'
                    ? 'የእርስዎ አስተያየት ወይም ጥቆማ'
                    : language === 'om'
                    ? 'Yaada ykn Yaada Fooyya’iinsaa'
                    : 'Your Comments & Suggestions'}
                </label>

                <textarea
                  id="feedback-comment"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  placeholder={
                    t.feedbackPlaceholder ||
                    'What went well? Any issues with finding a room, office, or service?'
                  }
                  className="w-full rounded-2xl border border-slate-200 p-4 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition resize-none"
                />
              </div>

              {/* Error Alert */}
              {error && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 px-6 rounded-2xl bg-slate-900 text-white font-semibold text-sm hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {submitting
                  ? (language === 'am' ? 'በመላክ ላይ...' : language === 'om' ? 'Ergaa jira...' : 'Submitting Feedback...')
                  : (t.submitFeedback || 'Send Feedback')}
              </button>
            </form>
          </div>
        )}
      </main>

      <FloatingHelp />
    </div>
  );
}
