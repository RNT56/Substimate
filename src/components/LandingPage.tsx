import React from 'react';
import { BarChart2 as ChartBar, Clock, CreditCard, Shield, Zap, Sparkles, BarChart3, Wallet } from 'lucide-react';
import { useCurrency } from '../contexts/CurrencyContext';

interface Props {
  onGetStarted: () => void;
}

export function LandingPage({ onGetStarted }: Props) {
  const { displayCurrency } = useCurrency();
  const isBTC = displayCurrency === 'BTC';

  const features = [
    {
      icon: ChartBar,
      title: 'Track Expenses',
      description: 'Monitor your subscription costs and analyze spending patterns over time.'
    },
    {
      icon: Clock,
      title: 'Usage Insights',
      description: 'Track how often you use each service to make informed decisions.'
    },
    {
      icon: CreditCard,
      title: 'Payment Management',
      description: 'Keep track of payment methods and billing cycles in one place.'
    },
    {
      icon: Shield,
      title: 'Secure & Private',
      description: 'Your data is encrypted and protected with industry-standard security.'
    }
  ];

  const benefits = [
    {
      icon: Zap,
      title: 'Save Money',
      description: 'Identify unused subscriptions and reduce unnecessary expenses.'
    },
    {
      icon: Sparkles,
      title: 'Stay Organized',
      description: 'Never lose track of your subscriptions and payment dates.'
    },
    {
      icon: BarChart3,
      title: 'Smart Analytics',
      description: 'Get insights into your spending habits and optimize costs.'
    },
    {
      icon: Wallet,
      title: 'Budget Better',
      description: 'Plan your finances with accurate monthly cost predictions.'
    }
  ];

  return (
    <div className="space-y-24 pb-24">
      {/* Hero Section */}
      <div className="text-center space-y-8">
        <h1 className="text-4xl md:text-6xl font-bold mb-6 title-gradient">
          Manage Your Subscriptions<br />Like Never Before
        </h1>
        <p className="text-xl text-theme-secondary max-w-2xl mx-auto">
          Take control of your digital subscriptions with powerful tracking, analytics, and optimization tools.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={onGetStarted}
            className={`neumorphic-button px-8 py-4 rounded-xl ${
              isBTC ? 'text-[#f7931a]' : 'text-emerald-400'
            } hover:opacity-80 w-full sm:w-auto`}
          >
            Get Started - It's Free
          </button>
          <a
            href="#features"
            className="neumorphic-button px-8 py-4 rounded-xl text-theme-secondary hover:text-theme-primary w-full sm:w-auto"
          >
            Learn More
          </a>
        </div>
      </div>

      {/* Features Grid */}
      <div id="features" className="space-y-12">
        <h2 className="text-3xl font-bold text-center mb-12 text-theme-primary">
          Everything You Need
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="neumorphic-card rounded-xl p-6 text-center space-y-4"
            >
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg ${
                isBTC ? 'bg-[#f7931a]/10' : 'bg-emerald-500/10'
              }`}>
                <feature.icon className={`w-6 h-6 ${
                  isBTC ? 'text-[#f7931a]' : 'text-emerald-400'
                }`} />
              </div>
              <h3 className="text-xl font-semibold text-theme-primary">{feature.title}</h3>
              <p className="text-theme-secondary">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Analytics Preview */}
      <div className="space-y-12">
        <h2 className="text-3xl font-bold text-center mb-12 text-theme-primary">
          Powerful Analytics
        </h2>
        <div className="neumorphic-card rounded-xl p-8 relative overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1642790106117-e829e14a795f?auto=format&fit=crop&w=2000&q=80"
            alt="Analytics Dashboard"
            className="rounded-lg w-full object-cover"
            style={{ maxHeight: '600px' }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end p-8">
            <div className="text-white max-w-xl">
              <h3 className="text-2xl font-bold mb-4">Visual Insights</h3>
              <p className="text-gray-200">
                Get detailed charts and analytics to understand your subscription spending patterns
                and make data-driven decisions.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="space-y-12">
        <h2 className="text-3xl font-bold text-center mb-12 text-theme-primary">
          Why Choose Substimate?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {benefits.map((benefit) => (
            <div
              key={benefit.title}
              className="neumorphic-card rounded-xl p-6 text-center space-y-4"
            >
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg ${
                isBTC ? 'bg-[#f7931a]/10' : 'bg-emerald-500/10'
              }`}>
                <benefit.icon className={`w-6 h-6 ${
                  isBTC ? 'text-[#f7931a]' : 'text-emerald-400'
                }`} />
              </div>
              <h3 className="text-xl font-semibold text-theme-primary">{benefit.title}</h3>
              <p className="text-theme-secondary">{benefit.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="text-center space-y-8">
        <h2 className="text-3xl font-bold text-theme-primary">
          Ready to Take Control?
        </h2>
        <p className="text-xl text-theme-secondary max-w-2xl mx-auto">
          Join thousands of users who are already saving money and managing their subscriptions better.
        </p>
        <button
          onClick={onGetStarted}
          className={`neumorphic-button px-8 py-4 rounded-xl ${
            isBTC ? 'text-[#f7931a]' : 'text-emerald-400'
          } hover:opacity-80`}
        >
          Get Started Now
        </button>
      </div>
    </div>
  );
}