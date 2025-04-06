import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface TooltipBreakdownProps {
  title: string;
  items: { label: string; value: string | number }[];
  className?: string;
}

export function TooltipBreakdown({ title, items, className = '' }: TooltipBreakdownProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  return (
    <div className={`themed-tooltip ${className}`}>
      <div className="space-y-2">
        <button
          onClick={handleClick}
          className="w-full flex items-center justify-between text-sm text-theme-secondary hover:text-theme-primary transition-colors"
        >
          <span>{title}</span>
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {isExpanded && (
          <div className="space-y-1 pl-2 text-sm max-h-40 overflow-y-auto custom-scrollbar">
            {items.map((item, index) => (
              <div key={index} className="flex justify-between gap-4">
                <span className="text-theme-secondary">{item.label}:</span>
                <span className="text-theme-primary font-medium">{item.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}