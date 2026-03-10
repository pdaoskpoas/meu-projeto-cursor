import DOMPurify from 'dompurify';

/**
 * 🔒 Sanitização HTML para prevenir XSS
 * Baseado em OWASP XSS Prevention Cheat Sheet
 */

// Configuração padrão (mais restritiva)
const DEFAULT_CONFIG: DOMPurify.Config = {
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li'],
  ALLOWED_ATTR: [],
  KEEP_CONTENT: true,
  RETURN_DOM: false,
  RETURN_DOM_FRAGMENT: false
};

// Configuração para rich text (descrições)
const RICH_TEXT_CONFIG: DOMPurify.Config = {
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote'],
  ALLOWED_ATTR: [],
  KEEP_CONTENT: true
};

// Configuração para texto puro (sem tags)
const PLAIN_TEXT_CONFIG: DOMPurify.Config = {
  ALLOWED_TAGS: [],
  ALLOWED_ATTR: [],
  KEEP_CONTENT: true
};

/**
 * Sanitiza HTML padrão (mais restritivo)
 */
export const sanitizeHTML = (dirty: string): string => {
  if (!dirty) return '';
  return DOMPurify.sanitize(dirty, DEFAULT_CONFIG);
};

/**
 * Sanitiza rich text (descrições de animais, eventos, artigos)
 */
export const sanitizeRichText = (dirty: string): string => {
  if (!dirty) return '';
  return DOMPurify.sanitize(dirty, RICH_TEXT_CONFIG);
};

/**
 * Sanitiza para texto puro (remove TODAS as tags HTML)
 */
export const sanitizePlainText = (dirty: string): string => {
  if (!dirty) return '';
  return DOMPurify.sanitize(dirty, PLAIN_TEXT_CONFIG);
};

/**
 * Sanitiza nomes (animais, usuários, propriedades)
 * Apenas texto, sem HTML
 */
export const sanitizeName = (name: string): string => {
  if (!name) return '';
  
  // Remover todas as tags HTML
  const cleaned = DOMPurify.sanitize(name, PLAIN_TEXT_CONFIG);
  
  // Limitar tamanho e remover caracteres especiais perigosos
  return cleaned
    .trim()
    .slice(0, 200) // Máximo 200 caracteres
    .replace(/[<>"'`]/g, ''); // Remove caracteres perigosos
};

/**
 * Sanitiza URLs (previne javascript:, data:, etc)
 */
export const sanitizeURL = (url: string): string => {
  if (!url) return '';
  
  try {
    const parsed = new URL(url);
    
    // Apenas permitir http/https
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return '';
    }
    
    return url;
  } catch {
    return '';
  }
};

/**
 * Sanitiza input de busca/pesquisa
 */
export const sanitizeSearchQuery = (query: string): string => {
  if (!query) return '';
  
  return query
    .trim()
    .slice(0, 100) // Máximo 100 caracteres
    .replace(/[<>"';`]/g, ''); // Remove caracteres SQL/XSS perigosos
};





