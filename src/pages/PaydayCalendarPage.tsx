import React, { useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO } from 'date-fns';
import { useSubscriptions } from '../hooks/useSubscriptions';
import { useCurrency } from '../contexts/CurrencyContext';
import { useTheme } from '../contexts/ThemeContext';
import { useDevice } from '../hooks/useDevice';
import { PaydayDetailModal } from '../components/finance/PaydayDetailModal';

interface PaymentEvent {
  name: string;
  amount: number;
  date: Date;
  type: 'upcoming' | 'past';
  billingPeriod: string;
}

interface SelectedPaydayData {
  date: Date;
  events: PaymentEvent[];
}

export function PaydayCalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const { subscriptions } = useSubscriptions();
  const { displayCurrency, formatAmount } = useCurrency();
  const { theme } = useTheme();
  const { isMobile } = useDevice();
  const isDark = theme === 'dark';
  const isBTC = displayCurrency === 'BTC';

  const [isPaydayModalOpen, setIsPaydayModalOpen] = useState(false);
  const [selectedPaydayData, setSelectedPaydayData] = useState<SelectedPaydayData | null>(null);

  // Get all days in the current month
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Calculate payment events for the month
  const paymentEvents = React.useMemo(() => {
    const events = new Map<string, PaymentEvent[]>();
    const today = new Date();

    subscriptions.forEach(sub => {
      const startDate = parseISO(sub.startDate);
      
      // Only add events if the subscription has started
      if (startDate > monthEnd) return;
      
      const monthlyAmount = sub.monthlyCost || 0;
      const yearlyAmount = monthlyAmount * 12;

      if (sub.billingPeriod === 'yearly') {
        // For yearly subscriptions, add payment on the anniversary
        const paymentDate = new Date(startDate);
        paymentDate.setFullYear(currentMonth.getFullYear());
        
        // If the payment date is in this month
        if (paymentDate >= monthStart && paymentDate <= monthEnd) {
          const dateKey = format(paymentDate, 'yyyy-MM-dd');
          const type = paymentDate > today ? 'upcoming' : 'past';
          
          if (!events.has(dateKey)) {
            events.set(dateKey, []);
          }
          events.get(dateKey)?.push({
            name: sub.name,
            amount: yearlyAmount,
            date: paymentDate,
            type,
            billingPeriod: 'yearly'
          });
        }
      } else {
        // For monthly subscriptions, add payment on the same day each month
        const paymentDate = new Date(currentMonth);
        paymentDate.setDate(startDate.getDate());
        
        if (paymentDate >= monthStart && paymentDate <= monthEnd) {
          const dateKey = format(paymentDate, 'yyyy-MM-dd');
          const type = paymentDate > today ? 'upcoming' : 'past';
          
          if (!events.has(dateKey)) {
            events.set(dateKey, []);
          }
          events.get(dateKey)?.push({
            name: sub.name,
            amount: monthlyAmount,
            date: paymentDate,
            type,
            billingPeriod: 'monthly'
          });
        }
      }
    });

    return events;
  }, [subscriptions, currentMonth]);

  const handlePreviousMonth = () => {
    setCurrentMonth(prev => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => addMonths(prev, 1));
  };

  const openPaydayModal = (data: SelectedPaydayData) => {
    setSelectedPaydayData(data);
    setIsPaydayModalOpen(true);
  };

  const closePaydayModal = () => {
    setIsPaydayModalOpen(false);
    setSelectedPaydayData(null);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2 title-gradient">Payday Calendar</h1>
        <p className="text-theme-secondary">Track your subscription payment dates</p>
      </div>

      <div className="themed-card rounded-xl p-6">
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={handlePreviousMonth}
            className="themed-button p-2 rounded-lg text-theme-secondary hover:text-theme-primary"
          >
            <ChevronLeft size={24} />
          </button>
          
          <h2 className="text-2xl font-bold text-theme-primary flex items-center gap-3">
            <CalendarIcon size={24} className={isBTC ? 'text-[#f7931a]' : 'text-emerald-400'} />
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          
          <button
            onClick={handleNextMonth}
            className="themed-button p-2 rounded-lg text-theme-secondary hover:text-theme-primary"
          >
            <ChevronRight size={24} />
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-4">
          {/* Day Headers */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center font-medium text-theme-secondary p-2">
              {day}
            </div>
          ))}

          {/* Empty cells for days before the first of the month */}
          {Array.from({ length: monthStart.getDay() }).map((_, i) => (
            <div key={`empty-start-${i}`} className="aspect-square" />
          ))}

          {/* Calendar Days */}
          {days.map(day => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const events = paymentEvents.get(dateKey) || [];
            const isToday = isSameDay(day, new Date());
            const hasEvents = events.length > 0;
            
            // Sort events by billing period (yearly first) and name
            const sortedEvents = [...events].sort((a, b) => {
              if (a.billingPeriod === b.billingPeriod) {
                return a.name.localeCompare(b.name);
              }
              return a.billingPeriod === 'yearly' ? -1 : 1;
            });

            // Calculate total events and how many to show as indicators
            const totalEvents = events.length;
            const maxIndicators = 5;
            const displayedIndicators = Math.min(totalEvents, maxIndicators);

            return (
              <div
                key={dateKey}
                className={`aspect-square p-1 rounded-lg relative group ${
                  hasEvents ? 'themed-card' : ''
                } ${isToday ? 'ring-2 ring-emerald-500' : ''} ${ isMobile && hasEvents ? 'cursor-pointer' : ''}`}
                onClick={() => {
                  if (isMobile && hasEvents) {
                    openPaydayModal({ date: day, events: sortedEvents });
                  }
                }}
              >
                <div className="text-sm text-theme-secondary mb-1">
                  {format(day, 'd')}
                </div>

                {/* Conditionally hide hover popup on mobile? Optional */} 
                {hasEvents && !isMobile && (
                  <div className={`themed-card absolute inset-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg overflow-y-auto max-h-[200px] custom-scrollbar z-10`} 
                       style={{ 
                         // Add slight background opacity for better readability over calendar numbers if needed
                         // Example: backgroundColor: isDark ? 'rgba(26, 26, 26, 0.9)' : 'rgba(255, 255, 255, 0.9)' 
                         // Or rely on themed-card's default which might include transparency
                       }}
                  >
                    <div className="text-sm font-medium mb-2 text-theme-primary">
                      {format(day, 'MMM d, yyyy')}
                    </div>
                    <div className="space-y-2">
                      {sortedEvents.map((event, i) => (
                        <div 
                          key={i} 
                          // Apply new base class and conditional yearly class
                          className={`payday-event-item p-2 rounded-lg ${ 
                            event.billingPeriod === 'yearly' ? 'payday-event-item-yearly' : ''
                          }`}
                        >
                          <div className="font-medium text-theme-primary text-sm flex items-center justify-between">
                            <span className="truncate" title={event.name}>{event.name}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${ // Keep tag styling as is for now
                              event.billingPeriod === 'yearly'
                                ? isDark
                                  ? 'bg-[#1e1b4b] text-purple-300'
                                  : 'bg-purple-200 text-purple-800'
                                : isDark
                                  ? 'bg-[#1a1a1a] text-gray-400'
                                  : 'bg-gray-200 text-gray-600'
                            }`}> 
                              {event.billingPeriod}
                            </span>
                          </div>
                          <div className={`mt-1 text-sm ${
                            event.type === 'upcoming' 
                              ? isBTC 
                                ? 'text-[#f7931a]' 
                                : isDark
                                  ? 'text-emerald-400'
                                  : 'text-emerald-600'
                              : 'text-theme-secondary'
                          }`}>
                            {formatAmount(event.amount, displayCurrency)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Event Indicators */}
                {hasEvents && (
                  <div className="flex flex-wrap gap-1">
                    {Array.from({ length: displayedIndicators }).map((_, i) => {
                      const event = sortedEvents[i];
                      return (
                        <div
                          key={i}
                          className={`h-1.5 ${i === 0 ? 'w-3' : 'w-1.5'} rounded-full ${
                            event.billingPeriod === 'yearly'
                              ? 'bg-purple-500'
                              : event.type === 'upcoming'
                                ? isBTC ? 'bg-[#f7931a]' : 'bg-emerald-400'
                                : isDark ? 'bg-gray-500' : 'bg-gray-400'
                          }`}
                        />
                      );
                    })}
                    {totalEvents > maxIndicators && (
                      <span className="text-xs text-theme-secondary">
                        +{totalEvents - maxIndicators}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Empty cells for days after the last of the month */}
          {Array.from({ 
            length: 6 - monthEnd.getDay() 
          }).map((_, i) => (
            <div key={`empty-end-${i}`} className="aspect-square" />
          ))}
        </div>

        {/* Legend */}
        <div className="mt-6 flex items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-1.5 bg-purple-500 rounded-full" />
            <span className="text-theme-secondary">Yearly</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-1.5 rounded-full ${
              isBTC ? 'bg-[#f7931a]' : 'bg-emerald-400'
            }`} />
            <span className="text-theme-secondary">Monthly</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-1.5 rounded-full ${
              isDark ? 'bg-gray-500' : 'bg-gray-400'
            }`} />
            <span className="text-theme-secondary">Past Payment</span>
          </div>
        </div>
      </div>

      {isPaydayModalOpen && selectedPaydayData && (
        <PaydayDetailModal
          isOpen={isPaydayModalOpen}
          onClose={closePaydayModal}
          data={selectedPaydayData}
        />
      )}
    </div>
  );
}