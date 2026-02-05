// PIX Payment Integration via Mercado Pago
// Documentation: https://www.mercadopago.com.br/developers/pt/docs

interface MercadoPagoConfig {
  accessToken: string;
  publicKey?: string;
}

interface PixPaymentRequest {
  amount: number;
  description: string;
  email: string;
  firstName: string;
  lastName: string;
  cpf: string;
  externalReference?: string;
}

interface PixPayment {
  id: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  qrCode: string;
  qrCodeBase64: string;
  ticketUrl: string;
  expiresAt: Date;
  amount: number;
}

interface PaymentStatus {
  id: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'refunded';
  statusDetail: string;
  paidAt?: Date;
}

const MERCADO_PAGO_API = 'https://api.mercadopago.com';

export class PixService {
  private accessToken: string;

  constructor(config: MercadoPagoConfig) {
    this.accessToken = config.accessToken;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(`${MERCADO_PAGO_API}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.accessToken}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `Mercado Pago API error: ${response.status}`);
    }

    return response.json();
  }

  async createPixPayment(params: PixPaymentRequest): Promise<PixPayment> {
    const payment = await this.request<any>('/v1/payments', {
      method: 'POST',
      body: JSON.stringify({
        transaction_amount: params.amount,
        description: params.description,
        payment_method_id: 'pix',
        payer: {
          email: params.email,
          first_name: params.firstName,
          last_name: params.lastName,
          identification: {
            type: 'CPF',
            number: params.cpf.replace(/\D/g, ''),
          },
        },
        external_reference: params.externalReference,
        notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/mercadopago`,
      }),
    });

    const transactionData = payment.point_of_interaction?.transaction_data;

    return {
      id: String(payment.id),
      status: this.mapStatus(payment.status),
      qrCode: transactionData?.qr_code || '',
      qrCodeBase64: transactionData?.qr_code_base64 || '',
      ticketUrl: transactionData?.ticket_url || '',
      expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
      amount: payment.transaction_amount,
    };
  }

  async getPaymentStatus(paymentId: string): Promise<PaymentStatus> {
    const payment = await this.request<any>(`/v1/payments/${paymentId}`);

    return {
      id: String(payment.id),
      status: this.mapStatus(payment.status),
      statusDetail: payment.status_detail,
      paidAt: payment.date_approved ? new Date(payment.date_approved) : undefined,
    };
  }

  async refundPayment(paymentId: string, amount?: number): Promise<void> {
    await this.request(`/v1/payments/${paymentId}/refunds`, {
      method: 'POST',
      body: JSON.stringify(amount ? { amount } : {}),
    });
  }

  private mapStatus(
    mpStatus: string
  ): 'pending' | 'approved' | 'rejected' | 'cancelled' | 'refunded' {
    const statusMap: Record<string, PaymentStatus['status']> = {
      pending: 'pending',
      approved: 'approved',
      authorized: 'approved',
      in_process: 'pending',
      in_mediation: 'pending',
      rejected: 'rejected',
      cancelled: 'cancelled',
      refunded: 'refunded',
      charged_back: 'refunded',
    };

    return statusMap[mpStatus] || 'pending';
  }

  // Verify webhook signature
  static verifyWebhookSignature(
    xSignature: string,
    xRequestId: string,
    dataId: string,
    secret: string
  ): boolean {
    // Extract ts and v1 from x-signature header
    const parts = xSignature.split(',');
    const tsMatch = parts.find((p) => p.trim().startsWith('ts='));
    const hashMatch = parts.find((p) => p.trim().startsWith('v1='));

    if (!tsMatch || !hashMatch) {
      return false;
    }

    const ts = tsMatch.split('=')[1];
    const hash = hashMatch.split('=')[1];

    // Build manifest string
    const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;

    // Calculate HMAC
    const crypto = require('crypto');
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(manifest);
    const calculatedHash = hmac.digest('hex');

    return calculatedHash === hash;
  }
}

// Singleton instance
let pixService: PixService | null = null;

export function getPixService(): PixService {
  if (!pixService) {
    if (!process.env.MERCADO_PAGO_ACCESS_TOKEN) {
      throw new Error('MERCADO_PAGO_ACCESS_TOKEN is not configured');
    }
    pixService = new PixService({
      accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN,
    });
  }
  return pixService;
}

// Helper to format CPF
export function formatCPF(cpf: string): string {
  const numbers = cpf.replace(/\D/g, '');
  return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

// Validate CPF
export function validateCPF(cpf: string): boolean {
  const numbers = cpf.replace(/\D/g, '');

  if (numbers.length !== 11) return false;
  if (/^(\d)\1+$/.test(numbers)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(numbers[i]) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(numbers[9])) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(numbers[i]) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(numbers[10])) return false;

  return true;
}
