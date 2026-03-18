import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export default function Button({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles = 'rounded-lg font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 touch-manipulation inline-flex items-center justify-center';

  const sizeStyles = {
    sm: 'px-3 py-2 text-sm min-h-[36px]',
    md: 'px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base min-h-[44px]',
    lg: 'px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg min-h-[52px]',
  };

  const variantStyles = {
    primary: disabled
      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
      : 'bg-[#E8621A] text-white hover:opacity-90 active:opacity-80 focus:ring-[#E8621A] shadow-md hover:shadow-lg',
    secondary: disabled
      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
      : 'bg-[#1A1A1A] text-white hover:bg-gray-700 active:bg-gray-800 focus:ring-[#1A1A1A] shadow-md hover:shadow-lg',
    outline: disabled
      ? 'border-2 border-gray-300 text-gray-500 cursor-not-allowed'
      : 'border-2 border-[#1A1A1A] text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white focus:ring-[#1A1A1A]',
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled}
      aria-disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
