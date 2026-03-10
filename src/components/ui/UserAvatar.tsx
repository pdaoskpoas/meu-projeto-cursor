import React from 'react';
import { User as UserIcon } from 'lucide-react';

interface User {
  id: string;
  name: string;
  avatar?: string | null;
  avatarUrl?: string | null;
  avatar_url?: string | null;
}

interface UserAvatarProps {
  user?: User | null;
  src?: string;
  alt?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showVerified?: boolean;
}

export function UserAvatar({ 
  user,
  src, 
  alt, 
  size = 'md', 
  className = '', 
  showVerified = false 
}: UserAvatarProps) {
  const [imageError, setImageError] = React.useState(false);
  
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  // Se user foi passado, pegar avatar, avatar_url ou avatarUrl
  const avatarSrc = user ? (user.avatar || user.avatar_url || user.avatarUrl) : src;
  const displayName = user?.name || alt || 'User';

  return (
    <div className={`relative ${className}`}>
      {avatarSrc && !imageError ? (
        <img 
          src={avatarSrc} 
          alt={displayName}
          className={`${sizeClasses[size]} rounded-xl object-cover`}
          onError={() => {
            // Se a imagem falhar ao carregar, mostrar fallback
            setImageError(true);
          }}
        />
      ) : (
        <div className={`${sizeClasses[size]} bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center`}>
          <UserIcon className={`${iconSizes[size]} text-white`} />
        </div>
      )}
      {showVerified && (
        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
          <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      )}
    </div>
  );
}


