import { supabase, isSupabaseConfigured } from './supabase';
import type { User } from '../types';

export async function signInWithEmail(email: string, password: string) {
  if (!isSupabaseConfigured()) return null;
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signUp(name: string, email: string, password: string, role?: string) {
  if (!isSupabaseConfigured()) return null;
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name, role: role || 'driver' },
    },
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  if (!isSupabaseConfigured()) return;
  await supabase.auth.signOut();
}

export async function resetPassword(email: string) {
  if (!isSupabaseConfigured()) return null;
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  if (error) throw error;
  return data;
}

export async function updatePassword(password: string) {
  if (!isSupabaseConfigured()) return null;
  const { data, error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
  return data;
}

export async function getSession() {
  if (!isSupabaseConfigured()) return null;
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export function onAuthChange(callback: (session: any) => void) {
  if (!isSupabaseConfigured()) return { subscription: { unsubscribe: () => {} } };
  const { data } = supabase.auth.onAuthStateChange((_event, session) => callback(session));
  return data;
}

export async function fetchProfile(userId: string): Promise<User | null> {
  if (!isSupabaseConfigured()) return null;
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  return data;
}
