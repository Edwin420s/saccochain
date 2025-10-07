import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const LandingPage = () => {
  const { t, i18n } = useTranslation();
  const [darkMode, setDarkMode] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
      {/* Navigation */}
      <nav className="bg-white dark:bg-gray-800 shadow-lg fixed w-full z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                SACCOChain
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => i18n.changeLanguage(i18n.language === 'en' ? 'sw' : 'en')}
                className="px-3 py-2 text-gray-600 dark:text-gray-300 hover:text-blue-600"
              >
                {i18n.language === 'en' ? 'SW' : 'EN'}
              </button>
              
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 text-gray-600 dark:text-gray-300 hover:text-blue-600"
              >
                {darkMode ? '☀️' : '🌙'}
              </button>
              
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                {t('getStarted')}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 pb-16 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">
            {t('heroTitle')}
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            {t('heroSubtitle')}
          </p>
          <div className="flex justify-center space-x-4">
            <button className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 text-lg">
              {t('getStarted')}
            </button>
            <button className="border border-blue-600 text-blue-600 dark:text-blue-400 px-8 py-3 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-800 text-lg">
              {t('watchDemo')}
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
            {t('features')}
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {['hybridBlockchain', 'smartLoans', 'creditScoring'].map((feature) => (
              <div key={feature} className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-lg">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  {t(`features.${feature}.title`)}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {t(`features.${feature}.description`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto text-center px-4">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            {t('newsletter.title')}
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            {t('newsletter.subtitle')}
          </p>
          <div className="flex max-w-md mx-auto">
            <input
              type="email"
              placeholder={t('newsletter.placeholder')}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button className="bg-blue-600 text-white px-6 py-2 rounded-r-lg hover:bg-blue-700">
              {t('newsletter.subscribe')}
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p>&copy; 2024 SACCOChain. {t('footer.rights')}</p>
        </div>
      </footer>

      {/* Chatbot */}
      {showChatbot && (
        <div className="fixed bottom-20 right-4 w-80 h-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl">
          {/* Chatbot UI */}
        </div>
      )}
      
      <button
        onClick={() => setShowChatbot(!showChatbot)}
        className="fixed bottom-4 right-4 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700"
      >
        💬
      </button>
    </div>
  );
};

export default LandingPage;