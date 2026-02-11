import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverEffect?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', onClick, hoverEffect = false }) => {
  return (
    <div 
      onClick={onClick}
      className={`
        glass-panel 
        rounded-3xl 
        p-8 
        transition-all 
        duration-300 
        relative
        overflow-hidden
        ${hoverEffect ? 'glass-panel-hover hover:-translate-y-1 cursor-pointer' : ''} 
        ${className}
      `}
    >
      {/* Shine effect */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/60 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
      {children}
    </div>
  );
};