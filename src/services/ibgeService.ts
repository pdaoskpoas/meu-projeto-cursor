/**
 * Serviço para buscar dados de localidades do IBGE
 * API: https://servicodados.ibge.gov.br/api/docs/localidades
 */

interface IBGEMunicipio {
  id: number;
  nome: string;
  microrregiao: {
    id: number;
    nome: string;
    mesorregiao: {
      id: number;
      nome: string;
      UF: {
        id: number;
        sigla: string;
        nome: string;
      };
    };
  };
}

// Cache em memória para evitar múltiplas requisições
const citiesCache: Map<string, string[]> = new Map();
let cacheTimestamp: number = 0;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 horas

/**
 * Busca todas as cidades de um estado usando a API do IBGE
 */
export async function fetchCitiesByState(uf: string): Promise<string[]> {
  // Verificar cache
  const now = Date.now();
  if (citiesCache.has(uf) && (now - cacheTimestamp) < CACHE_DURATION) {
    return citiesCache.get(uf)!;
  }

  try {
    const response = await fetch(
      `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`,
      {
        headers: {
          'Accept': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Erro ao buscar cidades: ${response.status}`);
    }

    const municipios: IBGEMunicipio[] = await response.json();
    const cities = municipios.map(m => m.nome).sort();

    // Atualizar cache
    citiesCache.set(uf, cities);
    cacheTimestamp = now;

    return cities;
  } catch (error) {
    console.error(`Erro ao buscar cidades de ${uf}:`, error);
    
    // Fallback: retornar cidades do cache se disponível
    if (citiesCache.has(uf)) {
      return citiesCache.get(uf)!;
    }
    
    throw error;
  }
}

/**
 * Limpa o cache de cidades
 */
export function clearCitiesCache(): void {
  citiesCache.clear();
  cacheTimestamp = 0;
}

/**
 * Pré-carrega as cidades de um estado (útil para melhorar UX)
 */
export async function preloadCities(uf: string): Promise<void> {
  try {
    await fetchCitiesByState(uf);
  } catch (error) {
    console.warn(`Não foi possível pré-carregar cidades de ${uf}`);
  }
}

