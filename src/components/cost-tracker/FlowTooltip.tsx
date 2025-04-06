import { useCurrency } from '../../contexts/CurrencyContext';
import { useTheme } from '../../contexts/ThemeContext';
import { TooltipBreakdown } from './TooltipBreakdown';
import { format, parseISO } from 'date-fns';
import type { Link } from './types';
import { SATS_PER_BTC } from '../../lib/constants';

interface FlowTooltipProps {
  link: Link;
  mouseX: number;
  mouseY: number;
  onClose: () => void;
}

export function FlowTooltip({ link, mouseX, mouseY, onClose }: FlowTooltipProps) {
  const { displayCurrency, formatAmount, convertAmount } = useCurrency();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const isBTC = displayCurrency === 'BTC';

  const sourceNode = link.sourceNode;
  const targetNode = link.targetNode;

  if (!sourceNode || !targetNode) return null;

  const services = targetNode.services || [];
  const totalAmount = link.value;

  // Limit to first 3 services
  const displayedServices = services.slice(0, 3);
  const hasMoreServices = services.length > 3;

  // Helper function to safely extract monetary values
  const extractMonetaryValue = (value: string | number | undefined): number => {
    if (typeof value === 'undefined') return 0;
    if (typeof value === 'number') return value;
    
    // If it's a string, try to extract numeric value
    if (typeof value === 'string') {
      // Check if the string is already a formatted amount with comma as decimal separator (European format)
      if (/\d+,\d+/.test(value)) {
        // European format (1.234,56 €) - remove non-numeric except last comma (decimal point)
        const parts = value.split(',');
        const wholePart = parts[0].replace(/[^\d]/g, '');
        const decimalPart = parts.length > 1 ? parts[1].replace(/[^\d]/g, '') : '0';
        return parseFloat(`${wholePart}.${decimalPart}`);
      } else {
        // US/UK format (1,234.56 $) or simple number
        const numericString = value.replace(/[^0-9.-]/g, '');
        return parseFloat(numericString);
      }
    }
    
    return 0;
  };

  // Format amount with proper currency conversion and period
  const formatWithPeriod = (amount: number, period: string) => {
    // First convert the amount from EUR to the display currency
    const convertedAmount = convertAmount(amount, 'EUR', displayCurrency);
    
    // Special case for BTC to format in satoshis
    if (displayCurrency === 'BTC') {
      // Calculate satoshi value (1 BTC = 100,000,000 satoshis)
      const satoshis = Math.round(convertedAmount * SATS_PER_BTC);
      return `${new Intl.NumberFormat('en-US', {
        maximumFractionDigits: 0
      }).format(satoshis)} sats/${period}`;
    }
    
    // For non-BTC currencies, use the formatAmount function
    return `${formatAmount(amount, displayCurrency)}/${period}`;
  };

  return (
    <div 
      className="fixed z-50 w-96 themed-tooltip"
      style={{
        left: `${mouseX + 16}px`,
        top: `${mouseY}px`,
        transform: 'translateY(-50%)',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
      }}
    >
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-medium text-theme-primary">
          {targetNode.name.replace('Fixed: ', '').replace('Variable: ', '').replace('Sub: ', '')}
        </h3>
        <button 
          onClick={onClose}
          className="text-theme-secondary hover:text-theme-primary transition-colors"
        >
          ×
        </button>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-theme-secondary">Total Flow:</span>
          <span className={isBTC ? 'text-[#f7931a]' : 'text-emerald-400'}>
            {isBTC 
              ? `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Math.round(convertAmount(totalAmount, 'EUR', 'BTC') * SATS_PER_BTC))} sats` 
              : formatAmount(totalAmount, displayCurrency)}
          </span>
        </div>

        {services.length > 0 && (
          <>
            <div className="h-px bg-gray-700/50" />
            <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
              {displayedServices.map((service, i) => {
                const billingPeriod = service.details['Billing Period']?.toLowerCase();
                const startDate = service.details['Start Date'];
                const isYearly = billingPeriod === 'yearly';
                
                // Get monthly amount directly from Monthly Cost if available
                let monthlyAmount = 0;
                if (typeof service.amount === 'number') {
                  // For yearly billing, use amount directly as monthly cost
                  // For monthly billing, amount is already monthly cost
                  monthlyAmount = service.amount;
                } else if (service.details['Monthly Cost']) {
                  // Extract from formatted Monthly Cost string
                  monthlyAmount = extractMonetaryValue(service.details['Monthly Cost']);
                }
                
                // Calculate yearly amount from monthly
                const yearlyAmount = monthlyAmount * 12;

                return (
                  <div 
                    key={i} 
                    className="text-sm p-4 rounded-lg themed-card"
                  >
                    <div className="flex flex-col gap-1 mb-3">
                      <div className="flex justify-between items-start">
                        <span className="text-theme-primary font-medium">{service.name}</span>
                        <div className="text-right">
                          <div className={isBTC ? 'text-[#f7931a]' : 'text-emerald-400'}>
                            {formatWithPeriod(monthlyAmount, 'mo')}
                          </div>
                          {isYearly && (
                            <div className="text-theme-secondary text-xs">
                              ({formatWithPeriod(yearlyAmount, 'yr')})
                            </div>
                          )}
                        </div>
                      </div>
                      {startDate && (
                        <div className="text-xs text-theme-secondary">
                          Started {format(parseISO(startDate), 'MMM d, yyyy')}
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      {Object.entries(service.details).map(([key, value]) => {
                        if (key === 'Start Date') return null;

                        if (key === 'Monthly Breakdown') {
                          const breakdownItems = (value as string).split('\n').map(item => {
                            const [label, amount] = item.split(': ');
                            return { label, value: amount };
                          });
                          
                          return (
                            <TooltipBreakdown
                              key={key}
                              title="Monthly Breakdown"
                              items={breakdownItems}
                              className="border-t border-gray-700/50 pt-2"
                            />
                          );
                        }

                        return (
                          <div key={key} className="flex justify-between text-sm">
                            <span className="text-theme-secondary">{key}:</span>
                            <span className="text-theme-primary font-medium">{value}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              {hasMoreServices && (
                <div className="text-sm text-theme-secondary text-center pt-2">
                  + {services.length - 3} more services
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}