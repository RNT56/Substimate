type BitcoinCurrency = 'eur' | 'usd';

interface CoinGeckoSimplePriceResponse {
  bitcoin?: Partial<Record<BitcoinCurrency, number>>;
}

interface FrankfurterResponse {
  rates?: {
    USD?: number;
  };
}

export async function fetchBitcoinPrices(
  vsCurrencies: BitcoinCurrency[]
): Promise<Record<BitcoinCurrency, number>> {
  const params = new URLSearchParams({
    ids: 'bitcoin',
    vs_currencies: vsCurrencies.join(',')
  });

  const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?${params}`);
  if (!response.ok) {
    throw new Error('Failed to fetch Bitcoin price data');
  }

  const data = (await response.json()) as CoinGeckoSimplePriceResponse;
  const prices = data.bitcoin;
  if (!prices) {
    throw new Error('Bitcoin price data was missing from the response');
  }

  return vsCurrencies.reduce((result, currency) => {
    const price = prices[currency];
    if (typeof price !== 'number' || !Number.isFinite(price) || price <= 0) {
      throw new Error(`Bitcoin ${currency.toUpperCase()} price was missing from the response`);
    }

    return {
      ...result,
      [currency]: price
    };
  }, {} as Record<BitcoinCurrency, number>);
}

export async function fetchEurUsdRate(): Promise<number> {
  const response = await fetch('https://api.frankfurter.app/latest?from=EUR&to=USD');
  if (!response.ok) {
    throw new Error('Failed to fetch EUR/USD exchange rate');
  }

  const data = (await response.json()) as FrankfurterResponse;
  const eurUsdRate = data.rates?.USD;
  if (typeof eurUsdRate !== 'number' || !Number.isFinite(eurUsdRate) || eurUsdRate <= 0) {
    throw new Error('EUR/USD exchange rate was missing from the response');
  }

  return eurUsdRate;
}
