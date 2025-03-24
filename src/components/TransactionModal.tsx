import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import type { AssetTransaction, FinancialAsset } from '../types';
import { useCurrency } from '../contexts/CurrencyContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (transaction: Omit<AssetTransaction, 'id' | 'userId' | 'createdAt'>) => void;
  onUpdate?: (transaction: AssetTransaction) => void;
  assets: FinancialAsset[];
  transaction?: AssetTransaction | null;
}

export function TransactionModal({ isOpen, onClose, onAdd, onUpdate, assets, transaction }: Props) {
  const [assetId, setAssetId] = useState(transaction?.assetId || assets[0]?.id || '');
  const [type, setType] = useState<'buy' | 'sell'>(transaction?.type || 'buy');
  const [quantity, setQuantity] = useState(transaction?.quantity?.toString() || '');
  const [price, setPrice] = useState(transaction?.price?.toString() || '');
  const [date, setDate] = useState(
    transaction?.date?.split('T')[0] || new Date().toISOString().split('T')[0]
  );
  const [fees, setFees] = useState(transaction?.fees?.toString() || '');
  const [notes, setNotes] = useState(transaction?.notes || '');

  const resetForm = () => {
    setAssetId(assets[0]?.id || '');
    setType('buy');
    setQuantity('');
    setPrice('');
    setDate(new Date().toISOString().split('T')[0]);
    setFees('');
    setNotes('');
  };

  // Reset form when transaction prop changes
  useEffect(() => {
    if (transaction) {
      setAssetId(transaction.assetId);
      setType(transaction.type);
      setQuantity(transaction.quantity.toString());
      setPrice(transaction.price.toString());
      setDate(transaction.date.split('T')[0]);
      setFees(transaction.fees?.toString() || '');
      setNotes(transaction.notes || '');
    } else {
      resetForm();
    }
  }, [transaction, assets]);

  const { displayCurrency } = useCurrency();
  const isBTC = displayCurrency === 'BTC';

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const transactionData = {
      assetId,
      type,
      quantity: parseFloat(quantity),
      price: parseFloat(price),
      date: new Date(date).toISOString(),
      fees: fees ? parseFloat(fees) : null,
      notes: notes || null
    };

    if (transaction && onUpdate) {
      onUpdate({ ...transaction, ...transactionData });
    } else {
      onAdd(transactionData);
      resetForm();
    }

    onClose();
  };

  const selectedAsset = assets.find(a => a.id === assetId);

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 flex items-start justify-center p-4 overflow-y-auto">
        <div className="neumorphic-card rounded-xl p-8 w-full max-w-md mt-8 mb-20">
          <h2 className="text-2xl font-bold mb-6 text-theme-primary">
            {transaction ? 'Edit' : 'Add'} Transaction
          </h2>
          
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2 text-theme-secondary">Asset</label>
                <select
                  value={assetId}
                  onChange={(e) => setAssetId(e.target.value)}
                  className="w-full neumorphic-input rounded-lg px-4 py-3 text-theme-primary focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                >
                  {assets.map(asset => (
                    <option key={asset.id} value={asset.id}>
                      {asset.name} ({asset.type})
                    </option>
                  ))}
                </select>
                {selectedAsset && (
                  <p className="mt-2 text-sm text-theme-secondary">
                    Current Value: {displayCurrency} {selectedAsset.value.toFixed(2)}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-theme-secondary">Type</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setType('buy')}
                    className={`neumorphic-button px-4 py-3 rounded-lg transition-colors ${
                      type === 'buy'
                        ? 'text-emerald-500'
                        : 'text-theme-secondary hover:text-theme-primary'
                    }`}
                  >
                    Buy
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('sell')}
                    className={`neumorphic-button px-4 py-3 rounded-lg transition-colors ${
                      type === 'sell'
                        ? 'text-red-500'
                        : 'text-theme-secondary hover:text-theme-primary'
                    }`}
                  >
                    Sell
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-theme-secondary">Quantity</label>
                <input
                  type="number"
                  step="0.00000001"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full neumorphic-input rounded-lg px-4 py-3 text-theme-primary focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-theme-secondary">Price</label>
                <input
                  type="number"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full neumorphic-input rounded-lg px-4 py-3 text-theme-primary focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-theme-secondary">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full neumorphic-input rounded-lg px-4 py-3 text-theme-primary focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-theme-secondary">Fees</label>
                <input
                  type="number"
                  step="0.01"
                  value={fees}
                  onChange={(e) => setFees(e.target.value)}
                  className="w-full neumorphic-input rounded-lg px-4 py-3 text-theme-primary focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Optional"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-theme-secondary">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full neumorphic-input rounded-lg px-4 py-3 text-theme-primary focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  rows={3}
                  placeholder="Optional transaction details"
                />
              </div>
            </div>

            <div className="flex justify-end gap-4 mt-8">
              <button
                type="button"
                onClick={onClose}
                className="neumorphic-button px-6 py-3 rounded-xl text-theme-secondary hover:text-theme-primary"
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`neumorphic-button px-6 py-3 rounded-xl flex items-center gap-2 ${
                  isBTC ? 'text-[#f7931a]' : 'text-emerald-400'
                } hover:opacity-80`}
              >
                <Plus size={20} />
                {transaction ? 'Update' : 'Add'} Transaction
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}