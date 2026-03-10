import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { pageVisitService } from '@/services/pageVisitService';

const PageVisitTracker: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    void pageVisitService.trackPageVisit({
      pathname: location.pathname,
      search: location.search,
      userId: user?.id,
    });
  }, [location.pathname, location.search, user?.id]);

  return null;
};

export default PageVisitTracker;
