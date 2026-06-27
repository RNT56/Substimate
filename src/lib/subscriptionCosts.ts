import type { Currency, Subscription } from '../types';

export const SUPPORTED_CURRENCIES: readonly Currency[] = ['EUR', 'USD', 'BTC'];

type ConvertAmount = (amount: number, fromCurrency: Currency, toCurrency: Currency) => number;

export function normalizeCurrency(currency?: string | null): Currency {
  return SUPPORTED_CURRENCIES.includes(currency as Currency) ? (currency as Currency) : 'EUR';
}

export function getSubscriptionMonthlyAmount(subscription: Pick<Subscription, 'monthlyCost' | 'amount'>): number {
  const amount = subscription.monthlyCost ?? subscription.amount ?? 0;
  return Number.isFinite(amount) ? amount : 0;
}

export function getSubscriptionPaymentAmount(
  subscription: Pick<Subscription, 'monthlyCost' | 'amount' | 'billingPeriod'>
): number {
  const monthlyAmount = getSubscriptionMonthlyAmount(subscription);
  return subscription.billingPeriod === 'yearly' ? monthlyAmount * 12 : monthlyAmount;
}

export function convertSubscriptionMonthlyAmount(
  subscription: Pick<Subscription, 'monthlyCost' | 'amount' | 'currency'>,
  toCurrency: Currency,
  convertAmount: ConvertAmount
): number {
  return convertAmount(
    getSubscriptionMonthlyAmount(subscription),
    normalizeCurrency(subscription.currency),
    toCurrency
  );
}

export function convertSubscriptionPaymentAmount(
  subscription: Pick<Subscription, 'monthlyCost' | 'amount' | 'billingPeriod' | 'currency'>,
  toCurrency: Currency,
  convertAmount: ConvertAmount
): number {
  return convertAmount(
    getSubscriptionPaymentAmount(subscription),
    normalizeCurrency(subscription.currency),
    toCurrency
  );
}
