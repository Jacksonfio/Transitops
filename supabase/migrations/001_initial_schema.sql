-- TransitOps Enterprise Schema
-- Run this in your Supabase SQL Editor

-- 0. Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Profiles (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(name) >= 1),
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin','fleet_manager','dispatcher','driver','safety_officer','financial_analyst')) DEFAULT 'driver',
  avatar TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_profiles_role ON public.profiles(role);

-- 2. Vehicles
CREATE TABLE public.vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  registration_number TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  model TEXT NOT NULL,
  manufacturer TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('Truck','Van','Bus','Trailer','SUV','Motorcycle')),
  load_capacity NUMERIC NOT NULL CHECK (load_capacity > 0),
  odometer NUMERIC NOT NULL DEFAULT 0,
  acquisition_cost NUMERIC NOT NULL DEFAULT 0,
  purchase_date DATE NOT NULL,
  insurance_expiry DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Available','On Trip','In Shop','Retired')) DEFAULT 'Available',
  fuel_type TEXT NOT NULL CHECK (fuel_type IN ('Diesel','Petrol','Electric','Hybrid','CNG')),
  current_driver_id UUID REFERENCES public.drivers(id) ON DELETE SET NULL,
  health_score INTEGER CHECK (health_score >= 0 AND health_score <= 100),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_vehicles_status ON public.vehicles(status);
CREATE INDEX idx_vehicles_registration ON public.vehicles(registration_number);

-- 3. Drivers
CREATE TABLE public.drivers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  license_number TEXT NOT NULL UNIQUE,
  license_category TEXT NOT NULL,
  license_expiry DATE NOT NULL,
  phone TEXT NOT NULL,
  emergency_contact TEXT,
  joining_date DATE NOT NULL,
  experience_years INTEGER NOT NULL DEFAULT 0,
  blood_group TEXT,
  safety_score INTEGER NOT NULL DEFAULT 100 CHECK (safety_score >= 0 AND safety_score <= 100),
  status TEXT NOT NULL CHECK (status IN ('Available','On Trip','Off Duty','Suspended')) DEFAULT 'Available',
  current_vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  fatigue_index INTEGER CHECK (fatigue_index >= 0 AND fatigue_index <= 100) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_drivers_status ON public.drivers(status);
CREATE INDEX idx_drivers_license ON public.drivers(license_number);

-- Add FK for vehicles.current_driver_id after drivers table exists
ALTER TABLE public.vehicles ADD CONSTRAINT fk_vehicle_driver FOREIGN KEY (current_driver_id) REFERENCES public.drivers(id) ON DELETE SET NULL;

-- 4. Trips
CREATE TABLE public.trips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source TEXT NOT NULL,
  destination TEXT NOT NULL,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE RESTRICT,
  driver_id UUID NOT NULL REFERENCES public.drivers(id) ON DELETE RESTRICT,
  cargo_description TEXT NOT NULL,
  cargo_weight NUMERIC NOT NULL CHECK (cargo_weight > 0),
  planned_distance NUMERIC NOT NULL CHECK (planned_distance > 0),
  estimated_duration NUMERIC NOT NULL CHECK (estimated_duration > 0),
  revenue NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('Draft','Dispatched','Completed','Cancelled')) DEFAULT 'Draft',
  priority TEXT NOT NULL CHECK (priority IN ('Low','Medium','High','Urgent')) DEFAULT 'Medium',
  dispatched_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  final_odometer NUMERIC,
  fuel_consumed NUMERIC,
  estimated_fuel_cost NUMERIC,
  estimated_co2 NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_trips_status ON public.trips(status);
CREATE INDEX idx_trips_vehicle ON public.trips(vehicle_id);
CREATE INDEX idx_trips_driver ON public.trips(driver_id);
CREATE INDEX idx_trips_created ON public.trips(created_at DESC);

-- 5. Maintenance Logs
CREATE TABLE public.maintenance_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('Oil Change','Brake Service','Engine Repair','Tyre Replacement','Battery','Transmission','Electrical','Inspection','Body Work','Other')),
  description TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Scheduled','In Progress','Completed','Cancelled')) DEFAULT 'Scheduled',
  scheduled_date DATE NOT NULL,
  completed_date DATE,
  cost NUMERIC NOT NULL DEFAULT 0,
  mechanic TEXT NOT NULL,
  odometer_at_service NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_maintenance_vehicle ON public.maintenance_logs(vehicle_id);
CREATE INDEX idx_maintenance_status ON public.maintenance_logs(status);

-- 6. Fuel Logs
CREATE TABLE public.fuel_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  trip_id UUID REFERENCES public.trips(id) ON DELETE SET NULL,
  fuel_station TEXT NOT NULL,
  fuel_type TEXT NOT NULL,
  liters NUMERIC NOT NULL CHECK (liters > 0),
  price_per_liter NUMERIC NOT NULL CHECK (price_per_liter > 0),
  total_cost NUMERIC NOT NULL CHECK (total_cost > 0),
  odometer NUMERIC NOT NULL,
  date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_fuel_vehicle ON public.fuel_logs(vehicle_id);
CREATE INDEX idx_fuel_date ON public.fuel_logs(date DESC);

-- 7. Expenses
CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  driver_id UUID REFERENCES public.drivers(id) ON DELETE SET NULL,
  trip_id UUID REFERENCES public.trips(id) ON DELETE SET NULL,
  category TEXT NOT NULL CHECK (category IN ('Fuel','Maintenance','Toll','Parking','Insurance','Permit','Driver Salary','Other')),
  amount NUMERIC NOT NULL CHECK (amount > 0),
  description TEXT NOT NULL,
  date DATE NOT NULL,
  receipt_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_expenses_category ON public.expenses(category);
CREATE INDEX idx_expenses_date ON public.expenses(date DESC);

-- 8. Notifications
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  severity TEXT NOT NULL CHECK (severity IN ('Info','Warning','Critical')) DEFAULT 'Info',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('License','Insurance','Maintenance','Trip','Vehicle','System')),
  resolved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_notifications_user ON public.notifications(user_id);
CREATE INDEX idx_notifications_resolved ON public.notifications(resolved);

-- 9. Documents (Storage metadata)
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('vehicle','driver','maintenance','expense','trip')),
  entity_id UUID NOT NULL,
  bucket TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_documents_entity ON public.documents(entity_type, entity_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fuel_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read all profiles, update own
CREATE POLICY "profiles_select_all" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Vehicles: all authenticated users can read; admin/fleet_manager can write
CREATE POLICY "vehicles_select_all" ON public.vehicles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "vehicles_insert_admin" ON public.vehicles FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','fleet_manager'))
);
CREATE POLICY "vehicles_update_admin" ON public.vehicles FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','fleet_manager'))
);
CREATE POLICY "vehicles_delete_admin" ON public.vehicles FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','fleet_manager'))
);

-- Drivers: all authenticated can read; admin/fleet_manager/safety_officer can write
CREATE POLICY "drivers_select_all" ON public.drivers FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "drivers_insert_admin" ON public.drivers FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','fleet_manager','safety_officer'))
);
CREATE POLICY "drivers_update_admin" ON public.drivers FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','fleet_manager','safety_officer'))
);
CREATE POLICY "drivers_delete_admin" ON public.drivers FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','fleet_manager'))
);

-- Trips: all authenticated can read; admin/fleet_manager/dispatcher can write
CREATE POLICY "trips_select_all" ON public.trips FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "trips_insert_allowed" ON public.trips FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','fleet_manager','dispatcher'))
);
CREATE POLICY "trips_update_allowed" ON public.trips FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','fleet_manager','dispatcher'))
);

-- Maintenance: all authenticated can read; admin/fleet_manager can write
CREATE POLICY "maintenance_select_all" ON public.maintenance_logs FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "maintenance_insert_admin" ON public.maintenance_logs FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','fleet_manager'))
);
CREATE POLICY "maintenance_update_admin" ON public.maintenance_logs FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','fleet_manager'))
);

-- Fuel & Expenses: all authenticated can read; admin/fleet_manager/financial_analyst can write
CREATE POLICY "fuel_select_all" ON public.fuel_logs FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "fuel_insert_allowed" ON public.fuel_logs FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','fleet_manager','financial_analyst'))
);
CREATE POLICY "expenses_select_all" ON public.expenses FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "expenses_insert_allowed" ON public.expenses FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','fleet_manager','financial_analyst'))
);

-- Notifications: users see their own
CREATE POLICY "notifications_select_own" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notifications_update_own" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- Documents: all authenticated can read; insert/delete based on entity permissions
CREATE POLICY "documents_select_all" ON public.documents FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "documents_insert_allowed" ON public.documents FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "documents_delete_own" ON public.documents FOR DELETE USING (
  uploaded_by = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ============================================================
-- TRIGGER: Auto-create profile on signup
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'driver')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- TRIGGER: Auto-update updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER vehicles_updated_at BEFORE UPDATE ON public.vehicles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER drivers_updated_at BEFORE UPDATE ON public.drivers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trips_updated_at BEFORE UPDATE ON public.trips FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER maintenance_updated_at BEFORE UPDATE ON public.maintenance_logs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER fuel_updated_at BEFORE UPDATE ON public.fuel_logs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER expenses_updated_at BEFORE UPDATE ON public.expenses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================
INSERT INTO storage.buckets (id, name, public) VALUES
  ('vehicle-images', 'vehicle-images', true),
  ('vehicle-documents', 'vehicle-documents', false),
  ('driver-licenses', 'driver-licenses', false),
  ('driver-photos', 'driver-photos', true),
  ('maintenance-files', 'maintenance-files', false),
  ('expense-receipts', 'expense-receipts', false)
ON CONFLICT (id) DO NOTHING;
