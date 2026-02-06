import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import Stripe from 'stripe';

let _stripe: Stripe | null = null;
function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');
  }
  return _stripe;
}

function getPlanFromPriceId(priceId: string): string {
  const map: Record<string, string> = {
    [process.env.STRIPE_PRO_PRICE_ID || '']: 'PRO',
    [process.env.STRIPE_ENTERPRISE_PRICE_ID || '']: 'ENTERPRISE',
  };
  return map[priceId] || 'PRO';
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return Response.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    );
  } catch (err) {
    console.error('[Stripe webhook] Signature verification failed:', err instanceof Error ? err.message : err);
    return Response.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;

        if (subscriptionId) {
          const sub = await getStripe().subscriptions.retrieve(subscriptionId);
          const priceId = sub.items.data[0]?.price.id;
          const plan = getPlanFromPriceId(priceId);

          // Find user by stripeCustomerId or by metadata
          const userId = session.metadata?.userId;
          if (!userId) break;

          await db.subscription.upsert({
            where: { userId },
            create: {
              userId,
              plan: plan as 'FREE' | 'PRO' | 'ENTERPRISE',
              status: 'ACTIVE',
              stripeCustomerId: customerId,
              stripeSubscriptionId: subscriptionId,
              currentPeriodStart: new Date((sub as any).current_period_start * 1000),
              currentPeriodEnd: new Date((sub as any).current_period_end * 1000),
            },
            update: {
              plan: plan as 'FREE' | 'PRO' | 'ENTERPRISE',
              status: 'ACTIVE',
              stripeCustomerId: customerId,
              stripeSubscriptionId: subscriptionId,
              currentPeriodStart: new Date((sub as any).current_period_start * 1000),
              currentPeriodEnd: new Date((sub as any).current_period_end * 1000),
            },
          });
        }
        break;
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const priceId = sub.items.data[0]?.price.id;
        const plan = getPlanFromPriceId(priceId);

        const existing = await db.subscription.findFirst({
          where: { stripeSubscriptionId: sub.id },
        });
        if (existing) {
          await db.subscription.update({
            where: { id: existing.id },
            data: {
              plan: plan as 'FREE' | 'PRO' | 'ENTERPRISE',
              status: sub.status === 'active' ? 'ACTIVE' : sub.status === 'past_due' ? 'PAST_DUE' : 'CANCELED',
              currentPeriodStart: new Date((sub as any).current_period_start * 1000),
              currentPeriodEnd: new Date((sub as any).current_period_end * 1000),
            },
          });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const existing = await db.subscription.findFirst({
          where: { stripeSubscriptionId: sub.id },
        });
        if (existing) {
          await db.subscription.update({
            where: { id: existing.id },
            data: {
              plan: 'FREE',
              status: 'CANCELED',
            },
          });
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as any;
        const subId = invoice.subscription as string;
        if (subId) {
          const existing = await db.subscription.findFirst({
            where: { stripeSubscriptionId: subId },
          });
          if (existing) {
            await db.subscription.update({
              where: { id: existing.id },
              data: {
                status: 'ACTIVE',
                messagesUsed: 0,
              },
            });
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as any;
        const subId = invoice.subscription as string;
        if (subId) {
          const existing = await db.subscription.findFirst({
            where: { stripeSubscriptionId: subId },
          });
          if (existing) {
            await db.subscription.update({
              where: { id: existing.id },
              data: { status: 'PAST_DUE' },
            });
          }
        }
        break;
      }
    }
  } catch (error) {
    console.error('[Stripe webhook] Processing error:', error instanceof Error ? error.message : error);
    // Return 200 anyway to prevent Stripe retries for processing errors
  }

  return Response.json({ received: true });
}
