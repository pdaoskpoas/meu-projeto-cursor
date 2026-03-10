-- =====================================================
-- MIGRAÇÃO 009: ROW LEVEL SECURITY (RLS) POLICIES
-- Data: 30/09/2025
-- Descrição: Configurar políticas de segurança para todas as tabelas
-- =====================================================

-- =====================================================
-- HABILITAR RLS EM TODAS AS TABELAS
-- =====================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE suspensions ENABLE ROW LEVEL SECURITY;
ALTER TABLE animals ENABLE ROW LEVEL SECURITY;
ALTER TABLE animal_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE animal_partnerships ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE impressions ENABLE ROW LEVEL SECURITY;
ALTER TABLE clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE boost_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLÍTICAS PARA PROFILES
-- =====================================================

-- Usuários podem ver todos os perfis públicos
CREATE POLICY "Profiles are viewable by everyone" ON profiles
    FOR SELECT USING (true);

-- Usuários podem atualizar apenas seu próprio perfil
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Usuários podem inserir apenas seu próprio perfil
CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Admins podem fazer tudo
CREATE POLICY "Admins can do everything on profiles" ON profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- =====================================================
-- POLÍTICAS PARA SUSPENSIONS
-- =====================================================

-- Apenas admins podem ver suspensões
CREATE POLICY "Only admins can view suspensions" ON suspensions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Apenas admins podem inserir suspensões
CREATE POLICY "Only admins can insert suspensions" ON suspensions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- =====================================================
-- POLÍTICAS PARA ANIMALS
-- =====================================================

-- Todos podem ver animais ativos
CREATE POLICY "Animals are viewable by everyone" ON animals
    FOR SELECT USING (ad_status = 'active');

-- Proprietários podem ver todos os seus animais
CREATE POLICY "Owners can view own animals" ON animals
    FOR SELECT USING (owner_id = auth.uid());

-- Sócios podem ver animais em parceria
CREATE POLICY "Partners can view partnership animals" ON animals
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM animal_partnerships 
            WHERE animal_id = animals.id 
            AND partner_id = auth.uid() 
            AND status = 'accepted'
        )
    );

-- Proprietários podem inserir animais
CREATE POLICY "Users can insert own animals" ON animals
    FOR INSERT WITH CHECK (owner_id = auth.uid());

-- Proprietários podem atualizar seus animais
CREATE POLICY "Owners can update own animals" ON animals
    FOR UPDATE USING (owner_id = auth.uid());

-- Admins podem fazer tudo
CREATE POLICY "Admins can do everything on animals" ON animals
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- =====================================================
-- POLÍTICAS PARA ANIMAL_MEDIA
-- =====================================================

-- Todos podem ver mídia de animais ativos
CREATE POLICY "Animal media is viewable by everyone" ON animal_media
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM animals 
            WHERE id = animal_media.animal_id AND ad_status = 'active'
        )
    );

-- Proprietários podem gerenciar mídia dos seus animais
CREATE POLICY "Owners can manage own animal media" ON animal_media
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM animals 
            WHERE id = animal_media.animal_id AND owner_id = auth.uid()
        )
    );

-- =====================================================
-- POLÍTICAS PARA ANIMAL_PARTNERSHIPS
-- =====================================================

-- Proprietários e sócios podem ver parcerias
CREATE POLICY "Partnerships are viewable by involved parties" ON animal_partnerships
    FOR SELECT USING (
        partner_id = auth.uid() OR 
        EXISTS (
            SELECT 1 FROM animals 
            WHERE id = animal_partnerships.animal_id AND owner_id = auth.uid()
        )
    );

-- Proprietários podem criar parcerias
CREATE POLICY "Owners can create partnerships" ON animal_partnerships
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM animals 
            WHERE id = animal_partnerships.animal_id AND owner_id = auth.uid()
        )
    );

-- Proprietários e sócios podem atualizar parcerias
CREATE POLICY "Involved parties can update partnerships" ON animal_partnerships
    FOR UPDATE USING (
        partner_id = auth.uid() OR 
        EXISTS (
            SELECT 1 FROM animals 
            WHERE id = animal_partnerships.animal_id AND owner_id = auth.uid()
        )
    );

-- =====================================================
-- POLÍTICAS PARA EVENTS
-- =====================================================

-- Todos podem ver eventos ativos
CREATE POLICY "Events are viewable by everyone" ON events
    FOR SELECT USING (ad_status = 'active');

-- Organizadores podem ver todos os seus eventos
CREATE POLICY "Organizers can view own events" ON events
    FOR SELECT USING (organizer_id = auth.uid());

-- Organizadores podem inserir eventos
CREATE POLICY "Users can insert own events" ON events
    FOR INSERT WITH CHECK (organizer_id = auth.uid());

-- Organizadores podem atualizar seus eventos
CREATE POLICY "Organizers can update own events" ON events
    FOR UPDATE USING (organizer_id = auth.uid());

-- =====================================================
-- POLÍTICAS PARA ARTICLES
-- =====================================================

-- Todos podem ver artigos publicados
CREATE POLICY "Published articles are viewable by everyone" ON articles
    FOR SELECT USING (is_published = true);

-- Autores podem ver seus próprios artigos
CREATE POLICY "Authors can view own articles" ON articles
    FOR SELECT USING (author_id = auth.uid());

-- Apenas admins podem inserir/atualizar artigos
CREATE POLICY "Only admins can manage articles" ON articles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- =====================================================
-- POLÍTICAS PARA ANALYTICS (IMPRESSIONS/CLICKS)
-- =====================================================

-- Proprietários podem ver analytics dos seus conteúdos
CREATE POLICY "Owners can view own content analytics" ON impressions
    FOR SELECT USING (
        (content_type = 'animal' AND EXISTS (
            SELECT 1 FROM animals WHERE id = impressions.content_id AND owner_id = auth.uid()
        )) OR
        (content_type = 'event' AND EXISTS (
            SELECT 1 FROM events WHERE id = impressions.content_id AND organizer_id = auth.uid()
        )) OR
        (content_type = 'article' AND EXISTS (
            SELECT 1 FROM articles WHERE id = impressions.content_id AND author_id = auth.uid()
        ))
    );

CREATE POLICY "Owners can view own content clicks" ON clicks
    FOR SELECT USING (
        (content_type = 'animal' AND EXISTS (
            SELECT 1 FROM animals WHERE id = clicks.content_id AND owner_id = auth.uid()
        )) OR
        (content_type = 'event' AND EXISTS (
            SELECT 1 FROM events WHERE id = clicks.content_id AND organizer_id = auth.uid()
        )) OR
        (content_type = 'article' AND EXISTS (
            SELECT 1 FROM articles WHERE id = clicks.content_id AND author_id = auth.uid()
        ))
    );

-- Sócios podem ver analytics de animais em parceria
CREATE POLICY "Partners can view partnership analytics" ON impressions
    FOR SELECT USING (
        content_type = 'animal' AND EXISTS (
            SELECT 1 FROM animal_partnerships 
            WHERE animal_id = impressions.content_id 
            AND partner_id = auth.uid() 
            AND status = 'accepted'
        )
    );

CREATE POLICY "Partners can view partnership clicks" ON clicks
    FOR SELECT USING (
        content_type = 'animal' AND EXISTS (
            SELECT 1 FROM animal_partnerships 
            WHERE animal_id = clicks.content_id 
            AND partner_id = auth.uid() 
            AND status = 'accepted'
        )
    );

-- Sistema pode inserir analytics
CREATE POLICY "System can insert impressions" ON impressions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "System can insert clicks" ON clicks
    FOR INSERT WITH CHECK (true);

-- Admins podem ver todas as analytics
CREATE POLICY "Admins can view all analytics" ON impressions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can view all clicks" ON clicks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- =====================================================
-- POLÍTICAS PARA FAVORITES
-- =====================================================

-- Usuários podem gerenciar apenas seus próprios favoritos
CREATE POLICY "Users can manage own favorites" ON favorites
    FOR ALL USING (user_id = auth.uid());

-- =====================================================
-- POLÍTICAS PARA CONVERSATIONS E MESSAGES
-- =====================================================

-- Participantes podem ver suas conversas
CREATE POLICY "Participants can view own conversations" ON conversations
    FOR SELECT USING (
        animal_owner_id = auth.uid() OR interested_user_id = auth.uid()
    );

-- Usuários podem criar conversas
CREATE POLICY "Users can create conversations" ON conversations
    FOR INSERT WITH CHECK (
        animal_owner_id = auth.uid() OR interested_user_id = auth.uid()
    );

-- Participantes podem ver mensagens das suas conversas
CREATE POLICY "Participants can view conversation messages" ON messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM conversations 
            WHERE id = messages.conversation_id 
            AND (animal_owner_id = auth.uid() OR interested_user_id = auth.uid())
        )
    );

-- Participantes podem enviar mensagens
CREATE POLICY "Participants can send messages" ON messages
    FOR INSERT WITH CHECK (
        sender_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM conversations 
            WHERE id = messages.conversation_id 
            AND (animal_owner_id = auth.uid() OR interested_user_id = auth.uid())
        )
    );

-- =====================================================
-- POLÍTICAS PARA BOOST_HISTORY
-- =====================================================

-- Usuários podem ver histórico dos seus boosts
CREATE POLICY "Users can view own boost history" ON boost_history
    FOR SELECT USING (user_id = auth.uid());

-- Usuários podem inserir seus próprios boosts
CREATE POLICY "Users can insert own boosts" ON boost_history
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Admins podem ver todo o histórico
CREATE POLICY "Admins can view all boost history" ON boost_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- =====================================================
-- POLÍTICAS PARA TRANSACTIONS
-- =====================================================

-- Usuários podem ver apenas suas transações
CREATE POLICY "Users can view own transactions" ON transactions
    FOR SELECT USING (user_id = auth.uid());

-- Sistema pode inserir transações
CREATE POLICY "System can insert transactions" ON transactions
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Admins podem ver todas as transações (sem dados sensíveis)
CREATE POLICY "Admins can view all transactions" ON transactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );





