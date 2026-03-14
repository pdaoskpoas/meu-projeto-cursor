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
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'a', 'img'],
  ALLOWED_ATTR: ['href', 'target', 'rel', 'src', 'alt', 'title', 'class'],
  ALLOW_DATA_ATTR: false,
  KEEP_CONTENT: true,
  // Garantir que o HTML seja renderizado, não escapado
  RETURN_DOM: false,
  RETURN_DOM_FRAGMENT: false,
  // Adicionar rel="noopener noreferrer" para links externos
  ADD_ATTR: ['target'],
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
 * Decodifica HTML entities escapadas
 */
const decodeHtmlEntities = (html: string): string => {
  if (typeof window === 'undefined') {
    // Servidor-side: usar replace simples
    return html
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
  }
  
  // Client-side: usar DOM para decodificar corretamente
  const textarea = document.createElement('textarea');
  textarea.innerHTML = html;
  return textarea.value;
};

/**
 * Sanitiza rich text (descrições de animais, eventos, artigos)
 */
export const sanitizeRichText = (dirty: string): string => {
  if (!dirty) return '';
  
  // Se o conteúdo já está escapado (contém &lt; ou &gt;), decodificar primeiro
  let content = dirty;
  if (content.includes('&lt;') || content.includes('&gt;') || content.includes('&amp;')) {
    content = decodeHtmlEntities(content);
  }
  
  // Sanitizar o HTML - DOMPurify mantém as tags permitidas e remove as não permitidas
  // IMPORTANTE: DOMPurify NÃO escapa o HTML, ele apenas remove tags não permitidas
  let sanitized = DOMPurify.sanitize(content, RICH_TEXT_CONFIG);
  
  // Adicionar rel="noopener noreferrer" para links externos automaticamente
  sanitized = sanitized.replace(
    /<a\s+([^>]*href=["']([^"']+)["'][^>]*)>/gi,
    (match, attrs, href) => {
      // Verificar se é link externo
      const isExternal = href.startsWith('http://') || href.startsWith('https://');
      if (isExternal && !attrs.includes('rel=')) {
        return `<a ${attrs} rel="noopener noreferrer" target="_blank">`;
      }
      if (isExternal && !attrs.includes('target=')) {
        return match.replace('>', ' target="_blank">');
      }
      return match;
    }
  );
  
  return sanitized;
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





