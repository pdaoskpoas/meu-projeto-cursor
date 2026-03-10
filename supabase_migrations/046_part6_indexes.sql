-- =====================================================
-- MIGRAÇÃO 046 - PARTE 6: ÍNDICES
-- Data: 04/11/2025
-- =====================================================

-- Índice composto: sociedades aceitas por parceiro
CREATE INDEX IF NOT EXISTS idx_animal_partnerships_partner_accepted 
    ON public.animal_partnerships(partner_id, status) 
    WHERE status = 'accepted';

-- Índice composto: sociedades por animal e status
CREATE INDEX IF NOT EXISTS idx_animal_partnerships_animal_status 
    ON public.animal_partnerships(animal_id, status);

COMMENT ON INDEX idx_animal_partnerships_partner_accepted IS 'Otimiza busca de sociedades aceitas por parceiro';
COMMENT ON INDEX idx_animal_partnerships_animal_status IS 'Otimiza busca de sociedades por animal e status';

