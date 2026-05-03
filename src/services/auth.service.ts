import { supabase } from './supabase'
import type { Session, User } from '@supabase/supabase-js'

type LoginCredentials = {
  email: string
  password: string
}

type AuthResult = {
  session: Session | null
  user: User | null
  error: string | null
}

export async function loginWithEmail(
  credentials: LoginCredentials,
): Promise<AuthResult> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: credentials.email,
    password: credentials.password,
  })

  if (error) {
    return { session: null, user: null, error: error.message }
  }

  return {
    session: data.session,
    user: data.user,
    error: null,
  }
}

export async function logoutUser(): Promise<{ error: string | null }> {
  const { error } = await supabase.auth.signOut()
  return { error: error?.message ?? null }
}

export async function sendPasswordReset(
  email: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase.auth.resetPasswordForEmail(email)
  return { error: error?.message ?? null }
}

export async function getCurrentSession(): Promise<AuthResult> {
  const { data, error } = await supabase.auth.getSession()

  if (error) {
    return { session: null, user: null, error: error.message }
  }

  return {
    session: data.session,
    user: data.session?.user ?? null,
    error: null,
  }
}
