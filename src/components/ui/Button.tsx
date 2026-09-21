import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'danger';
  isLoading?: boolean;
  loadingText?: string;
}

const variantStyles: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'bg-blue-600 hover:bg-blue-700 focus-visible:ring-blue-500 text-white',
  danger:  'bg-red-600 hover:bg-red-700 focus-visible:ring-red-500 text-white',
};

export function Button({
  children,
  variant = 'primary',
  isLoading = false,
  loadingText = 'Cargando...',
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || isLoading}
      className={`
        inline-flex items-center justify-center px-4 py-2
        text-sm font-medium rounded-md
        transition-colors duration-150
        focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantStyles[variant]}
        ${className}
      `}
      {...props}
    >
      {isLoading ? loadingText : children}
    </button>
  );
}
