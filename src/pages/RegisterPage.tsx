import React from 'react';
import AuthLayout, { AuthCard } from '@/components/auth/AuthLayout';
import RegisterForm from '@/components/auth/RegisterForm';
import { useRegister } from '@/hooks/useRegister';

const RegisterPage: React.FC = () => {
  const { isSubmitting, handleRegister } = useRegister();

  return (
    <AuthLayout>
      <AuthCard>
        <RegisterForm 
          onSubmit={handleRegister}
          isSubmitting={isSubmitting}
        />
      </AuthCard>
    </AuthLayout>
  );
};

export default RegisterPage;