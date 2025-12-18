// Memberstack configuration
export const MEMBERSTACK_APP_ID = process.env.NEXT_PUBLIC_MEMBERSTACK_APP_ID
export const MEMBERSTACK_LOGIN_URL = process.env.NEXT_PUBLIC_MEMBERSTACK_LOGIN_URL || 'https://listingleads.com/login'

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
