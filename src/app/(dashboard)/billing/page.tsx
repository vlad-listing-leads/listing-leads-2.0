'use client'

import { useState, useEffect } from 'react'
import { CreditCard, ExternalLink, CheckCircle, XCircle, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { getCurrentMember, openBillingPortal, MemberstackPlanConnection } from '@/lib/memberstack'

export default function BillingPage() {
  const [plans, setPlans] = useState<MemberstackPlanConnection[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isMemberstackUser, setIsMemberstackUser] = useState(false)

  useEffect(() => {
    async function fetchPlanData() {
      try {
        const member = await getCurrentMember()
        if (member) {
          setIsMemberstackUser(true)
          setPlans(member.planConnections || [])
        }
      } catch (error) {
        console.error('Failed to fetch plan data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPlanData()
  }, [])

  const handleManageBilling = async () => {
    await openBillingPortal()
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'canceled':
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-red-500" />
      default:
        return <Clock className="w-5 h-5 text-yellow-500" />
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'Active'
      case 'canceled':
      case 'cancelled':
        return 'Canceled'
      case 'trialing':
        return 'Trial'
      default:
        return status.charAt(0).toUpperCase() + status.slice(1)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'canceled':
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      case 'trialing':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      default:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
    }
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <main className="flex-1 p-8 overflow-y-auto">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">Billing & Subscription</h1>
          </div>
          <p className="text-muted-foreground">
            View your current plan and manage your subscription.
          </p>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading billing information...</p>
            </div>
          </div>
        ) : !isMemberstackUser ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">No billing information</h3>
              <p className="text-muted-foreground">
                Billing is managed through your membership account.
              </p>
            </div>
          </div>
        ) : (
          <div className="max-w-2xl">
            {/* Current Plan */}
            <div className="bg-card border border-border rounded-xl p-6 mb-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Current Plan</h2>

              {plans.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No active subscription</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {plans.map((plan, index) => (
                    <div
                      key={plan.planId || index}
                      className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        {getStatusIcon(plan.status)}
                        <div>
                          <p className="font-medium text-foreground">
                            {plan.planName || `Plan ${plan.planId}`}
                          </p>
                          {plan.payment && (
                            <p className="text-sm text-muted-foreground">
                              {plan.payment.currency?.toUpperCase()} {plan.payment.amount}
                              {plan.payment.interval && ` / ${plan.payment.interval}`}
                            </p>
                          )}
                        </div>
                      </div>
                      <span className={cn(
                        'px-3 py-1 rounded-full text-xs font-medium',
                        getStatusColor(plan.status)
                      )}>
                        {getStatusLabel(plan.status)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Manage Billing Section */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-lg font-semibold text-foreground mb-2">Manage Subscription</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Update your payment method, view invoices, or change your plan.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button onClick={handleManageBilling} className="gap-2">
                  <ExternalLink className="w-4 h-4" />
                  Manage Billing
                </Button>
                <Button onClick={handleManageBilling} variant="outline" className="gap-2">
                  Upgrade Plan
                </Button>
                <Button onClick={handleManageBilling} variant="outline" className="gap-2 text-destructive hover:text-destructive">
                  Cancel Subscription
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
