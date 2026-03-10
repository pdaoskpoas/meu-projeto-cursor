import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface BackNavigationProps {
  to?: string;
  text?: string;
  className?: string;
}

const BackNavigation: React.FC<BackNavigationProps> = ({ 
  to = '/', 
  text = 'Voltar ao site',
  className = '' 
}) => {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Link 
        to={to} 
        className="group inline-flex items-center space-x-3 bg-white/70 backdrop-blur-sm hover:bg-white/90 px-6 py-3 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20 hover:border-white/40"
      >
        <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full group-hover:from-blue-600 group-hover:to-indigo-700 transition-all duration-300">
          <ArrowLeft className="h-4 w-4 text-white" />
        </div>
        <span className="font-semibold text-slate-700 group-hover:text-slate-900 transition-colors">
          {text}
        </span>
      </Link>
    </div>
  );
};

export default BackNavigation;
