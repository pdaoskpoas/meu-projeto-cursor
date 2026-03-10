import { describe, test, expect } from 'vitest';
import { slugify, generateUniqueSlug } from '../slugify';

describe('slugify', () => {
  test('converte texto para slug minúsculo', () => {
    expect(slugify('Meu Primeiro Artigo')).toBe('meu-primeiro-artigo');
  });

  test('remove acentos corretamente', () => {
    expect(slugify('Café com Açúcar')).toBe('cafe-com-acucar');
  });

  test('remove caracteres especiais', () => {
    expect(slugify('Artigo!@# Teste$%^')).toBe('artigo-teste');
  });

  test('substitui múltiplos espaços por um hífen', () => {
    expect(slugify('Artigo    Com    Espaços')).toBe('artigo-com-espacos');
  });

  test('remove hífens no início e fim', () => {
    expect(slugify('---Artigo Teste---')).toBe('artigo-teste');
  });

  test('retorna string vazia para entrada vazia', () => {
    expect(slugify('')).toBe('');
  });
});

describe('generateUniqueSlug', () => {
  test('retorna slug original se não existir', () => {
    const slug = generateUniqueSlug('test-slug', []);
    expect(slug).toBe('test-slug');
  });

  test('adiciona sufixo numérico se slug já existir', () => {
    const slug = generateUniqueSlug('test-slug', ['test-slug']);
    expect(slug).toBe('test-slug-1');
  });

  test('incrementa sufixo se múltiplos slugs existirem', () => {
    const slug = generateUniqueSlug('test-slug', ['test-slug', 'test-slug-1', 'test-slug-2']);
    expect(slug).toBe('test-slug-3');
  });
});



