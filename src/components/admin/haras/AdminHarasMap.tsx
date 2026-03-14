import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { List, BarChart3, Loader2, MapPin, Search, Building } from 'lucide-react';
import { useAdminHaras, type AdminHarasProfile } from '@/hooks/admin/useAdminHaras';
import AdminHarasManagerModal from '@/components/admin/haras/AdminHarasManagerModal';

const AdminHarasMap: React.FC = () => {
  const [activeTab, setActiveTab] = useState('list');
  const { profiles, isLoading, error, refetch } = useAdminHaras();
  const [searchTerm, setSearchTerm] = useState('');
  const [planFilter, setPlanFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedProfile, setSelectedProfile] = useState<AdminHarasProfile | null>(null);
  const [isManagerOpen, setIsManagerOpen] = useState(false);

  const filteredProfiles = useMemo(() => {
    return profiles.filter(profile => {
      const matchesSearch = 
        (profile.name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (profile.propertyName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (profile.email?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (profile.city?.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesPlan = planFilter === 'all' || profile.plan === planFilter;
      const matchesType = typeFilter === 'all' || profile.propertyType === typeFilter;
      
      return matchesSearch && matchesPlan && matchesType;
    });
  }, [profiles, searchTerm, planFilter, typeFilter]);

  if (error) {
    return (
      <div className="p-6">
        <Card className="p-6 bg-red-50 border-red-200">
          <h3 className="text-lg font-semibold text-red-900 mb-2">Erro ao carregar perfis</h3>
          <p className="text-red-700">{error.message}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Perfis Institucionais</h1>
          <p className="text-gray-600">Gerencie haras, fazendas e CTEs cadastrados</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="list" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            Lista
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Estatísticas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-3 text-gray-600">Carregando perfis...</span>
            </div>
          ) : (
            <>
              {/* Filtros */}
              <Card className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  <Select value={planFilter} onValueChange={setPlanFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filtrar por plano" />
                    </SelectTrigger>
                    <SelectContent side="bottom" align="start" avoidCollisions={false}>
                      <SelectItem value="all">Todos os planos</SelectItem>
                      <SelectItem value="free">Free</SelectItem>
                      <SelectItem value="basic">Basic</SelectItem>
                      <SelectItem value="pro">Pro</SelectItem>
                      <SelectItem value="ultra">Ultra</SelectItem>
                      <SelectItem value="vip">VIP</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filtrar por tipo" />
                    </SelectTrigger>
                    <SelectContent side="bottom" align="start" avoidCollisions={false}>
                      <SelectItem value="all">Todos os tipos</SelectItem>
                      <SelectItem value="haras">Haras</SelectItem>
                      <SelectItem value="fazenda">Fazenda</SelectItem>
                      <SelectItem value="cte">CTE</SelectItem>
                      <SelectItem value="central-reproducao">Central Reprodução</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="text-sm text-muted-foreground flex items-center">
                    {filteredProfiles.length} perfil(is) encontrado(s)
                  </div>
                </div>
              </Card>

              {/* Lista de perfis */}
              <Card>
                <div className="p-6">
                  {filteredProfiles.length === 0 ? (
                    <div className="text-center py-12">
                      <Building className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">Nenhum perfil institucional encontrado.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Propriedade</TableHead>
                            <TableHead>Localização</TableHead>
                            <TableHead>Plano</TableHead>
                            <TableHead>Animais</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Cadastro</TableHead>
                            <TableHead>Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredProfiles.map((profile) => (
                            <TableRow key={profile.id}>
                              <TableCell className="font-medium">{profile.name}</TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {profile.propertyType === 'haras' ? 'Haras' :
                                   profile.propertyType === 'fazenda' ? 'Fazenda' :
                                   profile.propertyType === 'cte' ? 'CTE' :
                                   'Central Reprodução'}
                                </Badge>
                              </TableCell>
                              <TableCell>{profile.propertyName || '-'}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3 text-gray-400" />
                                  <span className="text-sm">
                                    {profile.city && profile.state ? `${profile.city}, ${profile.state}` : '-'}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant={profile.plan === 'vip' ? 'default' : 'outline'}>
                                  {profile.plan.toUpperCase()}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <span className="font-medium">{profile.activeAnimals}</span>
                                <span className="text-gray-500 text-sm"> / {profile.totalAnimals}</span>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div className={`w-2 h-2 rounded-full ${
                                    profile.isSuspended ? 'bg-red-500' : 
                                    profile.isActive ? 'bg-green-500' : 'bg-gray-500'
                                  }`} />
                                  {profile.isSuspended ? 'Suspenso' : profile.isActive ? 'Ativo' : 'Inativo'}
                                </div>
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {new Date(profile.createdAt).toLocaleDateString('pt-BR')}
                              </TableCell>
                              <TableCell>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedProfile(profile);
                                    setIsManagerOpen(true);
                                  }}
                                >
                                  Gerenciar
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="stats" className="space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-4 bg-blue-50 border-blue-200">
                  <h4 className="font-medium text-blue-900">Total de Perfis</h4>
                  <p className="text-3xl font-bold text-blue-800 mt-2">{profiles.length}</p>
                </Card>
                <Card className="p-4 bg-green-50 border-green-200">
                  <h4 className="font-medium text-green-900">Perfis Ativos</h4>
                  <p className="text-3xl font-bold text-green-800 mt-2">
                    {profiles.filter(p => p.isActive && !p.isSuspended).length}
                  </p>
                </Card>
                <Card className="p-4 bg-purple-50 border-purple-200">
                  <h4 className="font-medium text-purple-900">Total de Animais</h4>
                  <p className="text-3xl font-bold text-purple-800 mt-2">
                    {profiles.reduce((sum, p) => sum + p.totalAnimals, 0)}
                  </p>
                </Card>
                <Card className="p-4 bg-orange-50 border-orange-200">
                  <h4 className="font-medium text-orange-900">Animais Ativos</h4>
                  <p className="text-3xl font-bold text-orange-800 mt-2">
                    {profiles.reduce((sum, p) => sum + p.activeAnimals, 0)}
                  </p>
                </Card>
              </div>

              {/* Por tipo */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Distribuição por Tipo</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">
                      {profiles.filter(p => p.propertyType === 'haras').length}
                    </p>
                    <p className="text-sm text-gray-600">Haras</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">
                      {profiles.filter(p => p.propertyType === 'fazenda').length}
                    </p>
                    <p className="text-sm text-gray-600">Fazendas</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-orange-600">
                      {profiles.filter(p => p.propertyType === 'cte').length}
                    </p>
                    <p className="text-sm text-gray-600">CTEs</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">
                      {profiles.filter(p => p.propertyType === 'central-reproducao').length}
                    </p>
                    <p className="text-sm text-gray-600">Centrais</p>
                  </div>
                </div>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>

      <AdminHarasManagerModal
        isOpen={isManagerOpen}
        profile={selectedProfile}
        onClose={() => {
          setIsManagerOpen(false);
          setSelectedProfile(null);
        }}
        onUpdated={refetch}
      />
    </div>
  );
};

export default AdminHarasMap;

