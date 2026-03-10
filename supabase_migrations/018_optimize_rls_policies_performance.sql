-- 🔒 Otimização de Performance de RLS Policies
-- Baseado em: Supabase Performance Advisor
-- Fix: auth.uid() → (select auth.uid())
-- Data: 2 de outubro de 2025

-- Problema: auth.uid() é re-avaliado para cada linha
-- Solução: (select auth.uid()) é avaliado uma vez

-- =============================================================================
-- PROFILES
-- =============================================================================

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (id = (select auth.uid()));

-- =============================================================================
-- ANIMALS
-- =============================================================================

DROP POLICY IF EXISTS "animals_select_min" ON public.animals;
CREATE POLICY "animals_select_min"
ON public.animals FOR SELECT
USING (owner_id = (select auth.uid()) OR ad_status = 'active');

DROP POLICY IF EXISTS "animals_insert_min" ON public.animals;
CREATE POLICY "animals_insert_min"
ON public.animals FOR INSERT
WITH CHECK (owner_id = (select auth.uid()));

DROP POLICY IF EXISTS "animals_update_min" ON public.animals;
CREATE POLICY "animals_update_min"
ON public.animals FOR UPDATE
USING (owner_id = (select auth.uid()) AND can_edit = true);

DROP POLICY IF EXISTS "animals_delete_min" ON public.animals;
CREATE POLICY "animals_delete_min"
ON public.animals FOR DELETE
USING (owner_id = (select auth.uid()));

DROP POLICY IF EXISTS "animals_admin_select" ON public.animals;
CREATE POLICY "animals_admin_select"
ON public.animals FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = (select auth.uid()) AND role = 'admin'
  )
);

DROP POLICY IF EXISTS "animals_admin_insert" ON public.animals;
CREATE POLICY "animals_admin_insert"
ON public.animals FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = (select auth.uid()) AND role = 'admin'
  )
);

DROP POLICY IF EXISTS "animals_admin_update" ON public.animals;
CREATE POLICY "animals_admin_update"
ON public.animals FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = (select auth.uid()) AND role = 'admin'
  )
);

DROP POLICY IF EXISTS "animals_admin_delete" ON public.animals;
CREATE POLICY "animals_admin_delete"
ON public.animals FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = (select auth.uid()) AND role = 'admin'
  )
);

-- =============================================================================
-- SUSPENSIONS
-- =============================================================================

DROP POLICY IF EXISTS "Only admins can view suspensions" ON public.suspensions;
CREATE POLICY "Only admins can view suspensions"
ON public.suspensions FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = (select auth.uid()) AND role = 'admin'
  )
);

DROP POLICY IF EXISTS "Only admins can insert suspensions" ON public.suspensions;
CREATE POLICY "Only admins can insert suspensions"
ON public.suspensions FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = (select auth.uid()) AND role = 'admin'
  )
);

-- =============================================================================
-- EVENTS
-- =============================================================================

DROP POLICY IF EXISTS "Organizers can view own events" ON public.events;
CREATE POLICY "Organizers can view own events"
ON public.events FOR SELECT
USING (organizer_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert own events" ON public.events;
CREATE POLICY "Users can insert own events"
ON public.events FOR INSERT
WITH CHECK (organizer_id = (select auth.uid()));

DROP POLICY IF EXISTS "Organizers can update own events" ON public.events;
CREATE POLICY "Organizers can update own events"
ON public.events FOR UPDATE
USING (organizer_id = (select auth.uid()) AND can_edit = true);

-- =============================================================================
-- ARTICLES
-- =============================================================================

DROP POLICY IF EXISTS "Authors can view own articles" ON public.articles;
CREATE POLICY "Authors can view own articles"
ON public.articles FOR SELECT
USING (author_id = (select auth.uid()));

DROP POLICY IF EXISTS "Only admins can manage articles" ON public.articles;
CREATE POLICY "Only admins can manage articles"
ON public.articles FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = (select auth.uid()) AND role = 'admin'
  )
);

-- =============================================================================
-- ANIMAL_MEDIA
-- =============================================================================

DROP POLICY IF EXISTS "Owners can manage own animal media" ON public.animal_media;
CREATE POLICY "Owners can manage own animal media"
ON public.animal_media FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM animals 
    WHERE id = animal_media.animal_id AND owner_id = (select auth.uid())
  )
);

-- =============================================================================
-- ANIMAL_PARTNERSHIPS
-- =============================================================================

DROP POLICY IF EXISTS "Partnerships are viewable by involved parties" ON public.animal_partnerships;
CREATE POLICY "Partnerships are viewable by involved parties"
ON public.animal_partnerships FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM animals 
    WHERE id = animal_partnerships.animal_id AND owner_id = (select auth.uid())
  )
  OR partner_id = (select auth.uid())
);

DROP POLICY IF EXISTS "Owners can create partnerships" ON public.animal_partnerships;
CREATE POLICY "Owners can create partnerships"
ON public.animal_partnerships FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM animals 
    WHERE id = animal_partnerships.animal_id AND owner_id = (select auth.uid())
  )
);

DROP POLICY IF EXISTS "Involved parties can update partnerships" ON public.animal_partnerships;
CREATE POLICY "Involved parties can update partnerships"
ON public.animal_partnerships FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM animals 
    WHERE id = animal_partnerships.animal_id AND owner_id = (select auth.uid())
  )
  OR partner_id = (select auth.uid())
);

-- =============================================================================
-- IMPRESSIONS & CLICKS
-- =============================================================================

DROP POLICY IF EXISTS "Owners can view own content analytics" ON public.impressions;
CREATE POLICY "Owners can view own content analytics"
ON public.impressions FOR SELECT
USING (
  (content_type = 'animal' AND EXISTS (
    SELECT 1 FROM animals 
    WHERE id = impressions.content_id AND owner_id = (select auth.uid())
  ))
  OR (content_type = 'event' AND EXISTS (
    SELECT 1 FROM events 
    WHERE id = impressions.content_id AND organizer_id = (select auth.uid())
  ))
  OR (content_type = 'article' AND EXISTS (
    SELECT 1 FROM articles 
    WHERE id = impressions.content_id AND author_id = (select auth.uid())
  ))
);

DROP POLICY IF EXISTS "Admins can view all analytics" ON public.impressions;
CREATE POLICY "Admins can view all analytics"
ON public.impressions FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = (select auth.uid()) AND role = 'admin'
  )
);

DROP POLICY IF EXISTS "Partners can view partnership analytics" ON public.impressions;
CREATE POLICY "Partners can view partnership analytics"
ON public.impressions FOR SELECT
USING (
  content_type = 'animal' AND EXISTS (
    SELECT 1 FROM animal_partnerships 
    WHERE animal_id = impressions.content_id 
      AND partner_id = (select auth.uid())
      AND status = 'accepted'
  )
);

DROP POLICY IF EXISTS "Owners can view own content clicks" ON public.clicks;
CREATE POLICY "Owners can view own content clicks"
ON public.clicks FOR SELECT
USING (
  (content_type = 'animal' AND EXISTS (
    SELECT 1 FROM animals 
    WHERE id = clicks.content_id AND owner_id = (select auth.uid())
  ))
  OR (content_type = 'event' AND EXISTS (
    SELECT 1 FROM events 
    WHERE id = clicks.content_id AND organizer_id = (select auth.uid())
  ))
  OR (content_type = 'article' AND EXISTS (
    SELECT 1 FROM articles 
    WHERE id = clicks.content_id AND author_id = (select auth.uid())
  ))
);

DROP POLICY IF EXISTS "Admins can view all clicks" ON public.clicks;
CREATE POLICY "Admins can view all clicks"
ON public.clicks FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = (select auth.uid()) AND role = 'admin'
  )
);

DROP POLICY IF EXISTS "Partners can view partnership clicks" ON public.clicks;
CREATE POLICY "Partners can view partnership clicks"
ON public.clicks FOR SELECT
USING (
  content_type = 'animal' AND EXISTS (
    SELECT 1 FROM animal_partnerships 
    WHERE animal_id = clicks.content_id 
      AND partner_id = (select auth.uid())
      AND status = 'accepted'
  )
);

-- =============================================================================
-- FAVORITES
-- =============================================================================

DROP POLICY IF EXISTS "Users can manage own favorites" ON public.favorites;
CREATE POLICY "Users can manage own favorites"
ON public.favorites FOR ALL
TO authenticated
USING (user_id = (select auth.uid()));

-- =============================================================================
-- CONVERSATIONS & MESSAGES
-- =============================================================================

DROP POLICY IF EXISTS "Participants can view own conversations" ON public.conversations;
CREATE POLICY "Participants can view own conversations"
ON public.conversations FOR SELECT
TO authenticated
USING (
  animal_owner_id = (select auth.uid()) 
  OR interested_user_id = (select auth.uid())
);

DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;
CREATE POLICY "Users can create conversations"
ON public.conversations FOR INSERT
TO authenticated
WITH CHECK (interested_user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Participants can view conversation messages" ON public.messages;
CREATE POLICY "Participants can view conversation messages"
ON public.messages FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM conversations 
    WHERE id = messages.conversation_id 
      AND (animal_owner_id = (select auth.uid()) OR interested_user_id = (select auth.uid()))
  )
);

DROP POLICY IF EXISTS "Participants can send messages" ON public.messages;
CREATE POLICY "Participants can send messages"
ON public.messages FOR INSERT
TO authenticated
WITH CHECK (
  sender_id = (select auth.uid())
  AND EXISTS (
    SELECT 1 FROM conversations 
    WHERE id = messages.conversation_id 
      AND (animal_owner_id = (select auth.uid()) OR interested_user_id = (select auth.uid()))
  )
);

-- =============================================================================
-- BOOST_HISTORY
-- =============================================================================

DROP POLICY IF EXISTS "Users can view own boost history" ON public.boost_history;
CREATE POLICY "Users can view own boost history"
ON public.boost_history FOR SELECT
TO authenticated
USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert own boosts" ON public.boost_history;
CREATE POLICY "Users can insert own boosts"
ON public.boost_history FOR INSERT
TO authenticated
WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Admins can view all boost history" ON public.boost_history;
CREATE POLICY "Admins can view all boost history"
ON public.boost_history FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = (select auth.uid()) AND role = 'admin'
  )
);

-- =============================================================================
-- TRANSACTIONS
-- =============================================================================

DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;
CREATE POLICY "Users can view own transactions"
ON public.transactions FOR SELECT
TO authenticated
USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "System can insert transactions" ON public.transactions;
CREATE POLICY "System can insert transactions"
ON public.transactions FOR INSERT
WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Admins can view all transactions" ON public.transactions;
CREATE POLICY "Admins can view all transactions"
ON public.transactions FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = (select auth.uid()) AND role = 'admin'
  )
);

-- =============================================================================
-- ANIMAL_DRAFTS
-- =============================================================================

DROP POLICY IF EXISTS "animal_drafts_select_own" ON public.animal_drafts;
CREATE POLICY "animal_drafts_select_own"
ON public.animal_drafts FOR SELECT
TO authenticated
USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "animal_drafts_insert_own" ON public.animal_drafts;
CREATE POLICY "animal_drafts_insert_own"
ON public.animal_drafts FOR INSERT
TO authenticated
WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "animal_drafts_update_own" ON public.animal_drafts;
CREATE POLICY "animal_drafts_update_own"
ON public.animal_drafts FOR UPDATE
TO authenticated
USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "animal_drafts_delete_own" ON public.animal_drafts;
CREATE POLICY "animal_drafts_delete_own"
ON public.animal_drafts FOR DELETE
TO authenticated
USING (user_id = (select auth.uid()));

-- =============================================================================
-- RATE_LIMIT_TRACKER (nossa nova tabela)
-- =============================================================================

DROP POLICY IF EXISTS "Admins can view rate limit data" ON public.rate_limit_tracker;
CREATE POLICY "Admins can view rate limit data"
ON public.rate_limit_tracker FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = (select auth.uid()) AND role = 'admin'
  )
);





