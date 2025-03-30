import React, { useState, useRef, useCallback, memo, useEffect } from 'react';
import {
  // Media & Entertainment
  Music, Video, Tv, Film, Headphones, Radio, Mic, Camera, Image, Play,
  
  // Communication & Social
  MessageSquare, Mail, Send, Share2, Users, Heart, Star, Bell,
  
  // Technology & Development
  Code, Terminal, Database, Cloud, Server, Laptop, Monitor, Smartphone, Tablet,
  Bot, Cpu, Command, GitBranch, GitPullRequest,
  
  // Business & Productivity
  FileText, Folder, Calendar, Clock, Briefcase, BarChart2, PieChart, LineChart,
  Trello, Kanban, CheckSquare, ListTodo,
  
  // Shopping & Finance
  ShoppingBag, ShoppingCart, CreditCard, Wallet, DollarSign, Receipt, Tag, Package,
  
  // Navigation & Location
  Map, Navigation, Compass, Globe, Home, Building, Building2, Landmark,
  
  // UI Elements
  Layout, Layers, Sliders, Settings, PenTool as Tool, Wrench, Zap, Search,
  
  // Nature & Weather
  Sun, Moon, CloudRain, CloudSnow, Wind, Umbrella, Thermometer,
  
  // Lifestyle & Activities
  Coffee, Utensils, Wine, Pizza, Bike, Car, Plane, Train,
  
  // Gaming & Entertainment
  Gamepad, Dice1 as Dice, Target, Award, Trophy, Medal, Crown,
  
  // Art & Design
  Palette, Brush, PenTool, Scissors, Projector as Vector, Box, Boxes,
  
  // Health & Fitness
  Activity, Dumbbell, FileWarning as Running, Cog as Yoga, Apple,
  
  // Additional Icons
  HeartPulse as Heartbeat,
  
  // Action Icons
  Pencil, X
} from 'lucide-react';
import type { Subscription, UsageState } from '../types';
import { EditSubscriptionModal } from './EditSubscriptionModal';
import { IconSelector } from './IconSelector';
import { useCurrency } from '../contexts/CurrencyContext';

const ICONS = {
  // Media & Entertainment
  Music, Video, Tv, Film, Headphones, Radio, Mic, Camera, Image, Play,
  
  // Communication & Social
  MessageSquare, Mail, Send, Share2, Users, Heart, Star, Bell,
  
  // Technology & Development
  Code, Terminal, Database, Cloud, Server, Laptop, Monitor, Smartphone, Tablet,
  Bot, Cpu, Command, GitBranch, GitPullRequest,
  
  // Business & Productivity
  FileText, Folder, Calendar, Clock, Briefcase, BarChart2, PieChart, LineChart,
  Trello, Kanban, CheckSquare, ListTodo,
  
  // Shopping & Finance
  ShoppingBag, ShoppingCart, CreditCard, Wallet, DollarSign, Receipt, Tag, Package,
  
  // Navigation & Location
  Map, Navigation, Compass, Globe, Home, Building, Building2, Landmark,
  
  // UI Elements
  Layout, Layers, Sliders, Settings, Tool, Wrench, Zap, Search,
  
  // Nature & Weather
  Sun, Moon, CloudRain, CloudSnow, Wind, Umbrella, Thermometer,
  
  // Lifestyle & Activities
  Coffee, Utensils, Wine, Pizza, Bike, Car, Plane, Train,
  
  // Gaming & Entertainment
  Gamepad, Dice, Target, Award, Trophy, Medal, Crown,
  
  // Art & Design
  Palette, Brush, PenTool, Scissors, Vector, Box, Boxes,
  
  // Health & Fitness
  Activity, Heartbeat, Dumbbell, Running, Yoga, Apple
};

interface Props {
  subscription: Subscription;
  onUpdate: (subscription: Subscription) => void;
  onDelete: (id: string) => void;
}

const usageStateColors: Record<UsageState, { bg: string, border: string }> = {
  active: { bg: 'bg-emerald-500', border: 'border-emerald-600' },
  'not much': { bg: 'bg-amber-500', border: 'border-amber-600' },
  unused: { bg: 'bg-red-500', border: 'border-red-600' }
};

export const SubscriptionCard = memo(function SubscriptionCard({ subscription, onUpdate, onDelete }: Props) {
  // Track local state for optimistic updates
  const [localUsageState, setLocalUsageState] = useState<UsageState>(subscription.usageState);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSelectingIcon, setIsSelectingIcon] = useState(false);
  const Icon = ICONS[subscription.icon as keyof typeof ICONS] || Tv;
  const { displayCurrency, convertAmount, formatAmount } = useCurrency();
  const isBTC = displayCurrency === 'BTC';

  // Update local state when subscription changes
  useEffect(() => {
    setLocalUsageState(subscription.usageState);
  }, [subscription.usageState]);

  // Memoize handlers to prevent unnecessary re-renders
  const handleUsageStateChange = useCallback((usageState: UsageState) => {
    try {
      // Update local state immediately for optimistic UI
      setLocalUsageState(usageState);

      // Send update to server
      onUpdate({
        ...subscription,
        usageState
      });
    } catch (error) {
      console.error('Error updating usage state:', error);
      // Revert local state on error
      setLocalUsageState(subscription.usageState);
    }
  }, [subscription, onUpdate]);

  const handleIconChange = useCallback((newIcon: string) => {
    try {
      const updatedSubscription = {
        ...subscription,
        icon: newIcon
      };
      onUpdate(updatedSubscription);
      setIsSelectingIcon(false);
    } catch (error) {
      console.error('Error updating icon:', error);
    }
  }, [subscription, onUpdate]);

  const handleDelete = useCallback(async () => {
    try {
      // Set deleting state for UI feedback
      setIsDeleting(true);
      
      // Call delete function
      await onDelete(subscription.id);
    } catch (error) {
      // Reset deleting state on error
      setIsDeleting(false);
      console.error('Error deleting subscription:', error);
    }
  }, [subscription.id, onDelete]);

  const convertedMonthlyCost = convertAmount(subscription.monthlyCost, 'EUR', displayCurrency);
  const formattedCost = formatAmount(convertedMonthlyCost, displayCurrency);


  return (
    <>
      <div className={`neumorphic-card rounded-xl overflow-hidden relative ${isDeleting ? 'opacity-50 pointer-events-none' : ''}`}>
        <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${usageStateColors[localUsageState].bg} ${usageStateColors[localUsageState].border}`} />
        
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsSelectingIcon(true)}
                className="icon-container"
                title="Click to change icon"
                type="button"
              >
                <Icon size={24} className="text-theme-primary" />
              </button>
              <div>
                <h3 className="font-semibold text-theme-primary">{subscription.name}</h3>
                <a href={subscription.url} target="_blank" rel="noopener noreferrer" 
                  className={`text-sm ${isBTC ? 'text-[#f7931a]' : 'text-emerald-400'} hover:opacity-80 transition-opacity`}>
                  Visit site
                </a>
              </div>
            </div>
            <div className="text-right">
              <p className="font-semibold text-theme-primary">{formattedCost}/mo</p>
              <p className="text-sm text-theme-secondary">
                {subscription.paymentMethod} • {subscription.billingPeriod}
              </p>
            </div>
          </div>

          <div className="flex gap-2 mb-4">
            <button
              onClick={() => handleUsageStateChange('active')}
              className={`neumorphic-button px-4 py-2 rounded-lg text-sm transition-all ${
                localUsageState === 'active'
                  ? isBTC ? 'text-[#f7931a]' : 'text-emerald-500'
                  : 'text-theme-secondary hover:text-theme-primary'
              }`}
              type="button"
            >
              Active
            </button>
            <button
              onClick={() => handleUsageStateChange('not much')}
              className={`neumorphic-button px-4 py-2 rounded-lg text-sm transition-all ${
                localUsageState === 'not much' 
                  ? 'text-amber-500' 
                  : 'text-theme-secondary hover:text-theme-primary'
              }`}
              type="button"
            >
              Not Much
            </button>
            <button
              onClick={() => handleUsageStateChange('unused')}
              className={`neumorphic-button px-4 py-2 rounded-lg text-sm transition-all ${
                localUsageState === 'unused' 
                  ? 'text-red-500' 
                  : 'text-theme-secondary hover:text-theme-primary'
              }`}
              type="button"
            >
              Unused
            </button>
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={() => setIsEditing(true)}
              className={`neumorphic-button px-4 py-2 rounded-lg text-sm ${isBTC ? 'text-[#f7931a]' : 'text-emerald-400'} hover:opacity-80 flex items-center gap-2`}
              type="button"
              disabled={isDeleting}
            >
              <Pencil size={16} />
              Edit
            </button>
            <button
              onClick={handleDelete}
              className="neumorphic-button px-4 py-2 rounded-lg text-sm text-red-500 hover:opacity-80 flex items-center gap-2"
              type="button"
              disabled={isDeleting}
            >
              <X size={16} />
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </div>

      <EditSubscriptionModal
        isOpen={isEditing}
        onClose={() => setIsEditing(false)}
        onUpdate={onUpdate}
        subscription={subscription}
      />

      <IconSelector
        isOpen={isSelectingIcon}
        onClose={() => setIsSelectingIcon(false)}
        onSelect={handleIconChange}
        currentIcon={subscription.icon}
      />
    </>
  );
});