import React from 'react';
import { useCurrency } from '../../contexts/CurrencyContext';
import { useTheme } from '../../contexts/ThemeContext';
import { TooltipBreakdown } from './TooltipBreakdown';
import { format, parseISO } from 'date-fns';
import type { Node, Link } from './types';

interface FlowTooltipProps {
  link: Link;
  mouseX: number;
  mouseY: number;
  onClose: () => void;
}

export function FlowTooltip({ link, mouseX, mouseY, onClose }: FlowTooltipProps) {
  const { displayCurrency, formatAmount } = useCurrency();
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

  return (
    <div 
      className={`
        fixed z-50 w-96 tooltip
        neumorphic-card rounded-lg p-4 backdrop-blur-md border
        ${isDark ? 'bg-gray-900/95 border-gray-700' : 'bg-white/95 border-gray-200'}
      `}
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
            {formatAmount(totalAmount, displayCurrency)}
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
                const monthlyAmount = parseFloat(service.details['Monthly Cost']);
                const yearlyAmount = monthlyAmount * 12;

                return (
                  <div 
                    key={i} 
                    className="text-sm p-4 rounded-lg neumorphic-card"
                  >
                    <div className="flex flex-col gap-1 mb-3">
                      <div className="flex justify-between items-start">
                        <span className="text-theme-primary font-medium">{service.name}</span>
                        <div className="text-right">
                          <div className={isBTC ? 'text-[#f7931a]' : 'text-emerald-400'}>
                            {formatAmount(monthlyAmount, displayCurrency)}/mo
                          </div>
                          {isYearly && (
                            <div className="text-theme-secondary text-xs">
                              ({formatAmount(yearlyAmount, displayCurrency)}/yr)
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