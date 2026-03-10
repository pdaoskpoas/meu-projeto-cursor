import React from 'react';

interface AppContentProps {
  children: React.ReactNode;
  sidebarOpen: boolean;
  hasSidebar: boolean;
}

const AppContent: React.FC<AppContentProps> = ({ children }) => {
  return (
    <main className="flex-1 min-h-0 bg-gray-50">
      <div className="py-6">
        {children}
      </div>
    </main>
  );
};

export default AppContent;
