import React from 'react';

const ContactPage = () => {
  return (
    <main className="container-responsive section-spacing min-h-screen bg-background">
      <div className="max-w-3xl mx-auto space-content">
        <h1 className="text-3xl font-bold text-slate-900 mb-4">Contato</h1>
        <p className="text-slate-600 mb-6">
          Nosso time está pronto para ajudar. Responderemos o mais rápido possível.
        </p>
        <div className="text-slate-700 space-y-2">
          <p>
            <span className="font-semibold">E-mail:</span> contato@vitrinedocavalo.com.br
          </p>
          <p>
            <span className="font-semibold">Local:</span> São Paulo, SP - Brasil
          </p>
        </div>
      </div>
    </main>
  );
};

export default ContactPage;
