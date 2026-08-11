CREATE POLICY "users upload own shipping documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'shipping-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "users read own shipping documents"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'shipping-documents' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.has_ops_visibility(auth.uid())));

CREATE POLICY "users delete own shipping documents"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'shipping-documents' AND (storage.foldername(name))[1] = auth.uid()::text);