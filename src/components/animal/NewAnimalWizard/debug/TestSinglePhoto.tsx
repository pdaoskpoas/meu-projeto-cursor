// src/components/animal/NewAnimalWizard/debug/TestSinglePhoto.tsx

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { compressMultipleImages } from '../utils/imageCompression';
import { uploadMultiplePhotos } from '../utils/uploadWithRetry';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export const TestSinglePhoto: React.FC = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const addLog = (message: string, data?: unknown) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `${timestamp}: ${message}`;
    console.log(logMessage, data || '');
    setLogs(prev => [...prev, logMessage + (data ? ` - ${JSON.stringify(data)}` : '')]);
  };
  
  const testSinglePhotoUpload = async () => {
    if (!user) {
      addLog('❌ Usuário não autenticado');
      return;
    }
    
    setIsProcessing(true);
    addLog('=== TESTE DE UPLOAD DE FOTO ÚNICA ===');
    
    // Criar um arquivo de teste
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = 'blue';
      ctx.fillRect(0, 0, 100, 100);
    }
    
    try {
      // Converter canvas para blob/file
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => resolve(b!), 'image/jpeg');
      });
      
      const testFile = new File([blob], 'test-image.jpg', { type: 'image/jpeg' });
      addLog('📁 Arquivo de teste criado', {
        name: testFile.name,
        size: testFile.size,
        type: testFile.type
      });
      
      // Testar compressão de uma única imagem
      addLog('🗜️ Iniciando compressão...');
      const compressedFiles = await compressMultipleImages(
        [testFile],
        (current, total) => {
          addLog(`Progresso compressão: ${current}/${total}`);
        }
      );
      
      addLog('✅ Compressão concluída', {
        original: testFile.size,
        compressed: compressedFiles[0]?.size
      });
      
      if (compressedFiles.length === 0) {
        throw new Error('Nenhum arquivo foi comprimido');
      }
      
      // Criar um ID de animal fake para teste
      const testAnimalId = `test-${Date.now()}`;
      
      // Testar upload de uma única imagem
      addLog('📤 Iniciando upload...');
      const uploadedUrls = await uploadMultiplePhotos(
        compressedFiles,
        user.id,
        testAnimalId,
        (current, total, retrying) => {
          addLog(`Progresso upload: ${current}/${total} - Retry: ${retrying}`);
        }
      );
      
      addLog('✅ Upload concluído', {
        urls: uploadedUrls,
        count: uploadedUrls.length
      });
      
      // Verificar se a URL foi gerada
      if (uploadedUrls.length === 0) {
        throw new Error('Nenhuma URL foi retornada');
      }
      
      // Limpar arquivo de teste do storage
      const fileName = uploadedUrls[0].split('/').pop();
      if (fileName) {
        const { error } = await supabase.storage
          .from('animal-images')
          .remove([`${user.id}/${testAnimalId}/${fileName}`]);
        
        if (error) {
          addLog('⚠️ Não foi possível limpar arquivo de teste', error);
        } else {
          addLog('🧹 Arquivo de teste removido do storage');
        }
      }
      
      addLog('=== TESTE CONCLUÍDO COM SUCESSO ===');
      
    } catch (error: unknown) {
      addLog('❌ ERRO NO TESTE', error.message);
      console.error('Erro completo:', error);
    } finally {
      setIsProcessing(false);
    }
  };
  
  const clearLogs = () => setLogs([]);
  
  return (
    <Card className="p-6 max-w-4xl mx-auto mt-8">
      <h2 className="text-xl font-bold mb-4">Teste de Upload de Foto Única</h2>
      
      <div className="space-y-4">
        <div className="flex gap-4">
          <Button
            onClick={testSinglePhotoUpload}
            disabled={isProcessing || !user}
            variant="default"
          >
            {isProcessing ? 'Processando...' : 'Testar Upload de 1 Foto'}
          </Button>
          
          <Button
            onClick={clearLogs}
            variant="outline"
          >
            Limpar Logs
          </Button>
        </div>
        
        {!user && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              ⚠️ Você precisa estar logado para testar o upload
            </p>
          </div>
        )}
        
        <div className="border rounded-lg p-4 bg-gray-50 max-h-96 overflow-y-auto">
          <h3 className="font-semibold mb-2">Logs do Teste:</h3>
          {logs.length === 0 ? (
            <p className="text-gray-500">Clique em "Testar Upload" para começar...</p>
          ) : (
            <div className="space-y-1">
              {logs.map((log, index) => (
                <div 
                  key={index} 
                  className={`text-sm font-mono ${
                    log.includes('❌') ? 'text-red-600' : 
                    log.includes('✅') ? 'text-green-600' : 
                    log.includes('⚠️') ? 'text-yellow-600' : 
                    'text-gray-700'
                  }`}
                >
                  {log}
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800 font-semibold mb-2">
            ℹ️ O que este teste faz:
          </p>
          <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
            <li>Cria uma imagem de teste programaticamente</li>
            <li>Comprime a imagem usando a função compressMultipleImages com 1 arquivo</li>
            <li>Faz upload usando uploadMultiplePhotos com 1 arquivo</li>
            <li>Verifica se a URL foi gerada corretamente</li>
            <li>Limpa o arquivo de teste do storage</li>
          </ul>
        </div>
      </div>
    </Card>
  );
};

