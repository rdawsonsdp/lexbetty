import React from 'react';

interface BadgeProps {
  variant?: 'default' | 'breakfast' | 'lunch' | 'dessert' | 'success' | 'warning';
  children: React.ReactNode;
  className?: string;
}

export default function Badge({ variant = 'default', children, className = '' }: BadgeProps) {
  const variantStyles = {
    default: 'bg-[#E8621A]/30 text-[#383838] border border-[#E8621A]',
    breakfast: 'bg-[#E8621A]/20 text-[#383838] border border-[#E8621A]',
    lunch: 'bg-[#E8621A]/20 text-[#383838] border border-[#E8621A]',
    dessert: 'bg-[#E8621A]/20 text-[#383838] border border-[#E8621A]',
    success: 'bg-green-100 text-green-800 border border-green-200',
    warning: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
  };

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs sm:text-sm font-semibold ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
