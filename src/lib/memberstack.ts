// Memberstack configuration
export const MEMBERSTACK_APP_ID = process.env.NEXT_PUBLIC_MEMBERSTACK_APP_ID
export const MEMBERSTACK_LOGIN_URL = process.env.NEXT_PUBLIC_MEMBERSTACK_LOGIN_URL || 'https://listingleads.com/login'

// Memberstack instance type
type MemberstackInstance = {
  loginMemberEmailPassword: (params: { email: string; password: string }) => Promise<{ data?: { member?: Record<string, unknown> } }>
  signupMemberEmailPassword: (params: { email: string; password: string; customFields?: Record<string, string> }) => Promise<{ data?: { member?: Record<string, unknown> } }>
  sendMemberResetPasswordEmail: (params: { email: string }) => Promise<void>
  logout: () => Promise<void>
}

// Initialize Memberstack DOM (client-side only)
let memberstackInstance: MemberstackInstance | null = null
let memberstackPromise: Promise<MemberstackInstance | null> | null = null

async function initMemberstack(): Promise<MemberstackInstance | null> {
  if (typeof window === 'undefined') {
    return null
  }
  if (memberstackInstance) {
    return memberstackInstance
  }
  if (!MEMBERSTACK_APP_ID) {
    return null
  }

  // Dynamically import to avoid SSR issues
  const memberstackDOM = (await import('@memberstack/dom')).default
  memberstackInstance = memberstackDOM.init({
    publicKey: MEMBERSTACK_APP_ID,
  }) as unknown as MemberstackInstance
  return memberstackInstance
}

export async function getMemberstack(): Promise<MemberstackInstance | null> {
  if (typeof window === 'undefined') {
    return null
  }
  if (!memberstackPromise) {
    memberstackPromise = initMemberstack()
  }
  return memberstackPromise
}

// Type definitions for Memberstack plan connection
export interface MemberstackPlanConnection {
  planId: string
  planName?: string
  status: string
  payment?: {
    amount?: number
    currency?: string
    interval?: string
  }
}

// Type definitions for Memberstack member object
export interface MemberstackMember {
  id: string
  auth: {
    email: string
  }
  customFields?: Record<string, string>
  metaData?: Record<string, unknown>
  planConnections?: MemberstackPlanConnection[]
}

// Memberstack DOM response type
export interface MemberstackResponse {
  data: MemberstackMember | null
}

// Declare global type for Memberstack DOM
declare global {
  interface Window {
    $memberstackDom?: {
      getCurrentMember: () => Promise<MemberstackResponse>
      openAccountModal: (options?: { type?: string }) => Promise<void>
      logout: () => Promise<void>
    }
  }
}

// Helper to check if Memberstack is loaded
export function isMemberstackLoaded(): boolean {
  return typeof window !== 'undefined' && !!window.$memberstackDom
}

// Helper to get current member (returns null if not logged in)
export async function getCurrentMember(): Promise<MemberstackMember | null> {
  if (!isMemberstackLoaded()) {
    return null
  }

  try {
    const response = await window.$memberstackDom!.getCurrentMember()
    return response.data
  } catch (error) {
    console.error('Error getting Memberstack member:', error)
    return null
  }
}

// Redirect to Memberstack login
export function redirectToMemberstackLogin(): void {
  if (typeof window !== 'undefined') {
    window.location.href = MEMBERSTACK_LOGIN_URL
  }
}

// Get current member's plan connections
export async function getMemberPlans(): Promise<MemberstackPlanConnection[]> {
  const member = await getCurrentMember()
  return member?.planConnections || []
}

// Open Memberstack account/billing modal
export async function openBillingPortal(): Promise<void> {
  if (!isMemberstackLoaded()) {
    console.error('Memberstack not loaded')
    return
  }

  try {
    await window.$memberstackDom!.openAccountModal()
  } catch (error) {
    console.error('Error opening billing portal:', error)
  }
}

// Login with email and password
export async function loginWithEmailPassword(
  email: string,
  password: string
): Promise<{ member: MemberstackMember | null; error: string | null }> {
  const memberstack = await getMemberstack()
  if (!memberstack) {
    return { member: null, error: 'Memberstack not initialized' }
  }

  try {
    const result = await memberstack.loginMemberEmailPassword({ email, password })
    const m = result.data?.member
    if (m) {
      const auth = m.auth as { email: string }
      return {
        member: {
          id: m.id as string,
          auth: { email: auth.email },
          customFields: m.customFields as Record<string, string> | undefined,
          metaData: m.metaData as Record<string, unknown> | undefined,
          planConnections: m.planConnections as MemberstackPlanConnection[] | undefined,
        },
        error: null,
      }
    }
    return { member: null, error: 'Login failed' }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Login failed'
    return { member: null, error: message }
  }
}

// Signup with email and password
export async function signupWithEmailPassword(
  email: string,
  password: string,
  firstName?: string,
  lastName?: string
): Promise<{ member: MemberstackMember | null; error: string | null }> {
  const memberstack = await getMemberstack()
  if (!memberstack) {
    return { member: null, error: 'Memberstack not initialized' }
  }

  try {
    const result = await memberstack.signupMemberEmailPassword({
      email,
      password,
      customFields: {
        'first-name': firstName || '',
        'last-name': lastName || '',
      },
    })
    const m = result.data?.member
    if (m) {
      const auth = m.auth as { email: string }
      return {
        member: {
          id: m.id as string,
          auth: { email: auth.email },
          customFields: m.customFields as Record<string, string> | undefined,
          metaData: m.metaData as Record<string, unknown> | undefined,
          planConnections: m.planConnections as MemberstackPlanConnection[] | undefined,
        },
        error: null,
      }
    }
    return { member: null, error: 'Signup failed' }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Signup failed'
    return { member: null, error: message }
  }
}

// Send password reset email
export async function sendPasswordReset(
  email: string
): Promise<{ success: boolean; error: string | null }> {
  const memberstack = await getMemberstack()
  if (!memberstack) {
    return { success: false, error: 'Memberstack not initialized' }
  }

  try {
    await memberstack.sendMemberResetPasswordEmail({ email })
    return { success: true, error: null }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to send reset email'
    return { success: false, error: message }
  }
}

// Logout from Memberstack
export async function logoutMemberstack(): Promise<void> {
  const memberstack = await getMemberstack()
  if (memberstack) {
    try {
      await memberstack.logout()
    } catch (error) {
      console.error('Memberstack logout error:', error)
    }
  }
}
