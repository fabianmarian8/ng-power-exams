import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { ICONS } from '../constants';
import { Badge } from '../components/ui/Badge';
import { useLanguage } from '../contexts/LanguageContext';
import { heroImage, powerOutageCardImage, examResultsCardImage } from '../assets/images';
import { formatNigerianTime } from '../utils/date';
import { useLatestNews } from '../hooks/useNews';

const Home: React.FC = () => {
  const { texts } = useLanguage();

  // Fetch latest news with auto-refresh
  const { news, loading, error, refresh } = useLatestNews(10);

  return (
    <div className="space-y-12">
      <section 
        className="relative text-center bg-gray-800 text-white py-20 px-4 rounded-lg shadow-2xl overflow-hidden"
        style={{ backgroundImage: `url(${heroImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
      >
        <div className="absolute inset-0 bg-black opacity-60"></div>
        <div className="relative z-10">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
            {texts.homeTitle}
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-lg sm:text-xl text-gray-300">
            {texts.homeSubtitle}
          </p>
        </div>
      </section>

      <section className="grid md:grid-cols-2 gap-8">
        <Link to="/outages" className="block group">
          <Card className="h-full transform transition-transform duration-300 group-hover:scale-105 group-hover:shadow-xl">
             <div className="h-48 overflow-hidden">
                <img src={powerOutageCardImage} alt="Family enjoying electricity" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
              </div>
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <ICONS.Bolt />
                <span className="ml-2">{texts.powerOutageTrackerTitle}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                {texts.powerOutageTrackerDescription}
              </p>
              <div className="mt-4 font-semibold text-brand-green flex items-center">
                {texts.checkOutageStatus} <ICONS.ChevronRight className="transform transition-transform duration-300 group-hover:translate-x-1" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/exams" className="block group">
          <Card className="h-full transform transition-transform duration-300 group-hover:scale-105 group-hover:shadow-xl">
             <div className="h-48 overflow-hidden">
                <img src={examResultsCardImage} alt="Nigerian students studying" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
              </div>
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <ICONS.BookOpen />
                <span className="ml-2">{texts.examResultsPortalTitle}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                {texts.examResultsPortalDescription}
              </p>
              <div className="mt-4 font-semibold text-brand-green flex items-center">
                {texts.viewExamGuides} <ICONS.ChevronRight className="transform transition-transform duration-300 group-hover:translate-x-1" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </section>

      <section>
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>{texts.liveNewsBoard}</CardTitle>
              <button
                onClick={refresh}
                disabled={loading}
                className="text-sm text-brand-green hover:underline disabled:opacity-50"
              >
                {loading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-yellow-700 text-sm">
                <p>Unable to load latest news. Showing cached data.</p>
              </div>
            )}
            {loading && news.length === 0 ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-green mx-auto mb-2"></div>
                <p className="text-gray-500 text-sm">Loading latest news...</p>
              </div>
            ) : (
              <ul className="space-y-4">
                {news.slice(0, 6).map(item => (
                  <li key={item.id} className="border-b pb-2 last:border-b-0">
                    <div className="flex items-center mb-1">
                      <Badge color={item.category === 'ENERGY' ? 'yellow' : 'blue'}>{item.category}</Badge>
                      <span className="text-xs text-gray-500 ml-2">{formatNigerianTime(item.timestamp)}</span>
                    </div>
                    <h4 className="font-semibold text-gray-800">{item.title}</h4>
                    <p className="text-sm text-gray-600">{item.summary}</p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default Home;