import { AdminReport } from '@/hooks/admin/useAdminReports';

// Função para calcular denúncias relacionadas por usuário
export const getRelatedReportsByUser = (reports: AdminReport[], targetUserId: string): AdminReport[] => {
  return reports.filter(report => report.reportedUserId === targetUserId);
};

// Função para calcular denúncias relacionadas por animal
export const getRelatedReportsByAnimal = (reports: AdminReport[], targetAnimalId: string): AdminReport[] => {
  return reports.filter(report => report.animalId === targetAnimalId);
};

// Função para calcular denúncias relacionadas por conversa
export const getRelatedReportsByConversation = (reports: AdminReport[], targetConversationId: string): AdminReport[] => {
  return reports.filter(report => report.conversationId === targetConversationId);
};

// Função para obter estatísticas de denúncias relacionadas
export const getReportStatistics = (reports: AdminReport[], currentReport: AdminReport) => {
  const relatedByUser = currentReport.reportedUserId 
    ? getRelatedReportsByUser(reports, currentReport.reportedUserId)
    : [];
  
  const relatedByAnimal = currentReport.animalId 
    ? getRelatedReportsByAnimal(reports, currentReport.animalId)
    : [];
  
  const relatedByConversation = currentReport.conversationId 
    ? getRelatedReportsByConversation(reports, currentReport.conversationId)
    : [];

  return {
    userReports: relatedByUser.filter(r => r.id !== currentReport.id),
    animalReports: relatedByAnimal.filter(r => r.id !== currentReport.id),
    conversationReports: relatedByConversation.filter(r => r.id !== currentReport.id),
    totalUserReports: relatedByUser.length,
    totalAnimalReports: relatedByAnimal.length,
    totalConversationReports: relatedByConversation.length
  };
};

// Função para determinar o nível de risco baseado no histórico
export const getRiskLevel = (reportCount: number): 'low' | 'medium' | 'high' | 'critical' => {
  if (reportCount === 0) return 'low';
  if (reportCount <= 2) return 'medium';
  if (reportCount <= 5) return 'high';
  return 'critical';
};

// Função para obter cor do risco
export const getRiskColor = (riskLevel: string): string => {
  switch (riskLevel) {
    case 'low': return 'text-green-600';
    case 'medium': return 'text-yellow-600';
    case 'high': return 'text-orange-600';
    case 'critical': return 'text-red-600';
    default: return 'text-gray-600';
  }
};

// Função para obter cor de fundo do risco
export const getRiskBackgroundColor = (riskLevel: string): string => {
  switch (riskLevel) {
    case 'low': return 'bg-green-50 border-green-200';
    case 'medium': return 'bg-yellow-50 border-yellow-200';
    case 'high': return 'bg-orange-50 border-orange-200';
    case 'critical': return 'bg-red-50 border-red-200';
    default: return 'bg-gray-50 border-gray-200';
  }
};
