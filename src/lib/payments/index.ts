// Payment Module Exports
export * from './stripe';
export * from './pix';

import { STRIPE_PLANS, type PlanKey } from './stripe';

// Unified plan configuration
export interface Plan {
  id: string;
  name: string;
  description: string;
  price: {
    brl: { monthly: number; yearly: number };
    usd: { monthly: number; yearly: number };
  };
  features: PlanFeatures;
  badge?: string;
  highlighted?: boolean;
}

export interface PlanFeatures {
  messagesPerDay: number;
  tokensPerMonth: number;
  storageGB: number;
  maxFileUploadMB: number;
  models: string[] | 'all';
  webSearch: boolean;
  imageGeneration: boolean;
  imageGenerationsPerMonth: number;
  codeExecution: boolean;
  voiceMode: boolean;
  customStyles: number;
  projects: number;
  exportFormats: string[];
  support: 'community' | 'email' | 'priority';
  apiAccess: boolean;
  apiRequestsPerMonth: number;
  // Enterprise only
  teamMembers?: number;
  sso?: boolean;
  auditLogs?: boolean;
  customBranding?: boolean;
  dedicatedSupport?: boolean;
  sla?: string;
}

export const PLANS: Record<string, Plan> = {
  free: {
    id: 'free',
    name: 'Free',
    description: 'Para comecar a explorar',
    price: {
      brl: { monthly: 0, yearly: 0 },
      usd: { monthly: 0, yearly: 0 },
    },
    features: {
      messagesPerDay: 50,
      tokensPerMonth: 100_000,
      storageGB: 1,
      maxFileUploadMB: 10,
      models: ['gpt-3.5-turbo', 'claude-3-haiku-20240307', 'gemini-1.5-flash'],
      webSearch: false,
      imageGeneration: false,
      imageGenerationsPerMonth: 0,
      codeExecution: false,
      voiceMode: false,
      customStyles: 1,
      projects: 3,
      exportFormats: ['md', 'txt'],
      support: 'community',
      apiAccess: false,
      apiRequestsPerMonth: 0,
    },
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    description: 'Para profissionais e criadores',
    price: {
      brl: { monthly: 49.90, yearly: 479.90 },
      usd: { monthly: 9.90, yearly: 99.90 },
    },
    features: {
      messagesPerDay: 500,
      tokensPerMonth: 2_000_000,
      storageGB: 10,
      maxFileUploadMB: 50,
      models: ['gpt-4o', 'gpt-4-turbo', 'claude-3-5-sonnet-20241022', 'claude-3-opus-20240229', 'gemini-1.5-pro'],
      webSearch: true,
      imageGeneration: true,
      imageGenerationsPerMonth: 100,
      codeExecution: true,
      voiceMode: true,
      customStyles: 10,
      projects: 20,
      exportFormats: ['md', 'txt', 'pdf', 'docx'],
      support: 'email',
      apiAccess: true,
      apiRequestsPerMonth: 10_000,
    },
    badge: 'Popular',
    highlighted: true,
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Para times e empresas',
    price: {
      brl: { monthly: 199.90, yearly: 1999.90 },
      usd: { monthly: 39.90, yearly: 399.90 },
    },
    features: {
      messagesPerDay: -1, // unlimited
      tokensPerMonth: 10_000_000,
      storageGB: 100,
      maxFileUploadMB: 200,
      models: 'all',
      webSearch: true,
      imageGeneration: true,
      imageGenerationsPerMonth: -1,
      codeExecution: true,
      voiceMode: true,
      customStyles: -1,
      projects: -1,
      exportFormats: ['md', 'txt', 'pdf', 'docx', 'pptx', 'html'],
      support: 'priority',
      apiAccess: true,
      apiRequestsPerMonth: 100_000,
      teamMembers: 50,
      sso: true,
      auditLogs: true,
      customBranding: true,
      dedicatedSupport: true,
      sla: '99.9%',
    },
    badge: 'Enterprise',
  },
};

export function getPlanById(planId: string): Plan | undefined {
  return PLANS[planId.toLowerCase()];
}

export function canAccessModel(userPlan: string, modelId: string): boolean {
  const plan = getPlanById(userPlan);
  if (!plan) return false;

  if (plan.features.models === 'all') return true;
  return plan.features.models.includes(modelId);
}

export function canAccessFeature(userPlan: string, feature: keyof PlanFeatures): boolean {
  const plan = getPlanById(userPlan);
  if (!plan) return false;

  const value = plan.features[feature];
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (Array.isArray(value)) return value.length > 0;
  return value === 'all';
}

export function getUsageLimit(userPlan: string, limitType: keyof PlanFeatures): number {
  const plan = getPlanById(userPlan);
  if (!plan) return 0;

  const value = plan.features[limitType];
  if (typeof value === 'number') return value;
  return 0;
}

export function formatPrice(price: number, currency: 'brl' | 'usd'): string {
  const locale = currency === 'brl' ? 'pt-BR' : 'en-US';
  const currencyCode = currency.toUpperCase();

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode,
  }).format(price);
}
