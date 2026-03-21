import { supabase } from '@/lib/supabase';

/**
 * Interface para dados de criação de ticket
 */
export interface CreateTicketData {
  subject: string;
  category: string;
  description: string;
  userId: string;
}

/**
 * Interface para atualização de ticket
 */
export interface UpdateTicketData {
  status?: 'open' | 'in_progress' | 'closed';
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  assigned_to?: string | null;
  admin_notes?: string;
  resolved_at?: string | null;
}

/**
 * Interface para ticket
 */
export interface Ticket {
  id: string;
  user_id: string;
  subject: string;
  category: string;
  description: string;
  status: 'open' | 'in_progress' | 'closed';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  assigned_to: string | null;
  resolved_at: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Interface para resposta de ticket
 */
export interface TicketResponse {
  id: string;
  ticket_id: string;
  admin_id: string;
  response: string;
  new_status: 'open' | 'in_progress' | 'closed' | null;
  created_at: string;
  admin_name?: string;
}

/**
 * Service para gerenciar tickets de suporte
 */
export const ticketService = {
  /**
   * Criar novo ticket
   */
  async createTicket(data: CreateTicketData): Promise<Ticket> {
    const { data: ticket, error } = await supabase
      .from('support_tickets')
      .insert({
        user_id: data.userId,
        subject: data.subject,
        category: data.category,
        description: data.description,
        status: 'open',
        priority: 'normal'
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar ticket:', error);
      throw new Error(`Erro ao criar ticket: ${error.message}`);
    }

    return ticket;
  },

  /**
   * Buscar tickets do usuário
   */
  async getUserTickets(userId: string): Promise<Ticket[]> {
    const { data, error } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar tickets do usuário:', error);
      throw new Error(`Erro ao buscar tickets: ${error.message}`);
    }

    return data || [];
  },

  /**
   * Buscar todos os tickets (apenas admin)
   */
  async getAllTickets(): Promise<Ticket[]> {
    const { data, error } = await supabase
      .from('support_tickets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar todos os tickets:', error);
      throw new Error(`Erro ao buscar tickets: ${error.message}`);
    }

    return data || [];
  },

  /**
   * Buscar tickets por status
   */
  async getTicketsByStatus(status: 'open' | 'in_progress' | 'closed'): Promise<Ticket[]> {
    const { data, error } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar tickets por status:', error);
      throw new Error(`Erro ao buscar tickets: ${error.message}`);
    }

    return data || [];
  },

  /**
   * Atualizar ticket (apenas admin)
   */
  async updateTicket(ticketId: string, data: UpdateTicketData): Promise<Ticket> {
    const updateData: UpdateTicketData & { resolved_at?: string } = { ...data };

    // Se o status for 'closed' e não houver resolved_at, adicionar timestamp
    if (data.status === 'closed' && !data.resolved_at) {
      updateData.resolved_at = new Date().toISOString();
    }

    const { data: ticket, error } = await supabase
      .from('support_tickets')
      .update(updateData)
      .eq('id', ticketId)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar ticket:', error);
      throw new Error(`Erro ao atualizar ticket: ${error.message}`);
    }

    return ticket;
  },

  /**
   * Buscar ticket por ID
   */
  async getTicketById(ticketId: string): Promise<Ticket | null> {
    const { data, error } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('id', ticketId)
      .single();

    if (error) {
      console.error('Erro ao buscar ticket:', error);
      return null;
    }

    return data;
  },

  /**
   * Deletar ticket (apenas para casos excepcionais)
   */
  async deleteTicket(ticketId: string): Promise<void> {
    const { error } = await supabase
      .from('support_tickets')
      .delete()
      .eq('id', ticketId);

    if (error) {
      console.error('Erro ao deletar ticket:', error);
      throw new Error(`Erro ao deletar ticket: ${error.message}`);
    }
  },

  /**
   * Responder a um ticket (apenas admin)
   */
  async respondTicket(
    ticketId: string,
    adminId: string,
    response: string,
    newStatus?: 'open' | 'in_progress' | 'closed'
  ): Promise<TicketResponse> {
    // Usar a função RPC do Supabase que já cria notificação automaticamente
    const { data, error } = await supabase.rpc('respond_to_ticket', {
      p_ticket_id: ticketId,
      p_admin_id: adminId,
      p_response: response,
      p_new_status: newStatus || null
    });

    if (error) {
      console.error('Erro ao responder ticket:', error);
      throw new Error(`Erro ao responder ticket: ${error.message}`);
    }

    // Buscar a resposta criada
    const { data: responseData, error: fetchError } = await supabase
      .from('ticket_responses')
      .select('*')
      .eq('id', data)
      .single();

    if (fetchError) {
      console.error('Erro ao buscar resposta:', fetchError);
      throw new Error(`Erro ao buscar resposta: ${fetchError.message}`);
    }

    return responseData;
  },

  /**
   * Buscar respostas de um ticket
   */
  async getTicketResponses(ticketId: string): Promise<TicketResponse[]> {
    const { data, error } = await supabase
      .from('ticket_responses')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Erro ao buscar respostas:', error);
      throw new Error(`Erro ao buscar respostas: ${error.message}`);
    }

    // Buscar nomes dos admins (view pública - sem PII)
    const adminIds = [...new Set(data?.map(r => r.admin_id) || [])];
    const { data: adminsData } = await supabase
      .from('public_profiles')
      .select('id, name')
      .in('id', adminIds);

    const adminsMap = new Map(adminsData?.map(a => [a.id, a.name]) || []);

    return (data || []).map(response => ({
      ...response,
      admin_name: adminsMap.get(response.admin_id) || 'Administrador'
    }));
  },

  /**
   * Buscar tickets de um usuário com respostas
   */
  async getUserTicketsWithResponses(userId: string): Promise<(Ticket & { responses: TicketResponse[] })[]> {
    const tickets = await this.getUserTickets(userId);
    
    const ticketsWithResponses = await Promise.all(
      tickets.map(async (ticket) => {
        const responses = await this.getTicketResponses(ticket.id);
        return { ...ticket, responses };
      })
    );

    return ticketsWithResponses;
  }
};
