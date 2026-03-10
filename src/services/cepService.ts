// Serviço para buscar informações de CEP
// Utiliza a API ViaCEP (https://viacep.com.br/)

export interface CepData {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string; // Cidade
  uf: string; // Estado (sigla)
  ibge: string;
  gia: string;
  ddd: string;
  siafi: string;
}

export interface CepResult {
  success: boolean;
  data?: CepData;
  error?: string;
}

/**
 * Busca informações de endereço pelo CEP
 * @param cep CEP com ou sem formatação (12345678 ou 12345-678)
 * @returns Informações do endereço ou erro
 */
export const buscarCep = async (cep: string): Promise<CepResult> => {
  try {
    // Remove caracteres não numéricos
    const cepLimpo = cep.replace(/\D/g, '');

    // Validação básica de CEP
    if (cepLimpo.length !== 8) {
      return {
        success: false,
        error: 'CEP deve conter 8 dígitos',
      };
    }

    // Faz a requisição para a API ViaCEP
    const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);

    if (!response.ok) {
      return {
        success: false,
        error: 'Erro ao buscar CEP. Tente novamente.',
      };
    }

    const data: CepData = await response.json();

    // ViaCEP retorna { erro: true } quando o CEP não existe
    if ('erro' in data && data.erro) {
      return {
        success: false,
        error: 'CEP não encontrado',
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('Erro ao buscar CEP:', error);
    return {
      success: false,
      error: 'Erro ao buscar CEP. Verifique sua conexão.',
    };
  }
};

/**
 * Formata CEP para exibição (12345-678)
 * @param cep CEP sem formatação
 * @returns CEP formatado
 */
export const formatarCep = (cep: string): string => {
  const cepLimpo = cep.replace(/\D/g, '');
  return cepLimpo.replace(/^(\d{5})(\d{3})$/, '$1-$2');
};

/**
 * Converte sigla de estado para nome completo
 */
export const UF_TO_ESTADO: Record<string, string> = {
  'AC': 'Acre',
  'AL': 'Alagoas',
  'AP': 'Amapá',
  'AM': 'Amazonas',
  'BA': 'Bahia',
  'CE': 'Ceará',
  'DF': 'Distrito Federal',
  'ES': 'Espírito Santo',
  'GO': 'Goiás',
  'MA': 'Maranhão',
  'MT': 'Mato Grosso',
  'MS': 'Mato Grosso do Sul',
  'MG': 'Minas Gerais',
  'PA': 'Pará',
  'PB': 'Paraíba',
  'PR': 'Paraná',
  'PE': 'Pernambuco',
  'PI': 'Piauí',
  'RJ': 'Rio de Janeiro',
  'RN': 'Rio Grande do Norte',
  'RS': 'Rio Grande do Sul',
  'RO': 'Rondônia',
  'RR': 'Roraima',
  'SC': 'Santa Catarina',
  'SP': 'São Paulo',
  'SE': 'Sergipe',
  'TO': 'Tocantins',
};
