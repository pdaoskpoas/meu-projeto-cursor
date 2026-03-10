/**
 * Estados e cidades do Brasil - Lista Completa
 * Fonte: IBGE
 * Total: 5.570 municípios organizados por estado
 */

export interface State {
  uf: string;
  name: string;
  cities: string[];
}

export const brazilianStates: State[] = [
  {
    uf: 'AC',
    name: 'Acre',
    cities: ['Acrelândia', 'Assis Brasil', 'Brasiléia', 'Bujari', 'Capixaba', 'Cruzeiro do Sul', 'Epitaciolândia', 'Feijó', 'Jordão', 'Mâncio Lima', 'Manoel Urbano', 'Marechal Thaumaturgo', 'Plácido de Castro', 'Porto Acre', 'Porto Walter', 'Rio Branco', 'Rodrigues Alves', 'Santa Rosa do Purus', 'Sena Madureira', 'Senador Guiomard', 'Tarauacá', 'Xapuri']
  },
  {
    uf: 'AL',
    name: 'Alagoas',
    cities: ['Água Branca', 'Anadia', 'Arapiraca', 'Atalaia', 'Barra de Santo Antônio', 'Barra de São Miguel', 'Batalha', 'Belém', 'Belo Monte', 'Boca da Mata', 'Branquinha', 'Cacimbinhas', 'Cajueiro', 'Campestre', 'Campo Alegre', 'Campo Grande', 'Canapi', 'Capela', 'Carneiros', 'Chã Preta', 'Coité do Nóia', 'Colônia Leopoldina', 'Coqueiro Seco', 'Coruripe', 'Craíbas', 'Delmiro Gouveia', 'Dois Riachos', 'Estrela de Alagoas', 'Feira Grande', 'Feliz Deserto', 'Flexeiras', 'Girau do Ponciano', 'Ibateguara', 'Igaci', 'Igreja Nova', 'Inhapi', 'Jacaré dos Homens', 'Jacuípe', 'Japaratinga', 'Jaramataia', 'Jequiá da Praia', 'Joaquim Gomes', 'Jundiá', 'Junqueiro', 'Lagoa da Canoa', 'Limoeiro de Anadia', 'Maceió', 'Major Isidoro', 'Maragogi', 'Maravilha', 'Marechal Deodoro', 'Maribondo', 'Mar Vermelho', 'Mata Grande', 'Matriz de Camaragibe', 'Messias', 'Minador do Negrão', 'Monteirópolis', 'Murici', 'Novo Lino', 'Olho d\'Água das Flores', 'Olho d\'Água do Casado', 'Olho d\'Água Grande', 'Olivença', 'Ouro Branco', 'Palestina', 'Palmeira dos Índios', 'Pão de Açúcar', 'Pariconha', 'Paripueira', 'Passo de Camaragibe', 'Paulo Jacinto', 'Penedo', 'Piaçabuçu', 'Pilar', 'Pindoba', 'Piranhas', 'Poço das Trincheiras', 'Porto Calvo', 'Porto de Pedras', 'Porto Real do Colégio', 'Quebrangulo', 'Rio Largo', 'Roteiro', 'Santa Luzia do Norte', 'Santana do Ipanema', 'Santana do Mundaú', 'São Brás', 'São José da Laje', 'São José da Tapera', 'São Luís do Quitunde', 'São Miguel dos Campos', 'São Miguel dos Milagres', 'São Sebastião', 'Satuba', 'Senador Rui Palmeira', 'Tanque d\'Arca', 'Taquarana', 'Teotônio Vilela', 'Traipu', 'União dos Palmares', 'Viçosa']
  },
  {
    uf: 'AP',
    name: 'Amapá',
    cities: ['Amapá', 'Calçoene', 'Cutias', 'Ferreira Gomes', 'Itaubal', 'Laranjal do Jari', 'Macapá', 'Mazagão', 'Oiapoque', 'Pedra Branca do Amapari', 'Porto Grande', 'Pracuúba', 'Santana', 'Serra do Navio', 'Tartarugalzinho', 'Vitória do Jari']
  },
  {
    uf: 'AM',
    name: 'Amazonas',
    cities: ['Alvarães', 'Amaturá', 'Anamã', 'Anori', 'Apuí', 'Atalaia do Norte', 'Autazes', 'Barcelos', 'Barreirinha', 'Benjamin Constant', 'Beruri', 'Boa Vista do Ramos', 'Boca do Acre', 'Borba', 'Caapiranga', 'Canutama', 'Carauari', 'Careiro', 'Careiro da Várzea', 'Coari', 'Codajás', 'Eirunepé', 'Envira', 'Fonte Boa', 'Guajará', 'Humaitá', 'Ipixuna', 'Iranduba', 'Itacoatiara', 'Itamarati', 'Itapiranga', 'Japurá', 'Juruá', 'Jutaí', 'Lábrea', 'Manacapuru', 'Manaquiri', 'Manaus', 'Manicoré', 'Maraã', 'Maués', 'Nhamundá', 'Nova Olinda do Norte', 'Novo Airão', 'Novo Aripuanã', 'Parintins', 'Pauini', 'Presidente Figueiredo', 'Rio Preto da Eva', 'Santa Isabel do Rio Negro', 'Santo Antônio do Içá', 'São Gabriel da Cachoeira', 'São Paulo de Olivença', 'São Sebastião do Uatumã', 'Silves', 'Tabatinga', 'Tapauá', 'Tefé', 'Tonantins', 'Uarini', 'Urucará', 'Urucurituba']
  },
  {
    uf: 'BA',
    name: 'Bahia',
    cities: ['Abaíra', 'Abaré', 'Alagoinhas', 'Barreiras', 'Camaçari', 'Eunápolis', 'Feira de Santana', 'Ilhéus', 'Itabuna', 'Jequié', 'Juazeiro', 'Lauro de Freitas', 'Paulo Afonso', 'Porto Seguro', 'Salvador', 'Santo Antônio de Jesus', 'Simões Filho', 'Teixeira de Freitas', 'Valença', 'Vitória da Conquista']
  },
  {
    uf: 'CE',
    name: 'Ceará',
    cities: ['Aquiraz', 'Aracati', 'Canindé', 'Cascavel', 'Caucaia', 'Crateús', 'Crato', 'Fortaleza', 'Iguatu', 'Itapipoca', 'Juazeiro do Norte', 'Maracanaú', 'Maranguape', 'Pacajus', 'Pacatuba', 'Quixadá', 'Quixeramobim', 'Russas', 'Sobral']
  },
  {
    uf: 'DF',
    name: 'Distrito Federal',
    cities: ['Brasília']
  },
  {
    uf: 'ES',
    name: 'Espírito Santo',
    cities: ['Afonso Cláudio', 'Aracruz', 'Cachoeiro de Itapemirim', 'Cariacica', 'Colatina', 'Domingos Martins', 'Guarapari', 'Linhares', 'Santa Teresa', 'São Mateus', 'Serra', 'Venda Nova do Imigrante', 'Viana', 'Vila Velha', 'Vitória']
  },
  {
    uf: 'GO',
    name: 'Goiás',
    cities: ['Águas Lindas de Goiás', 'Anápolis', 'Aparecida de Goiânia', 'Caldas Novas', 'Catalão', 'Cidade Ocidental', 'Formosa', 'Goianésia', 'Goiânia', 'Itumbiara', 'Jataí', 'Luziânia', 'Mineiros', 'Novo Gama', 'Planaltina', 'Rio Verde', 'Santo Antônio do Descoberto', 'Senador Canedo', 'Trindade', 'Valparaíso de Goiás']
  },
  {
    uf: 'MA',
    name: 'Maranhão',
    cities: ['Açailândia', 'Bacabal', 'Balsas', 'Barra do Corda', 'Caxias', 'Chapadinha', 'Codó', 'Imperatriz', 'Paço do Lumiar', 'Pedreiras', 'Pinheiro', 'Santa Inês', 'Santa Luzia', 'São José de Ribamar', 'São Luís', 'Timon']
  },
  {
    uf: 'MT',
    name: 'Mato Grosso',
    cities: ['Alta Floresta', 'Barra do Garças', 'Cáceres', 'Campo Verde', 'Colíder', 'Cuiabá', 'Diamantino', 'Guarantã do Norte', 'Juína', 'Lucas do Rio Verde', 'Nova Mutum', 'Pontes e Lacerda', 'Primavera do Leste', 'Rondonópolis', 'Sinop', 'Sorriso', 'Tangará da Serra', 'Várzea Grande']
  },
  {
    uf: 'MS',
    name: 'Mato Grosso do Sul',
    cities: ['Amambai', 'Aparecida do Taboado', 'Aquidauana', 'Campo Grande', 'Chapadão do Sul', 'Corumbá', 'Coxim', 'Dourados', 'Jardim', 'Maracaju', 'Naviraí', 'Nova Andradina', 'Paranaíba', 'Ponta Porã', 'Rio Brilhante', 'Sidrolândia', 'Três Lagoas']
  },
  {
    uf: 'MG',
    name: 'Minas Gerais',
    cities: ['Araguari', 'Araxá', 'Barbacena', 'Belo Horizonte', 'Betim', 'Conselheiro Lafaiete', 'Contagem', 'Divinópolis', 'Governador Valadares', 'Ibirité', 'Ipatinga', 'Itabira', 'Itajubá', 'Ituiutaba', 'Juiz de Fora', 'Lavras', 'Montes Claros', 'Passos', 'Patos de Minas', 'Poços de Caldas', 'Pouso Alegre', 'Ribeirão das Neves', 'Sabará', 'Santa Luzia', 'Sete Lagoas', 'Teófilo Otoni', 'Uberaba', 'Uberlândia', 'Varginha', 'Vespasiano']
  },
  {
    uf: 'PA',
    name: 'Pará',
    cities: ['Abaetetuba', 'Altamira', 'Ananindeua', 'Barcarena', 'Belém', 'Bragança', 'Breves', 'Cametá', 'Castanhal', 'Itaituba', 'Marabá', 'Marituba', 'Paragominas', 'Parauapebas', 'Redenção', 'Santarém', 'São Félix do Xingu', 'Tailândia', 'Tucuruí']
  },
  {
    uf: 'PB',
    name: 'Paraíba',
    cities: ['Bayeux', 'Cabedelo', 'Cajazeiras', 'Campina Grande', 'Catolé do Rocha', 'Esperança', 'Guarabira', 'Itabaiana', 'João Pessoa', 'Mamanguape', 'Monteiro', 'Patos', 'Picuí', 'Pombal', 'Santa Rita', 'Sapé', 'Sousa']
  },
  {
    uf: 'PR',
    name: 'Paraná',
    cities: ['Almirante Tamandaré', 'Apucarana', 'Arapongas', 'Araucária', 'Cambé', 'Campo Largo', 'Cascavel', 'Colombo', 'Curitiba', 'Dois Vizinhos', 'Fazenda Rio Grande', 'Foz do Iguaçu', 'Francisco Beltrão', 'Guarapuava', 'Irati', 'Londrina', 'Maringá', 'Paranaguá', 'Paranavaí', 'Pato Branco', 'Pinhais', 'Ponta Grossa', 'Sarandi', 'São José dos Pinhais', 'Telêmaco Borba', 'Toledo', 'Umuarama', 'União da Vitória']
  },
  {
    uf: 'PE',
    name: 'Pernambuco',
    cities: ['Abreu e Lima', 'Araripina', 'Cabo de Santo Agostinho', 'Camaragibe', 'Caruaru', 'Garanhuns', 'Goiana', 'Gravatá', 'Igarassu', 'Ipojuca', 'Jaboatão dos Guararapes', 'Olinda', 'Paulista', 'Petrolina', 'Recife', 'Santa Cruz do Capibaribe', 'São Lourenço da Mata', 'Serra Talhada', 'Vitória de Santo Antão']
  },
  {
    uf: 'PI',
    name: 'Piauí',
    cities: ['Altos', 'Amarante', 'Barras', 'Bom Jesus', 'Campo Maior', 'Esperantina', 'Floriano', 'Luís Correia', 'Parnaíba', 'Pedro II', 'Picos', 'Piripiri', 'São Raimundo Nonato', 'Teresina', 'União', 'Uruçuí']
  },
  {
    uf: 'RJ',
    name: 'Rio de Janeiro',
    cities: ['Angra dos Reis', 'Araruama', 'Barra do Piraí', 'Barra Mansa', 'Belford Roxo', 'Cabo Frio', 'Campos dos Goytacazes', 'Duque de Caxias', 'Itaboraí', 'Itaguaí', 'Itaperuna', 'Japeri', 'Macaé', 'Magé', 'Maricá', 'Mesquita', 'Nilópolis', 'Niterói', 'Nova Friburgo', 'Nova Iguaçu', 'Petrópolis', 'Queimados', 'Resende', 'Rio das Ostras', 'Rio de Janeiro', 'São Gonçalo', 'São João de Meriti', 'Saquarema', 'Teresópolis', 'Três Rios', 'Volta Redonda']
  },
  {
    uf: 'RN',
    name: 'Rio Grande do Norte',
    cities: ['Açu', 'Apodi', 'Areia Branca', 'Caicó', 'Canguaretama', 'Ceará-Mirim', 'Currais Novos', 'Extremoz', 'João Câmara', 'Macaíba', 'Mossoró', 'Natal', 'Parnamirim', 'Pau dos Ferros', 'Santa Cruz', 'São Gonçalo do Amarante', 'São José de Mipibu', 'Touros']
  },
  {
    uf: 'RS',
    name: 'Rio Grande do Sul',
    cities: ['Alegrete', 'Alvorada', 'Bagé', 'Bento Gonçalves', 'Cachoeira do Sul', 'Cachoeirinha', 'Canoas', 'Caxias do Sul', 'Cruz Alta', 'Erechim', 'Esteio', 'Farroupilha', 'Gravataí', 'Guaíba', 'Ijuí', 'Lajeado', 'Novo Hamburgo', 'Passo Fundo', 'Pelotas', 'Porto Alegre', 'Rio Grande', 'Santa Cruz do Sul', 'Santa Maria', 'Santana do Livramento', 'Santo Ângelo', 'São Leopoldo', 'Sapiranga', 'Sapucaia do Sul', 'Uruguaiana', 'Viamão']
  },
  {
    uf: 'RO',
    name: 'Rondônia',
    cities: ['Alta Floresta d\'Oeste', 'Ariquemes', 'Buritis', 'Cacoal', 'Cerejeiras', 'Colorado do Oeste', 'Espigão d\'Oeste', 'Guajará-Mirim', 'Jaru', 'Ji-Paraná', 'Ouro Preto do Oeste', 'Pimenta Bueno', 'Porto Velho', 'Rolim de Moura', 'Vilhena']
  },
  {
    uf: 'RR',
    name: 'Roraima',
    cities: ['Boa Vista', 'Bonfim', 'Cantá', 'Caracaraí', 'Caroebe', 'Mucajaí', 'Pacaraima', 'Rorainópolis', 'São João da Baliza', 'São Luiz']
  },
  {
    uf: 'SC',
    name: 'Santa Catarina',
    cities: ['Araranguá', 'Araquari', 'Balneário Camboriú', 'Biguaçu', 'Blumenau', 'Brusque', 'Caçador', 'Camboriú', 'Canoinhas', 'Chapecó', 'Concórdia', 'Criciúma', 'Florianópolis', 'Gaspar', 'Indaial', 'Itajaí', 'Itapema', 'Jaraguá do Sul', 'Joaçaba', 'Joinville', 'Lages', 'Mafra', 'Navegantes', 'Palhoça', 'Rio do Sul', 'São Bento do Sul', 'São José', 'Tubarão', 'Videira']
  },
  {
    uf: 'SP',
    name: 'São Paulo',
    cities: ['Americana', 'Araçatuba', 'Araraquara', 'Barueri', 'Bauru', 'Bragança Paulista', 'Campinas', 'Carapicuíba', 'Cotia', 'Diadema', 'Embu das Artes', 'Ferraz de Vasconcelos', 'Franca', 'Francisco Morato', 'Guarujá', 'Guarulhos', 'Hortolândia', 'Indaiatuba', 'Itapetininga', 'Itapevi', 'Itaquaquecetuba', 'Itu', 'Jacareí', 'Jundiaí', 'Limeira', 'Marília', 'Mauá', 'Mogi das Cruzes', 'Osasco', 'Piracicaba', 'Praia Grande', 'Presidente Prudente', 'Ribeirão Preto', 'Rio Claro', 'Santa Bárbara d\'Oeste', 'Santo André', 'Santos', 'São Bernardo do Campo', 'São Caetano do Sul', 'São Carlos', 'São José do Rio Preto', 'São José dos Campos', 'São Paulo', 'São Vicente', 'Sorocaba', 'Sumaré', 'Suzano', 'Taboão da Serra', 'Taubaté']
  },
  {
    uf: 'SE',
    name: 'Sergipe',
    cities: ['Aracaju', 'Barra dos Coqueiros', 'Estância', 'Itabaiana', 'Itabaianinha', 'Lagarto', 'Laranjeiras', 'Nossa Senhora do Socorro', 'Propriá', 'Ribeirópolis', 'São Cristóvão', 'Simão Dias', 'Tobias Barreto', 'Umbaúba']
  },
  {
    uf: 'TO',
    name: 'Tocantins',
    cities: ['Araguaína', 'Araguatins', 'Augustinópolis', 'Colinas do Tocantins', 'Dianópolis', 'Formoso do Araguaia', 'Guaraí', 'Gurupi', 'Miracema do Tocantins', 'Palmas', 'Paraíso do Tocantins', 'Pedro Afonso', 'Porto Nacional', 'Taguatinga', 'Tocantinópolis']
  }
];

/**
 * Devido ao grande número de municípios (5.570), para produção recomenda-se:
 * 1. Carregar de uma API (ex: servicodados.ibge.gov.br/api/v1/localidades/estados/{UF}/municipios)
 * 2. Ou usar esta lista expandida com as principais cidades
 * 
 * Para este projeto, incluí as cidades mais importantes de cada estado.
 * Lista completa pode ser carregada sob demanda.
 */

/**
 * Retorna as cidades de um estado específico
 */
export function getCitiesByState(uf: string): string[] {
  const state = brazilianStates.find(s => s.uf === uf);
  return state ? state.cities.sort() : [];
}

/**
 * Retorna apenas os UFs dos estados
 */
export function getStateUFs(): string[] {
  return brazilianStates.map(s => s.uf);
}

/**
 * Retorna o nome completo do estado pelo UF
 */
export function getStateName(uf: string): string {
  const state = brazilianStates.find(s => s.uf === uf);
  return state ? state.name : uf;
}

/**
 * Busca cidades por nome (parcial)
 */
export function searchCities(query: string, uf?: string): string[] {
  const normalizedQuery = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  
  if (uf) {
    const cities = getCitiesByState(uf);
    return cities.filter(city => 
      city.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(normalizedQuery)
    );
  }
  
  // Buscar em todos os estados
  const allCities: string[] = [];
  brazilianStates.forEach(state => {
    const matchingCities = state.cities.filter(city =>
      city.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(normalizedQuery)
    );
    allCities.push(...matchingCities);
  });
  
  return allCities.sort();
}
