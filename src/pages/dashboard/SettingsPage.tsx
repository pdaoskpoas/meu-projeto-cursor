import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { 
  User, 
  Lock, 
  Mail, 
  Phone, 
  Building, 
  Save,
  Eye,
  EyeOff,
  Shield,
  CreditCard,
  Building2,
  Bell,
  CheckCircle2,
  AlertCircle,
  Trash2
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import DashboardPageWrapper from '@/components/layout/DashboardPageWrapper';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import PropertyTypeSelector from '@/components/auth/PropertyTypeSelector';
import { formatPhone } from '@/utils/paymentValidation';

const SettingsPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [personalData, setPersonalData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    cpf: user?.cpf || ''
  });

  const [institutionalData, setInstitutionalData] = useState({
    propertyName: user?.propertyName || '',
    propertyType: user?.propertyType || 'haras'
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const [notificationPreferences, setNotificationPreferences] = useState({
    emailNewMessage: true,
    emailNewAnimal: false,
    emailEventUpdate: true,
    emailPartnership: true,
    emailMarketing: false,
    pushNotifications: true
  });

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState({
    personal: false,
    institutional: false,
    notifications: false
  });

  // Estado para histórico de pagamentos real
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(true);

  // Buscar histórico de pagamentos real do banco de dados
  useEffect(() => {
    if (!user?.id) return;
    setPersonalData(prev => ({
      ...prev,
      name: user?.name || '',
      email: user?.email || '',
      cpf: user?.cpf || '',
      phone: user?.phone || ''
    }));
  }, [user?.id, user?.name, user?.email, user?.cpf, user?.phone]);

  useEffect(() => {
    const fetchPaymentHistory = async () => {
      if (!user?.id) return;
      
      try {
        setLoadingPayments(true);
        
        // Buscar transações do usuário
        const { data: transactions, error } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Processar transações para formato do histórico
        const formattedHistory = transactions?.map(transaction => {
          const metadata = (transaction.metadata || {}) as Record<string, unknown>;
          const hasAdminGrantFlag = Boolean(metadata.admin_grant || metadata.granted_by_admin);
          const isVipPlan = transaction.plan_type === 'vip';
          const isAdminGrant = transaction.amount === 0 || transaction.amount === null || hasAdminGrantFlag || isVipPlan;
          
          // Determinar tipo de pagamento
          let type = 'monthly';
          let installment = null;
          let totalInstallments = null;
          
          if (transaction.type === 'plan_subscription') {
            if (transaction.is_annual) {
              if (transaction.metadata?.installment) {
                type = 'annual_installment';
                installment = transaction.metadata.installment;
                totalInstallments = transaction.metadata.total_installments || 12;
              } else if (transaction.metadata?.payment_method === 'pix') {
                type = 'annual_pix';
              }
            }
          }

          // Determinar método de pagamento
          let method = 'Não especificado';
          if (isAdminGrant) {
            method = 'Grátis (Concedido pelo Admin)';
          } else if (transaction.metadata?.payment_method) {
            const methodMap = {
              'credit_card': 'Cartão de Crédito',
              'pix': 'PIX',
              'boleto': 'Boleto'
            };
            method = methodMap[transaction.metadata.payment_method] || transaction.metadata.payment_method;
          }

          // Determinar nome do plano
          let planName = 'Plano';
          if (transaction.type === 'boost_purchase') {
            planName = 'Compra de Boost';
          } else if (transaction.type === 'individual_ad') {
            planName = 'Publicação individual';
          } else if (transaction.plan_type) {
            const planNameMap = {
              'free': 'Gratuito',
              'basic': 'Basic',
              'pro': 'Pro',
              'ultra': 'Ultra',
              'vip': 'VIP'
            };
            const resolvedName = planNameMap[transaction.plan_type] || transaction.plan_type;
            planName = `Plano (${resolvedName})`;
          }

          if (transaction.is_annual) {
            planName += ' Anual';
            if (type === 'annual_installment' && installment) {
              planName += ` ${installment} de ${totalInstallments || 12}`;
            }
          }

          // Status
          const statusMap = {
            'pending': 'Pendente',
            'completed': 'Pago',
            'failed': 'Falhou',
            'refunded': 'Reembolsado'
          };

          return {
            id: transaction.id,
            date: transaction.created_at,
            plan: planName,
            amount: isAdminGrant ? 0 : parseFloat(transaction.amount),
            method: method,
            status: isAdminGrant ? 'Grátis' : (statusMap[transaction.status] || transaction.status),
            type: type,
            installment: installment,
            totalInstallments: totalInstallments,
            isAdminGrant: isAdminGrant,
            description: isAdminGrant
              ? 'Concessão administrativa'
              : transaction.type === 'boost_purchase'
                ? `Compra de ${transaction.boost_quantity || 1} impulso(s)`
                : transaction.type === 'individual_ad'
                  ? 'Publicação individual'
                  : transaction.type === 'plan_subscription'
                    ? planName
                    : 'Transação'
          };
        }) || [];

        setPaymentHistory(formattedHistory);
      } catch (error) {
        console.error('Erro ao buscar histórico de pagamentos:', error);
        toast({
          title: "Erro ao carregar histórico",
          description: "Não foi possível carregar o histórico de pagamentos.",
          variant: "destructive"
        });
      } finally {
        setLoadingPayments(false);
      }
    };

    fetchPaymentHistory();
  }, [user?.id, toast]);

  useEffect(() => {
    if (!user?.id || user?.accountType !== 'institutional') return;
    if (hasUnsavedChanges.institutional) return;
    const loadInstitutionalProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('property_name, property_type')
          .eq('id', user.id)
          .single();
        if (error) throw error;
        setInstitutionalData({
          propertyName: data?.property_name || '',
          propertyType: data?.property_type || 'haras'
        });
      } catch (error) {
        console.error('Erro ao carregar dados institucionais:', error);
      }
    };
    loadInstitutionalProfile();
  }, [user?.id, user?.accountType, hasUnsavedChanges.institutional]);

  // Calcular força da senha
  const calculatePasswordStrength = (password: string) => {
    if (!password) return { strength: 0, label: '', color: '' };
    
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    
    if (strength <= 1) return { strength, label: 'Fraca', color: 'bg-red-500' };
    if (strength <= 3) return { strength, label: 'Média', color: 'bg-yellow-500' };
    return { strength, label: 'Forte', color: 'bg-green-500' };
  };

  const passwordStrength = calculatePasswordStrength(passwordData.newPassword);

  const handleSavePersonalData = async () => {
    if (!user?.id) return;

    const name = personalData.name.trim();
    const phone = personalData.phone.trim();

    if (!name) {
      toast({
        title: "Dados incompletos",
        description: "Informe seu nome completo.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name,
          phone: phone ? phone : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Dados pessoais atualizados",
        description: "Suas informações foram salvas com sucesso.",
      });
      setHasUnsavedChanges({ ...hasUnsavedChanges, personal: false });
    } catch (error) {
      console.error('Erro ao salvar dados pessoais:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar seus dados pessoais.",
        variant: "destructive"
      });
    }
  };

  const handleSaveInstitutionalData = async () => {
    if (!user?.id) return;
    if (!institutionalData.propertyName.trim() || !institutionalData.propertyType) {
      toast({
        title: "Dados incompletos",
        description: "Informe o nome e o tipo da propriedade.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          property_name: institutionalData.propertyName.trim(),
          property_type: institutionalData.propertyType,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Dados institucionais atualizados",
        description: "As informações da sua propriedade foram salvas com sucesso.",
      });
      setHasUnsavedChanges({...hasUnsavedChanges, institutional: false});
    } catch (error) {
      console.error('Erro ao salvar dados institucionais:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar os dados institucionais.",
        variant: "destructive"
      });
    }
  };

  const handleSaveNotifications = () => {
    // In real app, this would update notification preferences
    toast({
      title: "Preferências de notificações salvas",
      description: "Suas preferências foram atualizadas com sucesso.",
    });
    setHasUnsavedChanges({...hasUnsavedChanges, notifications: false});
  };

  const handleChangePassword = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Erro",
        description: "A nova senha e a confirmação não coincidem.",
        variant: "destructive"
      });
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast({
        title: "Erro",
        description: "A nova senha deve ter pelo menos 8 caracteres.",
        variant: "destructive"
      });
      return;
    }

    // In real app, this would change password in database
    toast({
      title: "Senha alterada",
      description: "Sua senha foi alterada com sucesso.",
    });
    
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
  };

  const handleDeleteAccount = () => {
    // Confirmação adicional necessária
    toast({
      title: "Atenção",
      description: "Entre em contato com o suporte para excluir sua conta.",
      variant: "destructive"
    });
  };

  return (
    <ProtectedRoute>
      <DashboardPageWrapper 
        title="Configurações"
        subtitle="Gerencie as configurações da sua conta"
      >
        <div className="max-w-5xl mx-auto">
          <Tabs defaultValue="perfil" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 h-auto">
              <TabsTrigger value="perfil" className="flex items-center gap-2 py-3">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Perfil</span>
              </TabsTrigger>
              <TabsTrigger value="seguranca" className="flex items-center gap-2 py-3">
                <Shield className="h-4 w-4" />
                <span className="hidden sm:inline">Segurança</span>
              </TabsTrigger>
              <TabsTrigger value="notificacoes" className="flex items-center gap-2 py-3">
                <Bell className="h-4 w-4" />
                <span className="hidden sm:inline">Notificações</span>
              </TabsTrigger>
              <TabsTrigger value="conta" className="flex items-center gap-2 py-3">
                <CreditCard className="h-4 w-4" />
                <span className="hidden sm:inline">Conta</span>
              </TabsTrigger>
            </TabsList>

            {/* ABA PERFIL */}
            <TabsContent value="perfil" className="space-y-6">
              <Card className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200">
                <div className="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="text-lg font-semibold text-slate-900">Atualizar Perfil</h3>
                    <p className="text-sm text-slate-600">
                      Complete as informações do seu perfil público e localização.
                    </p>
                  </div>
                  <Link to="/dashboard/settings/profile">
                    <Button className="bg-orange-500 hover:bg-orange-600">
                      Ir para Atualizar Perfil
                    </Button>
                  </Link>
                </div>
              </Card>

              {/* Personal Data Card */}
              <Card className="bg-white shadow-lg border-l-4 border-l-blue-500">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <User className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900">Dados Pessoais</h2>
                        <p className="text-sm text-gray-600">Atualize suas informações pessoais</p>
                      </div>
                    </div>
                    {hasUnsavedChanges.personal && (
                      <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Alterações não salvas
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                        Nome Completo <span className="text-red-500">*</span>
                      </label>
                      <Input
                        value={personalData.name}
                        onChange={(e) => {
                          setPersonalData({...personalData, name: e.target.value});
                          setHasUnsavedChanges({...hasUnsavedChanges, personal: true});
                        }}
                        placeholder="Seu nome completo"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                        Email
                      </label>
                      <Input
                        type="email"
                        value={personalData.email}
                        placeholder="seu@email.com"
                        disabled
                        className="bg-gray-50"
                      />
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Lock className="h-3 w-3" />
                        Email não pode ser alterado
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                        <Phone className="h-4 w-4" />
                        Telefone
                      </label>
                      <Input
                        value={personalData.phone}
                        onChange={(e) => {
                          setPersonalData({ ...personalData, phone: formatPhone(e.target.value) });
                          setHasUnsavedChanges({...hasUnsavedChanges, personal: true});
                        }}
                        placeholder="(11) 99999-9999"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">CPF</label>
                      <Input
                        value={personalData.cpf}
                        placeholder="000.000.000-00"
                        disabled
                        className="bg-gray-50"
                      />
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Lock className="h-3 w-3" />
                        CPF não pode ser alterado
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex justify-end pt-4">
                    <Button 
                      onClick={handleSavePersonalData} 
                      className="bg-blue-600 hover:bg-blue-700"
                      disabled={!hasUnsavedChanges.personal}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Salvar Dados Pessoais
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Institutional Data Card (only for institutional accounts) */}
              {user?.accountType === 'institutional' && (
                <Card className="bg-white shadow-lg border-l-4 border-l-green-500">
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <Building className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <h2 className="text-xl font-semibold text-gray-900">Dados Institucionais</h2>
                          <p className="text-sm text-gray-600">Informações do seu {user.propertyType || 'haras'}</p>
                        </div>
                      </div>
                      {hasUnsavedChanges.institutional && (
                        <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Alterações não salvas
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                          <Building2 className="h-4 w-4" />
                          Nome da Propriedade <span className="text-red-500">*</span>
                        </label>
                        <Input
                          value={institutionalData.propertyName}
                          onChange={(e) => {
                            setInstitutionalData({...institutionalData, propertyName: e.target.value});
                            setHasUnsavedChanges({...hasUnsavedChanges, institutional: true});
                          }}
                          placeholder="Nome do seu haras/fazenda/CTE"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Tipo de Propriedade</label>
                        <PropertyTypeSelector
                          selectedType={institutionalData.propertyType}
                          onTypeSelect={(value) => {
                            setInstitutionalData({...institutionalData, propertyType: value});
                            setHasUnsavedChanges({...hasUnsavedChanges, institutional: true});
                          }}
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-end pt-4">
                      <Button 
                        onClick={handleSaveInstitutionalData} 
                        className="bg-green-600 hover:bg-green-700"
                        disabled={!hasUnsavedChanges.institutional}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Salvar Dados Institucionais
                      </Button>
                    </div>
                  </div>
                </Card>
              )}
            </TabsContent>

            {/* ABA SEGURANÇA */}
            <TabsContent value="seguranca" className="space-y-6">
              {/* Password Change Card */}
              <Card className="bg-white shadow-lg border-l-4 border-l-red-500">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                      <Lock className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">Alterar Senha</h2>
                      <p className="text-sm text-gray-600">Mantenha sua conta segura com uma senha forte</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-6 space-y-4">
                  <Alert className="bg-blue-50 border-blue-200">
                    <Shield className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-sm text-blue-800">
                      Use pelo menos 8 caracteres com letras maiúsculas, minúsculas, números e símbolos.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Senha Atual</label>
                      <div className="relative">
                        <Input
                          type={showPasswords.current ? "text" : "password"}
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                          placeholder="Digite sua senha atual"
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 h-auto p-1 hover:bg-transparent"
                          onClick={() => setShowPasswords({...showPasswords, current: !showPasswords.current})}
                        >
                          {showPasswords.current ? <EyeOff className="h-4 w-4 text-gray-500" /> : <Eye className="h-4 w-4 text-gray-500" />}
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Nova Senha</label>
                      <div className="relative">
                        <Input
                          type={showPasswords.new ? "text" : "password"}
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                          placeholder="Digite sua nova senha"
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 h-auto p-1 hover:bg-transparent"
                          onClick={() => setShowPasswords({...showPasswords, new: !showPasswords.new})}
                        >
                          {showPasswords.new ? <EyeOff className="h-4 w-4 text-gray-500" /> : <Eye className="h-4 w-4 text-gray-500" />}
                        </Button>
                      </div>
                      
                      {/* Indicador de força da senha */}
                      {passwordData.newPassword && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-600">Força da senha:</span>
                            <span className={`font-semibold ${
                              passwordStrength.strength <= 1 ? 'text-red-600' :
                              passwordStrength.strength <= 3 ? 'text-yellow-600' : 'text-green-600'
                            }`}>
                              {passwordStrength.label}
                            </span>
                          </div>
                          <div className="flex gap-1 h-1.5">
                            {[1, 2, 3, 4, 5].map((level) => (
                              <div
                                key={level}
                                className={`flex-1 rounded-full transition-all ${
                                  level <= passwordStrength.strength ? passwordStrength.color : 'bg-gray-200'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Confirmar Nova Senha</label>
                      <div className="relative">
                        <Input
                          type={showPasswords.confirm ? "text" : "password"}
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                          placeholder="Confirme sua nova senha"
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 h-auto p-1 hover:bg-transparent"
                          onClick={() => setShowPasswords({...showPasswords, confirm: !showPasswords.confirm})}
                        >
                          {showPasswords.confirm ? <EyeOff className="h-4 w-4 text-gray-500" /> : <Eye className="h-4 w-4 text-gray-500" />}
                        </Button>
                      </div>
                      {passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && (
                        <p className="text-xs text-red-600 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          As senhas não coincidem
                        </p>
                      )}
                      {passwordData.confirmPassword && passwordData.newPassword === passwordData.confirmPassword && (
                        <p className="text-xs text-green-600 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          As senhas coincidem
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex justify-end pt-4">
                    <Button 
                      onClick={handleChangePassword}
                      disabled={!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword || passwordData.newPassword !== passwordData.confirmPassword}
                      className="bg-red-600 hover:bg-red-700 disabled:opacity-50"
                    >
                      <Lock className="h-4 w-4 mr-2" />
                      Alterar Senha
                    </Button>
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* ABA NOTIFICAÇÕES */}
            <TabsContent value="notificacoes" className="space-y-6">
              <Card className="bg-white shadow-lg border-l-4 border-l-purple-500">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Bell className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900">Preferências de Notificações</h2>
                        <p className="text-sm text-gray-600">Escolha como deseja ser notificado</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="p-6 space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Notificações por Email</h3>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between py-3 border-b border-gray-100">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">Novas mensagens</p>
                          <p className="text-xs text-gray-500">Receba notificações quando receber novas mensagens</p>
                        </div>
                        <Switch
                          checked={notificationPreferences.emailNewMessage}
                          onCheckedChange={(checked) => {
                            setNotificationPreferences({...notificationPreferences, emailNewMessage: checked});
                            setHasUnsavedChanges({...hasUnsavedChanges, notifications: true});
                          }}
                        />
                      </div>

                      <div className="flex items-center justify-between py-3 border-b border-gray-100">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">Novos animais</p>
                          <p className="text-xs text-gray-500">Notificações sobre novos animais adicionados na plataforma</p>
                        </div>
                        <Switch
                          checked={notificationPreferences.emailNewAnimal}
                          onCheckedChange={(checked) => {
                            setNotificationPreferences({...notificationPreferences, emailNewAnimal: checked});
                            setHasUnsavedChanges({...hasUnsavedChanges, notifications: true});
                          }}
                        />
                      </div>

                      <div className="flex items-center justify-between py-3 border-b border-gray-100">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">Atualizações de eventos</p>
                          <p className="text-xs text-gray-500">Notificações sobre eventos que você participa ou criou</p>
                        </div>
                        <Switch
                          checked={notificationPreferences.emailEventUpdate}
                          onCheckedChange={(checked) => {
                            setNotificationPreferences({...notificationPreferences, emailEventUpdate: checked});
                            setHasUnsavedChanges({...hasUnsavedChanges, notifications: true});
                          }}
                        />
                      </div>

                      <div className="flex items-center justify-between py-3 border-b border-gray-100">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">Sociedades</p>
                          <p className="text-xs text-gray-500">Convites e atualizações sobre suas sociedades</p>
                        </div>
                        <Switch
                          checked={notificationPreferences.emailPartnership}
                          onCheckedChange={(checked) => {
                            setNotificationPreferences({...notificationPreferences, emailPartnership: checked});
                            setHasUnsavedChanges({...hasUnsavedChanges, notifications: true});
                          }}
                        />
                      </div>

                      <div className="flex items-center justify-between py-3 border-b border-gray-100">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">Marketing e novidades</p>
                          <p className="text-xs text-gray-500">Notícias, dicas e promoções especiais</p>
                        </div>
                        <Switch
                          checked={notificationPreferences.emailMarketing}
                          onCheckedChange={(checked) => {
                            setNotificationPreferences({...notificationPreferences, emailMarketing: checked});
                            setHasUnsavedChanges({...hasUnsavedChanges, notifications: true});
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Push Notifications</h3>
                    
                    <div className="flex items-center justify-between py-3">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Ativar notificações push</p>
                        <p className="text-xs text-gray-500">Receba notificações instantâneas no navegador</p>
                      </div>
                      <Switch
                        checked={notificationPreferences.pushNotifications}
                        onCheckedChange={(checked) => {
                          setNotificationPreferences({...notificationPreferences, pushNotifications: checked});
                          setHasUnsavedChanges({...hasUnsavedChanges, notifications: true});
                        }}
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end pt-4">
                    <Button 
                      onClick={handleSaveNotifications}
                      className="bg-purple-600 hover:bg-purple-700"
                      disabled={!hasUnsavedChanges.notifications}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Salvar Preferências
                    </Button>
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* ABA CONTA */}
            <TabsContent value="conta" className="space-y-6">
              {/* Account Info Card */}
              <Card className="bg-white shadow-lg border-l-4 border-l-green-500">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <Shield className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">Informações da Conta</h2>
                      <p className="text-sm text-gray-600">Dados da sua conta na plataforma</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Tipo de Conta</label>
                      <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <span className="text-sm font-medium capitalize">
                          {user?.accountType === 'institutional' ? 'Institucional' : 'Pessoal'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Plano Atual</label>
                      <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <span className="text-sm font-medium capitalize flex items-center gap-2">
                          <CreditCard className="h-4 w-4" />
                          {user?.plan || 'Básico'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Código Público</label>
                      <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <span className="text-sm font-mono font-medium">
                          {user?.publicCode || 'USR2024'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Status</label>
                      <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                        <span className="text-sm font-medium text-green-700 flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4" />
                          Ativo
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Plan Upgrade Card */}
              <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
                <div className="p-6">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                        <CreditCard className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900">Upgrade do Plano</h2>
                        <p className="text-sm text-gray-600">
                          Aproveite mais recursos com nossos planos premium
                        </p>
                      </div>
                    </div>
                    
                    <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                      Ver Planos
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Payment History Card */}
              <Card className="bg-white shadow-lg border-l-4 border-l-emerald-500">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <CreditCard className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">Histórico de Pagamentos</h2>
                      <p className="text-sm text-gray-600">Visualize todos os seus pagamentos e faturas</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  {loadingPayments ? (
                    <div className="text-center py-12">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                      <p className="text-sm text-gray-500 mt-4">Carregando histórico...</p>
                    </div>
                  ) : paymentHistory.length > 0 ? (
                    <div className="space-y-3">
                      {paymentHistory.map((payment) => (
                        <div key={payment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                payment.isAdminGrant 
                                  ? 'bg-purple-100' 
                                  : payment.status === 'Pago' 
                                    ? 'bg-emerald-100' 
                                    : 'bg-gray-100'
                              }`}>
                                {payment.isAdminGrant ? (
                                  <Shield className="h-5 w-5 text-purple-600" />
                                ) : payment.status === 'Pago' ? (
                                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                                ) : (
                                  <CreditCard className="h-5 w-5 text-gray-600" />
                                )}
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-gray-900">
                                  {payment.plan}
                                  {payment.type === 'annual_installment' && payment.installment && ` - Parcela ${payment.installment}`}
                                  {payment.isAdminGrant && (
                                    <Badge className="ml-2 bg-purple-100 text-purple-800 text-[10px] px-1.5 py-0.5 border-0">
                                      Concedido
                                    </Badge>
                                  )}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-gray-600 mt-1">
                                  <span>{new Date(payment.date).toLocaleDateString('pt-BR')}</span>
                                  <span>•</span>
                                  <span className="font-medium">{payment.method}</span>
                                  {payment.type === 'annual_pix' && !payment.isAdminGrant && (
                                    <>
                                      <span>•</span>
                                      <Badge className="bg-blue-100 text-blue-800 text-[10px] px-1.5 py-0.5 border-0">
                                        Pagamento Anual
                                      </Badge>
                                    </>
                                  )}
                                </div>
                                <p className="text-xs text-gray-500 mt-1">{payment.description}</p>
                              </div>
                            </div>
                          </div>
                          <div className="text-right ml-4">
                            <p className={`text-sm font-bold ${
                              payment.isAdminGrant ? 'text-purple-600' : 'text-gray-900'
                            }`}>
                              R$ {payment.amount.toFixed(2).replace('.', ',')}
                            </p>
                            <Badge className={`mt-1 border-0 ${
                              payment.status === 'Pago' ? 'bg-green-100 text-green-800' :
                              payment.status === 'Pendente' ? 'bg-yellow-100 text-yellow-800' :
                              payment.status === 'Falhou' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {payment.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <CreditCard className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-sm text-gray-500">Nenhum pagamento registrado ainda</p>
                      <p className="text-xs text-gray-400 mt-2">Seu histórico de transações aparecerá aqui</p>
                    </div>
                  )}
                </div>
              </Card>

              {/* Delete Account Card */}
              <Card className="bg-white shadow-lg border-l-4 border-l-red-500">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                      <Trash2 className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">Zona de Perigo</h2>
                      <p className="text-sm text-gray-600">Ações irreversíveis na sua conta</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  <Alert className="bg-red-50 border-red-200 mb-4">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-sm text-red-800">
                      A exclusão da conta é permanente e não pode ser desfeita. Todos os seus dados serão removidos.
                    </AlertDescription>
                  </Alert>

                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Excluir conta</p>
                      <p className="text-xs text-gray-500">Remova permanentemente sua conta e todos os dados associados</p>
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={handleDeleteAccount}
                      className="border-red-600 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir Conta
                    </Button>
                  </div>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DashboardPageWrapper>
    </ProtectedRoute>
  );
};

export default SettingsPage;