import React from 'react';
import Breadcrumb from '@/components/ui/breadcrumb';
import QuickStatsBar from '@/components/dashboard/QuickStatsBar';
import { cn } from '@/lib/utils';

interface ModernDashboardWrapperProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  showStats?: boolean;
  stats?: Array<{ label: string; value: string | number; icon?: React.ComponentType<{ className?: string }> }>;
  breadcrumbItems?: Array<{ label: string; href?: string }>;
  className?: string;
}

const ModernDashboardWrapper: React.FC<ModernDashboardWrapperProps> = ({ 
  children, 
  title, 
  subtitle, 
  actions,
  showStats = false,
  stats,
  breadcrumbItems,
  className = ''
}) => {
  return (
    <div className={cn('bg-gradient-to-br from-slate-50 via-white to-slate-50', className)}>
      {/* Breadcrumb Navigation */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-3">
        <Breadcrumb items={breadcrumbItems} />
      </div>

      {/* Page Header */}
      {(title || subtitle || actions || showStats) && (
        <div className="bg-white border-b border-slate-200">
          <div className="px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              {/* Title and Subtitle */}
              <div className="flex-1 min-w-0">
                {title && (
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 mb-2">
                    {title}
                  </h1>
                )}
                {subtitle && (
                  <p className="text-sm sm:text-base lg:text-lg text-slate-600">
                    {subtitle}
                  </p>
                )}
              </div>

              {/* Actions */}
              {actions && (
                <div className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center lg:w-auto flex-shrink-0">
                  {actions}
                </div>
              )}
            </div>

            {/* Quick Stats */}
            {showStats && (
              <div className="mt-6 pt-6 border-t border-slate-100">
                <QuickStatsBar stats={stats} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Page Content */}
      <div className="flex-1 px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

export default ModernDashboardWrapper;




