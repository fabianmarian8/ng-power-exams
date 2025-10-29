
import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import PowerOutages from './pages/PowerOutages';
import ExamResults from './pages/ExamResults';
import { LanguageProvider } from './contexts/LanguageContext';
import { DataSourcesDebug } from './components/DataSourcesDebug';

const App: React.FC = () => {
  return (
    <LanguageProvider>
      <HashRouter>
        <div className="flex flex-col min-h-screen bg-brand-light text-brand-dark">
          <Header />
          <main className="flex-grow container mx-auto px-4 py-8">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/outages" element={<PowerOutages />} />
              <Route path="/exams" element={<ExamResults />} />
            </Routes>
          </main>
          <Footer />
          {/* Debug panel - only visible in development */}
          <DataSourcesDebug />
        </div>
      </HashRouter>
    </LanguageProvider>
  );
};

export default App;
