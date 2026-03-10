import React, { useCallback, useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Bell, BellOff, Clock, Mail, Smartphone } from 'lucide-react';

interface NotificationPrefs {
  favorite_added_enabled: boolean;
  message_received_enabled: boolean;
  animal_view_enabled: boolean;
  animal_click_enabled: boolean;
  boost_expiring_enabled: boolean;
  ad_expiring_enabled: boolean;
  partnership_invite_enabled: boolean;
  partnership_accepted_enabled: boolean;
  digest_mode: boolean;
  digest_frequency: 'realtime' | 'hourly' | 'daily' | 'weekly';
  in_app_enabled: boolean;
  email_enabled: boolean;
  push_enabled: boolean;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
}

/**
 * Componente para gerenciar preferências de notificações
 * Permite controle granular sobre quais notificações receber
 */
export const NotificationPreferences: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [prefs, setPrefs] = useState<NotificationPrefs>({
    favorite_added_enabled: true,
    message_received_enabled: true,
    animal_view_enabled: true,
    animal_click_enabled: false,
    boost_expiring_enabled: true,
    ad_expiring_enabled: true,
    partnership_invite_enabled: true,
    partnership_accepted_enabled: true,
    digest_mode: false,
    digest_frequency: 'realtime',
    in_app_enabled: true,
    email_enabled: false,
    push_enabled: false,
    quiet_hours_enabled: false,
    quiet_hours_start: '22:00',
    quiet_hours_end: '08:00'
  });

  const loadPreferences = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = not found
        throw error;
      }

      if (data) {
        setPrefs(prev => ({ ...prev, ...data }));
      }
    } catch (error: unknown) {
      console.error('Erro ao carregar preferências:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar suas preferências.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [user?.id, toast]);

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  const savePreferences = async () => {
    if (!user?.id) return;

    try {
      setSaving(true);

      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: user.id,
          ...prefs,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: 'Sucesso!',
        description: 'Suas preferências foram salvas.',
      });
    } catch (error: unknown) {
      console.error('Erro ao salvar preferências:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar suas preferências.',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const updatePref = (key: keyof NotificationPrefs, value: boolean) => {
    setPrefs(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-gray-600">Carregando preferências...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tipos de Notificação */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Tipos de Notificação</h3>
        </div>
        <p className="text-sm text-gray-600 mb-6">
          Escolha quais notificações você deseja receber
        </p>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="favorite">Favoritos nos anúncios</Label>
              <p className="text-xs text-gray-500">Quando alguém favoritar seus anúncios</p>
            </div>
            <Switch
              id="favorite"
              checked={prefs.favorite_added_enabled}
              onCheckedChange={(checked) => updatePref('favorite_added_enabled', checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="message">Mensagens recebidas</Label>
              <p className="text-xs text-gray-500">Quando receber novas mensagens</p>
            </div>
            <Switch
              id="message"
              checked={prefs.message_received_enabled}
              onCheckedChange={(checked) => updatePref('message_received_enabled', checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="views">Visualizações nos anúncios</Label>
              <p className="text-xs text-gray-500">A cada 10 visualizações</p>
            </div>
            <Switch
              id="views"
              checked={prefs.animal_view_enabled}
              onCheckedChange={(checked) => updatePref('animal_view_enabled', checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="partnership">Convites de sociedade</Label>
              <p className="text-xs text-gray-500">Quando receberconvites de parceria</p>
            </div>
            <Switch
              id="partnership"
              checked={prefs.partnership_invite_enabled}
              onCheckedChange={(checked) => updatePref('partnership_invite_enabled', checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="boost">Alertas de boost expirando</Label>
              <p className="text-xs text-gray-500">Quando seu boost estiver próximo de expirar</p>
            </div>
            <Switch
              id="boost"
              checked={prefs.boost_expiring_enabled}
              onCheckedChange={(checked) => updatePref('boost_expiring_enabled', checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="ad-expire">Alertas de anúncio expirando</Label>
              <p className="text-xs text-gray-500">Quando seu anúncio estiver próximo de expirar</p>
            </div>
            <Switch
              id="ad-expire"
              checked={prefs.ad_expiring_enabled}
              onCheckedChange={(checked) => updatePref('ad_expiring_enabled', checked)}
            />
          </div>
        </div>
      </Card>

      {/* Horário Silencioso */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Horário Silencioso</h3>
        </div>
        <p className="text-sm text-gray-600 mb-6">
          Não receber notificações durante determinado horário
        </p>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="quiet">Ativar horário silencioso</Label>
            <Switch
              id="quiet"
              checked={prefs.quiet_hours_enabled}
              onCheckedChange={(checked) => updatePref('quiet_hours_enabled', checked)}
            />
          </div>

          {prefs.quiet_hours_enabled && (
            <>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="quiet-start">Início</Label>
                  <input
                    type="time"
                    id="quiet-start"
                    value={prefs.quiet_hours_start}
                    onChange={(e) => updatePref('quiet_hours_start', e.target.value)}
                    className="w-full mt-1 px-3 py-2 border rounded-md"
                  />
                </div>
                <div>
                  <Label htmlFor="quiet-end">Fim</Label>
                  <input
                    type="time"
                    id="quiet-end"
                    value={prefs.quiet_hours_end}
                    onChange={(e) => updatePref('quiet_hours_end', e.target.value)}
                    className="w-full mt-1 px-3 py-2 border rounded-md"
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </Card>

      {/* Canais (Futuro) */}
      <Card className="p-6 opacity-60">
        <div className="flex items-center gap-2 mb-4">
          <Smartphone className="h-5 w-5 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-500">Canais de Notificação</h3>
          <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">Em breve</span>
        </div>
        <p className="text-sm text-gray-500 mb-6">
          Escolha onde deseja receber notificações
        </p>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-gray-400">Notificações no app</Label>
              <p className="text-xs text-gray-400">Sempre ativas</p>
            </div>
            <Switch checked={true} disabled />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-gray-400" />
              <div>
                <Label className="text-gray-400">Email</Label>
                <p className="text-xs text-gray-400">Resumo diário por email</p>
              </div>
            </div>
            <Switch disabled />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BellOff className="h-4 w-4 text-gray-400" />
              <div>
                <Label className="text-gray-400">Push (navegador/mobile)</Label>
                <p className="text-xs text-gray-400">Notificações push</p>
              </div>
            </div>
            <Switch disabled />
          </div>
        </div>
      </Card>

      {/* Botão Salvar */}
      <div className="flex justify-end">
        <Button
          onClick={savePreferences}
          disabled={saving}
          className="w-full sm:w-auto"
        >
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Salvar Preferências
        </Button>
      </div>
    </div>
  );
};

