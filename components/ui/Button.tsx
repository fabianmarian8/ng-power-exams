
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
    variant?: 'primary' | 'secondary';
}

export const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', className = '', ...props }) => {
    const baseClasses = 'inline-flex items-center justify-center px-4 py-2 border text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2';
    const variantClasses = {
        primary: 'border-transparent text-white bg-brand-green hover:bg-green-700 focus:ring-brand-green',
        secondary: 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-brand-green'
    };

    return (
        <button
            type="button"
            className={`${baseClasses} ${variantClasses[variant]} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
};
