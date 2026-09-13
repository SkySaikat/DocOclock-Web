import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'outline' | 'danger' | 'gradient';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  fullWidth = false, 
  className = '',
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center rounded-full font-display font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed";

  // `btn-sheen` (index.css) is Figma's documented hover treatment for filled
  // pill buttons — a soft radial highlight that fades in on hover. Figma
  // applies it to solid accent-colored CTAs specifically (confirmed on both
  // the generic Button component and the Doctor Card's "Get an Appointment"
  // button), not on light/outline/secondary variants.
  const variants = {
    primary: "btn-sheen bg-medical-500 text-white hover:bg-medical-600 shadow-md shadow-medical-200",
    secondary: "bg-sky-100 text-medical-700 hover:bg-sky-200",
    accent: "btn-sheen bg-teal-500 text-white hover:bg-teal-600 shadow-md shadow-teal-200",
    outline: "border-2 border-medical-500 text-medical-500 hover:bg-medical-50",
    danger: "bg-red-500 text-white hover:bg-red-600",
    // Dococlock brand gradient CTA (navbar/hero/closing-band pill buttons)
    gradient: "btn-sheen bg-gradient-to-b from-medical-500 to-medical-600 text-white hover:brightness-105 shadow-md shadow-medical-200"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-5 py-2.5 text-base",
    lg: "px-6 py-3.5 text-lg"
  };

  return (
    <button
      className={`
        ${baseStyles} 
        ${variants[variant]} 
        ${sizes[size]} 
        ${fullWidth ? 'w-full' : ''} 
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
};