import React from 'react';
import { ActionButtons } from '../ActionButtons';
import { useCurrency } from '../../contexts/CurrencyContext';
import { format, parseISO } from 'date-fns';
import { Plus } from 'lucide-react';
import type { FinancialAsset } from '../../types';

interface Props {
  assets: FinancialAsset[];
  onAdd: () => void;
  onEdit: (asset: FinancialAsset) => void;
  onDelete: (id: string) => void;
}

export function AssetList({ assets, onAdd, onEdit, onDelete }: Props) {
  const { displayCurrency, convertAmount, formatAmount } = useCurrency();
  const isBTC = displayCurrency === 'BTC';

  return (
    <div className="themed-card rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-theme-primary">Assets</h2>
        <button
          onClick={onAdd}
          className={`themed-button px-4 py-2 rounded-lg ${
            isBTC ? 'text-[#f7931a]' : 'text-emerald-400'
          } hover:opacity-80 flex items-center gap-2`}
        >
          <Plus size={20} />
          Add Asset
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left py-3 text-theme-secondary">Name</th>
              <th className="text-left py-3 text-theme-secondary">Type</th>
              <th className="text-right py-3 text-theme-secondary">Value</th>
              <th className="text-right py-3 text-theme-secondary">Purchase Price</th>
              <th className="text-right py-3 text-theme-secondary">Current Price</th>
              <th className="text-right py-3 text-theme-secondary">Change</th>
              <th className="w-20"></th>
            </tr>
          </thead>
          <tbody>
            {assets.map(asset => {
              const priceChange = asset.currentPrice && asset.purchasePrice
                ? ((asset.currentPrice - asset.purchasePrice) / asset.purchasePrice) * 100
                : 0;

              return (
                <tr 
                  key={asset.id} 
                  className="border-b border-gray-700/50 group hover:bg-gray-800/10 transition-colors"
                >
                  <td className="py-3 text-theme-primary">{asset.name}</td>
                  <td className="py-3 text-theme-secondary capitalize">
                    {asset.type.replace('_', ' ')}
                  </td>
                  <td className="py-3 text-right text-theme-primary">
                    {formatAmount(convertAmount(asset.value, 'EUR', displayCurrency), displayCurrency)}
                  </td>
                  <td className="py-3 text-right text-theme-secondary">
                    {asset.purchasePrice
                      ? formatAmount(convertAmount(asset.purchasePrice, 'EUR', displayCurrency), displayCurrency)
                      : '-'}
                  </td>
                  <td className="py-3 text-right text-theme-secondary">
                    {asset.currentPrice
                      ? formatAmount(convertAmount(asset.currentPrice, 'EUR', displayCurrency), displayCurrency)
                      : '-'}
                  </td>
                  <td className="py-3 text-right">
                    <div className="flex justify-end items-center">
                      <span className={priceChange > 0 ? 'text-emerald-400' : 'text-red-400'}>
                        {priceChange !== 0 ? `${priceChange > 0 ? '+' : ''}${priceChange.toFixed(2)}%` : '-'}
                      </span>
                      <ActionButtons
                        onEdit={() => onEdit(asset)}
                        onDelete={() => onDelete(asset.id)}
                        className="ml-4"
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}