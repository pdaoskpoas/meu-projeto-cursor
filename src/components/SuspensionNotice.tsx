import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ShieldX, Mail, Phone } from 'lucide-react';

interface SuspensionNoticeProps {
  suspensionDate?: string;
  suspensionReason?: string;
}

export function SuspensionNotice({ suspensionDate, suspensionReason }: SuspensionNoticeProps) {
  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <Card className="border-gray-300 bg-gray-900">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <ShieldX className="h-16 w-16 text-white" />
          </div>
          <CardTitle className="text-2xl text-white">
            Usuário Bloqueado
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert className="border-gray-600 bg-gray-800">
            <AlertDescription className="text-white">
              Após constatarmos que você infringiu algumas de nossas normas, decidimos suspender o seu acesso à nossa plataforma.
            </AlertDescription>
          </Alert>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              O que acontece com sua conta suspensa:
            </h3>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-gray-900 font-bold">•</span>
                <span>Todos os seus anúncios foram removidos do ar</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gray-900 font-bold">•</span>
                <span>Sociedades foram removidas do seu perfil</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gray-900 font-bold">•</span>
                <span>Você não pode criar uma nova conta com este email ou CPF</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gray-900 font-bold">•</span>
                <span>Seu acesso está limitado apenas à visualização</span>
              </li>
            </ul>
          </div>

          {suspensionDate && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">
                <strong>Data da suspensão:</strong> {new Date(suspensionDate).toLocaleDateString('pt-BR')}
              </p>
              {suspensionReason && (
                <p className="text-sm text-gray-600 mt-2">
                  <strong>Motivo:</strong> {suspensionReason}
                </p>
              )}
            </div>
          )}

          <div className="text-center space-y-4">
            <p className="text-gray-700">
              Para solucionar possíveis dúvidas ou mal-entendidos, entre em contato com nosso suporte:
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="outline" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                suporte@vitrinedocavalo.com.br
              </Button>
              <Button variant="outline" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                (11) 9999-9999
              </Button>
            </div>
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-500">
              Esta medida é pensada para proteger nossa comunidade de usuários que possam utilizar a plataforma para aplicar golpes.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


