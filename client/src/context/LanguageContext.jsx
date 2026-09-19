import React, { createContext, useContext, useState } from 'react';

const LanguageContext = createContext();

const translations = {
  en: {
    buildingGuide: 'Building Guide',
    tagline: 'Scan. Search. Find.',
    searchPlaceholder: 'Search offices, people, or amenities...',
    secureVisitorPortal: 'Secure Visitor Portal',
    centralBusinessDistrict: 'Central Business District',
    welcomeMessage: 'Welcome to our digital visitor guide platform.',
    exploreBuilding: 'Explore the Building / Choose Your Floor',
    searchResults: 'Search Results',
    searching: 'Searching...',
    noResults: 'No results found for',
    office: 'Office',
    service: 'Service',
    employee: 'Employee',
    department: 'Department',
    facility: 'Facility',
    feedback: 'Feedback',
    giveFeedback: 'Give Feedback',
    rateYourVisit: 'Rate Your Experience',
    feedbackPlaceholder: 'Share your thoughts, suggestions, or report an issue...',
    feedbackSuccess: 'Thank you! Your feedback has been submitted successfully.',
    backToHome: 'Back to Home',
    submitFeedback: 'Submit Feedback',
  },

  am: {
    buildingGuide: 'የህንፃ መመሪያ',
    tagline: 'ስካን። ፈልግ። አግኝ።',
    searchPlaceholder: 'ቢሮዎችን፣ ሰራተኞችን ወይም አገልግሎቶችን ይፈልጉ...',
    secureVisitorPortal: 'አስተማማኝ የጎብኚ መግቢያ',
    centralBusinessDistrict: 'ማዕከላዊ የንግድ አካባቢ',
    welcomeMessage: 'ወደ ዲጂታል የጎብኚ መመሪያችን እንኳን በደህና መጡ።',
    exploreBuilding: 'ህንፃውን ይመልከቱ / ፎቅዎን ይምረጡ',
    searchResults: 'የፍለጋ ውጤቶች',
    searching: 'በመፈለግ ላይ...',
    noResults: 'ምንም ውጤት አልተገኘም ለ',
    office: 'ቢሮ',
    service: 'አገልግሎት',
    employee: 'ሰራተኛ',
    department: 'ዲፓርትመንት',
    facility: 'አገልግሎት ቦታ',
    feedback: 'አስተያየት',
    giveFeedback: 'አስተያየት ይስጡ',
    rateYourVisit: 'ልምድዎን ደረጃ ይስጡ',
    feedbackPlaceholder: 'አስተያየትዎን፣ ሃሳብዎን ወይም ጥያቄዎን እዚህ ያካፍሉን...',
    feedbackSuccess: 'እናመሰግናለን! አስተያየትዎ በተሳካ ሁኔታ ተልኳል።',
    backToHome: 'ወደ ዋና ገጽ ተመለስ',
    submitFeedback: 'አስተያየት ላክ',
  },

  om: {
    buildingGuide: 'Qajeelcha Gamoo',
    tagline: 'Skaanii. Barbaadi. Argadhu.',
    searchPlaceholder: 'Waajjira, hojjetaa ykn tajaajila barbaadi...',
    secureVisitorPortal: 'Karoorra Daawwattootaa Eegamaa',
    centralBusinessDistrict: 'Naannoo Daldalaa Giddugaleessaa',
    welcomeMessage: 'Gara qajeelcha daawwattootaa dijitaalaa keenyaatti baga nagaan dhuftan.',
    exploreBuilding: 'Gamoo Sakatta’i / Darbii Kee Filadhu',
    searchResults: 'Bu’aa Barbaachaa',
    searching: 'Barbaadaa jira...',
    noResults: 'Bu’aan hin argamne',
    office: 'Waajjira',
    service: 'Tajaajila',
    employee: 'Hojjetaa',
    department: 'Kutaa',
    facility: 'Bakka Tajaajilaa',
    feedback: 'Yaada',
    giveFeedback: 'Yaada Kennaa',
    rateYourVisit: 'Muuxannoo Kee Madaali',
    feedbackPlaceholder: 'Yaada, yaada fooyya’iinsaa ykn komii keessan nuuf qoodaa...',
    feedbackSuccess: 'Galatoomaa! Yaanni keessan milkaa’inaan ergameera.',
    backToHome: 'Gara Fuula Duraatti Deebi’i',
    submitFeedback: 'Yaada Ergi',
  },
};

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState('en');

  const t = translations[language] || translations.en;

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error('useLanguage must be used inside LanguageProvider');
  }

  return context;
}