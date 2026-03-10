-- ============================================================================
-- MIGRAÇÃO 084: Permitir admin gerenciar imagens de animais
-- ============================================================================
-- Motivo: admin precisa enviar/atualizar/deletar imagens em nome de qualquer haras
-- mantendo o layout atual de storage (bucket animal-images).
-- ============================================================================

-- Upload (INSERT)
DROP POLICY IF EXISTS "Admins podem fazer upload de imagens de animais" ON storage.objects;
CREATE POLICY "Admins podem fazer upload de imagens de animais"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'animal-images'
  AND EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'admin'
  )
);

-- Atualização (UPDATE)
DROP POLICY IF EXISTS "Admins podem atualizar imagens de animais" ON storage.objects;
CREATE POLICY "Admins podem atualizar imagens de animais"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'animal-images'
  AND EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'admin'
  )
)
WITH CHECK (
  bucket_id = 'animal-images'
  AND EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'admin'
  )
);

-- Remoção (DELETE)
DROP POLICY IF EXISTS "Admins podem deletar imagens de animais" ON storage.objects;
CREATE POLICY "Admins podem deletar imagens de animais"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'animal-images'
  AND EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'admin'
  )
);
