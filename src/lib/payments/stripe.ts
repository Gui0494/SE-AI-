import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('Warning: STRIPE_SECRET_KEY is not set');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
  typescript: true,
});

// Plan configurations
export const STRIPE_PLANS = {
  pro_monthly: {
    priceId: process.env.STRIPE_PRO_MONTHLY_PRICE_ID || '',
    name: 'Pro Mensal',
    price: 49.90,
    currency: 'brl',
    interval: 'month' as const,
  },
  pro_yearly: {
    priceId: process.env.STRIPE_PRO_YEARLY_PRICE_ID || '',
    name: 'Pro Anual',
    price: 479.90,
    currency: 'brl',
    interval: 'year' as const,
  },
  enterprise_monthly: {
    priceId: process.env.STRIPE_ENTERPRISE_MONTHLY_PRICE_ID || '',
    name: 'Enterprise Mensal',
    price: 199.90,
    currency: 'brl',
    interval: 'month' as const,
  },
  enterprise_yearly: {
    priceId: process.env.STRIPE_ENTERPRISE_YEARLY_PRICE_ID || '',
    name: 'Enterprise Anual',
    price: 1999.90,
    currency: 'brl',
    interval: 'year' as const,
  },
};

export type PlanKey = keyof typeof STRIPE_PLANS;

// Create or get Stripe customer for user
export async function getOrCreateStripeCustomer(
  userId: string,
  email: string,
  name?: string
): Promise<string> {
  // TODO: Check if customer already exists in database
  // For now, create a new customer
  const customer = await stripe.customers.create({
    email,
    name: name || undefined,
    metadata: {
      userId,
    },
  });

  return customer.id;
}

// Create checkout session
export async function createCheckoutSession(
  customerId: string,
  planKey: PlanKey,
  successUrl: string,
  cancelUrl: string
): Promise<string> {
  const plan = STRIPE_PLANS[planKey];

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [
      {
        price: plan.priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: successUrl,
    cancel_url: cancelUrl,
    subscription_data: {
      metadata: {
        planKey,
      },
    },
    allow_promotion_codes: true,
    billing_address_collection: 'required',
    locale: 'pt-BR',
  });

  return session.url!;
}

// Create customer portal session
export async function createPortalSession(
  customerId: string,
  returnUrl: string
): Promise<string> {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return session.url;
}

// Get subscription details
export async function getSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription | null> {
  try {
    return await stripe.subscriptions.retrieve(subscriptionId);
  } catch {
    return null;
  }
}

// Cancel subscription
export async function cancelSubscription(
  subscriptionId: string,
  cancelAtPeriodEnd: boolean = true
): Promise<Stripe.Subscription> {
  if (cancelAtPeriodEnd) {
    return stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });
  } else {
    return stripe.subscriptions.cancel(subscriptionId);
  }
}

// Resume subscription
export async function resumeSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  return stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  });
}

// Change subscription plan
export async function changeSubscriptionPlan(
  subscriptionId: string,
  newPlanKey: PlanKey
): Promise<Stripe.Subscription> {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const plan = STRIPE_PLANS[newPlanKey];

  return stripe.subscriptions.update(subscriptionId, {
    items: [
      {
        id: subscription.items.data[0].id,
        price: plan.priceId,
      },
    ],
    proration_behavior: 'create_prorations',
  });
}

// Webhook event types
export const WEBHOOK_EVENTS = {
  CHECKOUT_COMPLETED: 'checkout.session.completed',
  SUBSCRIPTION_CREATED: 'customer.subscription.created',
  SUBSCRIPTION_UPDATED: 'customer.subscription.updated',
  SUBSCRIPTION_DELETED: 'customer.subscription.deleted',
  INVOICE_PAID: 'invoice.paid',
  INVOICE_PAYMENT_FAILED: 'invoice.payment_failed',
} as const;

// Verify webhook signature
export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string
): Stripe.Event {
  return stripe.webhooks.constructEvent(
    payload,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET || ''
  );
}
