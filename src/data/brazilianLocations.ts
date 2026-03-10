// Lista completa de estados brasileiros
export const BRAZILIAN_STATES = [
  'Acre',
  'Alagoas', 
  'Amapá',
  'Amazonas',
  'Bahia',
  'Ceará',
  'Distrito Federal',
  'Espírito Santo',
  'Goiás',
  'Maranhão',
  'Mato Grosso',
  'Mato Grosso do Sul',
  'Minas Gerais',
  'Pará',
  'Paraíba',
  'Paraná',
  'Pernambuco',
  'Piauí',
  'Rio de Janeiro',
  'Rio Grande do Norte',
  'Rio Grande do Sul',
  'Rondônia',
  'Roraima',
  'Santa Catarina',
  'São Paulo',
  'Sergipe',
  'Tocantins'
];

// Principais cidades por estado (expandida)
export const CITIES_BY_STATE: Record<string, string[]> = {
  'Acre': [
    'Rio Branco', 'Cruzeiro do Sul', 'Sena Madureira', 'Tarauacá', 'Feijó',
    'Brasileia', 'Plácido de Castro', 'Xapuri', 'Senador Guiomard', 'Acrelândia'
  ],
  'Alagoas': [
    'Maceió', 'Arapiraca', 'Palmeira dos Índios', 'Rio Largo', 'Penedo',
    'União dos Palmares', 'São Miguel dos Campos', 'Coruripe', 'Delmiro Gouveia', 'Santana do Ipanema'
  ],
  'Amapá': [
    'Macapá', 'Santana', 'Laranjal do Jari', 'Oiapoque', 'Mazagão',
    'Porto Grande', 'Tartarugalzinho', 'Vitória do Jari', 'Ferreira Gomes', 'Pedra Branca do Amapari'
  ],
  'Amazonas': [
    'Manaus', 'Parintins', 'Itacoatiara', 'Manacapuru', 'Coari',
    'Tefé', 'Tabatinga', 'Maués', 'São Gabriel da Cachoeira', 'Humaitá'
  ],
  'Bahia': [
    'Salvador', 'Feira de Santana', 'Vitória da Conquista', 'Camaçari', 'Itabuna',
    'Juazeiro', 'Lauro de Freitas', 'Ilhéus', 'Jequié', 'Teixeira de Freitas',
    'Alagoinhas', 'Porto Seguro', 'Simões Filho', 'Paulo Afonso', 'Eunápolis'
  ],
  'Ceará': [
    'Fortaleza', 'Caucaia', 'Juazeiro do Norte', 'Maracanaú', 'Sobral',
    'Crato', 'Itapipoca', 'Maranguape', 'Iguatu', 'Quixadá',
    'Canindé', 'Aquiraz', 'Pacatuba', 'Crateús', 'Russas'
  ],
  'Distrito Federal': [
    'Brasília', 'Taguatinga', 'Ceilândia', 'Samambaia', 'Planaltina',
    'Águas Claras', 'Guará', 'Sobradinho', 'Gama', 'Santa Maria'
  ],
  'Espírito Santo': [
    'Vitória', 'Vila Velha', 'Cariacica', 'Serra', 'Cachoeiro de Itapemirim',
    'Linhares', 'São Mateus', 'Colatina', 'Guarapari', 'Aracruz',
    'Viana', 'Nova Venécia', 'Barra de São Francisco', 'Santa Teresa', 'Domingos Martins'
  ],
  'Goiás': [
    'Goiânia', 'Aparecida de Goiânia', 'Anápolis', 'Rio Verde', 'Luziânia',
    'Águas Lindas de Goiás', 'Valparaíso de Goiás', 'Trindade', 'Formosa', 'Novo Gama',
    'Itumbiara', 'Senador Canedo', 'Catalão', 'Jataí', 'Planaltina'
  ],
  'Maranhão': [
    'São Luís', 'Imperatriz', 'São José de Ribamar', 'Timon', 'Caxias',
    'Codó', 'Paço do Lumiar', 'Açailândia', 'Bacabal', 'Balsas',
    'Santa Inês', 'Pinheiro', 'Pedreiras', 'Chapadinha', 'Barra do Corda'
  ],
  'Mato Grosso': [
    'Cuiabá', 'Várzea Grande', 'Rondonópolis', 'Sinop', 'Tangará da Serra',
    'Cáceres', 'Sorriso', 'Lucas do Rio Verde', 'Barra do Garças', 'Primavera do Leste',
    'Alta Floresta', 'Diamantino', 'Juína', 'Nova Mutum', 'Colíder'
  ],
  'Mato Grosso do Sul': [
    'Campo Grande', 'Dourados', 'Três Lagoas', 'Corumbá', 'Ponta Porã',
    'Naviraí', 'Nova Andradina', 'Sidrolândia', 'Maracaju', 'São Gabriel do Oeste',
    'Coxim', 'Aquidauana', 'Paranaíba', 'Amambai', 'Chapadão do Sul'
  ],
  'Minas Gerais': [
    'Belo Horizonte', 'Uberlândia', 'Contagem', 'Juiz de Fora', 'Betim',
    'Montes Claros', 'Ribeirão das Neves', 'Uberaba', 'Governador Valadares', 'Ipatinga',
    'Sete Lagoas', 'Divinópolis', 'Santa Luzia', 'Ibirité', 'Poços de Caldas',
    'Patos de Minas', 'Pouso Alegre', 'Teófilo Otoni', 'Barbacena', 'Sabará'
  ],
  'Pará': [
    'Belém', 'Ananindeua', 'Santarém', 'Marabá', 'Parauapebas',
    'Castanhal', 'Abaetetuba', 'Cametá', 'Marituba', 'Bragança',
    'Altamira', 'Itaituba', 'Tucuruí', 'Benevides', 'Paragominas'
  ],
  'Paraíba': [
    'João Pessoa', 'Campina Grande', 'Santa Rita', 'Patos', 'Bayeux',
    'Sousa', 'Cajazeiras', 'Cabedelo', 'Guarabira', 'Mamanguape',
    'Sapé', 'Desterro', 'Rio Tinto', 'Conde', 'Monteiro'
  ],
  'Paraná': [
    'Curitiba', 'Londrina', 'Maringá', 'Ponta Grossa', 'Cascavel',
    'São José dos Pinhais', 'Foz do Iguaçu', 'Colombo', 'Guarapuava', 'Paranaguá',
    'Araucária', 'Toledo', 'Apucarana', 'Pinhais', 'Campo Largo',
    'Almirante Tamandaré', 'Umuarama', 'Paranavaí', 'Bacacheri', 'Cambé'
  ],
  'Pernambuco': [
    'Recife', 'Jaboatão dos Guararapes', 'Olinda', 'Bandeira', 'Caruaru',
    'Petrolina', 'Paulista', 'Cabo de Santo Agostinho', 'Camaragibe', 'Garanhuns',
    'Vitória de Santo Antão', 'Igarassu', 'São Lourenço da Mata', 'Santa Cruz do Capibaribe', 'Abreu e Lima'
  ],
  'Piauí': [
    'Teresina', 'Parnaíba', 'Picos', 'Piripiri', 'Floriano',
    'Campo Maior', 'Barras', 'União', 'Altos', 'Pedro II',
    'Valença', 'José de Freitas', 'Oeiras', 'São Raimundo Nonato', 'Esperantina'
  ],
  'Rio de Janeiro': [
    'Rio de Janeiro', 'São Gonçalo', 'Duque de Caxias', 'Nova Iguaçu', 'Niterói',
    'Belford Roxo', 'São João de Meriti', 'Campos dos Goytacazes', 'Petrópolis', 'Volta Redonda',
    'Magé', 'Macaé', 'Itaboraí', 'Cabo Frio', 'Angra dos Reis',
    'Nova Friburgo', 'Barra Mansa', 'Teresópolis', 'Mesquita', 'Nilópolis'
  ],
  'Rio Grande do Norte': [
    'Natal', 'Mossoró', 'Parnamirim', 'São Gonçalo do Amarante', 'Macaíba',
    'Ceará-Mirim', 'Caicó', 'Assu', 'Currais Novos', 'Santa Cruz',
    'São José de Mipibu', 'Nova Cruz', 'João Câmara', 'Pau dos Ferros', 'Canguaretama'
  ],
  'Rio Grande do Sul': [
    'Porto Alegre', 'Caxias do Sul', 'Pelotas', 'Canoas', 'Santa Maria',
    'Gravataí', 'Viamão', 'Novo Hamburgo', 'São Leopoldo', 'Rio Grande',
    'Alvorada', 'Passo Fundo', 'Sapucaia do Sul', 'Uruguaiana', 'Santa Cruz do Sul',
    'Cachoeirinha', 'Bagé', 'Bento Gonçalves', 'Erechim', 'Guaíba'
  ],
  'Rondônia': [
    'Porto Velho', 'Ji-Paraná', 'Ariquemes', 'Vilhena', 'Cacoal',
    'Rolim de Moura', 'Guajará-Mirim', 'Jaru', 'Ouro Preto do Oeste', 'Buritis',
    'Machadinho d\'Oeste', 'Presidente Médici', 'Espigão d\'Oeste', 'Colorado do Oeste', 'Cerejeiras'
  ],
  'Roraima': [
    'Boa Vista', 'Rorainópolis', 'Caracaraí', 'Alto Alegre', 'Mucajaí',
    'Cantá', 'Bonfim', 'Normandia', 'São Luiz', 'São João da Baliza',
    'Caroebe', 'Iracema', 'Amajari', 'Pacaraima', 'Uiramutã'
  ],
  'Santa Catarina': [
    'Florianópolis', 'Joinville', 'Blumenau', 'São José', 'Criciúma',
    'Chapecó', 'Itajaí', 'Lages', 'Jaraguá do Sul', 'Palhoça',
    'Balneário Camboriú', 'Brusque', 'Tubarão', 'São Bento do Sul', 'Caçador',
    'Camboriú', 'Navegantes', 'Concórdia', 'Rio do Sul', 'Araranguá'
  ],
  'São Paulo': [
    'São Paulo', 'Guarulhos', 'Campinas', 'São Bernardo do Campo', 'Santo André',
    'Osasco', 'Ribeirão Preto', 'Sorocaba', 'Mauá', 'São José dos Campos',
    'Mogi das Cruzes', 'Diadema', 'Jundiaí', 'Carapicuíba', 'Piracicaba',
    'Bauru', 'São Vicente', 'Franca', 'Guarujá', 'Taubaté',
    'Praia Grande', 'Limeira', 'Suzano', 'Taboão da Serra', 'Sumaré'
  ],
  'Sergipe': [
    'Aracaju', 'Nossa Senhora do Socorro', 'Lagarto', 'Itabaiana', 'São Cristóvão',
    'Estância', 'Tobias Barreto', 'Simão Dias', 'Propriá', 'Barra dos Coqueiros',
    'Glória', 'Ribeirópolis', 'Neópolis', 'Canindé de São Francisco', 'Carmópolis'
  ],
  'Tocantins': [
    'Palmas', 'Araguaína', 'Gurupi', 'Porto Nacional', 'Paraíso do Tocantins',
    'Colinas do Tocantins', 'Guaraí', 'Formoso do Araguaia', 'Dianópolis', 'Taguatinga',
    'Araguatins', 'Tocantinópolis', 'Pedro Afonso', 'Miracema do Tocantins', 'Xambioá'
  ]
};

// Função para buscar cidades por estado
export const getCitiesByState = (state: string): string[] => {
  return CITIES_BY_STATE[state] || [];
};

// Função para validar se uma cidade existe no estado
export const isValidCityForState = (state: string, city: string): boolean => {
  const cities = getCitiesByState(state);
  return cities.includes(city);
};

