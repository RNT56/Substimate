import React, { useMemo, useState } from 'react';
import { sankey, sankeyLinkHorizontal } from 'd3-sankey';
import { useTheme } from '../../contexts/ThemeContext';
import { useCurrency } from '../../contexts/CurrencyContext';

interface Props {
  incomeSources: {
    source: string;
    amount: number;
  }[];
  fixedExpenses: {
    category: string;
    amount: number;
    name: string;
    frequency: string;
  }[];
  variableExpenses: {
    category: string;
    amount: number;
    name: string;
    date: string;
  }[];
  subscriptions: {
    category: string;
    monthlyCost: number;
    name: string;
    billingPeriod: string;
    usageState: string;
  }[];
}

interface Node {
  name: string;
  category: 'income' | 'fixed' | 'variable' | 'subscription' | 'savings' | 'category';
  originalCategory?: string;
  services?: Array<{
    name: string;
    amount: number;
    details: Record<string, any>;
  }>;
}

interface Link {
  source: number;
  target: number;
  value: number;
  category: 'fixed' | 'variable' | 'subscription' | 'savings';
  sourceNode?: Node;
  targetNode?: Node;
}

interface LinkTooltipProps {
  link: Link;
  mouseX: number;
  mouseY: number;
  onClose: () => void;
}

function LinkTooltip({ link, mouseX, mouseY, onClose }: LinkTooltipProps) {
  const { displayCurrency, formatAmount } = useCurrency();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const sourceNode = link.sourceNode;
  const targetNode = link.targetNode;

  if (!sourceNode || !targetNode) return null;

  const services = targetNode.services || [];
  const totalAmount = link.value;

  return (
    <div 
      className={`
        fixed z-50 w-80
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
          <span className="text-emerald-400 font-medium">
            {formatAmount(totalAmount, displayCurrency)}
          </span>
        </div>

        {services.length > 0 && (
          <>
            <div className="h-px bg-gray-700/50" />
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
              {services.map((service, i) => (
                <div 
                  key={i} 
                  className="text-sm p-2 rounded-lg hover:bg-gray-800/20 transition-colors"
                >
                  <div className="flex justify-between mb-1">
                    <span className="text-theme-primary font-medium">{service.name}</span>
                    <span className="text-emerald-400">
                      {formatAmount(service.amount, displayCurrency)}
                    </span>
                  </div>
                  <div className="text-xs text-theme-secondary space-y-1">
                    {Object.entries(service.details).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span>{key}:</span>
                        <span className="font-medium">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function IncomeFlowChart({ incomeSources, fixedExpenses, variableExpenses, subscriptions }: Props) {
  const { theme } = useTheme();
  const { displayCurrency, convertAmount, formatAmount } = useCurrency();
  const isDark = theme === 'dark';
  const isBTC = displayCurrency === 'BTC';

  const [hoveredLink, setHoveredLink] = useState<Link | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const { nodes, links } = useMemo(() => {
    // Calculate total income
    const totalIncome = incomeSources.reduce((sum, source) => sum + source.amount, 0);

    // Group expenses by category with service details
    const fixedCategories = fixedExpenses.reduce<Record<string, Array<{
      name: string;
      amount: number;
      details: Record<string, any>;
    }>>>((acc, expense) => {
      if (!acc[expense.category]) acc[expense.category] = [];
      acc[expense.category].push({
        name: expense.name,
        amount: expense.amount,
        details: {
          Frequency: expense.frequency.charAt(0).toUpperCase() + expense.frequency.slice(1)
        }
      });
      return acc;
    }, {});

    const variableCategories = variableExpenses.reduce<Record<string, Array<{
      name: string;
      amount: number;
      details: Record<string, any>;
    }>>>((acc, expense) => {
      if (!acc[expense.category]) acc[expense.category] = [];
      acc[expense.category].push({
        name: expense.name,
        amount: expense.amount,
        details: {
          Date: new Date(expense.date).toLocaleDateString()
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
      acc[sub.category].push({
        name: sub.name,
        amount: sub.monthlyCost,
        details: {
          'Billing Period': sub.billingPeriod.charAt(0).toUpperCase() + sub.billingPeriod.slice(1),
          'Usage State': sub.usageState.charAt(0).toUpperCase() + sub.usageState.slice(1)
        }
      });
      return acc;
    }, {});

    // Create nodes array
    const nodes: Node[] = [
      // Income node
      { name: 'Total Income', category: 'income' }
    ];

    // Add category nodes for fixed expenses
    const fixedCategoryNodes = Object.entries(fixedCategories).map(([category, services]) => ({
      name: `Fixed: ${category}`,
      category: 'category' as const,
      originalCategory: 'fixed' as const,
      services,
      value: services.reduce((sum, service) => sum + service.amount, 0)
    }));

    // Add category nodes for variable expenses
    const variableCategoryNodes = Object.entries(variableCategories).map(([category, services]) => ({
      name: `Variable: ${category}`,
      category: 'category' as const,
      originalCategory: 'variable' as const,
      services,
      value: services.reduce((sum, service) => sum + service.amount, 0)
    }));

    // Add category nodes for subscriptions
    const subscriptionCategoryNodes = Object.entries(subscriptionCategories).map(([category, services]) => ({
      name: `Sub: ${category}`,
      category: 'category' as const,
      originalCategory: 'subscription' as const,
      services,
      value: services.reduce((sum, service) => sum + service.amount, 0)
    }));

    // Add savings node
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

    // Create links
    const links: Link[] = [];

    // Links from income to fixed expense categories
    fixedCategoryNodes.forEach((node, index) => {
      links.push({
        source: 0,
        target: index + 1,
        value: node.value,
        category: 'fixed',
        sourceNode: nodes[0],
        targetNode: node
      });
    });

    // Links from income to variable expense categories
    variableCategoryNodes.forEach((node, index) => {
      links.push({
        source: 0,
        target: index + 1 + fixedCategoryNodes.length,
        value: node.value,
        category: 'variable',
        sourceNode: nodes[0],
        targetNode: node
      });
    });

    // Links from income to subscription categories
    subscriptionCategoryNodes.forEach((node, index) => {
      links.push({
        source: 0,
        target: index + 1 + fixedCategoryNodes.length + variableCategoryNodes.length,
        value: node.value,
        category: 'subscription',
        sourceNode: nodes[0],
        targetNode: node
      });
    });

    // Link from income to savings
    links.push({
      source: 0,
      target: nodes.length - 1,
      value: savings,
      category: 'savings',
      sourceNode: nodes[0],
      targetNode: nodes[nodes.length - 1]
    });

    return { nodes, links };
  }, [incomeSources, fixedExpenses, variableExpenses, subscriptions]);

  const sankeyData = useMemo(() => {
    const sankeyLayout = sankey<Node, Link>()
      .nodeWidth(30)
      .nodePadding(20)
      .extent([[0, 0], [900, 450]]);

    return sankeyLayout({
      nodes: nodes.map(d => ({ ...d })),
      links: links.map(d => ({ ...d }))
    });
  }, [nodes, links]);

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

  const handleLinkMouseEnter = (event: React.MouseEvent, link: Link) => {
    setHoveredLink(link);
    setMousePos({ x: event.clientX, y: event.clientY });
  };

  const handleLinkMouseMove = (event: React.MouseEvent) => {
    setMousePos({ x: event.clientX, y: event.clientY });
  };

  return (
    <div className="neumorphic-card rounded-xl p-6">
      <h2 className="text-xl font-bold mb-6 text-theme-primary">Income Flow</h2>
      <div className="w-full overflow-x-auto">
        <div className="min-w-[900px] h-[600px]">
          <svg width="100%" height="600" preserveAspectRatio="xMidYMid meet" viewBox="0 0 1200 600">
            <g transform="translate(40,20)">
              {/* Links */}
              {sankeyData.links?.map((link, i) => (
                <g 
                  key={i} 
                  fill="none"
                  onMouseEnter={(e) => handleLinkMouseEnter(e, link)}
                  onMouseMove={handleLinkMouseMove}
                  onMouseLeave={() => setHoveredLink(null)}
                  style={{ cursor: 'pointer' }}
                >
                  <path
                    d={sankeyLinkHorizontal()(link as any) as string}
                    stroke={getLinkColor(link)}
                    strokeWidth={Math.max(1, link.width as number)}
                    opacity={hoveredLink === link ? 1 : 0.8}
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

              {/* Nodes */}
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
                    ({formatAmount(node.value as number, displayCurrency)})
                  </text>
                </g>
              ))}
            </g>

            {/* Legend */}
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

      {/* Link Tooltip */}
      {hoveredLink && (
        <LinkTooltip
          link={hoveredLink}
          mouseX={mousePos.x}
          mouseY={mousePos.y}
          onClose={() => setHoveredLink(null)}
        />
      )}
    </div>
  );
}