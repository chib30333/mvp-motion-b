// src/modules/payments/payment.types.ts

export type SupportedPaymentProvider = 'STRIPE' | 'YOOKASSA';

export type NormalizedPaymentResult =
    | 'SUCCEEDED'
    | 'FAILED'
    | 'CANCELLED'
    | 'REFUNDED';

export type PaymentBusinessType = 'BOOKING' | 'SUBSCRIPTION';

export type CheckoutCreationResult = {
    externalPaymentId: string;
    checkoutUrl: string;
    rawPayload: unknown;
};

export type NormalizedWebhookEvent = {
    provider: SupportedPaymentProvider;
    providerEventId: string;
    eventType: string;
    externalPaymentId: string | null;
    result: NormalizedPaymentResult;
    metadata?: {
        internalPaymentId?: string;
        bookingId?: string;
        subscriptionId?: string;
        userId?: string;
        type?: PaymentBusinessType;
    };
    failureReason?: string | null;
    rawPayload: unknown;
};

export type CreateBookingCheckoutInput = {
    bookingId: string;
    userId: string;
    provider: SupportedPaymentProvider;
};

export type CreateSubscriptionCheckoutInput = {
    userId: string;
    planCode: string;
    provider: SupportedPaymentProvider;
};

export interface PaymentProviderAdapter {
    createBookingCheckout(input: {
        booking: any;
        payment: any;
        idempotencyKey: string;
    }): Promise<CheckoutCreationResult>;

    createSubscriptionCheckout(input: {
        subscription: any;
        payment: any;
        plan: any;
        idempotencyKey: string;
    }): Promise<CheckoutCreationResult>;
}