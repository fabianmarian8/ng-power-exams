import React from 'react';

// This interface allows standard div attributes (like onClick) to be passed through.
interface CardPartProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const Card: React.FC<CardPartProps> = ({ children, className = '', ...props }) => {
  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden ${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardHeader: React.FC<CardPartProps> = ({ children, className = '', ...props }) => {
  return <div className={`p-4 border-b border-gray-200 ${className}`} {...props}>{children}</div>;
};

export const CardContent: React.FC<CardPartProps> = ({ children, className = '', ...props }) => {
  return <div className={`p-4 ${className}`} {...props}>{children}</div>;
};

// CardTitle renders an h3, so it should accept heading element attributes.
interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
    children: React.ReactNode;
}

export const CardTitle: React.FC<CardTitleProps> = ({ children, className = '', ...props }) => {
    return <h3 className={`text-lg font-semibold text-gray-800 ${className}`} {...props}>{children}</h3>
}