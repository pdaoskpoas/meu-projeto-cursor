import React from 'react';

const PrivacyPage = () => {
  return (
    <main className="container-responsive section-spacing min-h-screen bg-background">
      <div className="max-w-3xl mx-auto space-content">
        <h1 className="text-3xl font-bold text-slate-900 mb-4">Política de Privacidade</h1>
        <p className="text-slate-600 mb-6">
          Esta Politica de Privacidade descreve como tratamos seus dados pessoais na plataforma
          Vitrine do Cavalo, em conformidade com a LGPD (Lei n 13.709/2018).
        </p>

        <section className="space-y-3 text-slate-700">
          <h2 className="text-xl font-semibold text-slate-900">1. Dados coletados</h2>
          <p>
            Coletamos dados fornecidos por voce no cadastro e uso da plataforma, incluindo nome,
            e-mail, CPF, telefone, dados de perfil, conteudos publicados e interacoes (mensagens,
            favoritos, cliques e acessos).
          </p>
        </section>

        <section className="space-y-3 text-slate-700">
          <h2 className="text-xl font-semibold text-slate-900">2. Finalidades do tratamento</h2>
          <p>
            Utilizamos seus dados para operar a plataforma, autenticar usuarios, viabilizar pagamentos,
            prevenir fraudes, entregar funcionalidades contratadas, melhorar a experiencia de navegacao,
            gerar metricas administrativas e atender obrigacoes legais.
          </p>
        </section>

        <section className="space-y-3 text-slate-700">
          <h2 className="text-xl font-semibold text-slate-900">3. Base legal</h2>
          <p>
            Tratamos dados com base na execucao de contrato, cumprimento de obrigacao legal,
            exercicio regular de direitos e legitimo interesse, sempre observando os direitos
            e liberdades fundamentais do titular.
          </p>
        </section>

        <section className="space-y-3 text-slate-700">
          <h2 className="text-xl font-semibold text-slate-900">4. Compartilhamento de dados</h2>
          <p>
            Podemos compartilhar dados com operadores essenciais para funcionamento do servico,
            como provedor de infraestrutura, servicos de autenticacao, banco de dados e processadores
            de pagamento. Nao vendemos dados pessoais.
          </p>
        </section>

        <section className="space-y-3 text-slate-700">
          <h2 className="text-xl font-semibold text-slate-900">5. Retencao e seguranca</h2>
          <p>
            Adotamos medidas tecnicas e administrativas para proteger os dados contra acesso nao
            autorizado, perda e uso indevido. Os dados sao mantidos pelo tempo necessario para as
            finalidades descritas e para cumprimento de obrigacoes legais/regulatorias.
          </p>
        </section>

        <section className="space-y-3 text-slate-700">
          <h2 className="text-xl font-semibold text-slate-900">6. Direitos do titular</h2>
          <p>
            Voce pode solicitar confirmacao de tratamento, acesso, correcao, anonimização, portabilidade,
            eliminacao (quando aplicavel) e informacoes sobre compartilhamentos, conforme a LGPD.
          </p>
        </section>

        <section className="space-y-3 text-slate-700">
          <h2 className="text-xl font-semibold text-slate-900">7. Cookies e analytics</h2>
          <p>
            Utilizamos tecnologias de sessao e analytics para seguranca, autenticacao, prevencao de abusos
            e melhoria da plataforma. Esses dados podem incluir identificadores de sessao, paginas acessadas
            e eventos de navegacao.
          </p>
        </section>

        <section className="space-y-3 text-slate-700">
          <h2 className="text-xl font-semibold text-slate-900">8. Contato</h2>
          <p>
            Para exercer seus direitos ou tirar duvidas sobre privacidade, entre em contato em
            <span className="font-semibold text-slate-800"> contato@vitrinedocavalo.com.br</span>.
          </p>
          <p className="text-sm text-slate-500">Ultima atualizacao: 10/03/2026</p>
        </section>
      </div>
    </main>
  );
};

export default PrivacyPage;
