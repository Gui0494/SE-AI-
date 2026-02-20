import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { formatErrorResponse, AuthenticationError } from '@/lib/errors';
import { checkoutSchema } from '@/lib/validations';
import Stripe from 'stripe';

let _stripe: Stripe | null = null;
function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');
  }
  return _stripe;
}

function getPriceId(plan: string): string {
  const ids: Record<string, string> = {
    PRO: process.env.STRIPE_PRO_PRICE_ID || '',
    ENTERPRISE: process.env.STRIPE_ENTERPRISE_PRICE_ID || '',
  };
  return ids[plan] || '';
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || !session.user.email) throw new AuthenticationError();

    const body = await request.json();
    const parsed = checkoutSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: 'Invalid input', code: 'VALIDATION_ERROR' }, { status: 400 });
    }

    const priceId = getPriceId(parsed.data.plan);
    if (!priceId) {
      return Response.json({ error: 'Plan not configured', code: 'CONFIG_ERROR' }, { status: 500 });
    }

    // Get or create Stripe customer
    const subscription = await db.subscription.findUnique({
      where: { userId: session.user.id },
    });

    let customerId = subscription?.stripeCustomerId;
    if (!customerId) {
      const customer = await getStripe().customers.create({
        email: session.user.email,
        metadata: { userId: session.user.id },
      });
      customerId = customer.id;
    }

    // Create checkout session
    const checkoutSession = await getStripe().checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/settings?success=true`,
      cancel_url: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/settings?canceled=true`,
      metadata: { userId: session.user.id },
    });

    return Response.json({ url: checkoutSession.url });
  } catch (error) {
    const formatted = formatErrorResponse(error);
    return Response.json(
      { error: formatted.error, code: formatted.code },
      { status: formatted.statusCode }
    );
  }
}
