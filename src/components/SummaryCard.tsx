import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface SummaryCardProps {
  id: string;
  title: string;
  value: string | number;
  trend?: string;
  trendValue?: string;
  icon: React.ElementType;
  variant?: 'default' | 'error' | 'gradient';
}

export const SummaryCard: React.FC<SummaryCardProps> = ({ 
  id, title, value, trend, trendValue, icon: Icon, variant = 'default' 
}) => {
  const getTrendIcon = () => {
    if (trend === 'up') return <TrendingUp size={14} />;
    if (trend === 'down') return <TrendingDown size={14} />;
    return <Minus size={14} />;
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'error': return 'border-error-container';
      case 'gradient': return 'bg-gradient-to-br from-white to-surface-container border-surface-container-high';
      default: return 'border-surface-container-high';
    }
  };

  return (
    <div id={id} className={`bg-white p-6 rounded-xl soft-shadow border flex flex-col justify-between h-36 ${getVariantStyles()}`}>
      <div className="flex justify-between items-start mb-4">
        <span className="text-xs font-semibold text-secondary uppercase tracking-wider">{title}</span>
        <Icon className={variant === 'error' ? 'text-error' : 'text-primary'} size={20} />
      </div>
      <div>
        <span className="text-3xl font-bold text-on-surface">{value}</span>
        {trendValue && (
          <div className={`flex items-center gap-1 mt-1 text-xs font-medium ${
            trend === 'up' ? 'text-primary' : trend === 'down' ? 'text-error' : 'text-secondary'
          }`}>
            {getTrendIcon()}
            <span>{trendValue}</span>
          </div>
        )}
      </div>
    </div>
  );
};
