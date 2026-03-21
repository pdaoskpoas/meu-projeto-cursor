import React from 'react';
import { Link } from 'react-router-dom';

const PrivacyPage = () => {
  return (
    <main className="container-responsive section-spacing min-h-screen bg-background">
      <div className="max-w-3xl mx-auto space-content py-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Politica de Privacidade</h1>
        <p className="text-sm text-slate-500 mb-1">Versao 1.0</p>
        <p className="text-sm text-slate-500 mb-8">Ultima atualizacao: 21/03/2026</p>

        <p className="text-slate-700 mb-6">
          Esta Politica de Privacidade ("Politica") descreve como a <strong>Vitrine do Cavalo</strong>{' '}
          ("Plataforma", "Nos"), operada por Vitrine do Cavalo Tecnologia Ltda., pessoa juridica de
          direito privado, inscrita no CNPJ/MF sob o n. [CNPJ], com sede em [ENDERECO COMPLETO],
          coleta, utiliza, armazena, compartilha, protege e elimina dados pessoais de seus usuarios
          e visitantes, em conformidade com a Lei Geral de Protecao de Dados Pessoais
          (LGPD - Lei n. 13.709/2018), o Marco Civil da Internet (Lei n. 12.965/2014) e
          demais normas aplicaveis.
        </p>
        <p className="text-slate-700 mb-6">
          Ao acessar ou utilizar a Plataforma, voce ("Usuario", "Titular") declara ter lido,
          compreendido e concordado com esta Politica. <strong>Caso nao concorde, nao utilize
          a Plataforma.</strong> Esta Politica deve ser lida em conjunto com nossos{' '}
          <Link to="/terms" className="text-blue-600 underline hover:text-blue-800">Termos de Uso</Link>,
          que constituem parte integrante deste instrumento.
        </p>

        {/* 1 */}
        <section className="space-y-3 text-slate-700 mb-6">
          <h2 className="text-xl font-semibold text-slate-900">1. Definicoes</h2>
          <p>
            Para fins desta Politica, aplicam-se as seguintes definicoes, em consonancia com a LGPD (Art. 5):
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Dado Pessoal:</strong> informacao relacionada a pessoa natural identificada ou identificavel;</li>
            <li><strong>Dado Pessoal Sensivel:</strong> dado sobre origem racial/etnica, conviccao religiosa, opiniao politica, filiacao a sindicato, dado referente a saude ou a vida sexual, dado genetico ou biometrico;</li>
            <li><strong>Titular:</strong> pessoa natural a quem se referem os dados pessoais (voce, Usuario);</li>
            <li><strong>Controlador:</strong> Vitrine do Cavalo Tecnologia Ltda., a quem competem as decisoes sobre o tratamento de dados pessoais;</li>
            <li><strong>Operador:</strong> pessoa natural ou juridica que realiza o tratamento de dados pessoais em nome do Controlador;</li>
            <li><strong>Tratamento:</strong> toda operacao realizada com dados pessoais (coleta, producao, recepcao, classificacao, utilizacao, acesso, reproducao, transmissao, distribuicao, processamento, arquivamento, armazenamento, eliminacao, avaliacao, controle, modificacao, comunicacao, transferencia, difusao ou extracao);</li>
            <li><strong>Consentimento:</strong> manifestacao livre, informada e inequivoca pela qual o Titular concorda com o tratamento de seus dados;</li>
            <li><strong>ANPD:</strong> Autoridade Nacional de Protecao de Dados, orgao federal responsavel por fiscalizar o cumprimento da LGPD.</li>
          </ul>
        </section>

        {/* 2 */}
        <section className="space-y-3 text-slate-700 mb-6">
          <h2 className="text-xl font-semibold text-slate-900">2. Dados Pessoais Coletados</h2>
          <p>
            2.1. <strong>Dados fornecidos diretamente pelo Usuario:</strong>
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Dados cadastrais:</strong> nome completo, e-mail, CPF, telefone, data de nascimento, endereco (CEP, cidade, estado);</li>
            <li><strong>Dados de perfil:</strong> foto de perfil, nome do haras ou propriedade, descricao, localizacao (cidade/estado);</li>
            <li><strong>Conteudo publicado:</strong> anuncios de equinos (fotos, videos, descricoes, documentos, genealogia), eventos e informacoes de plantel;</li>
            <li><strong>Dados de comunicacao:</strong> mensagens trocadas com outros Usuarios dentro da Plataforma;</li>
            <li><strong>Dados de pagamento:</strong> informacoes necessarias para contratacao de planos e funcionalidades pagas. <strong>A Plataforma nao armazena dados de cartao de credito, dados bancarios ou informacoes financeiras sensiveis</strong> — o processamento e realizado integralmente por operadores de pagamento terceirizados.</li>
          </ul>
          <p>
            2.2. <strong>Dados coletados automaticamente:</strong>
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Dados de acesso e navegacao:</strong> endereco IP, tipo e versao do navegador, sistema operacional, resolucao de tela, paginas acessadas, URLs de referencia, data e hora de acesso;</li>
            <li><strong>Dados de uso e interacao:</strong> cliques, tempo de permanencia em paginas, funcionalidades utilizadas, pesquisas realizadas, anuncios visualizados;</li>
            <li><strong>Dados de dispositivo:</strong> identificadores unicos de dispositivo, informacoes de rede;</li>
            <li><strong>Cookies e tecnologias similares:</strong> identificadores de sessao, preferencias de navegacao, dados de autenticacao (conforme detalhado na Secao 9).</li>
          </ul>
          <p>
            2.3. <strong>Dados sensiveis:</strong> A Plataforma <strong>nao coleta intencionalmente</strong>{' '}
            dados pessoais sensiveis (Art. 5, II da LGPD), como dados de origem racial ou etnica,
            conviccao religiosa, opiniao politica, dados de saude ou dados biometricos. Caso o
            Usuario inclua voluntariamente informacoes dessa natureza em campos de texto livre
            (como descricoes de animais), o tratamento se dara exclusivamente para exibicao do
            conteudo conforme publicado pelo proprio Usuario, sob sua inteira responsabilidade.
          </p>
          <p>
            2.4. <strong>Dados de menores:</strong> A Plataforma nao e destinada a menores de 18
            (dezoito) anos e nao coleta intencionalmente dados de menores de idade. Caso tomemos
            conhecimento de que dados de um menor de 18 anos foram coletados sem o consentimento
            de um responsavel legal, tomaremos as medidas necessarias para eliminar tais dados
            no menor prazo possivel.
          </p>
        </section>

        {/* 3 */}
        <section className="space-y-3 text-slate-700 mb-6">
          <h2 className="text-xl font-semibold text-slate-900">3. Finalidades do Tratamento</h2>
          <p>
            3.1. Os dados pessoais coletados sao utilizados para as seguintes finalidades especificas:
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse border border-slate-300 mt-2">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-300 px-3 py-2 text-left font-semibold">Finalidade</th>
                  <th className="border border-slate-300 px-3 py-2 text-left font-semibold">Dados Utilizados</th>
                  <th className="border border-slate-300 px-3 py-2 text-left font-semibold">Base Legal (LGPD)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-slate-300 px-3 py-2">Criar e gerenciar conta</td>
                  <td className="border border-slate-300 px-3 py-2">Cadastrais, perfil</td>
                  <td className="border border-slate-300 px-3 py-2">Execucao de contrato (Art. 7, V)</td>
                </tr>
                <tr className="bg-slate-50">
                  <td className="border border-slate-300 px-3 py-2">Publicar e exibir anuncios</td>
                  <td className="border border-slate-300 px-3 py-2">Perfil, conteudo publicado</td>
                  <td className="border border-slate-300 px-3 py-2">Execucao de contrato (Art. 7, V)</td>
                </tr>
                <tr>
                  <td className="border border-slate-300 px-3 py-2">Permitir comunicacao entre Usuarios</td>
                  <td className="border border-slate-300 px-3 py-2">Cadastrais, mensagens</td>
                  <td className="border border-slate-300 px-3 py-2">Execucao de contrato (Art. 7, V)</td>
                </tr>
                <tr className="bg-slate-50">
                  <td className="border border-slate-300 px-3 py-2">Processar pagamentos de planos</td>
                  <td className="border border-slate-300 px-3 py-2">Cadastrais, pagamento</td>
                  <td className="border border-slate-300 px-3 py-2">Execucao de contrato (Art. 7, V)</td>
                </tr>
                <tr>
                  <td className="border border-slate-300 px-3 py-2">Autenticacao e seguranca</td>
                  <td className="border border-slate-300 px-3 py-2">Cadastrais, acesso, dispositivo</td>
                  <td className="border border-slate-300 px-3 py-2">Legitimo interesse (Art. 7, IX)</td>
                </tr>
                <tr className="bg-slate-50">
                  <td className="border border-slate-300 px-3 py-2">Prevencao de fraudes e abusos</td>
                  <td className="border border-slate-300 px-3 py-2">Cadastrais, acesso, uso, IP</td>
                  <td className="border border-slate-300 px-3 py-2">Legitimo interesse (Art. 7, IX)</td>
                </tr>
                <tr>
                  <td className="border border-slate-300 px-3 py-2">Melhoria da Plataforma e analytics</td>
                  <td className="border border-slate-300 px-3 py-2">Uso, navegacao (anonimizados)</td>
                  <td className="border border-slate-300 px-3 py-2">Legitimo interesse (Art. 7, IX)</td>
                </tr>
                <tr className="bg-slate-50">
                  <td className="border border-slate-300 px-3 py-2">Notificacoes sobre a conta</td>
                  <td className="border border-slate-300 px-3 py-2">E-mail</td>
                  <td className="border border-slate-300 px-3 py-2">Execucao de contrato (Art. 7, V)</td>
                </tr>
                <tr>
                  <td className="border border-slate-300 px-3 py-2">Comunicacoes promocionais</td>
                  <td className="border border-slate-300 px-3 py-2">E-mail, nome</td>
                  <td className="border border-slate-300 px-3 py-2">Consentimento (Art. 7, I)</td>
                </tr>
                <tr className="bg-slate-50">
                  <td className="border border-slate-300 px-3 py-2">Obrigacoes legais e regulatorias</td>
                  <td className="border border-slate-300 px-3 py-2">Cadastrais, transacoes</td>
                  <td className="border border-slate-300 px-3 py-2">Obrigacao legal (Art. 7, II)</td>
                </tr>
                <tr>
                  <td className="border border-slate-300 px-3 py-2">Exercicio regular de direitos</td>
                  <td className="border border-slate-300 px-3 py-2">Todos os dados pertinentes</td>
                  <td className="border border-slate-300 px-3 py-2">Exercicio regular de direitos (Art. 7, VI)</td>
                </tr>
                <tr className="bg-slate-50">
                  <td className="border border-slate-300 px-3 py-2">Estatisticas internas e metricas</td>
                  <td className="border border-slate-300 px-3 py-2">Uso e navegacao (agregados)</td>
                  <td className="border border-slate-300 px-3 py-2">Legitimo interesse (Art. 7, IX)</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="mt-3">
            3.2. Os dados pessoais nao serao tratados para finalidades incompativeis com as descritas acima.
            Caso surja necessidade de tratamento para nova finalidade, o Titular sera informado previamente
            e, quando exigido pela LGPD, sera solicitado novo consentimento.
          </p>
        </section>

        {/* 4 */}
        <section className="space-y-3 text-slate-700 mb-6">
          <h2 className="text-xl font-semibold text-slate-900">4. Consentimento e seu Registro</h2>
          <p>
            4.1. Quando o tratamento de dados se fundamentar no consentimento do Titular (Art. 7, I e
            Art. 8 da LGPD), este sera coletado de forma livre, informada, inequivoca e para finalidade
            determinada, por meio de mecanismo claro e destacado ("checkbox" ou equivalente) no momento
            do cadastro ou da ativacao da funcionalidade que exige consentimento.
          </p>
          <p>
            4.2. <strong>Registro de consentimento:</strong> A Plataforma registra e armazena
            eletronicamente a prova do consentimento do Titular, incluindo:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Data e hora (UTC) do aceite;</li>
            <li>Versao dos Termos de Uso e da Politica de Privacidade aceitos;</li>
            <li>Endereco IP do Titular no momento do aceite;</li>
            <li>Identificacao do mecanismo utilizado (checkbox de cadastro, banner de cookies, etc.);</li>
            <li>Conteudo especifico do consentimento fornecido.</li>
          </ul>
          <p>
            4.3. O consentimento pode ser revogado a qualquer momento, sem custos, por meio das
            configuracoes da conta ou pelo e-mail <span className="font-semibold text-slate-800">[E-MAIL DPO]</span>.
            A revogacao nao afeta a licitude do tratamento realizado anteriormente com base no
            consentimento (Art. 8, par. 5 da LGPD).
          </p>
          <p>
            4.4. A revogacao do consentimento para tratamentos essenciais a prestacao do servico
            podera resultar na impossibilidade de uso de determinadas funcionalidades ou na
            necessidade de encerramento da conta.
          </p>
        </section>

        {/* 5 */}
        <section className="space-y-3 text-slate-700 mb-6">
          <h2 className="text-xl font-semibold text-slate-900">5. Compartilhamento de Dados</h2>
          <p>
            5.1. A Plataforma <strong>nao vende, aluga, comercializa, cede a titulo oneroso,
            permuta, licencia ou de qualquer outra forma disponibiliza dados pessoais</strong>{' '}
            de seus Usuarios a terceiros para fins de marketing, publicidade direcionada,
            elaboracao de perfis comerciais, enriquecimento de base de dados, mineracao de dados
            ou qualquer outra finalidade comercial nao diretamente relacionada a operacao da
            Plataforma. Esta proibicao e absoluta, irrestrita e se aplica independentemente de
            qualquer consideracao comercial, parceria ou relacionamento empresarial. Os dados
            pessoais dos Usuarios <strong>nao constituem ativo comercializavel</strong> da Empresa
            e nao serao tratados como tal em nenhuma circunstancia.
          </p>
          <p>
            5.2. Os dados pessoais poderao ser compartilhados, exclusivamente para as finalidades
            descritas nesta Politica e nos limites estritamente necessarios, com as seguintes
            categorias de destinatarios (operadores):
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              <strong>Provedor de infraestrutura e banco de dados:</strong> Supabase Inc. (armazenamento
              seguro de dados, autenticacao e funcoes de backend) — servidores nos EUA, com protecao
              contratual adequada conforme Art. 33 da LGPD;
            </li>
            <li>
              <strong>Processador de pagamentos:</strong> Asaas Gestao Financeira S.A. (processamento de
              cobrancas e pagamentos de planos) — compartilhamos apenas os dados estritamente necessarios
              para o processamento do pagamento;
            </li>
            <li>
              <strong>Provedor de hospedagem e CDN:</strong> Vercel Inc. (hospedagem e entrega da aplicacao
              web) — servidores distribuidos globalmente, com protecao contratual adequada;
            </li>
            <li>
              <strong>Servicos de mapeamento:</strong> Mapbox Inc. (exibicao de localizacao em mapas) —
              compartilhamos apenas dados de cidade/estado, sem dados pessoais identificaveis;
            </li>
            <li>
              <strong>Servicos de consulta de endereco:</strong> ViaCEP e IBGE (consulta automatica de
              endereco por CEP) — compartilhamos apenas o CEP informado pelo Usuario.
            </li>
          </ul>
          <p>
            5.3. Os dados poderao ainda ser compartilhados nas seguintes hipoteses legais:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              <strong>Autoridades publicas:</strong> quando exigido por lei, regulamento, decisao judicial
              ou requisicao de autoridade administrativa competente (Ministerio Publico, delegacias, ANPD, etc.);
            </li>
            <li>
              <strong>Protecao de direitos:</strong> quando necessario para proteger os direitos, a propriedade
              ou a seguranca da Empresa, de seus Usuarios ou de terceiros;
            </li>
            <li>
              <strong>Reorganizacao societaria:</strong> em caso de fusao, aquisicao, incorporacao ou
              venda de ativos, os dados poderao ser transferidos ao novo controlador, mediante comunicacao
              previa ao Titular e manutencao das garantias desta Politica.
            </li>
          </ul>
          <p>
            5.4. <strong>Dados de perfil publico:</strong> informacoes que o Usuario opta por tornar
            publicas (nome do haras, localizacao, anuncios publicados, fotos de animais) sao visiveis
            a outros Usuarios e visitantes da Plataforma, conforme a natureza do servico de divulgacao.
            Dados como <strong>CPF, telefone, e-mail e endereco completo nao sao exibidos
            publicamente</strong> em nenhuma hipotese.
          </p>
          <p>
            5.5. <strong>Transferencia internacional:</strong> Alguns de nossos operadores possuem
            servidores localizados fora do Brasil. Nesses casos, garantimos que os destinatarios
            oferecem nivel de protecao de dados adequado ou que a transferencia esta amparada por
            clausulas contratuais padrao, em conformidade com o Art. 33 da LGPD e regulamentacao
            da ANPD.
          </p>
        </section>

        {/* 6 */}
        <section className="space-y-3 text-slate-700 mb-6">
          <h2 className="text-xl font-semibold text-slate-900">6. Armazenamento e Medidas de Seguranca</h2>
          <p>
            6.1. Em conformidade com o Art. 46 da LGPD, a Plataforma adota medidas de seguranca tecnicas
            e administrativas aptas a proteger os dados pessoais de acessos nao autorizados e de situacoes
            acidentais ou ilicitas de destruicao, perda, alteracao, comunicacao ou difusao, incluindo:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              <strong>Criptografia de dados sensiveis em repouso:</strong> dados pessoais como CPF e telefone
              sao armazenados com criptografia AES-256 (Advanced Encryption Standard, padrao utilizado pelo
              setor bancario) no banco de dados. Mesmo em caso de acesso indevido ao armazenamento, os dados
              permanecem ininteligiveis sem a chave de descriptografia;
            </li>
            <li>
              <strong>Hashing de dados de busca:</strong> para permitir buscas sem exposicao de dados
              sensiveis, utilizamos hashing unidirecional (SHA-256) de dados como CPF, garantindo que o
              dado original nao pode ser reconstruido a partir do hash;
            </li>
            <li>
              <strong>Controle de acesso granular:</strong> politicas de seguranca em nivel de linha
              (Row Level Security - RLS) no banco de dados garantem que cada Usuario acessa exclusivamente
              seus proprios dados pessoais, impedindo acesso cruzado entre contas;
            </li>
            <li>
              <strong>Criptografia em transito:</strong> todas as comunicacoes entre o navegador do Usuario
              e os servidores da Plataforma sao protegidas por criptografia TLS 1.2+ (HTTPS), impedindo
              interceptacao de dados em transito;
            </li>
            <li>
              <strong>Protecao contra ataques web:</strong> implementamos cabecalhos de seguranca (CSP,
              X-Frame-Options, HSTS, X-Content-Type-Options) para protecao contra ataques XSS, clickjacking,
              MIME sniffing e outros vetores comuns;
            </li>
            <li>
              <strong>Autenticacao segura:</strong> utilizamos autenticacao baseada em tokens JWT (JSON Web
              Tokens) com expiracao automatica. Senhas sao armazenadas com hashing criptografico (bcrypt),
              tornando impossivel a recuperacao da senha original;
            </li>
            <li>
              <strong>Principio do menor privilegio:</strong> o acesso interno a dados pessoais e
              restrito aos colaboradores e sistemas que efetivamente necessitam de tal acesso para
              cumprir suas funcoes;
            </li>
            <li>
              <strong>Monitoramento e auditoria:</strong> monitoramos acessos, atividades administrativas e
              eventos de seguranca para deteccao de comportamentos anomalos e prevencao de incidentes.
            </li>
          </ul>
          <p>
            6.2. <strong>Incidentes de seguranca:</strong> Apesar de adotarmos as melhores praticas e
            medidas tecnicas disponiveis, nenhum sistema e absolutamente imune a incidentes. Em caso
            de incidente de seguranca que possa acarretar risco ou dano relevante aos Titulares, a
            Plataforma comunicara:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>A Autoridade Nacional de Protecao de Dados (ANPD), conforme Art. 48 da LGPD, em prazo razoavel;</li>
            <li>Os Titulares afetados, informando a natureza dos dados afetados, os riscos envolvidos, as medidas adotadas e as recomendacoes para mitigacao de danos.</li>
          </ul>
          <p>
            6.3. A Plataforma mantem registro das operacoes de tratamento de dados pessoais, conforme
            Art. 37 da LGPD, contendo informacoes sobre as categorias de dados tratados, as finalidades,
            as bases legais e os prazos de retencao.
          </p>
        </section>

        {/* 7 */}
        <section className="space-y-3 text-slate-700 mb-6">
          <h2 className="text-xl font-semibold text-slate-900">7. Retencao e Eliminacao de Dados</h2>
          <p>
            7.1. Os dados pessoais serao retidos pelo periodo estritamente necessario para cumprir as
            finalidades para as quais foram coletados, observando os seguintes criterios objetivos:
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse border border-slate-300 mt-2">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-300 px-3 py-2 text-left font-semibold">Categoria de Dados</th>
                  <th className="border border-slate-300 px-3 py-2 text-left font-semibold">Periodo de Retencao</th>
                  <th className="border border-slate-300 px-3 py-2 text-left font-semibold">Fundamento</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-slate-300 px-3 py-2">Dados cadastrais e de perfil</td>
                  <td className="border border-slate-300 px-3 py-2">Enquanto a conta estiver ativa + 6 meses apos exclusao</td>
                  <td className="border border-slate-300 px-3 py-2">Execucao de contrato; exercicio regular de direitos</td>
                </tr>
                <tr className="bg-slate-50">
                  <td className="border border-slate-300 px-3 py-2">Dados de pagamentos e transacoes</td>
                  <td className="border border-slate-300 px-3 py-2">5 (cinco) anos apos a transacao</td>
                  <td className="border border-slate-300 px-3 py-2">Obrigacao legal (legislacao tributaria e fiscal — CTN Art. 173/174)</td>
                </tr>
                <tr>
                  <td className="border border-slate-300 px-3 py-2">Registros de acesso (IP, logs)</td>
                  <td className="border border-slate-300 px-3 py-2">6 (seis) meses</td>
                  <td className="border border-slate-300 px-3 py-2">Obrigacao legal (Marco Civil da Internet — Art. 15)</td>
                </tr>
                <tr className="bg-slate-50">
                  <td className="border border-slate-300 px-3 py-2">Registros de consentimento</td>
                  <td className="border border-slate-300 px-3 py-2">5 (cinco) anos apos o termino da relacao ou revogacao</td>
                  <td className="border border-slate-300 px-3 py-2">Exercicio regular de direitos; onus da prova (Art. 8, par. 2 LGPD)</td>
                </tr>
                <tr>
                  <td className="border border-slate-300 px-3 py-2">Anuncios e conteudo publicado</td>
                  <td className="border border-slate-300 px-3 py-2">Enquanto a conta estiver ativa; eliminados com a conta</td>
                  <td className="border border-slate-300 px-3 py-2">Execucao de contrato</td>
                </tr>
                <tr className="bg-slate-50">
                  <td className="border border-slate-300 px-3 py-2">Mensagens entre Usuarios</td>
                  <td className="border border-slate-300 px-3 py-2">Enquanto a conta estiver ativa; anonimizadas com a exclusao da conta</td>
                  <td className="border border-slate-300 px-3 py-2">Execucao de contrato</td>
                </tr>
                <tr>
                  <td className="border border-slate-300 px-3 py-2">Dados para defesa em processos</td>
                  <td className="border border-slate-300 px-3 py-2">Ate a prescricao legal aplicavel (geralmente 5 anos — CC Art. 206)</td>
                  <td className="border border-slate-300 px-3 py-2">Exercicio regular de direitos</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-3">
            7.2. <strong>Apos o encerramento da conta:</strong> os dados pessoais serao eliminados ou
            anonimizados de forma irreversivel, exceto aqueles que devam ser mantidos por obrigacao legal,
            regulatoria ou para exercicio regular de direitos, conforme os prazos acima.
          </p>
          <p>
            7.3. <strong>Dados anonimizados:</strong> dados que nao permitem, por meios tecnicos
            razoaveis e disponiveis na ocasiao do tratamento, a identificacao direta ou indireta
            do Titular podem ser mantidos indefinidamente para fins estatisticos, analiticos e de
            melhoria da Plataforma, nos termos do Art. 12 da LGPD. A anonimizacao e realizada
            por meio de tecnicas que removem irreversivelmente identificadores pessoais (como nome,
            CPF, e-mail e telefone), substituindo-os por valores aleatorios ou agregados, de modo
            que o dado nao possa ser revertido ou reassociado ao Titular, mesmo em cruzamento com
            outras bases de dados.
          </p>
          <p>
            7.4. O Titular pode solicitar a eliminacao antecipada de seus dados a qualquer momento,
            por meio das configuracoes da conta (exclusao de conta) ou pelo e-mail{' '}
            <span className="font-semibold text-slate-800">[E-MAIL DPO]</span>,
            ressalvadas as hipoteses de retencao obrigatoria previstas em lei.
          </p>
        </section>

        {/* 8 */}
        <section className="space-y-3 text-slate-700 mb-6">
          <h2 className="text-xl font-semibold text-slate-900">8. Direitos do Titular dos Dados</h2>
          <p>
            8.1. Em conformidade com o Art. 18 da LGPD, o Titular tem os seguintes direitos sobre
            seus dados pessoais, que podem ser exercidos a qualquer momento:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              <strong>Confirmacao e acesso (Art. 18, I e II):</strong> confirmar a existencia de
              tratamento e obter acesso aos seus dados pessoais tratados pela Plataforma;
            </li>
            <li>
              <strong>Correcao (Art. 18, III):</strong> solicitar a correcao de dados pessoais
              incompletos, inexatos ou desatualizados;
            </li>
            <li>
              <strong>Anonimizacao, bloqueio ou eliminacao (Art. 18, IV):</strong> solicitar a
              anonimizacao, bloqueio ou eliminacao de dados desnecessarios, excessivos ou tratados
              em desconformidade com a LGPD;
            </li>
            <li>
              <strong>Portabilidade (Art. 18, V):</strong> obter a portabilidade de seus dados
              pessoais em formato estruturado e interoperavel (JSON) para transferencia a outro
              fornecedor de servico. Este direito pode ser exercido diretamente nas configuracoes
              da conta, na funcionalidade "Exportar Meus Dados";
            </li>
            <li>
              <strong>Eliminacao (Art. 18, VI):</strong> solicitar a eliminacao dos dados pessoais
              tratados com base no consentimento. A eliminacao completa da conta e de todos os dados
              associados pode ser realizada nas configuracoes da conta, mediante confirmacao de senha;
            </li>
            <li>
              <strong>Informacao sobre compartilhamento (Art. 18, VII):</strong> obter informacoes
              sobre entidades publicas e privadas com as quais a Plataforma compartilhou seus dados;
            </li>
            <li>
              <strong>Informacao sobre o nao consentimento (Art. 18, VIII):</strong> ser informado
              sobre a possibilidade de nao fornecer consentimento e sobre as consequencias da negativa;
            </li>
            <li>
              <strong>Revogacao do consentimento (Art. 18, IX):</strong> revogar o consentimento
              previamente fornecido, a qualquer momento, mediante manifestacao expressa e sem custos,
              sem afetar a licitude do tratamento realizado anteriormente.
            </li>
          </ul>
          <p>
            8.2. <strong>Como exercer seus direitos:</strong>
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              <strong>Pela Plataforma (autoatendimento):</strong> acesse as configuracoes da sua conta
              para exportar seus dados (portabilidade), corrigir informacoes cadastrais ou solicitar
              exclusao da conta;
            </li>
            <li>
              <strong>Por e-mail ao Encarregado (DPO):</strong> envie sua solicitacao para{' '}
              <span className="font-semibold text-slate-800">[E-MAIL DPO]</span>{' '}
              com o assunto "Exercicio de Direitos LGPD", informando seu nome completo, e-mail
              cadastrado e o direito que deseja exercer;
            </li>
            <li>
              <strong>Prazo de resposta:</strong> responderemos sua solicitacao no prazo de ate 15
              (quinze) dias uteis, contados do recebimento da requisicao, conforme regulamentacao da ANPD.
              Em casos que exijam maior complexidade, poderemos estender o prazo, mediante justificativa
              fundamentada ao Titular.
            </li>
          </ul>
          <p>
            8.3. Para fins de seguranca e prevencao de fraudes, poderemos solicitar a verificacao de
            identidade do Titular antes de atender determinadas solicitacoes, sem que isso constitua
            obstaculo ao exercicio de direitos.
          </p>
          <p>
            8.4. <strong>Reclamacao a ANPD:</strong> Caso entenda que seus direitos nao foram
            adequadamente atendidos, o Titular podera apresentar reclamacao ou peticao perante a
            Autoridade Nacional de Protecao de Dados (ANPD), nos termos do Art. 18, par. 1 da LGPD.
          </p>
        </section>

        {/* 9 */}
        <section className="space-y-3 text-slate-700 mb-6">
          <h2 className="text-xl font-semibold text-slate-900">9. Cookies e Tecnologias de Rastreamento</h2>
          <p>
            9.1. A Plataforma utiliza cookies e tecnologias similares (web storage, tokens de sessao)
            para as seguintes finalidades:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              <strong>Cookies estritamente necessarios:</strong> indispensaveis para o funcionamento
              da Plataforma, incluindo autenticacao, manutencao de sessao, seguranca e prevencao de
              fraudes. Estes cookies nao podem ser desativados sem comprometer o uso da Plataforma.
              Base legal: execucao de contrato (Art. 7, V) e legitimo interesse (Art. 7, IX);
            </li>
            <li>
              <strong>Cookies de desempenho e analytics:</strong> coletam informacoes anonimas e
              agregadas sobre como a Plataforma e utilizada (paginas mais acessadas, taxas de erro,
              tempo de carregamento), permitindo melhorar a experiencia do Usuario.
              Base legal: legitimo interesse (Art. 7, IX);
            </li>
            <li>
              <strong>Cookies de funcionalidade:</strong> armazenam preferencias do Usuario (como
              configuracoes de exibicao e filtros salvos) para personalizar a experiencia.
              Base legal: execucao de contrato (Art. 7, V).
            </li>
          </ul>
          <p>
            9.2. <strong>A Plataforma nao utiliza cookies de rastreamento publicitario de terceiros</strong>{' '}
            nem compartilha dados de navegacao com redes de publicidade.
          </p>
          <p>
            9.3. O Usuario pode gerenciar ou bloquear cookies por meio das configuracoes de seu
            navegador. A desativacao de cookies estritamente necessarios podera comprometer total
            ou parcialmente o funcionamento da Plataforma.
          </p>
        </section>

        {/* 10 */}
        <section className="space-y-3 text-slate-700 mb-6">
          <h2 className="text-xl font-semibold text-slate-900">10. Alteracoes nesta Politica</h2>
          <p>
            10.1. Esta Politica de Privacidade podera ser atualizada periodicamente para refletir
            mudancas em nossas praticas de tratamento de dados, na legislacao aplicavel ou em
            decisoes regulatorias da ANPD. Cada versao sera identificada por numero de versao e
            data de atualizacao no topo do documento.
          </p>
          <p>
            10.2. Alteracoes relevantes que afetem os direitos do Titular ou que ampliem o escopo de
            tratamento de dados serao comunicadas com antecedencia minima de 15 (quinze) dias por
            meio da Plataforma (notificacao no painel de controle) e/ou por e-mail. Quando exigido
            pela LGPD, sera solicitado novo consentimento expresso.
          </p>
          <p>
            10.3. O uso continuado da Plataforma apos a entrada em vigor das alteracoes constitui
            aceitacao da Politica atualizada. Caso nao concorde, o Titular devera cessar o uso
            da Plataforma e podera solicitar a exclusao de sua conta e de seus dados pessoais.
          </p>
          <p>
            10.4. Versoes anteriores desta Politica poderao ser disponibilizadas mediante solicitacao
            ao Encarregado de Dados (DPO).
          </p>
        </section>

        {/* 11 */}
        <section className="space-y-3 text-slate-700 mb-6">
          <h2 className="text-xl font-semibold text-slate-900">11. Encarregado de Protecao de Dados (DPO)</h2>
          <p>
            11.1. Em conformidade com o Art. 41 da LGPD, informamos os dados de contato do nosso
            Encarregado pelo Tratamento de Dados Pessoais (Data Protection Officer - DPO):
          </p>
          <ul className="list-none pl-6 space-y-1">
            <li><strong>Nome:</strong> [NOME DO DPO]</li>
            <li><strong>E-mail:</strong> <span className="font-semibold text-slate-800">[E-MAIL DPO]</span></li>
          </ul>
          <p>
            11.2. O Encarregado e responsavel por:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Aceitar reclamacoes e comunicacoes dos Titulares e da ANPD, prestar esclarecimentos e adotar providencias;</li>
            <li>Receber comunicacoes da ANPD e adotar as medidas necessarias;</li>
            <li>Orientar os colaboradores da Empresa sobre as praticas de protecao de dados;</li>
            <li>Executar as demais atribuicoes determinadas pelo Controlador ou estabelecidas em normas complementares.</li>
          </ul>
          <p>
            11.3. O Titular pode contatar o Encarregado a qualquer momento para exercer seus direitos,
            tirar duvidas sobre o tratamento de dados ou reportar incidentes de seguranca.
          </p>
        </section>

        {/* 12 */}
        <section className="space-y-3 text-slate-700 mb-6">
          <h2 className="text-xl font-semibold text-slate-900">12. Legislacao Aplicavel</h2>
          <p>
            12.1. Esta Politica de Privacidade e regida pelas leis da Republica Federativa do Brasil,
            em especial:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Lei n. 13.709/2018 (Lei Geral de Protecao de Dados Pessoais — LGPD);</li>
            <li>Lei n. 12.965/2014 (Marco Civil da Internet);</li>
            <li>Decreto n. 8.771/2016 (Regulamentacao do Marco Civil da Internet);</li>
            <li>Lei n. 8.078/1990 (Codigo de Defesa do Consumidor), quando aplicavel;</li>
            <li>Regulamentacoes e orientacoes da ANPD.</li>
          </ul>
          <p>
            12.2. Eventuais controversias relacionadas a esta Politica serao dirimidas conforme
            estabelecido na clausula de foro dos{' '}
            <Link to="/terms" className="text-blue-600 underline hover:text-blue-800">Termos de Uso</Link>.
          </p>
        </section>

        {/* Contato */}
        <section className="space-y-3 text-slate-700 border-t pt-6">
          <h2 className="text-xl font-semibold text-slate-900">Contato</h2>
          <p>
            Para duvidas, sugestoes ou reclamacoes sobre esta Politica de Privacidade ou sobre o
            tratamento dos seus dados pessoais, entre em contato:
          </p>
          <ul className="list-none pl-0 space-y-1">
            <li><strong>Razao social:</strong> Vitrine do Cavalo Tecnologia Ltda.</li>
            <li><strong>CNPJ:</strong> [CNPJ]</li>
            <li><strong>Endereco:</strong> [ENDERECO COMPLETO]</li>
            <li><strong>E-mail geral:</strong>{' '}
              <span className="font-semibold text-slate-800">contato@vitrinedocavalo.com.br</span>
            </li>
            <li><strong>Suporte:</strong>{' '}
              <span className="font-semibold text-slate-800">suporte@vitrinedocavalo.com.br</span>
            </li>
            <li><strong>Encarregado de dados (DPO):</strong>{' '}
              <span className="font-semibold text-slate-800">[E-MAIL DPO]</span>
            </li>
          </ul>
          <p className="text-sm text-slate-500 mt-4">
            Caso entenda que seus direitos nao foram adequadamente atendidos pela Plataforma,
            voce pode apresentar reclamacao perante a Autoridade Nacional de Protecao de Dados
            (ANPD) — <span className="font-semibold">www.gov.br/anpd</span>.
          </p>
        </section>
      </div>
    </main>
  );
};

export default PrivacyPage;
