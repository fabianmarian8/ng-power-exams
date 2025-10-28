
import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-gray-200 mt-12">
      <div className="container mx-auto py-6 px-4 text-center text-gray-500">
        <p>&copy; {new Date().getFullYear()} Naija Power & Portal Hub. All Rights Reserved.</p>
        <p className="text-sm mt-1">Providing essential information for Nigerians.</p>
      </div>
    </footer>
  );
};

export default Footer;
