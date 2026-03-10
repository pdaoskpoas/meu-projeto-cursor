import React from 'react';

const TermsPage = () => {
  return (
    <main className="container-responsive section-spacing min-h-screen bg-background">
      <div className="max-w-3xl mx-auto space-content">
        <h1 className="text-3xl font-bold text-slate-900 mb-4">Termos de Uso</h1>
        <p className="text-slate-600 mb-6">
          Este documento define os termos e condições para uso da plataforma Vitrine do Cavalo.
          Em breve, publicaremos a versão completa com todas as regras e responsabilidades.
        </p>
        <p className="text-slate-600">
          Para dúvidas imediatas, entre em contato pelo e-mail
          <span className="font-semibold text-slate-800"> contato@vitrinedocavalo.com.br</span>.
        </p>
      </div>
    </main>
  );
};

export default TermsPage;
