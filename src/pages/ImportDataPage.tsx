import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, FileText, Upload } from 'lucide-react';
import { useCurrency } from '../contexts/CurrencyContext';
import { useSubscriptions } from '../contexts/SubscriptionContext';
import { useToast } from '../contexts/ToastContext';
import type { BillingPeriod, Currency, PaymentMethod, Subscription } from '../types';
import { SUPPORTED_CURRENCIES } from '../lib/subscriptionCosts';

type ImportStatus = 'idle' | 'ready' | 'importing' | 'complete' | 'error';

interface ImportRow {
  rowNumber: number;
  subscription: Omit<Subscription, 'id'>;
  errors: string[];
}

const PAYMENT_METHODS: PaymentMethod[] = [
  'credit_card',
  'debit_card',
  'paypal',
  'bank_transfer',
  'apple_pay',
  'google_pay',
  'crypto'
];

const SAMPLE_CSV = [
  'name,amount,billing_period,currency,payment_method,category,start_date,url',
  'Netflix,15.49,monthly,EUR,credit_card,Streaming,2026-01-01,https://netflix.com',
  'GitHub,100,yearly,USD,paypal,Coding,2026-02-15,https://github.com'
].join('\n');

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let current = '';
  let row: string[] = [];
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const nextChar = text[index + 1];

    if (char === '"' && inQuotes && nextChar === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      row.push(current.trim());
      current = '';
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') index += 1;
      row.push(current.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      current = '';
    } else {
      current += char;
    }
  }

  row.push(current.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase().replace(/[\s-]+/g, '_');
}

function getField(row: Record<string, string>, names: string[]): string {
  for (const name of names) {
    const value = row[name];
    if (value) return value.trim();
  }
  return '';
}

function normalizeDate(value: string): string {
  if (!value) return new Date().toISOString().split('T')[0];
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? new Date().toISOString().split('T')[0]
    : parsed.toISOString().split('T')[0];
}

function parseImportRows(text: string): ImportRow[] {
  const rows = parseCsv(text);
  if (rows.length < 2) return [];

  const headers = rows[0].map(normalizeHeader);

  return rows.slice(1).map((values, rowIndex) => {
    const raw = headers.reduce<Record<string, string>>((acc, header, columnIndex) => {
      acc[header] = values[columnIndex] ?? '';
      return acc;
    }, {});

    const errors: string[] = [];
    const name = getField(raw, ['name', 'service', 'subscription']);
    const billingPeriod = (getField(raw, ['billing_period', 'billing', 'period']) || 'monthly') as BillingPeriod;
    const currency = (getField(raw, ['currency']) || 'EUR').toUpperCase() as Currency;
    const paymentMethod = (getField(raw, ['payment_method', 'payment', 'method']) || 'credit_card') as PaymentMethod;
    const monthlyCostRaw = getField(raw, ['monthly_cost', 'monthly_amount']);
    const amountRaw = monthlyCostRaw || getField(raw, ['amount', 'cost', 'price']);
    const amount = Number.parseFloat(amountRaw);

    if (!name) errors.push('Missing name');
    if (!Number.isFinite(amount) || amount < 0) errors.push('Invalid amount');
    if (!['monthly', 'yearly'].includes(billingPeriod)) errors.push('Invalid billing period');
    if (!SUPPORTED_CURRENCIES.includes(currency)) errors.push('Unsupported currency');
    if (!PAYMENT_METHODS.includes(paymentMethod)) errors.push('Unsupported payment method');

    const monthlyCost = monthlyCostRaw
      ? amount
      : billingPeriod === 'monthly'
        ? amount
        : amount / 12;
    const startDate = normalizeDate(getField(raw, ['start_date', 'start', 'date']));
    const url = getField(raw, ['url', 'website']);
    const usageState = getField(raw, ['usage_state', 'usage']) || 'active';

    if (!['active', 'not much', 'unused'].includes(usageState)) {
      errors.push('Unsupported usage state');
    }

    return {
      rowNumber: rowIndex + 2,
      subscription: {
        name,
        url,
        icon: getField(raw, ['icon']) || 'CreditCard',
        monthlyCost,
        amount: monthlyCost,
        currency,
        billingPeriod,
        paymentMethod,
        category: getField(raw, ['category']) || 'Other',
        usageState: usageState as Subscription['usageState'],
        startDate,
        autoRenew: getField(raw, ['auto_renew', 'autorenew']).toLowerCase() === 'true'
      },
      errors
    };
  });
}

export function ImportDataPage() {
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState('');
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [status, setStatus] = useState<ImportStatus>('idle');
  const [message, setMessage] = useState('');
  const { displayCurrency } = useCurrency();
  const { addSubscription } = useSubscriptions();
  const { showToast } = useToast();
  const isBTC = displayCurrency === 'BTC';

  const validRows = rows.filter(row => row.errors.length === 0);
  const invalidRows = rows.length - validRows.length;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    void handleFiles(Array.from(e.dataTransfer.files));
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    void handleFiles(e.target.files ? Array.from(e.target.files) : []);
    e.target.value = '';
  };

  const handleFiles = async (files: File[]) => {
    const file = files[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv') && file.type !== 'text/csv') {
      setStatus('error');
      setMessage('Only CSV files are supported.');
      setRows([]);
      return;
    }

    try {
      const text = await file.text();
      const parsedRows = parseImportRows(text);
      setFileName(file.name);
      setRows(parsedRows);
      setStatus(parsedRows.length ? 'ready' : 'error');
      setMessage(parsedRows.length ? '' : 'The CSV file did not contain importable rows.');
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Failed to read CSV file.');
      setRows([]);
    }
  };

  const handleImport = async () => {
    if (!validRows.length) return;

    setStatus('importing');
    setMessage('');

    try {
      for (const row of validRows) {
        await addSubscription(row.subscription);
      }

      setStatus('complete');
      setMessage(`Imported ${validRows.length} subscription${validRows.length === 1 ? '' : 's'}.`);
      showToast('Subscriptions imported', 'success');
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Import failed.');
      showToast('Import failed', 'error');
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2 title-gradient">Import Data</h1>
        <p className="text-theme-secondary">Import recurring subscriptions from a CSV file.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="themed-card rounded-xl p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className={`p-3 rounded-lg ${isBTC ? 'bg-[#f7931a]/10' : 'bg-emerald-500/10'}`}>
              <Upload size={24} className={isBTC ? 'text-[#f7931a]' : 'text-emerald-400'} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-theme-primary">Upload CSV</h2>
              <p className="text-theme-secondary">Preview rows before they are added.</p>
            </div>
          </div>

          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
              dragActive ? 'border-emerald-500 bg-emerald-500/10' : 'border-gray-700 hover:border-gray-600'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              id="file-upload"
              className="hidden"
              accept=".csv,text/csv"
              onChange={handleFileInput}
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <FileText size={48} className="mx-auto mb-4 text-theme-secondary" />
              <p className="text-theme-primary font-medium mb-2">Drop a CSV here or click to upload</p>
              <p className="text-sm text-theme-secondary">Supported columns are shown on the right.</p>
            </label>
          </div>

          {fileName && (
            <div className="mt-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-theme-primary font-medium">{fileName}</p>
                <p className="text-sm text-theme-secondary">
                  {validRows.length} valid, {invalidRows} invalid
                </p>
              </div>
              <button
                type="button"
                onClick={handleImport}
                disabled={!validRows.length || status === 'importing'}
                className={`themed-button px-4 py-2 rounded-lg ${
                  isBTC ? 'text-[#f7931a]' : 'text-emerald-400'
                } disabled:opacity-50`}
              >
                {status === 'importing' ? 'Importing...' : 'Import Valid Rows'}
              </button>
            </div>
          )}

          {message && (
            <div className={`mt-4 flex items-start gap-2 text-sm ${
              status === 'error' ? 'text-red-400' : 'text-emerald-400'
            }`}>
              {status === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
              <span>{message}</span>
            </div>
          )}
        </div>

        <div className="themed-card rounded-xl p-6">
          <h2 className="text-xl font-bold text-theme-primary mb-4">CSV Format</h2>
          <p className="text-theme-secondary mb-4">
            Required columns are `name` and either `amount` or `monthly_cost`.
          </p>
          <pre className="themed-card rounded-lg p-4 overflow-x-auto text-sm text-theme-secondary">
            {SAMPLE_CSV}
          </pre>
          <div className="mt-4 text-sm text-theme-secondary space-y-2">
            <p>`amount` is interpreted as the billing-period amount. `monthly_cost` is always monthly.</p>
            <p>Supported currencies: EUR, USD, BTC.</p>
            <p>Supported billing periods: monthly, yearly.</p>
          </div>
        </div>
      </div>

      {rows.length > 0 && (
        <div className="themed-card rounded-xl p-6 overflow-x-auto">
          <h2 className="text-xl font-bold text-theme-primary mb-4">Preview</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="py-2 text-left text-theme-primary">Row</th>
                <th className="py-2 text-left text-theme-primary">Name</th>
                <th className="py-2 text-left text-theme-primary">Monthly Amount</th>
                <th className="py-2 text-left text-theme-primary">Currency</th>
                <th className="py-2 text-left text-theme-primary">Category</th>
                <th className="py-2 text-left text-theme-primary">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.rowNumber} className="border-b border-gray-700/50">
                  <td className="py-2 text-theme-secondary">{row.rowNumber}</td>
                  <td className="py-2 text-theme-primary">{row.subscription.name || '-'}</td>
                  <td className="py-2 text-theme-primary">{row.subscription.monthlyCost}</td>
                  <td className="py-2 text-theme-secondary">{row.subscription.currency}</td>
                  <td className="py-2 text-theme-secondary">{row.subscription.category}</td>
                  <td className={row.errors.length ? 'py-2 text-red-400' : 'py-2 text-emerald-400'}>
                    {row.errors.length ? row.errors.join(', ') : 'Ready'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
