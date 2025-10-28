
import React from 'react';
import { NavLink } from 'react-router-dom';
import { ICONS } from '../constants';
import { useLanguage } from '../contexts/LanguageContext';
import { LanguageSwitcher } from './LanguageSwitcher';

const Header: React.FC = () => {
  const { texts } = useLanguage();
  const linkClass = "text-gray-600 hover:text-brand-green transition-colors px-3 py-2 rounded-md text-sm font-medium";
  const activeLinkClass = "text-brand-green bg-green-50";

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <NavLink to="/" className="flex items-center space-x-2">
             <ICONS.Bolt />
            <span className="font-bold text-xl text-brand-green">NaijaHub</span>
          </NavLink>
          <div className="flex items-center">
            <nav className="hidden md:flex items-center space-x-4">
              <NavLink to="/" className={({ isActive }) => `${linkClass} ${isActive ? activeLinkClass : ''}`}>
                {texts.navHome}
              </NavLink>
              <NavLink to="/outages" className={({ isActive }) => `${linkClass} ${isActive ? activeLinkClass : ''}`}>
                {texts.navOutages}
              </NavLink>
              <NavLink to="/exams" className={({ isActive }) => `${linkClass} ${isActive ? activeLinkClass : ''}`}>
                {texts.navExams}
              </NavLink>
            </nav>
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
