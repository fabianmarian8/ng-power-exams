
import React from 'react';
import footerPattern from '@/assets/footer-pattern.jpg';

const Footer: React.FC = () => {
  return (
    <footer className="relative bg-white border-t border-gray-200 mt-12 overflow-hidden">
      <div 
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `url(${footerPattern})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      />
      <div className="relative container mx-auto py-6 px-4 text-center text-gray-500">
        <p>&copy; {new Date().getFullYear()} Naija Power & Portal Hub. All Rights Reserved.</p>
        <p className="text-sm mt-1">Providing essential information for Nigerians.</p>
      </div>
    </footer>
  );
};

export default Footer;
