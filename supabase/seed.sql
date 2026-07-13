-- TransitOps Seed Data
-- Run this AFTER 001_initial_schema.sql in the Supabase SQL Editor.
-- NOTE: Auth users must exist first (sign up via the app, or create via
-- Supabase Auth panel). The handle_new_user() trigger will auto-create profiles.
-- This seed populates all business tables with demo data using UUIDs.

-- ── Vehicles ────────────────────────────────────────────────────
INSERT INTO public.vehicles (id, registration_number, name, model, manufacturer, type, load_capacity, odometer, acquisition_cost, purchase_date, insurance_expiry, status, fuel_type, health_score) VALUES
  (gen_random_uuid(), 'TN-01-AB-1234', 'Thunder-01', 'Actros 1845', 'Mercedes-Benz', 'Truck', 25000, 120000, 85000, '2021-03-15', '2026-12-31', 'Available', 'Diesel', 87),
  (gen_random_uuid(), 'TN-02-CD-5678', 'Swift-02', 'Sprinter 316', 'Mercedes-Benz', 'Van', 1500, 84000, 42000, '2022-06-10', '2026-09-30', 'On Trip', 'Diesel', 72),
  (gen_random_uuid(), 'TN-03-EF-9012', 'Titan-03', 'T680', 'Kenworth', 'Truck', 30000, 210000, 95000, '2019-08-22', '2026-08-22', 'In Shop', 'Diesel', 45),
  (gen_random_uuid(), 'TN-04-GH-3456', 'Eagle-04', 'Transit Custom', 'Ford', 'Van', 1000, 56000, 38000, '2023-01-20', '2027-01-20', 'Available', 'Diesel', 92),
  (gen_random_uuid(), 'MH-05-IJ-7890', 'Falcon-05', 'BS-6 Sleeper', 'Tata Motors', 'Truck', 20000, 178000, 72000, '2020-11-05', '2025-11-05', 'Retired', 'Diesel', 22),
  (gen_random_uuid(), 'DL-06-KL-2345', 'Maverick-06', 'Cascadia', 'Freightliner', 'Truck', 28000, 65000, 110000, '2024-02-18', '2028-02-18', 'Available', 'Diesel', 96),
  (gen_random_uuid(), 'KA-07-MN-6789', 'Hercules-07', '9700 S', 'Volvo', 'Truck', 32000, 45000, 145000, '2024-09-01', '2028-09-01', 'Available', 'Diesel', 98),
  (gen_random_uuid(), 'GJ-08-OP-0123', 'Courier-08', 'e-Transit', 'Ford', 'Van', 800, 12000, 52000, '2024-05-12', '2028-05-12', 'Available', 'Electric', 95);

-- ── Drivers ─────────────────────────────────────────────────────
INSERT INTO public.drivers (id, name, license_number, license_category, license_expiry, phone, emergency_contact, joining_date, experience_years, blood_group, safety_score, status, fatigue_index) VALUES
  (gen_random_uuid(), 'Rajesh Kumar', 'DL-IND-2021-001', 'Class A', '2027-06-15', '+91-9876543210', '+91-9876543211', '2021-01-10', 8, 'O+', 92, 'Available', 15),
  (gen_random_uuid(), 'Priya Sharma', 'DL-IND-2022-002', 'Class B', '2026-11-20', '+91-9876543212', '+91-9876543213', '2022-03-05', 5, 'A+', 88, 'On Trip', 25),
  (gen_random_uuid(), 'Vikram Singh', 'DL-IND-2020-003', 'Class A', '2025-08-10', '+91-9876543214', '+91-9876543215', '2020-06-20', 12, 'B+', 95, 'Available', 10),
  (gen_random_uuid(), 'Ananya Patel', 'DL-IND-2023-004', 'Class C', '2028-02-28', '+91-9876543216', '+91-9876543217', '2023-08-15', 3, 'AB+', 78, 'Suspended', 5),
  (gen_random_uuid(), 'Suresh Reddy', 'DL-IND-2019-005', 'Class A', '2025-12-05', '+91-9876543218', '+91-9876543219', '2019-04-01', 15, 'O-', 85, 'Available', 30),
  (gen_random_uuid(), 'Deepa Nair', 'DL-IND-2024-006', 'Class B', '2029-04-18', '+91-9876543220', '+91-9876543221', '2024-01-10', 4, 'A-', 90, 'Available', 8);

-- ── Trips ───────────────────────────────────────────────────────
INSERT INTO public.trips (id, source, destination, vehicle_id, driver_id, cargo_description, cargo_weight, planned_distance, estimated_duration, revenue, status, priority, estimated_fuel_cost, estimated_co2) VALUES
  (gen_random_uuid(), 'Chennai', 'Bangalore', (SELECT id FROM public.vehicles WHERE registration_number = 'TN-02-CD-5678'), (SELECT id FROM public.drivers WHERE license_number = 'DL-IND-2022-002'), 'Electronics & Spare Parts', 1200, 350, 6.5, 45000, 'Dispatched', 'High', 8500, 280),
  (gen_random_uuid(), 'Mumbai', 'Delhi', (SELECT id FROM public.vehicles WHERE registration_number = 'TN-01-AB-1234'), (SELECT id FROM public.drivers WHERE license_number = 'DL-IND-2021-001'), 'Textiles & Garments', 18000, 1400, 28, 185000, 'Draft', 'Medium', 42000, 1100),
  (gen_random_uuid(), 'Hyderabad', 'Kolkata', (SELECT id FROM public.vehicles WHERE registration_number = 'DL-06-KL-2345'), (SELECT id FROM public.drivers WHERE license_number = 'DL-IND-2020-003'), 'Pharmaceuticals', 15000, 1500, 30, 220000, 'Draft', 'Urgent', 38000, 980);

-- ── Maintenance Logs ────────────────────────────────────────────
INSERT INTO public.maintenance_logs (id, vehicle_id, type, description, status, scheduled_date, cost, mechanic) VALUES
  (gen_random_uuid(), (SELECT id FROM public.vehicles WHERE registration_number = 'TN-03-EF-9012'), 'Engine Repair', 'Complete engine overhaul - piston rings & cylinder head', 'In Progress', '2025-12-10', 45000, 'Ravi Auto Works'),
  (gen_random_uuid(), (SELECT id FROM public.vehicles WHERE registration_number = 'TN-01-AB-1234'), 'Oil Change', 'Routine oil and filter change', 'Scheduled', '2026-01-20', 3500, 'Speed Service Center'),
  (gen_random_uuid(), (SELECT id FROM public.vehicles WHERE registration_number = 'TN-04-GH-3456'), 'Brake Service', 'Brake pad replacement and fluid top-up', 'Completed', '2025-11-15', 6200, 'Brake Masters'),
  (gen_random_uuid(), (SELECT id FROM public.vehicles WHERE registration_number = 'DL-06-KL-2345'), 'Tyre Replacement', 'Replace all 6 tyres with Michelin X', 'Scheduled', '2026-02-01', 18000, 'Tyre Zone'),
  (gen_random_uuid(), (SELECT id FROM public.vehicles WHERE registration_number = 'KA-07-MN-6789'), 'Inspection', 'Annual fitness & emission inspection', 'Scheduled', '2026-01-05', 2500, 'RTO Inspection Center');

-- ── Fuel Logs ───────────────────────────────────────────────────
INSERT INTO public.fuel_logs (id, vehicle_id, driver_id, fuel_station, fuel_type, liters, price_per_liter, total_cost, odometer, date) VALUES
  (gen_random_uuid(), (SELECT id FROM public.vehicles WHERE registration_number = 'TN-02-CD-5678'), (SELECT id FROM public.drivers WHERE license_number = 'DL-IND-2022-002'), 'IndianOil - Chennai', 'Diesel', 85, 86.50, 7352.50, 84500, '2025-12-28'),
  (gen_random_uuid(), (SELECT id FROM public.vehicles WHERE registration_number = 'TN-01-AB-1234'), (SELECT id FROM public.drivers WHERE license_number = 'DL-IND-2021-001'), 'BPCL - Mumbai', 'Diesel', 120, 87.00, 10440.00, 121500, '2025-12-25'),
  (gen_random_uuid(), (SELECT id FROM public.vehicles WHERE registration_number = 'TN-04-GH-3456'), (SELECT id FROM public.drivers WHERE license_number = 'DL-IND-2024-006'), 'HP - Bangalore', 'Diesel', 55, 86.80, 4774.00, 56200, '2025-12-20');

-- ── Expenses ────────────────────────────────────────────────────
INSERT INTO public.expenses (id, vehicle_id, category, amount, description, date) VALUES
  (gen_random_uuid(), (SELECT id FROM public.vehicles WHERE registration_number = 'TN-01-AB-1234'), 'Toll', 2800, 'Mumbai-Pune Expressway toll charges', '2025-12-26'),
  (gen_random_uuid(), (SELECT id FROM public.vehicles WHERE registration_number = 'TN-02-CD-5678'), 'Parking', 500, 'Warehouse parking fee - 2 days', '2025-12-29'),
  (gen_random_uuid(), (SELECT id FROM public.vehicles WHERE registration_number = 'DL-06-KL-2345'), 'Insurance', 24000, 'Annual comprehensive insurance premium', '2025-12-01'),
  (gen_random_uuid(), (SELECT id FROM public.vehicles WHERE registration_number = 'KA-07-MN-6789'), 'Permit', 12000, 'National permit renewal - 1 year', '2025-12-15');

-- ── Notifications ───────────────────────────────────────────────
INSERT INTO public.notifications (id, severity, title, message, category, resolved) VALUES
  (gen_random_uuid(), 'Critical', 'License Expired', 'Driver Ananya Patel license expired 45 days ago.', 'License', false),
  (gen_random_uuid(), 'Warning', 'Insurance Expiring', 'Vehicle Falcon-05 insurance expired 30 days ago.', 'Insurance', false),
  (gen_random_uuid(), 'Info', 'Maintenance Completed', 'Brake service completed on Eagle-04.', 'Maintenance', true),
  (gen_random_uuid(), 'Warning', 'Vehicle In Shop', 'Titan-03 has been in maintenance for 5 days.', 'Maintenance', false),
  (gen_random_uuid(), 'Info', 'Trip Dispatched', 'Trip from Chennai to Bangalore is active.', 'Trip', false);

-- ── Documents (Storage references) ─────────────────────────────
INSERT INTO public.documents (id, entity_type, entity_id, bucket, file_path, file_name, file_size, mime_type) VALUES
  (gen_random_uuid(), 'vehicle', (SELECT id FROM public.vehicles WHERE registration_number = 'DL-06-KL-2345'), 'vehicle-images', 'maverick-06/photo.jpg', 'maverick-06.jpg', 245000, 'image/jpeg'),
  (gen_random_uuid(), 'driver', (SELECT id FROM public.drivers WHERE license_number = 'DL-IND-2021-001'), 'driver-licenses', 'rajesh-kumar/license.pdf', 'license.pdf', 120000, 'application/pdf');
