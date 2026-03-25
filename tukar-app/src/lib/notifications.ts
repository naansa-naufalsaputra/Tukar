// Notifications are currently bypassed for Expo Go compatibility
import type { Subscription } from '../types';

/** Subset of Subscription needed for notification scheduling */
type NotifiableSubscription = Pick<Subscription, 'id' | 'service_name' | 'amount'> & { billing_date?: number; name?: string };

const DAILY_REMINDER_ID = 'tukar-daily-expense-reminder';

// Configure foreground notification behaviour
// Notifications.setNotificationHandler({ ... });

// ─── Permission ───────────────────────────────────────────────
export async function requestNotificationPermission(): Promise<boolean> {
    return false;
}

// ─── Cancel all scheduled notifs for a subscription ──────────
export async function cancelSubscriptionNotifications(subscriptionId: string) {
    // bypass for Expo Go
}

// ─── Schedule H-3 & Hari-H 09:00 notifications ──────────────
export async function scheduleSubscriptionNotifications(_subscription: NotifiableSubscription) {
    // bypass for Expo Go
}

// ─── Schedule for ALL active subscriptions ──────────────────
export async function scheduleAllSubscriptionNotifications(_subscriptions: NotifiableSubscription[]) {
    // bypass for Expo Go
}

// ─── Daily Expense Reminder ───────────────────────────────────
export async function scheduleDailyExpenseReminder() {
    // bypass for Expo Go
}

export async function cancelDailyExpenseReminder() {
    // bypass for Expo Go
}
