import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, parseISO } from 'date-fns';
import { useTheme } from '../../contexts/ThemeContext';
import { useCurrency } from '../../contexts/CurrencyContext';

interface Props {
  data: {
    name: string;
    totalSpent: number;
    monthlyCost: number;
    months: number;
    startDate: string;
    billingPeriod: string;
    usageState: string;
  }[];
  loading: boolean;
  isMobile: boolean;
}

export function LifetimeCosts({ data, loading, isMobile }: Props) {
  const { theme } = useTheme();
  const { displayCurrency, formatAmount } = useCurrency();
  const isDark = theme === 'dark';
  const isBTC = displayCurrency === 'BTC';

  if (loading) {
    return (
      <div className="h-[400px] flex items-center justify-center">
        <p className="text-theme-secondary">Loading lifetime costs...</p>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left py-2 text-theme-secondary">Service</th>
              <th className="text-right py-2 text-theme-secondary">Total Spent</th>
              <th className="text-right py-2 text-theme-secondary">Monthly</th>
            </tr>
          </thead>
          <tbody>
            {data.map((cost) => (
              <tr key={cost.name} className="border-b border-gray-700/50">
                <td className="py-2 text-theme-primary">{cost.name}</td>
                <td className="text-right py-2 text-emerald-400">
                  {formatAmount(cost.totalSpent, displayCurrency)}
                </td>
                <td className="text-right py-2 text-emerald-400">
                  {formatAmount(cost.monthlyCost, displayCurrency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart 
        data={data}
        margin={{ top: 10, right: 30, left: 10, bottom: 60 }}
      >
        <defs>
          <filter id="hover-shadow" height="130%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="blur" />
            <feOffset in="blur" dx="0" dy="1" result="offsetBlur" />
            <feMerge>
              <feMergeNode in="offsetBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e2e8f0'} />
        <XAxis 
          dataKey="name" 
          stroke={isDark ? '#9CA3AF' : '#475569'}
          tick={{ fill: isDark ? '#9CA3AF' : '#475569' }}
          angle={-45}
          textAnchor="end"
          height={60}
          interval={0}
        />
        <YAxis 
          stroke={isDark ? '#9CA3AF' : '#475569'}
          tick={{ fill: isDark ? '#9CA3AF' : '#475569' }}
          tickFormatter={(value) => formatAmount(value, displayCurrency)}
          width={80}
        />
        <Tooltip
          content={({ active, payload, label }) => {
            if (!active || !payload?.[0]) return null;
            const data = payload[0].payload;
            const startDateFormatted = format(parseISO(data.startDate), 'MMM d, yyyy');
            const usageStateColors = {
              active: 'text-emerald-500',
              'not much': 'text-amber-500',
              unused: 'text-red-500'
            };

            return (
              <div className="p-4 rounded-lg shadow-lg backdrop-blur-md bg-gray-900/95 border border-gray-700">
                <p className="font-medium text-base mb-2">{label}</p>
                <div className="space-y-2">
                  <div className="flex justify-between gap-4">
                    <span className="text-theme-secondary">Start Date:</span>
                    <span className="text-theme-primary">{startDateFormatted}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-theme-secondary">Months Active:</span>
                    <span className="text-theme-primary">{data.months}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-theme-secondary">Monthly Cost:</span>
                    <span className="text-emerald-500">
                      {formatAmount(data.monthlyCost, displayCurrency)}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-theme-secondary">Total Spent:</span>
                    <span className="text-emerald-500">
                      {formatAmount(data.totalSpent, displayCurrency)}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-theme-secondary">Usage State:</span>
                    <span className={usageStateColors[data.usageState as keyof typeof usageStateColors]}>
                      {data.usageState.charAt(0).toUpperCase() + data.usageState.slice(1)}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-theme-secondary">Billing Period:</span>
                    <span className="text-theme-primary">
                      {data.billingPeriod.charAt(0).toUpperCase() + data.billingPeriod.slice(1)}
                    </span>
                  </div>
                </div>
              </div>
            );
          }}
          cursor={{ 
            fill: isDark ? 'rgba(55, 65, 81, 0.8)' : 'rgba(255, 255, 255, 0.8)',
            filter: 'url(#hover-shadow)'
          }}
        />
        <Bar 
          dataKey="totalSpent" 
          name="Total Spent" 
          fill={isBTC ? '#f7931a' : '#10B981'}
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}