import { useState, useEffect, useCallback } from 'react';
import { ticketService, Ticket, UpdateTicketData } from '@/services/ticketService';
import { supabase } from '@/lib/supabase';

export interface TicketWithUser extends Ticket {
  user_name?: string;
  user_email?: string;
}

interface TicketStats {
  total: number;
  open: number;
  in_progress: number;
  closed: number;
  avg_response_time: number; // em horas
}

export const useAdminTickets = () => {
  const [tickets, setTickets] = useState<TicketWithUser[]>([]);
  const [stats, setStats] = useState<TicketStats>({
    total: 0,
    open: 0,
    in_progress: 0,
    closed: 0,
    avg_response_time: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Buscar todos os tickets com informações do usuário
   */
  const fetchTickets = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Buscar tickets
      const { data: ticketsData, error: ticketsError } = await supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (ticketsError) throw ticketsError;

      // Buscar dados dos usuários
      const userIds = [...new Set((ticketsData || []).map(t => t.user_id))];
      const { data: usersData } = await supabase
        .from('profiles')
        .select('id, name, email')
        .in('id', userIds);

      const usersMap = new Map(usersData?.map(u => [u.id, u]) || []);

      // Formatar dados
      const formattedTickets: TicketWithUser[] = (ticketsData || []).map((ticket: Ticket) => {
        const user = usersMap.get(ticket.user_id);
        return {
          ...ticket,
          user_name: user?.name || 'Usuário não encontrado',
          user_email: user?.email || 'Email não disponível'
        };
      });

      setTickets(formattedTickets);

      // Calcular estatísticas
      const openTickets = formattedTickets.filter(t => t.status === 'open');
      const inProgressTickets = formattedTickets.filter(t => t.status === 'in_progress');
      const closedTickets = formattedTickets.filter(t => t.status === 'closed');

      // Calcular tempo médio de resposta (em horas)
      const closedWithResolution = closedTickets.filter(t => t.resolved_at);
      const avgResponseTime = closedWithResolution.length > 0
        ? closedWithResolution.reduce((acc, ticket) => {
            const created = new Date(ticket.created_at).getTime();
            const resolved = new Date(ticket.resolved_at!).getTime();
            const diffHours = (resolved - created) / (1000 * 60 * 60);
            return acc + diffHours;
          }, 0) / closedWithResolution.length
        : 0;

      setStats({
        total: formattedTickets.length,
        open: openTickets.length,
        in_progress: inProgressTickets.length,
        closed: closedTickets.length,
        avg_response_time: Math.round(avgResponseTime * 10) / 10
      });

    } catch (err) {
      console.error('Erro ao buscar tickets:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Atualizar status do ticket
   */
  const updateTicketStatus = async (
    ticketId: string,
    status: 'open' | 'in_progress' | 'closed'
  ) => {
    try {
      await ticketService.updateTicket(ticketId, { status });
      await fetchTickets(); // Recarregar lista
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
      throw err;
    }
  };

  /**
   * Atualizar prioridade do ticket
   */
  const updateTicketPriority = async (
    ticketId: string,
    priority: 'low' | 'normal' | 'high' | 'urgent'
  ) => {
    try {
      await ticketService.updateTicket(ticketId, { priority });
      await fetchTickets(); // Recarregar lista
    } catch (err) {
      console.error('Erro ao atualizar prioridade:', err);
      throw err;
    }
  };

  /**
   * Atribuir ticket a um admin
   */
  const assignTicket = async (ticketId: string, adminId: string | null) => {
    try {
      await ticketService.updateTicket(ticketId, { assigned_to: adminId });
      await fetchTickets(); // Recarregar lista
    } catch (err) {
      console.error('Erro ao atribuir ticket:', err);
      throw err;
    }
  };

  /**
   * Adicionar notas administrativas
   */
  const addAdminNotes = async (ticketId: string, notes: string) => {
    try {
      await ticketService.updateTicket(ticketId, { admin_notes: notes });
      await fetchTickets(); // Recarregar lista
    } catch (err) {
      console.error('Erro ao adicionar notas:', err);
      throw err;
    }
  };

  /**
   * Atualizar ticket completo
   */
  const updateTicket = async (ticketId: string, data: UpdateTicketData) => {
    try {
      await ticketService.updateTicket(ticketId, data);
      await fetchTickets(); // Recarregar lista
    } catch (err) {
      console.error('Erro ao atualizar ticket:', err);
      throw err;
    }
  };

  /**
   * Buscar tickets por status
   */
  const getTicketsByStatus = (status: 'open' | 'in_progress' | 'closed') => {
    return tickets.filter(ticket => ticket.status === status);
  };

  // Carregar tickets ao montar o componente
  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  return {
    tickets,
    stats,
    isLoading,
    error,
    refetch: fetchTickets,
    updateTicketStatus,
    updateTicketPriority,
    assignTicket,
    addAdminNotes,
    updateTicket,
    getTicketsByStatus
  };
};

