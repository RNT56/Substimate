import React from 'react';
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
  Columns3 as Trello, Kanban, CheckSquare, ListTodo,
  
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
  HeartPulse as Heartbeat
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (iconName: string) => void;
  currentIcon: string;
}

interface IconCategory {
  name: string;
  icons: Record<string, React.FC<any>>;
}

const ICON_CATEGORIES: IconCategory[] = [
  {
    name: 'Media & Entertainment',
    icons: { Music, Video, Tv, Film, Headphones, Radio, Mic, Camera, Image, Play }
  },
  {
    name: 'Communication',
    icons: { MessageSquare, Mail, Send, Share2, Users, Heart, Star, Bell }
  },
  {
    name: 'Technology',
    icons: { 
      Code, Terminal, Database, Cloud, Server, Laptop, Monitor, Smartphone, 
      Tablet, Bot, Cpu, Command, GitBranch, GitPullRequest 
    }
  },
  {
    name: 'Business',
    icons: { 
      FileText, Folder, Calendar, Clock, Briefcase, BarChart2, PieChart, 
      LineChart, Trello, Kanban, CheckSquare, ListTodo 
    }
  },
  {
    name: 'Shopping',
    icons: { 
      ShoppingBag, ShoppingCart, CreditCard, Wallet, DollarSign, Receipt, 
      Tag, Package 
    }
  },
  {
    name: 'Navigation',
    icons: { Map, Navigation, Compass, Globe, Home, Building, Building2, Landmark }
  },
  {
    name: 'UI Elements',
    icons: { Layout, Layers, Sliders, Settings, Tool, Wrench, Zap, Search }
  },
  {
    name: 'Nature & Weather',
    icons: { Sun, Moon, Cloud, CloudRain, CloudSnow, Wind, Umbrella, Thermometer }
  },
  {
    name: 'Lifestyle',
    icons: { Coffee, Utensils, Wine, Pizza, Bike, Car, Plane, Train }
  },
  {
    name: 'Gaming',
    icons: { Gamepad, Dice, Target, Award, Trophy, Medal, Crown }
  },
  {
    name: 'Art & Design',
    icons: { Palette, Brush, PenTool, Scissors, Vector, Box, Boxes }
  },
  {
    name: 'Health & Fitness',
    icons: { Activity, Heart, Heartbeat, Dumbbell, Running, Yoga, Apple }
  }
];

export function IconSelector({ isOpen, onClose, onSelect, currentIcon }: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none">
        <div className="themed-card rounded-xl p-6 w-full max-w-4xl max-h-[80vh] overflow-hidden pointer-events-auto">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-theme-primary">Select Icon</h3>
            <button
              onClick={onClose}
              className="themed-button px-4 py-2 rounded-lg text-theme-secondary hover:text-theme-primary"
            >
              Close
            </button>
          </div>
          
          <div className="overflow-y-auto max-h-[calc(80vh-8rem)] pr-4 -mr-4">
            <div className="space-y-8">
              {ICON_CATEGORIES.map((category) => (
                <div key={category.name}>
                  <h4 className="text-lg font-medium text-theme-primary mb-4">{category.name}</h4>
                  <div className="grid grid-cols-8 gap-4">
                    {Object.entries(category.icons).map(([name, Icon]) => (
                      <button
                        key={name}
                        onClick={() => {
                          onSelect(name);
                          onClose();
                        }}
                        className={`themed-button p-3 rounded-lg hover:text-emerald-400 transition-all ${
                          currentIcon === name ? 'text-emerald-400' : 'text-theme-secondary'
                        }`}
                        title={name}
                      >
                        <Icon size={24} />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
