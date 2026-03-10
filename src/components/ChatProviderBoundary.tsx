import React, { Suspense } from 'react';

const LazyChatProvider = React.lazy(() =>
  import('@/contexts/ChatContext').then((module) => ({ default: module.ChatProvider }))
);

interface ChatProviderBoundaryProps {
  children: React.ReactNode;
}

const ChatProviderBoundary: React.FC<ChatProviderBoundaryProps> = ({ children }) => {
  return (
    <Suspense fallback={null}>
      <LazyChatProvider>{children}</LazyChatProvider>
    </Suspense>
  );
};

export default ChatProviderBoundary;
