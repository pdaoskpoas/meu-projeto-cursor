import React from 'react';
import AuthLayout, { AuthCard } from '@/components/auth/AuthLayout';
import LoginForm from '@/components/auth/LoginForm';
import { useLogin } from '@/hooks/useLogin';

const LoginPage: React.FC = () => {
  const { isSubmitting, handleLogin } = useLogin();

  return (
    <AuthLayout>
      <AuthCard>
        <LoginForm 
          onSubmit={handleLogin}
          isSubmitting={isSubmitting}
        />
      </AuthCard>
    </AuthLayout>
  );
};

export default LoginPage;
