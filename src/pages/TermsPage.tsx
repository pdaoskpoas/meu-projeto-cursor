import React from 'react';
import { Link } from 'react-router-dom';

const TermsPage = () => {
  return (
    <main className="container-responsive section-spacing min-h-screen bg-background">
      <div className="max-w-3xl mx-auto space-content py-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Termos de Uso</h1>
        <p className="text-sm text-slate-500 mb-1">Versao 1.0</p>
        <p className="text-sm text-slate-500 mb-8">Ultima atualizacao: 21/03/2026</p>

        <p className="text-slate-700 mb-6">
          Estes Termos de Uso ("Termos") regulam o acesso e a utilizacao da plataforma digital{' '}
          <strong>Vitrine do Cavalo</strong> ("Plataforma"), disponibilizada por meio de website e
          aplicacoes correlatas, operada por Vitrine do Cavalo Tecnologia Ltda., pessoa juridica de
          direito privado, inscrita no CNPJ/MF sob o n. [CNPJ], com sede em [ENDERECO COMPLETO]
          ("Empresa", "Nos" ou "Vitrine do Cavalo").
        </p>
        <p className="text-slate-700 mb-6">
          Ao acessar, navegar ou utilizar a Plataforma de qualquer forma, voce ("Usuario") declara ter
          lido, compreendido e concordado integralmente com estes Termos e com a nossa{' '}
          <Link to="/privacy" className="text-blue-600 underline hover:text-blue-800">Politica de Privacidade</Link>,
          que e parte integrante deste instrumento. <strong>Caso nao concorde com qualquer disposicao
          destes Termos, nao acesse nem utilize a Plataforma.</strong>
        </p>

        {/* 1 */}
        <section className="space-y-3 text-slate-700 mb-6">
          <h2 className="text-xl font-semibold text-slate-900">1. Aceitacao e Registro de Consentimento</h2>
          <p>
            1.1. A utilizacao da Plataforma esta condicionada a aceitacao integral e irrestrita destes Termos de Uso e da
            nossa{' '}
            <Link to="/privacy" className="text-blue-600 underline hover:text-blue-800">Politica de Privacidade</Link>.
            Caso voce nao concorde com qualquer disposicao, nao utilize a Plataforma.
          </p>
          <p>
            1.2. Ao criar uma conta, o Usuario manifesta seu aceite de forma expressa, livre, informada e
            inequivoca, por meio do mecanismo de aceite ("checkbox" ou equivalente) disponibilizado no
            processo de cadastro. A Plataforma registrara eletronicamente a data, hora, versao dos Termos
            aceitos e o endereco IP do Usuario no momento do aceite, constituindo prova valida do
            consentimento nos termos da legislacao brasileira.
          </p>
          <p>
            1.3. Voce declara ser maior de 18 (dezoito) anos e possuir capacidade civil plena para
            celebrar este instrumento. Caso seja menor de 18 anos, devera estar devidamente assistido
            ou representado por responsavel legal, que tambem estara vinculado a estes Termos.
          </p>
          <p>
            1.4. Estes Termos constituem um contrato vinculante entre o Usuario e a Empresa, regido
            pelas leis da Republica Federativa do Brasil, em especial o Codigo Civil (Lei n. 10.406/2002),
            o Marco Civil da Internet (Lei n. 12.965/2014), a Lei Geral de Protecao de Dados (Lei n. 13.709/2018)
            e o Codigo de Defesa do Consumidor (Lei n. 8.078/1990), quando aplicavel.
          </p>
        </section>

        {/* 2 */}
        <section className="space-y-3 text-slate-700 mb-6">
          <h2 className="text-xl font-semibold text-slate-900">2. Descricao do Servico e Modelo de Negocio</h2>
          <p>
            2.1. A Vitrine do Cavalo e uma plataforma digital de <strong>divulgacao e conexao</strong> entre
            interessados no mercado equino. O servico consiste em permitir que Usuarios publiquem anuncios de
            equinos, visualizem anuncios de terceiros, troquem mensagens e promovam seus planteis e propriedades.
          </p>
          <p>
            2.2. <strong>A Plataforma atua exclusivamente como vitrine de divulgacao e classificados.</strong>{' '}
            A Vitrine do Cavalo <strong>nao e</strong> intermediadora, corretora, leiloeira, agente comercial,
            representante ou mandataria de qualquer Usuario, e <strong>nao participa, de nenhuma forma,</strong>{' '}
            de negociacoes, acordos, contratos ou transacoes realizados entre Usuarios ou entre Usuarios e
            terceiros.
          </p>
          <p>
            2.3. A Plataforma <strong>nao realiza, facilita nem garante</strong> vendas, compras, permutas,
            trocas, emprestimos ou qualquer operacao comercial envolvendo animais, bens ou servicos.
            Toda e qualquer negociacao entre Usuarios ocorre <strong>por conta e risco exclusivo das
            partes envolvidas</strong>, sem qualquer participacao, anuencia ou responsabilidade da Plataforma.
          </p>
          <p>
            2.4. O Usuario reconhece e concorda que a Plataforma nao possui qualquer controle, ingerencia
            ou responsabilidade sobre a qualidade, seguranca, legalidade, veracidade ou precisao dos
            anuncios publicados, nem sobre a capacidade dos Usuarios de concluir transacoes ou sobre
            a idoneidade dos demais Usuarios.
          </p>
          <p>
            2.5. A Plataforma oferece planos de assinatura que concedem funcionalidades adicionais de
            divulgacao, como limites ampliados de anuncios, destaque de publicacoes ("boosts") e
            ferramentas de gestao. O pagamento de planos remunera exclusivamente o uso de funcionalidades
            da Plataforma e <strong>nao constitui, sob nenhuma hipotese,</strong> participacao da
            Plataforma em transacoes entre Usuarios, taxa de intermediacao ou garantia de negocio.
          </p>
          <p>
            2.6. <strong>Ausencia de garantia de resultado:</strong> A Plataforma <strong>nao
            garante</strong>, em nenhuma hipotese, qualquer resultado decorrente da publicacao de
            anuncios ou do uso de funcionalidades pagas, incluindo, sem limitacao:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>A venda, permuta ou negociacao de animais anunciados;</li>
            <li>Nivel de visibilidade, alcance, numero de visualizacoes ou cliques nos anuncios;</li>
            <li>Retorno financeiro, lucratividade ou recuperacao de investimento;</li>
            <li>Quantidade ou qualidade de contatos recebidos por meio da Plataforma;</li>
            <li>Posicionamento ou destaque de anuncios em resultados de busca externos.</li>
          </ul>
          <p>
            O Usuario reconhece que os resultados dependem de fatores alheios ao controle da Plataforma,
            como demanda de mercado, qualidade do anuncio, sazonalidade e comportamento dos demais Usuarios.
          </p>
        </section>

        {/* 3 */}
        <section className="space-y-3 text-slate-700 mb-6">
          <h2 className="text-xl font-semibold text-slate-900">3. Negociacoes entre Usuarios — Risco Exclusivo</h2>
          <p>
            3.1. <strong>Toda e qualquer negociacao, tratativa, acordo ou transacao realizada entre Usuarios,
            dentro ou fora da Plataforma, e de inteira e exclusiva responsabilidade das partes envolvidas.</strong>{' '}
            A Plataforma nao garante, endossa, verifica nem se responsabiliza por qualquer aspecto dessas negociacoes.
          </p>
          <p>
            3.2. O Usuario que optar por negociar com outro Usuario assume integralmente os riscos da
            negociacao, incluindo, sem limitacao:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Risco de fraude, golpe, estelionato ou ma-fe da contraparte;</li>
            <li>Risco de o animal nao corresponder a descricao, fotos ou documentacao do anuncio;</li>
            <li>Risco de inadimplemento contratual, falta de pagamento ou entrega;</li>
            <li>Risco sanitario, veterinario ou de conformidade documental do animal;</li>
            <li>Riscos logisticos, incluindo transporte, seguro e custos envolvidos.</li>
          </ul>
          <p>
            3.3. A Plataforma <strong>recomenda expressamente</strong> que o Usuario:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Verifique pessoalmente o animal antes de efetuar qualquer pagamento;</li>
            <li>Exija e confira toda a documentacao do animal (registro genealogico, GTA, exames sanitarios);</li>
            <li>Consulte profissional veterinario de sua confianca;</li>
            <li>Formalize toda transacao por meio de contrato escrito;</li>
            <li>Nao realize pagamentos antecipados integrais sem garantias formais;</li>
            <li>Desconfie de precos muito abaixo do mercado ou de pedidos de pagamento por meios nao rastreaveis.</li>
          </ul>
          <p>
            3.4. A Plataforma nao realiza verificacao de identidade, idoneidade financeira, historico
            criminal ou antecedentes de seus Usuarios, e nao garante que as informacoes fornecidas
            pelos Usuarios sejam verdadeiras, completas ou atualizadas.
          </p>
        </section>

        {/* 4 */}
        <section className="space-y-3 text-slate-700 mb-6">
          <h2 className="text-xl font-semibold text-slate-900">4. Responsabilidades do Usuario</h2>
          <p>
            4.1. O Usuario e integralmente responsavel pela veracidade, precisao, legalidade e
            atualidade das informacoes inseridas na Plataforma, incluindo dados cadastrais,
            descricoes de animais, fotografias, videos, documentos, genealogia e quaisquer
            conteudos publicados.
          </p>
          <p>
            4.2. O Usuario declara e garante que:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Fornecera informacoes verdadeiras, completas e atualizadas em todos os campos;</li>
            <li>Mantera seus dados cadastrais permanentemente atualizados;</li>
            <li>So publicara anuncios de animais de sua propriedade ou sobre os quais possua autorizacao legal expressa do proprietario;</li>
            <li>Respeitara integralmente a legislacao vigente sobre bem-estar animal, transporte, sanidade e comercializacao de equinos;</li>
            <li>Nao utilizara a Plataforma para fins ilicitos, fraudulentos, enganosos ou que violem direitos de terceiros;</li>
            <li>Mantera em absoluto sigilo suas credenciais de acesso (e-mail e senha), sendo responsavel por toda atividade em sua conta;</li>
            <li>Possui todos os direitos necessarios sobre os conteudos (imagens, videos, textos) que publica na Plataforma;</li>
            <li>Nao infringira direitos de propriedade intelectual, imagem, honra ou privacidade de terceiros.</li>
          </ul>
          <p>
            4.3. O Usuario e o unico responsavel por verificar a procedencia, documentacao, estado de saude,
            conformidade sanitaria e demais condicoes dos animais antes de realizar qualquer negociacao
            com outros Usuarios, sendo certo que a Plataforma nao assume qualquer responsabilidade por
            tais verificacoes.
          </p>
          <p>
            4.4. O Usuario responde civil e criminalmente por danos causados a Plataforma, a outros
            Usuarios ou a terceiros em decorrencia do uso inadequado da Plataforma ou da violacao
            destes Termos, obrigando-se a indenizar a Empresa por quaisquer perdas, danos, custos
            ou despesas (incluindo honorarios advocaticios) decorrentes de tais atos.
          </p>
        </section>

        {/* 5 */}
        <section className="space-y-3 text-slate-700 mb-6">
          <h2 className="text-xl font-semibold text-slate-900">5. Limitacao de Responsabilidade da Plataforma</h2>
          <p>
            5.1. A Vitrine do Cavalo, na qualidade de plataforma de divulgacao, <strong>nao se
            responsabiliza</strong>, direta ou indiretamente, em nenhuma hipotese, por:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Negociacoes, acordos, contratos, transacoes ou disputas realizados entre Usuarios, dentro ou fora da Plataforma;</li>
            <li>Veracidade, qualidade, legalidade, seguranca ou adequacao dos anuncios, descricoes, fotos ou documentos publicados por Usuarios;</li>
            <li>Estado de saude, procedencia, documentacao, registro genealogico ou conformidade legal dos animais anunciados;</li>
            <li>Perdas financeiras, danos materiais, morais, lucros cessantes ou danos emergentes decorrentes de negocios firmados entre Usuarios;</li>
            <li>Fraudes, golpes, estelionato, falsidade ideologica ou condutas de ma-fe praticadas por Usuarios contra outros Usuarios ou terceiros;</li>
            <li>Inadimplemento contratual, falta de pagamento, entrega ou cumprimento de obrigacoes assumidas entre Usuarios;</li>
            <li>Conteudo, precisao ou legalidade de mensagens, imagens, videos ou documentos compartilhados entre Usuarios;</li>
            <li>Indisponibilidade temporaria ou permanente da Plataforma por motivos tecnicos, manutencao programada, falhas de infraestrutura, ataques ciberneticos ou eventos de forca maior;</li>
            <li>Danos decorrentes de virus, malware ou outros elementos nocivos que possam afetar o equipamento do Usuario;</li>
            <li>Decisoes tomadas pelo Usuario com base em informacoes obtidas na Plataforma.</li>
          </ul>
          <p>
            5.2. A Plataforma <strong>nao emite garantias, expressas ou implicitas,</strong> sobre os animais
            anunciados, sobre a capacidade financeira, idoneidade, honestidade, competencia ou boa-fe dos
            Usuarios, nem sobre a conclusao, sucesso ou satisfacao de qualquer negociacao.
          </p>
          <p>
            5.3. A Plataforma nao oferece qualquer tipo de seguro, garantia de devolucao, mediacao de
            conflitos ou servico de arbitragem entre Usuarios. Eventuais disputas deverao ser resolvidas
            diretamente entre as partes, sem participacao da Plataforma.
          </p>
          <p>
            5.4. Em qualquer hipotese, a responsabilidade total e agregada da Empresa perante o Usuario,
            por qualquer causa e independentemente da forma da acao, estara limitada ao valor efetivamente
            pago pelo Usuario a Plataforma nos 12 (doze) meses anteriores ao evento que deu origem a
            reclamacao, ou R$ 100,00 (cem reais), o que for maior. Esta limitacao nao se aplica nos
            casos em que a lei expressamente proiba tal limitacao.
          </p>
          <p>
            5.5. A Plataforma podera, a seu exclusivo criterio e sem obrigacao de faze-lo, remover
            anuncios, conteudos ou contas que considere inadequados, imprecisos, fraudulentos, abusivos
            ou que violem estes Termos, a legislacao vigente ou direitos de terceiros, sem necessidade
            de aviso previo e sem que isso gere qualquer direito de indenizacao ao Usuario.
          </p>
          <p>
            5.6. <strong>Disponibilidade do servico:</strong> A Plataforma e fornecida no estado em
            que se encontra ("as is") e conforme disponibilidade ("as available"). A Empresa{' '}
            <strong>nao garante</strong> que o servico sera ininterrupto, livre de erros, seguro ou
            disponivel em qualquer momento ou localidade. Em particular:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>A Plataforma podera ficar temporariamente indisponivel para manutencao programada ou corretiva, com ou sem aviso previo;</li>
            <li>Nao ha acordo de nivel de servico (SLA) garantido, salvo quando expressamente contratado em instrumento separado;</li>
            <li>A Empresa reserva-se o direito de descontinuar, modificar ou restringir funcionalidades a qualquer tempo, mediante comunicacao razoavel aos Usuarios;</li>
            <li>Falhas, lentidao ou indisponibilidade decorrentes de infraestrutura de terceiros (provedores de hospedagem, internet, operadoras) nao sao de responsabilidade da Empresa.</li>
          </ul>
          <p>
            O Usuario declara estar ciente de que nenhuma plataforma digital e capaz de garantir
            disponibilidade absoluta e isenta a Empresa de qualquer responsabilidade por prejuizos
            decorrentes de interrupcoes do servico.
          </p>
        </section>

        {/* 6 */}
        <section className="space-y-3 text-slate-700 mb-6">
          <h2 className="text-xl font-semibold text-slate-900">6. Regras de Uso, Conduta e Conteudo Proibido</h2>
          <p>
            6.1. E expressamente proibido ao Usuario:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Publicar conteudo ilegal, ofensivo, difamatorio, calunioso, injurioso, discriminatorio, obsceno ou que incite violencia ou odio;</li>
            <li>Publicar anuncios falsos, enganosos, com informacoes deliberadamente incorretas ou que induzam terceiros a erro;</li>
            <li>Utilizar a Plataforma para pratica de fraudes, estelionato, lavagem de dinheiro, receptacao ou qualquer ato ilicito;</li>
            <li>Publicar anuncios de animais em situacao de maus-tratos, abandono, em desacordo com a legislacao de bem-estar animal ou sem a documentacao sanitaria exigida;</li>
            <li>Publicar anuncios de animais que nao sejam equinos, salvo quando expressamente permitido pela Plataforma;</li>
            <li>Criar multiplas contas para burlar restricoes, limites, suspensoes ou banimentos da Plataforma;</li>
            <li>Coletar, armazenar, divulgar ou utilizar dados pessoais de outros Usuarios sem consentimento expresso;</li>
            <li>Tentar acessar sistemas, servidores, bases de dados ou areas restritas da Plataforma sem autorizacao;</li>
            <li>Realizar engenharia reversa, descompilar, desmontar ou tentar obter o codigo-fonte da Plataforma;</li>
            <li>Utilizar robos, scrapers, crawlers ou ferramentas automatizadas para extrair, copiar ou indexar dados da Plataforma;</li>
            <li>Enviar spam, comunicacoes em massa nao solicitadas ou conteudo promocional nao autorizado por meio da Plataforma;</li>
            <li>Interferir no funcionamento normal da Plataforma ou sobrecarregar intencionalmente seus servidores;</li>
            <li>Violar direitos de propriedade intelectual, marcas registradas, patentes ou segredos comerciais de terceiros.</li>
          </ul>
          <p>
            6.2. O Usuario e integralmente responsavel por todo o conteudo que publica na Plataforma. A
            Plataforma nao realiza revisao previa de anuncios ("pre-moderacao"), mas reserva-se o
            direito de remover qualquer conteudo que viole estes Termos, a qualquer momento e sem aviso previo.
          </p>
        </section>

        {/* 7 */}
        <section className="space-y-3 text-slate-700 mb-6">
          <h2 className="text-xl font-semibold text-slate-900">7. Denuncias e Moderacao de Conteudo</h2>
          <p>
            7.1. Qualquer Usuario ou visitante pode denunciar anuncios, conteudos ou condutas que
            considere inadequados, fraudulentos, ilegais ou que violem estes Termos, por meio dos
            mecanismos de denuncia disponibilizados na Plataforma ou pelo e-mail{' '}
            <span className="font-semibold text-slate-800">suporte@vitrinedocavalo.com.br</span>.
          </p>
          <p>
            7.2. A Plataforma se compromete a analisar as denuncias recebidas em prazo razoavel,
            podendo adotar as seguintes medidas, conforme a gravidade da situacao:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Remocao do conteudo:</strong> exclusao do anuncio, mensagem ou conteudo denunciado;</li>
            <li><strong>Notificacao ao Usuario:</strong> comunicacao ao autor do conteudo sobre a violacao identificada;</li>
            <li><strong>Suspensao temporaria:</strong> bloqueio temporario do acesso a conta ou a determinadas funcionalidades;</li>
            <li><strong>Exclusao permanente:</strong> cancelamento definitivo da conta em casos graves ou reincidentes;</li>
            <li><strong>Comunicacao as autoridades:</strong> encaminhamento do caso as autoridades competentes quando houver indicio de crime.</li>
          </ul>
          <p>
            7.3. A Plataforma nao e obrigada a divulgar os criterios internos de moderacao, nem a
            fundamentar suas decisoes ao Usuario denunciado, exceto quando exigido por lei ou decisao judicial.
          </p>
          <p>
            7.4. A existencia de mecanismos de denuncia e moderacao nao transfere a Plataforma
            qualquer responsabilidade pelo conteudo publicado pelos Usuarios, que permanece sendo
            de responsabilidade exclusiva de seus autores.
          </p>
        </section>

        {/* 8 */}
        <section className="space-y-3 text-slate-700 mb-6">
          <h2 className="text-xl font-semibold text-slate-900">8. Conta do Usuario</h2>
          <p>
            8.1. Para utilizar determinadas funcionalidades da Plataforma, o Usuario devera criar
            uma conta, fornecendo dados pessoais verdadeiros e completos. A conta e pessoal,
            intransferivel e de uso exclusivo do titular.
          </p>
          <p>
            8.2. O Usuario e exclusivamente responsavel por todas as atividades realizadas em sua conta,
            incluindo atos praticados por terceiros que obtenham acesso mediante uso de suas credenciais,
            por negligencia do Usuario ou por qualquer outra causa.
          </p>
          <p>
            8.3. Em caso de uso nao autorizado da conta, acesso indevido ou qualquer suspeita de
            comprometimento de seguranca, o Usuario devera notificar a Plataforma imediatamente
            pelo e-mail <span className="font-semibold text-slate-800">suporte@vitrinedocavalo.com.br</span>.
            A Plataforma nao se responsabiliza por perdas ou danos decorrentes do atraso na comunicacao
            pelo Usuario.
          </p>
          <p>
            8.4. O Usuario pode solicitar a exclusao de sua conta a qualquer momento por meio das
            configuracoes de sua conta, mediante confirmacao de senha. A exclusao implicara a
            remocao permanente e irreversivel de todos os dados pessoais, anuncios, mensagens e
            conteudos associados, conforme detalhado na{' '}
            <Link to="/privacy" className="text-blue-600 underline hover:text-blue-800">Politica de Privacidade</Link>,
            ressalvados os dados que devam ser mantidos por obrigacao legal ou regulatoria.
          </p>
        </section>

        {/* 9 */}
        <section className="space-y-3 text-slate-700 mb-6">
          <h2 className="text-xl font-semibold text-slate-900">9. Suspensao, Penalidades e Cancelamento</h2>
          <p>
            9.1. A Plataforma se reserva o direito de, a qualquer momento e a seu exclusivo criterio,
            adotar uma ou mais das seguintes medidas em relacao ao Usuario:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Advertencia formal:</strong> notificacao ao Usuario sobre conduta inadequada, com prazo para regularizacao;</li>
            <li><strong>Restricao de funcionalidades:</strong> limitacao temporaria de publicacao de anuncios, envio de mensagens ou acesso a determinados recursos;</li>
            <li><strong>Suspensao temporaria:</strong> bloqueio do acesso a conta por prazo determinado (de 1 a 90 dias, conforme a gravidade);</li>
            <li><strong>Exclusao permanente:</strong> cancelamento definitivo e irreversivel da conta e de todo o conteudo associado;</li>
            <li><strong>Remocao de conteudo:</strong> exclusao de anuncios, fotos, videos, mensagens ou qualquer conteudo publicado.</li>
          </ul>
          <p>
            9.2. As medidas acima poderao ser adotadas, de forma isolada ou cumulativa, nas seguintes hipoteses:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Violacao de qualquer disposicao destes Termos;</li>
            <li>Denuncias fundamentadas de outros Usuarios ou terceiros;</li>
            <li>Suspeita de fraude, falsidade ou uso indevido da Plataforma;</li>
            <li>Publicacao de conteudo ilegal, ofensivo ou que viole direitos de terceiros;</li>
            <li>Determinacao judicial ou de autoridade administrativa competente;</li>
            <li>Qualquer situacao que comprometa a integridade, seguranca ou reputacao da Plataforma;</li>
            <li>Inatividade da conta por periodo superior a 12 (doze) meses consecutivos.</li>
          </ul>
          <p>
            9.3. A Plataforma envidara esforcos razoaveis para notificar o Usuario previamente sobre
            a aplicacao de penalidades, exceto quando a gravidade da situacao exigir acao imediata
            (como nos casos de fraude, crime ou risco iminente a outros Usuarios).
          </p>
          <p>
            9.4. O Usuario cujo plano pago seja cancelado por violacao dos Termos <strong>nao tera
            direito a reembolso</strong> de valores ja pagos, salvo disposicao expressa em contrario
            na legislacao vigente. O cancelamento por iniciativa do Usuario segue as regras da secao 10.
          </p>
          <p>
            9.5. A exclusao da conta por violacao dos Termos nao exime o Usuario de suas
            responsabilidades civis e criminais decorrentes dos atos praticados na Plataforma.
          </p>
        </section>

        {/* 10 */}
        <section className="space-y-3 text-slate-700 mb-6">
          <h2 className="text-xl font-semibold text-slate-900">10. Planos, Pagamentos e Cancelamento</h2>
          <p>
            10.1. A Plataforma oferece planos gratuitos e planos pagos. Os planos pagos conferem
            funcionalidades adicionais de divulgacao e gestao, conforme descrito na pagina de planos,
            vigente no momento da contratacao.
          </p>
          <p>
            10.2. Os valores, periodicidade e funcionalidades de cada plano estao sujeitos a alteracoes.
            Alteracoes de preco nao afetarao o periodo de assinatura ja pago, mas poderao ser aplicadas
            na renovacao seguinte, mediante comunicacao previa de no minimo 30 (trinta) dias.
          </p>
          <p>
            10.3. O pagamento de planos e processado por terceiros (operadoras de pagamento autorizadas)
            e esta sujeito as condicoes, politicas e termos desses prestadores. A Plataforma <strong>nao
            armazena</strong> dados de cartao de credito, dados bancarios ou informacoes financeiras sensiveis
            dos Usuarios.
          </p>
          <p>
            10.4. O cancelamento de planos pode ser realizado a qualquer momento pelo Usuario nas
            configuracoes da conta. O acesso as funcionalidades do plano permanecera ativo ate o
            termino do periodo de assinatura ja pago. Nao ha reembolso proporcional por periodo
            nao utilizado, salvo disposicao legal em contrario.
          </p>
          <p>
            10.5. A Plataforma podera oferecer funcionalidades avulsas ("boosts" e similares) com
            cobranca pontual. Tais funcionalidades serao regidas pelas condicoes apresentadas no
            momento da compra e nao sao reembolsaveis apos a ativacao.
          </p>
        </section>

        {/* 11 */}
        <section className="space-y-3 text-slate-700 mb-6">
          <h2 className="text-xl font-semibold text-slate-900">11. Propriedade Intelectual</h2>
          <p>
            11.1. A marca "Vitrine do Cavalo", o logotipo, o nome de dominio, o design, o layout,
            os textos institucionais, os codigos-fonte, os algoritmos e todo o conteudo original da
            Plataforma sao de propriedade exclusiva da Empresa e estao protegidos pela legislacao
            brasileira de propriedade intelectual (Lei n. 9.279/1996 e Lei n. 9.610/1998).
          </p>
          <p>
            11.2. Ao publicar conteudo na Plataforma (fotos, descricoes, videos, documentos), o Usuario
            concede a Vitrine do Cavalo licenca nao exclusiva, gratuita, revogavel, sublicenciavel
            e de ambito mundial para exibir, reproduzir, adaptar (como redimensionamento de imagens)
            e distribuir tal conteudo <strong>exclusivamente</strong> no contexto da operacao da
            Plataforma, incluindo exibicao em resultados de busca, divulgacao em redes sociais
            oficiais e materiais promocionais da Plataforma. A licenca vigora enquanto o conteudo
            permanecer publicado e sera extinta com a remocao do conteudo ou exclusao da conta.
          </p>
          <p>
            11.3. O Usuario garante que possui todos os direitos necessarios sobre o conteudo que
            publica (incluindo direitos de imagem de pessoas e animais retratados) e se responsabiliza
            integralmente, inclusive patrimonialmente, por eventual violacao de direitos de terceiros.
          </p>
          <p>
            11.4. E vedada a reproducao, copia, distribuicao, engenharia reversa ou uso comercial
            de qualquer elemento da Plataforma sem autorizacao previa e expressa da Empresa.
          </p>
        </section>

        {/* 12 */}
        <section className="space-y-3 text-slate-700 mb-6">
          <h2 className="text-xl font-semibold text-slate-900">12. Protecao de Dados e Privacidade</h2>
          <p>
            12.1. O tratamento de dados pessoais realizado pela Plataforma observa rigorosamente a
            Lei Geral de Protecao de Dados Pessoais (LGPD - Lei n. 13.709/2018) e esta descrito de
            forma detalhada em nossa{' '}
            <Link to="/privacy" className="text-blue-600 underline hover:text-blue-800">Politica de Privacidade</Link>,
            que e parte integrante destes Termos.
          </p>
          <p>
            12.2. Ao aceitar estes Termos, o Usuario declara estar ciente e concordar com as praticas
            de coleta, uso, armazenamento e compartilhamento de dados pessoais descritas na Politica
            de Privacidade, conforme as bases legais previstas na LGPD.
          </p>
          <p>
            12.3. O Usuario podera exercer seus direitos de titular de dados (acesso, correcao,
            portabilidade, eliminacao, entre outros) por meio das funcionalidades disponibilizadas
            nas configuracoes da conta ou pelo e-mail{' '}
            <span className="font-semibold text-slate-800">[E-MAIL DPO]</span>.
          </p>
          <p>
            12.4. <strong>Retencao para defesa juridica e auditoria:</strong> O Usuario reconhece e
            concorda que a Empresa podera reter dados pessoais, registros de acesso, logs de
            atividade e conteudo publicado, mesmo apos o encerramento da conta, quando necessario para:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Defesa em processos judiciais, administrativos ou arbitrais (Art. 7, VI da LGPD);</li>
            <li>Cumprimento de obrigacoes legais, fiscais ou regulatorias (Art. 7, II da LGPD);</li>
            <li>Prevencao e deteccao de fraudes, atividades ilicitas e violacoes aos Termos;</li>
            <li>Auditoria interna e externa, investigacoes de seguranca e resposta a incidentes;</li>
            <li>Atendimento a requisicoes de autoridades competentes.</li>
          </ul>
          <p>
            Os prazos especificos de retencao estao detalhados na{' '}
            <Link to="/privacy" className="text-blue-600 underline hover:text-blue-800">Politica de Privacidade</Link>.
          </p>
        </section>

        {/* 13 */}
        <section className="space-y-3 text-slate-700 mb-6">
          <h2 className="text-xl font-semibold text-slate-900">13. Indenizacao</h2>
          <p>
            13.1. O Usuario concorda em defender, indenizar e isentar a Empresa, seus socios,
            diretores, funcionarios, agentes e prestadores de servicos de toda e qualquer
            reclamacao, dano, obrigacao, perda, responsabilidade, custo, divida e despesa
            (incluindo honorarios advocaticios) decorrentes de:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Uso da Plataforma pelo Usuario;</li>
            <li>Violacao destes Termos pelo Usuario;</li>
            <li>Violacao de direitos de terceiros pelo Usuario;</li>
            <li>Conteudo publicado pelo Usuario na Plataforma;</li>
            <li>Negociacoes, transacoes ou disputas entre o Usuario e outros Usuarios ou terceiros.</li>
          </ul>
        </section>

        {/* 14 */}
        <section className="space-y-3 text-slate-700 mb-6">
          <h2 className="text-xl font-semibold text-slate-900">14. Modificacoes dos Termos</h2>
          <p>
            14.1. A Vitrine do Cavalo podera modificar estes Termos a qualquer momento, a seu
            exclusivo criterio. As alteracoes serao identificadas por nova versao e data de
            atualizacao no topo do documento.
          </p>
          <p>
            14.2. As alteracoes relevantes serao comunicadas aos Usuarios por meio da Plataforma
            (notificacao no painel de controle) e/ou por e-mail, com antecedencia minima de 15
            (quinze) dias antes da entrada em vigor.
          </p>
          <p>
            14.3. Em caso de alteracoes substanciais que afetem direitos do Usuario, podera ser
            solicitado novo aceite expresso. O uso continuado da Plataforma apos a entrada em vigor
            das alteracoes constitui aceitacao dos novos Termos.
          </p>
          <p>
            14.4. Caso nao concorde com as alteracoes, o Usuario devera cessar o uso da Plataforma
            e podera solicitar a exclusao de sua conta, sem penalidade.
          </p>
        </section>

        {/* 15 */}
        <section className="space-y-3 text-slate-700 mb-6">
          <h2 className="text-xl font-semibold text-slate-900">15. Disposicoes Gerais</h2>
          <p>
            15.1. <strong>Integralidade:</strong> Estes Termos, juntamente com a Politica de Privacidade,
            constituem o acordo integral entre o Usuario e a Empresa no que se refere ao uso da
            Plataforma, substituindo quaisquer entendimentos, propostas ou acordos anteriores,
            escritos ou verbais, sobre o mesmo objeto.
          </p>
          <p>
            15.2. <strong>Independencia das clausulas:</strong> Caso qualquer clausula ou disposicao
            destes Termos seja considerada invalida, nula ou inexequivel por autoridade competente,
            as demais clausulas permanecerao em pleno vigor e efeito, devendo a clausula invalida
            ser substituida por outra que reflita, na medida do possivel, a intencao original.
          </p>
          <p>
            15.3. <strong>Tolerancia:</strong> A tolerancia ou nao exercicio, pela Empresa, de qualquer
            direito ou faculdade previstos nestes Termos nao constituira novacao, renuncia ou
            precedente invocavel, nem afetara o direito de exigi-los a qualquer tempo.
          </p>
          <p>
            15.4. <strong>Cessao:</strong> O Usuario nao podera ceder, transferir ou sub-licenciar
            seus direitos ou obrigacoes sob estes Termos sem consentimento previo e escrito da Empresa.
            A Empresa podera ceder estes Termos, no todo ou em parte, a qualquer momento, mediante
            notificacao ao Usuario.
          </p>
          <p>
            15.5. <strong>Comunicacoes operacionais:</strong> Ao criar uma conta, o Usuario aceita
            receber comunicacoes operacionais essenciais por e-mail e/ou notificacoes na Plataforma,
            incluindo: alertas de seguranca, confirmacoes de transacao, avisos de suspensao ou
            penalidade, notificacoes sobre alteracoes nos Termos ou na Politica de Privacidade,
            e comunicacoes relacionadas ao funcionamento da conta. Estas comunicacoes nao podem
            ser desativadas enquanto a conta estiver ativa, pois sao necessarias para a prestacao
            do servico. O Usuario e responsavel por manter seu e-mail cadastrado atualizado.
          </p>
          <p>
            15.6. <strong>Comunicacoes promocionais:</strong> O envio de comunicacoes de marketing,
            ofertas, novidades e conteudo promocional somente sera realizado mediante consentimento
            previo e expresso do Usuario (Art. 7, I da LGPD), que podera ser revogado a qualquer
            momento por meio das configuracoes da conta ou pelo link de descadastro presente em
            cada comunicacao, sem afetar a prestacao do servico.
          </p>
          <p>
            15.7. <strong>Forca maior:</strong> A Empresa nao sera responsavel por atrasos ou falhas
            no cumprimento de suas obrigacoes decorrentes de eventos de forca maior ou caso fortuito,
            incluindo, sem limitacao, desastres naturais, pandemias, guerras, greves, falhas de
            telecomunicacoes, atos governamentais ou ataques ciberneticos.
          </p>
        </section>

        {/* 16 */}
        <section className="space-y-3 text-slate-700 mb-6">
          <h2 className="text-xl font-semibold text-slate-900">16. Legislacao Aplicavel e Foro</h2>
          <p>
            16.1. Estes Termos sao regidos e interpretados de acordo com as leis da Republica
            Federativa do Brasil.
          </p>
          <p>
            16.2. Para dirimir quaisquer controversias oriundas destes Termos ou do uso da Plataforma,
            as partes elegem o foro da comarca do domicilio do Usuario, nos termos do Art. 101, I, do
            Codigo de Defesa do Consumidor (Lei n. 8.078/1990), quando o Usuario for considerado
            consumidor final. Nos demais casos, fica eleito o foro da comarca de [CIDADE/ESTADO DA SEDE],
            com exclusao de qualquer outro, por mais privilegiado que seja.
          </p>
          <p>
            16.3. Antes de recorrer ao Poder Judiciario, as partes envidarao esforcos razoaveis para
            resolver eventuais controversias de forma amigavel, por meio de negociacao direta pelo
            e-mail <span className="font-semibold text-slate-800">contato@vitrinedocavalo.com.br</span>.
          </p>
        </section>

        {/* Contato */}
        <section className="space-y-3 text-slate-700 border-t pt-6">
          <h2 className="text-xl font-semibold text-slate-900">Contato</h2>
          <p>
            Para duvidas, sugestoes ou reclamacoes sobre estes Termos de Uso, entre em contato:
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
        </section>
      </div>
    </main>
  );
};

export default TermsPage;
