import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { pageVisitService } from '@/services/pageVisitService';

const PageVisitTracker: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();
  const lastExecutionRef = useRef(0);

  useEffect(() => {
    const now = Date.now();
    if (now - lastExecutionRef.current < 1000) {
      return;
    }

    lastExecutionRef.current = now;

    void pageVisitService.trackPageVisit({
      pathname: location.pathname,
      search: location.search,
      userId: user?.id,
    });
  }, [location.pathname, location.search, user?.id]);

  return null;
};

export default PageVisitTracker;
