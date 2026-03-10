// src/pages/TestUploadPage.tsx

import React from 'react';
import { TestUpload } from '@/components/animal/NewAnimalWizard/debug/TestUpload';
import { TestSinglePhoto } from '@/components/animal/NewAnimalWizard/debug/TestSinglePhoto';

export default function TestUploadPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold text-center mb-8">
        Página de Teste - Upload de Imagens
      </h1>
      
      <div className="space-y-8">
        <TestSinglePhoto />
        <TestUpload />
      </div>
      
      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg max-w-2xl mx-auto">
        <p className="text-sm text-yellow-800">
          ⚠️ Esta é uma página de teste para debugar o upload de imagens.
          Abra o console do navegador (F12) para ver logs detalhados.
        </p>
      </div>
    </div>
  );
}
