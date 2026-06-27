import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import type { FinancialAsset } from '../types';
import { useCurrency } from '../contexts/CurrencyContext';
import { fetchBitcoinPrices } from '../lib/marketData';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (asset: Omit<FinancialAsset, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => void;
  onUpdate?: (asset: FinancialAsset) => void;
  asset?: FinancialAsset | null;
}

const ASSET_TYPES: string[] = ['stock', 'crypto', 'savings', 'real_estate', 'other'];

export function AssetManagementModal({ isOpen, onClose, onAdd, onUpdate, asset }: Props) {
  // Initialize state with asset data if editing
  const [name, setName] = useState(asset?.name || '');
  const [type, setType] = useState<string>(asset?.type || 'stock');
  const [quantity, setQuantity] = useState(asset?.quantity?.toString() || '');
  const [purchasePrice, setPurchasePrice] = useState(asset?.purchasePrice?.toString() || '');
  const [purchaseDate, setPurchaseDate] = useState(
    asset?.purchaseDate?.split('T')[0] || new Date().toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState<string | undefined>(asset?.notes);

  // Reset form when asset prop changes
  useEffect(() => {
    if (asset) {
      setName(asset.name);
      setType(asset.type);
      setQuantity(asset.quantity?.toString() || '');
      setPurchasePrice(asset.purchasePrice?.toString() || '');
      setPurchaseDate(asset.purchaseDate?.split('T')[0] || '');
      setNotes(asset.notes);
    } else {
      // Reset form for new asset
      setName('');
      setType('stock');
      setQuantity('');
      setPurchasePrice('');
      setPurchaseDate(new Date().toISOString().split('T')[0]);
      setNotes(undefined);
    }
  }, [asset]);

  const { displayCurrency } = useCurrency();
  const isBTC = displayCurrency === 'BTC';

  // Fetch current BTC price if asset type is crypto and name contains "bitcoin"
  useEffect(() => {
    const fetchBTCPrice = async () => {
      if (type === 'crypto' && name.toLowerCase().includes('bitcoin')) {
        try {
          const data = await fetchBitcoinPrices(['eur']);
          const currentPrice = data.eur;
          
          // If we're adding a new asset, set the purchase price to current price
          if (!asset && !purchasePrice) {
            setPurchasePrice(currentPrice.toString());
          }
        } catch (error) {
          console.error('Error fetching BTC price:', error);
        }
      }
    };

    fetchBTCPrice();
  }, [type, name, asset, purchasePrice]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Calculate total value from quantity and purchase price
    const qty = parseFloat(quantity) || 0;
    const price = parseFloat(purchasePrice) || 0;
    const value = qty * price;

    // Transform data to match database schema
    const assetData = {
      name,
      type,
      value,
      quantity: qty,
      purchasePrice: price,
      purchaseDate: new Date(purchaseDate).toISOString(),
      currentPrice: price, // Initially set to purchase price, will be updated via API
      notes: notes || undefined // Ensure notes is string or undefined
    };

    if (asset && onUpdate) {
      // When updating, maintain existing timestamps
      onUpdate({
        ...asset,
        ...assetData
      });
    } else {
      // When adding, let the database handle timestamps
      onAdd(assetData);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 flex items-start justify-center p-4 overflow-y-auto">
        <div className="themed-card rounded-xl p-8 w-full max-w-md mt-8 mb-20">
          <h2 className="text-2xl font-bold mb-6 text-theme-primary">
            {asset ? 'Edit Asset' : 'Add New Asset'}
          </h2>
          
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2 text-theme-secondary">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full themed-input rounded-lg px-4 py-3 text-theme-primary focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-theme-secondary">Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full themed-input rounded-lg px-4 py-3 text-theme-primary focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {ASSET_TYPES.map(type => (
                    <option key={type} value={type}>
                      {type.split('_').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-theme-secondary">Quantity</label>
                <input
                  type="number"
                  step="0.00000001"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full themed-input rounded-lg px-4 py-3 text-theme-primary focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-theme-secondary">Purchase Price</label>
                <input
                  type="number"
                  step="0.01"
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(e.target.value)}
                  className="w-full themed-input rounded-lg px-4 py-3 text-theme-primary focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-theme-secondary">Purchase Date</label>
                <input
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  className="w-full themed-input rounded-lg px-4 py-3 text-theme-primary focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-theme-secondary">Notes</label>
                <textarea
                  value={notes || ''}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full themed-input rounded-lg px-4 py-3 text-theme-primary focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  rows={3}
                  placeholder="Optional notes about this asset"
                />
              </div>
            </div>

            <div className="flex justify-end gap-4 mt-8">
              <button
                type="button"
                onClick={onClose}
                className="themed-button px-6 py-3 rounded-xl text-theme-secondary hover:text-theme-primary"
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`themed-button px-6 py-3 rounded-xl flex items-center gap-2 ${
                  isBTC ? 'text-[#f7931a]' : 'text-emerald-400'
                } hover:opacity-80`}
              >
                <Plus size={20} />
                {asset ? 'Update' : 'Add'} Asset
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
