// src/components/animal/NewAnimalWizard/debug/TestUpload.tsx

import React, { useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { validateImageFile } from '../utils/imageCompression';

export const TestUpload: React.FC = () => {
  const [logs, setLogs] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const addLog = (message: string) => {
    console.log(message);
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };
  
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    addLog('=== INÍCIO DO TESTE ===');
    addLog(`handleFileSelect chamado`);
    
    const files = e.target.files;
    addLog(`Files object: ${files}`);
    addLog(`Files length: ${files?.length || 0}`);
    
    if (!files || files.length === 0) {
      addLog('Nenhum arquivo selecionado');
      return;
    }
    
    const filesArray = Array.from(files);
    addLog(`Array.from executado: ${filesArray.length} arquivos`);
    
    for (let i = 0; i < filesArray.length; i++) {
      const file = filesArray[i];
      addLog(`Arquivo ${i + 1}:`);
      addLog(`  - Nome: ${file.name}`);
      addLog(`  - Tipo: ${file.type}`);
      addLog(`  - Tamanho: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
      
      try {
        addLog(`  - Validando...`);
        const validation = validateImageFile(file);
        addLog(`  - Resultado: ${validation}`);
      } catch (error: unknown) {
        addLog(`  - ERRO na validação: ${error.message}`);
        console.error(error);
      }
    }
    
    addLog('=== FIM DO TESTE ===');
    
    // Limpar input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  return (
    <Card className="p-6 max-w-2xl mx-auto mt-8">
      <h2 className="text-xl font-bold mb-4">Teste de Upload de Imagens</h2>
      
      <div className="space-y-4">
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <Button
            onClick={() => {
              addLog('Botão clicado - abrindo seletor de arquivos');
              fileInputRef.current?.click();
            }}
            variant="outline"
            className="w-full"
          >
            Selecionar Arquivos para Teste
          </Button>
        </div>
        
        <div className="border rounded-lg p-4 bg-gray-50 max-h-96 overflow-y-auto">
          <h3 className="font-semibold mb-2">Logs:</h3>
          {logs.length === 0 ? (
            <p className="text-gray-500">Nenhum log ainda...</p>
          ) : (
            <div className="space-y-1">
              {logs.map((log, index) => (
                <div key={index} className="text-sm font-mono">
                  {log}
                </div>
              ))}
            </div>
          )}
        </div>
        
        <Button
          onClick={() => setLogs([])}
          variant="destructive"
          size="sm"
        >
          Limpar Logs
        </Button>
      </div>
    </Card>
  );
};

