-- TransitOps Storage Bucket RLS Policies
-- Run this AFTER 001_initial_schema.sql

-- ============================================================
-- Storage bucket RLS policies
-- ============================================================

-- Vehicle Images (public read, authenticated upload/delete)
CREATE POLICY "vehicle_images_select_public" ON storage.objects
  FOR SELECT USING (bucket_id = 'vehicle-images');

CREATE POLICY "vehicle_images_insert_auth" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'vehicle-images' AND auth.role() = 'authenticated'
  );

CREATE POLICY "vehicle_images_delete_own" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'vehicle-images' AND auth.role() = 'authenticated'
  );

-- Vehicle Documents (authenticated read/write)
CREATE POLICY "vehicle_docs_select_auth" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'vehicle-documents' AND auth.role() = 'authenticated'
  );

CREATE POLICY "vehicle_docs_insert_auth" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'vehicle-documents' AND auth.role() = 'authenticated'
  );

CREATE POLICY "vehicle_docs_delete_own" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'vehicle-documents' AND auth.role() = 'authenticated'
  );

-- Driver Licenses (authenticated read/write)
CREATE POLICY "driver_licenses_select_auth" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'driver-licenses' AND auth.role() = 'authenticated'
  );

CREATE POLICY "driver_licenses_insert_auth" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'driver-licenses' AND auth.role() = 'authenticated'
  );

CREATE POLICY "driver_licenses_delete_own" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'driver-licenses' AND auth.role() = 'authenticated'
  );

-- Driver Photos (public read, authenticated upload/delete)
CREATE POLICY "driver_photos_select_public" ON storage.objects
  FOR SELECT USING (bucket_id = 'driver-photos');

CREATE POLICY "driver_photos_insert_auth" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'driver-photos' AND auth.role() = 'authenticated'
  );

CREATE POLICY "driver_photos_delete_own" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'driver-photos' AND auth.role() = 'authenticated'
  );

-- Maintenance Files (authenticated read/write)
CREATE POLICY "maintenance_files_select_auth" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'maintenance-files' AND auth.role() = 'authenticated'
  );

CREATE POLICY "maintenance_files_insert_auth" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'maintenance-files' AND auth.role() = 'authenticated'
  );

CREATE POLICY "maintenance_files_delete_own" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'maintenance-files' AND auth.role() = 'authenticated'
  );

-- Expense Receipts (authenticated read/write)
CREATE POLICY "expense_receipts_select_auth" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'expense-receipts' AND auth.role() = 'authenticated'
  );

CREATE POLICY "expense_receipts_insert_auth" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'expense-receipts' AND auth.role() = 'authenticated'
  );

CREATE POLICY "expense_receipts_delete_own" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'expense-receipts' AND auth.role() = 'authenticated'
  );
