import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface AdminReport {
  id: string;
  // Denunciante
  reporterId?: string;
  reporterEmail?: string;
  reporterName?: string;
  
  // Denunciado
  reportedUserId?: string;
  reportedUserName?: string;
  
  // Conteúdo
  contentType: 'animal' | 'event' | 'user' | 'message' | 'conversation' | 'profile' | 'other';
  contentId?: string;
  
  // Detalhes
  reason: string;
  description: string;
  category?: 'fake_info' | 'scam' | 'inappropriate' | 'spam' | 'harassment' | 'other';
  
  // URLs
  reportLocation?: string;
  evidenceUrls?: string[];
  
  // Status
  status: 'pending' | 'under_review' | 'resolved' | 'rejected';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  
  // Admin
  adminId?: string;
  adminNotes?: string;
  adminAction?: 'none' | 'warning' | 'content_removed' | 'user_suspended' | 'user_banned';
  reviewedAt?: string;
  
  // Relacionados
  conversationId?: string;
  messageId?: string;
  animalId?: string;
  animalName?: string;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export const useAdminReports = () => {
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchReports = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('reports')
        .select(`
          *,
          animal:animals(name)
        `)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      const mappedReports: AdminReport[] = (data || []).map(report => ({
        id: report.id,
        reporterId: report.reporter_id,
        reporterEmail: report.reporter_email,
        reporterName: report.reporter_name,
        reportedUserId: report.reported_user_id,
        reportedUserName: report.reported_user_name,
        contentType: report.content_type,
        contentId: report.content_id,
        reason: report.reason,
        description: report.description,
        category: report.category,
        reportLocation: report.report_location,
        evidenceUrls: report.evidence_urls,
        status: report.status,
        priority: report.priority,
        adminId: report.admin_id,
        adminNotes: report.admin_notes,
        adminAction: report.admin_action,
        reviewedAt: report.reviewed_at,
        conversationId: report.conversation_id,
        messageId: report.message_id,
        animalId: report.animal_id,
        animalName: report.animal?.name,
        createdAt: report.created_at,
        updatedAt: report.updated_at,
      }));

      setReports(mappedReports);
    } catch (err) {
      console.error('Error fetching admin reports:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const updateReportStatus = async (
    reportId: string, 
    status: AdminReport['status'],
    adminNotes?: string,
    adminAction?: AdminReport['adminAction']
  ) => {
    try {
      const { error: updateError } = await supabase
        .from('reports')
        .update({
          status,
          admin_notes: adminNotes,
          admin_action: adminAction,
          reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', reportId);

      if (updateError) throw updateError;

      await fetchReports();
      return true;
    } catch (err) {
      console.error('Error updating report:', err);
      throw err;
    }
  };

  const approveReport = async (reportId: string, adminNotes: string, adminAction: AdminReport['adminAction']) => {
    return updateReportStatus(reportId, 'resolved', adminNotes, adminAction);
  };

  const rejectReport = async (reportId: string, adminNotes: string) => {
    return updateReportStatus(reportId, 'rejected', adminNotes, 'none');
  };

  const setUnderReview = async (reportId: string) => {
    return updateReportStatus(reportId, 'under_review');
  };

  return {
    reports,
    isLoading,
    error,
    refetch: fetchReports,
    updateReportStatus,
    approveReport,
    rejectReport,
    setUnderReview,
  };
};




