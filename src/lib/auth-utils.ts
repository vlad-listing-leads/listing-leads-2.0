import { SupabaseClient, User } from '@supabase/supabase-js'

export interface Profile {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  memberstack_id: string | null
  role: 'admin' | 'user'
  region: string | null
}

/**
 * Get the current authenticated user
 * Returns null if not authenticated
 */
export async function getAuthUser(supabase: SupabaseClient): Promise<User | null> {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  return user
}

/**
 * Get the current user's profile
 * Returns null if not authenticated or profile not found
 */
export async function getUserProfile(supabase: SupabaseClient): Promise<Profile | null> {
  const user = await getAuthUser(supabase)
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, email, first_name, last_name, memberstack_id, role, region')
    .eq('id', user.id)
    .single()

  return profile
}

/**
 * Check if the current user is an admin
 * Returns false if not authenticated or not an admin
 */
export async function isAdmin(supabase: SupabaseClient): Promise<boolean> {
  const profile = await getUserProfile(supabase)
  return profile?.role === 'admin'
}

/**
 * Require admin access - throws if not admin
 * Use this at the start of admin-only API routes
 */
export async function requireAdmin(supabase: SupabaseClient): Promise<{ user: User; profile: Profile }> {
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    throw new AuthError('Unauthorized', 401)
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, email, first_name, last_name, memberstack_id, role, region')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    throw new AuthError('Forbidden', 403)
  }

  return { user, profile: profile as Profile }
}

/**
 * Require authenticated user - throws if not authenticated
 */
export async function requireAuth(supabase: SupabaseClient): Promise<User> {
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    throw new AuthError('Unauthorized', 401)
  }

  return user
}

/**
 * Custom error class for auth errors
 */
export class AuthError extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message)
    this.name = 'AuthError'
  }
}
