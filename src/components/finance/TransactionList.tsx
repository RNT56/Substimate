import React from 'react';
import { ActionButtons } from '../ActionButtons';
import { useCurrency } from '../../contexts/CurrencyContext';
import { format, parseISO } from 'date-fns';
import { Plus } from 'lucide-react';
import type { AssetTransaction, FinancialAsset } from '../../types';

interface Props {
  transactions: AssetTransaction[];
  assets: FinancialAsset[];
  onAdd: () => void;
  onEdit: (transaction: AssetTransaction) => void;
  onDelete: (id: string) => void;
}

export function TransactionList({ transactions, assets, onAdd, onEdit, onDelete }: Props) {
  const { displayCurrency, convertAmount, formatAmount } = useCurrency();
  const isBTC = displayCurrency === 'BTC';

  if (transactions.length === 0) {
    return (
      <div className="neumorphic-card rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-theme-primary">Transactions</h2>
          <button
            onClick={onAdd}
            className={`neumorphic-button px-4 py-2 rounded-lg ${
              isBTC ? 'text-[#f7931a]' : 'text-emerald-400'
            } hover:opacity-80 flex items-center gap-2`}
          >
            <Plus size={20} />
            Add Transaction
          </button>
        </div>
        <p className="text-center text-theme-secondary">No transactions made yet</p>
      </div>
    );
  }

  return (
    <div className="neumorphic-card rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-theme-primary">Transactions</h2>
        <button
          onClick={onAdd}
          className={`neumorphic-button px-4 py-2 rounded-lg ${
            isBTC ? 'text-[#f7931a]' : 'text-emerald-400'
          } hover:opacity-80 flex items-center gap-2`}
        >
          <Plus size={20} />
          Add Transaction
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left py-3 text-theme-secondary">Asset</th>
              <th className="text-left py-3 text-theme-secondary">Type</th>
              <th className="text-right py-3 text-theme-secondary">Quantity</th>
              <th className="text-right py-3 text-theme-secondary">Price</th>
              <th className="text-right py-3 text-theme-secondary">Total</th>
              <th className="text-right py-3 text-theme-secondary">Date</th>
              <th className="text-right py-3 text-theme-secondary">Fees</th>
              <th className="w-20"></th>
            </tr>
          </thead>
          <tbody>
            {transactions.map(transaction => {
              const asset = assets.find(a => a.id === transaction.assetId);
              const total = transaction.quantity * transaction.price;
              const convertedPrice = convertAmount(transaction.price, 'EUR', displayCurrency);
              const convertedTotal = convertAmount(total, 'EUR', displayCurrency);
              const convertedFees = transaction.fees 
                ? convertAmount(transaction.fees, 'EUR', displayCurrency)
                : null;

              return (
                <tr 
                  key={transaction.id} 
                  className="border-b border-gray-700/50 group hover:bg-gray-800/10 transition-colors"
                >
                  <td className="py-3 text-theme-primary">
                    {asset?.name || 'Unknown Asset'}
                  </td>
                  <td className="py-3">
                    <span className={`px-2 py-1 rounded-full text-sm ${
                      transaction.type === 'buy' 
                        ? 'bg-emerald-500/10 text-emerald-500' 
                        : 'bg-red-500/10 text-red-500'
                    }`}>
                      {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                    </span>
                  </td>
                  <td className="py-3 text-right text-theme-primary">
                    {transaction.quantity.toFixed(8)}
                  </td>
                  <td className="py-3 text-right text-theme-secondary">
                    {formatAmount(convertedPrice, displayCurrency)}
                  </td>
                  <td className="py-3 text-right text-theme-primary">
                    {formatAmount(convertedTotal, displayCurrency)}
                  </td>
                  <td className="py-3 text-right text-theme-secondary">
                    {format(parseISO(transaction.date), 'MMM d, yyyy')}
                  </td>
                  <td className="py-3 text-right text-theme-secondary">
                    {convertedFees ? formatAmount(convertedFees, displayCurrency) : '-'}
                  </td>
                  <td className="py-3">
                    <ActionButtons
                      onEdit={() => onEdit(transaction)}
                      onDelete={() => onDelete(transaction.id)}
                    />
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