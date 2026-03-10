import React from 'react';
import { cn } from '@/lib/utils';

interface SectionContainerProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'gray' | 'gradient';
  size?: 'tight' | 'default' | 'relaxed' | 'spacious';
  divider?: 'none' | 'top' | 'bottom' | 'both';
}

const SectionContainer: React.FC<SectionContainerProps> = ({ 
  children, 
  className,
  variant = 'default',
  size = 'default',
  divider = 'none'
}) => {
  const baseClasses = "w-full relative";
  
  const variantClasses = {
    default: "bg-white",
    gray: "bg-slate-50",
    gradient: "bg-gradient-to-br from-slate-50 via-white to-blue-50"
  };

  // Sistema de espaçamento otimizado e moderno
  const sizeClasses = {
    tight: "py-8 sm:py-10 lg:py-12",      // 32px → 40px → 48px - Seções relacionadas
    default: "py-10 sm:py-12 lg:py-14",   // 40px → 48px → 56px - Padrão
    relaxed: "py-12 sm:py-14 lg:py-16",   // 48px → 56px → 64px - Entre blocos diferentes
    spacious: "py-14 sm:py-16 lg:py-20"   // 56px → 64px → 80px - Hero e seções especiais
  };

  // Divisores visuais sutis
  const getDividerClasses = () => {
    const classes = [];
    
    if (divider === 'top' || divider === 'both') {
      classes.push('before:absolute before:top-0 before:left-1/2 before:-translate-x-1/2 before:w-24 before:h-px before:bg-gradient-to-r before:from-transparent before:via-slate-300 before:to-transparent');
    }
    
    if (divider === 'bottom' || divider === 'both') {
      classes.push('after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:w-24 after:h-px after:bg-gradient-to-r after:from-transparent after:via-slate-300 after:to-transparent');
    }
    
    return classes.join(' ');
  };

  return (
    <section className={cn(
      baseClasses,
      variantClasses[variant],
      sizeClasses[size],
      getDividerClasses(),
      className
    )}>
      <div className="container-responsive">
        {children}
      </div>
    </section>
  );
};

export default SectionContainer;
