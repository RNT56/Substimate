import React, { useMemo, useState, useEffect } from 'react';
import { sankey, sankeyLinkHorizontal } from 'd3-sankey';
import { useTheme } from '../../contexts/ThemeContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { TimeframeSelector, type Timeframe } from './TimeframeSelector';
import { isWithinInterval, parseISO, endOfMonth, startOfMonth, addMonths, isAfter, isBefore, eachMonthOfInterval, format } from 'date-fns';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { FlowTooltip } from './FlowTooltip';
import type { Props, Node, Link, PriceHistory } from './types';
import { SATS_PER_BTC } from '../../lib/constants';

export function SpendingFlowChart({ incomeSources, fixedExpenses, variableExpenses, subscriptions }: Props) {
  const { theme } = useTheme();
  const { displayCurrency, convertAmount, formatAmount } = useCurrency();
  const { user } = useAuth();
  const isDark = theme === 'dark';
  const isBTC = displayCurrency === 'BTC';

  const [timeframe, setTimeframe] = useState<Timeframe>('monthly');
  const [hoveredLink, setHoveredLink] = useState<Link | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [priceHistory, setPriceHistory] = useState<Record<string, PriceHistory[]>>({});
  const [activeLink, setActiveLink] = useState<Link | null>(null);
  const [stickyTooltip, setStickyTooltip] = useState(false);

  useEffect(() => {
    const fetchPriceHistory = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('subscription_price_history')
          .select('*')
          .eq('user_id', user.id)
          .order('effective_from', { ascending: true });

        if (error) throw error;

        const history = data.reduce<Record<string, PriceHistory[]>>((acc, entry) => {
          if (!acc[entry.subscription_id]) {
            acc[entry.subscription_id] = [];
          }
          acc[entry.subscription_id].push({
            subscription_id: entry.subscription_id,
            monthly_cost: entry.monthly_cost,
            effective_from: entry.effective_from
          });
          return acc;
        }, {});

        setPriceHistory(history);
      } catch (error) {
        console.error('Error fetching price history:', error);
      }
    };

    fetchPriceHistory();
  }, [user]);

  useEffect(() => {
    const handleBackgroundClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.flow-path') && !target.closest('.tooltip')) {
        setHoveredLink(null);
        setActiveLink(null);
        setStickyTooltip(false);
      }
    };

    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setHoveredLink(null);
        setActiveLink(null);
        setStickyTooltip(false);
      }
    };

    document.addEventListener('click', handleBackgroundClick);
    document.addEventListener('keydown', handleEscapeKey);
    
    return () => {
      document.removeEventListener('click', handleBackgroundClick);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, []);

  const handleLinkClick = (event: React.MouseEvent, link: Link) => {
    event.stopPropagation();
    setActiveLink(link);
    setStickyTooltip(true);
    setMousePos({ x: event.clientX, y: event.clientY });
  };

  const handleLinkMouseEnter = (event: React.MouseEvent, link: Link) => {
    if (!stickyTooltip) {
      setHoveredLink(link);
      setMousePos({ x: event.clientX, y: event.clientY });
    }
  };

  const handleLinkMouseMove = (event: React.MouseEvent) => {
    if (!stickyTooltip) {
      setMousePos({ x: event.clientX, y: event.clientY });
    }
  };

  const handleLinkMouseLeave = () => {
    if (!stickyTooltip) {
      setHoveredLink(null);
    }
  };

  const handleTooltipClose = () => {
    setHoveredLink(null);
    setActiveLink(null);
    setStickyTooltip(false);
  };

  const timeframeMultiplier = useMemo(() => {
    switch (timeframe) {
      case 'monthly':
        return 1;
      case 'quarterly':
        return 3;
      case 'yearly':
        return 12;
      default:
        return 1;
    }
  }, [timeframe]);

  const getSubscriptionCostForMonth = (subscription: Props['subscriptions'][0], month: Date): number => {
    const history = priceHistory[subscription.id];
    if (!history?.length) {
      return subscription.monthlyCost;
    }

    const applicablePrice = history
      .filter(entry => !isAfter(parseISO(entry.effective_from), endOfMonth(month)))
      .sort((a, b) => 
        parseISO(b.effective_from).getTime() - parseISO(a.effective_from).getTime()
      )[0];

    return applicablePrice ? applicablePrice.monthly_cost : subscription.monthlyCost;
  };

  const flowData = useMemo(() => {
    const periodStart = startOfMonth(selectedDate);
    const periodEnd = endOfMonth(selectedDate);
    if (timeframe === 'quarterly') {
      periodEnd.setMonth(periodEnd.getMonth() + 2);
    } else if (timeframe === 'yearly') {
      periodEnd.setMonth(periodEnd.getMonth() + 11);
    }

    const months = eachMonthOfInterval({ start: periodStart, end: periodEnd });

    const filteredVariableExpenses = variableExpenses.filter(expense => {
      const expenseDate = parseISO(expense.date);
      return isWithinInterval(expenseDate, { start: periodStart, end: periodEnd });
    });

    const totalIncome = incomeSources.reduce((sum, source) => {
      let amount = source.amount;
      if (timeframe === 'yearly' && source.frequency === 'monthly') {
        amount *= 12;
      } else if (timeframe === 'quarterly' && source.frequency === 'monthly') {
        amount *= 3;
      }
      return sum + amount;
    }, 0);

    const fixedCategories = fixedExpenses.reduce<Record<string, Array<{
      name: string;
      amount: number;
      details: Record<string, any>;
    }>>>((acc, expense) => {
      if (!acc[expense.category]) acc[expense.category] = [];
      let amount = expense.amount;
      
      if (expense.frequency === 'yearly') {
        amount = timeframe === 'yearly' ? amount : amount / 12 * timeframeMultiplier;
      } else if (expense.frequency === 'quarterly') {
        amount = timeframe === 'yearly' ? amount * 4 : 
                timeframe === 'quarterly' ? amount : 
                amount / 3;
      } else {
        amount *= timeframeMultiplier;
      }

      acc[expense.category].push({
        name: expense.name,
        amount,
        details: {
          Frequency: expense.frequency.charAt(0).toUpperCase() + expense.frequency.slice(1),
          [`${timeframe.charAt(0).toUpperCase() + timeframe.slice(1)} Amount`]: 
            formatAmount(amount, displayCurrency),
          'Monthly Breakdown': months.map(month => 
            `${format(month, 'MMM yyyy')}: ${formatAmount(expense.amount, displayCurrency)}`
          ).join('\n')
        }
      });
      return acc;
    }, {});

    const variableCategories = filteredVariableExpenses.reduce<Record<string, Array<{
      name: string;
      amount: number;
      details: Record<string, any>;
    }>>>((acc, expense) => {
      if (!acc[expense.category]) acc[expense.category] = [];
      const amount = expense.amount * timeframeMultiplier;
      acc[expense.category].push({
        name: expense.name,
        amount,
        details: {
          Date: new Date(expense.date).toLocaleDateString(),
          [`${timeframe.charAt(0).toUpperCase() + timeframe.slice(1)} Amount`]: 
            formatAmount(amount, displayCurrency)
        }
      });
      return acc;
    }, {});

    const subscriptionCategories = subscriptions.reduce<Record<string, Array<{
      name: string;
      amount: number;
      details: Record<string, any>;
    }>>>((acc, sub) => {
      if (!acc[sub.category]) acc[sub.category] = [];

      const monthlyAmount = sub.monthlyCost;
      const yearlyAmount = monthlyAmount * 12;

      let totalAmount = 0;
      if (timeframe === 'yearly') {
        totalAmount = yearlyAmount;
      } else if (timeframe === 'quarterly') {
        totalAmount = monthlyAmount * 3;
      } else {
        totalAmount = monthlyAmount;
      }

      const monthlyAmounts = months.map(month => {
        return `${format(month, 'MMM yyyy')}: ${formatAmount(monthlyAmount, displayCurrency)}`;
      });

      acc[sub.category].push({
        name: sub.name,
        amount: totalAmount,
        details: {
          'Start Date': sub.startDate,
          'Billing Period': sub.billingPeriod.charAt(0).toUpperCase() + sub.billingPeriod.slice(1),
          'Usage State': sub.usageState.charAt(0).toUpperCase() + sub.usageState.slice(1),
          'Monthly Cost': formatAmount(monthlyAmount, displayCurrency),
          ...(sub.billingPeriod === 'yearly' && {
            'Yearly Cost': formatAmount(yearlyAmount, displayCurrency)
          }),
          [`${timeframe.charAt(0).toUpperCase() + timeframe.slice(1)} Cost`]: 
            formatAmount(totalAmount, displayCurrency),
          'Monthly Breakdown': monthlyAmounts.join('\n')
        }
      });
      return acc;
    }, {});

    const nodes: Node[] = [
      { name: 'Total Income', category: 'income' }
    ];

    const fixedCategoryNodes = Object.entries(fixedCategories).map(([category, services]) => ({
      name: `Fixed: ${category}`,
      category: 'category' as const,
      originalCategory: 'fixed' as const,
      services,
      value: services.reduce((sum, service) => sum + service.amount, 0)
    }));

    const variableCategoryNodes = Object.entries(variableCategories).map(([category, services]) => ({
      name: `Variable: ${category}`,
      category: 'category' as const,
      originalCategory: 'variable' as const,
      services,
      value: services.reduce((sum, service) => sum + service.amount, 0)
    }));

    const subscriptionCategoryNodes = Object.entries(subscriptionCategories).map(([category, services]) => ({
      name: `Sub: ${category}`,
      category: 'category' as const,
      originalCategory: 'subscription' as const,
      services,
      value: services.reduce((sum, service) => sum + service.amount, 0)
    }));

    const totalExpenses = [
      ...Object.values(fixedCategories).flat(),
      ...Object.values(variableCategories).flat(),
      ...Object.values(subscriptionCategories).flat()
    ].reduce((sum, service) => sum + service.amount, 0);

    const savings = Math.max(0, totalIncome - totalExpenses);
    
    nodes.push(
      ...fixedCategoryNodes,
      ...variableCategoryNodes,
      ...subscriptionCategoryNodes,
      { name: 'Savings', category: 'savings' }
    );

    const links: Link[] = [];

    fixedCategoryNodes.forEach((node, index) => {
      links.push({
        source: 0,
        target: index + 1,
        value: node.value || 0,
        category: 'fixed',
        sourceNode: nodes[0],
        targetNode: node,
        id: `fixed-${index}`
      });
    });

    variableCategoryNodes.forEach((node, index) => {
      links.push({
        source: 0,
        target: index + 1 + fixedCategoryNodes.length,
        value: node.value || 0,
        category: 'variable',
        sourceNode: nodes[0],
        targetNode: node,
        id: `variable-${index}`
      });
    });

    subscriptionCategoryNodes.forEach((node, index) => {
      links.push({
        source: 0,
        target: index + 1 + fixedCategoryNodes.length + variableCategoryNodes.length,
        value: node.value || 0,
        category: 'subscription',
        sourceNode: nodes[0],
        targetNode: node,
        id: `subscription-${index}`
      });
    });

    links.push({
      source: 0,
      target: nodes.length - 1,
      value: savings,
      category: 'savings',
      sourceNode: nodes[0],
      targetNode: nodes[nodes.length - 1],
      id: 'savings'
    });

    return { nodes, links };
  }, [
    incomeSources, 
    fixedExpenses, 
    variableExpenses, 
    subscriptions, 
    timeframe, 
    timeframeMultiplier, 
    displayCurrency, 
    formatAmount, 
    selectedDate,
    priceHistory
  ]);

  const sankeyData = useMemo(() => {
    const sankeyLayout = sankey<Node, Link>()
      .nodeWidth(30)
      .nodePadding(20)
      .extent([[0, 0], [900, 450]]);

    return sankeyLayout({
      nodes: flowData.nodes.map(d => ({ ...d })),
      links: flowData.links.map(d => ({ ...d }))
    });
  }, [flowData]);

  const getNodeColor = (node: Node) => {
    if (node.category === 'income') return isBTC ? '#f7931a' : '#10B981';
    if (node.category === 'savings') return '#F59E0B';
    
    if (node.name.startsWith('Fixed:')) return '#EF4444';
    if (node.name.startsWith('Variable:')) return '#F97316';
    if (node.name.startsWith('Sub:')) return '#8B5CF6';
    
    return '#64748B';
  };

  const getLinkColor = (link: Link) => {
    switch (link.category) {
      case 'fixed':
        return '#EF444480';
      case 'variable':
        return '#F9731680';
      case 'subscription':
        return '#8B5CF680';
      case 'savings':
        return '#F59E0B80';
      default:
        return '#64748B80';
    }
  };

  // Format BTC values properly for the sankey diagram
  const formatNodeAmount = (amount: number): string => {
    if (displayCurrency === 'BTC') {
      // Convert to satoshis for display
      const satoshis = Math.round(convertAmount(amount, 'EUR', 'BTC') * SATS_PER_BTC);
      return `${new Intl.NumberFormat('en-US', {
        maximumFractionDigits: 0
      }).format(satoshis)} sats`;
    }
    return formatAmount(amount, displayCurrency);
  };

  return (
    <div className="neumorphic-card rounded-xl p-6">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-xl font-bold text-theme-primary">Spending Flow</h2>
        <TimeframeSelector 
          timeframe={timeframe}
          selectedDate={selectedDate}
          onTimeframeChange={setTimeframe}
          onDateChange={setSelectedDate}
        />
      </div>

      <div className="w-full overflow-x-auto">
        <div className="min-w-[900px] h-[600px]">
          <svg width="100%" height="600" preserveAspectRatio="xMidYMid meet" viewBox="0 0 1200 600">
            <g transform="translate(40,20)">
              {sankeyData.links?.map((link, i) => (
                <g 
                  key={link.id || i}
                  fill="none"
                  className="flow-path"
                  onMouseEnter={(e) => handleLinkMouseEnter(e, link)}
                  onMouseMove={handleLinkMouseMove}
                  onMouseLeave={handleLinkMouseLeave}
                  onClick={(e) => handleLinkClick(e, link)}
                  style={{ cursor: 'pointer' }}
                >
                  <path
                    d={sankeyLinkHorizontal()(link as any) as string}
                    stroke={getLinkColor(link)}
                    strokeWidth={Math.max(1, link.width as number)}
                    opacity={
                      (activeLink || hoveredLink) 
                        ? (activeLink?.id === link.id || hoveredLink?.id === link.id ? 1 : 0.3)
                        : 0.8
                    }
                    fill="none"
                  />
                  <path
                    d={sankeyLinkHorizontal()(link as any) as string}
                    stroke="transparent"
                    strokeWidth={Math.max(20, link.width as number)}
                    fill="none"
                    style={{ pointerEvents: 'all' }}
                  />
                </g>
              ))}

              {sankeyData.nodes?.map((node, i) => (
                <g 
                  key={i} 
                  transform={`translate(${node.x0},${node.y0})`}
                >
                  <rect
                    height={Math.max(1, node.y1 as number - node.y0 as number)}
                    width={node.x1 as number - node.x0 as number}
                    fill={getNodeColor(node)}
                    opacity={0.8}
                  />
                  <text
                    x={node.category === 'income' ? 6 : -6}
                    y={(node.y1 as number - node.y0 as number) / 2}
                    dy="0.35em"
                    textAnchor={node.category === 'income' ? 'start' : 'end'}
                    fill={isDark ? '#fff' : '#000'}
                    fontSize={12}
                  >
                    {node.name.replace('Fixed: ', '').replace('Variable: ', '').replace('Sub: ', '')}
                    {' '}
                    ({formatNodeAmount(node.value as number)})
                  </text>
                </g>
              ))}
            </g>

            <g transform="translate(40,560)">
              {[
                { name: 'Fixed Expenses', color: '#EF4444' },
                { name: 'Variable Expenses', color: '#F97316' },
                { name: 'Subscriptions', color: '#8B5CF6' },
                { name: 'Savings', color: '#F59E0B' }
              ].map((item, i) => (
                <g key={item.name} transform={`translate(${i * 250},0)`}>
                  <rect
                    width={16}
                    height={16}
                    fill={item.color}
                    opacity={0.8}
                  />
                  <text
                    x={24}
                    y={12}
                    fontSize={12}
                    fill={isDark ? '#fff' : '#000'}
                  >
                    {item.name}
                  </text>
                </g>
              ))}
            </g>
          </svg>
        </div>
      </div>

      {(activeLink || (hoveredLink && !stickyTooltip)) && (
        <FlowTooltip
          link={(activeLink || hoveredLink)!}
          mouseX={mousePos.x}
          mouseY={mousePos.y}
          onClose={handleTooltipClose}
        />
      )}
    </div>
  );
}