import React from 'react';
import { Settings, Upload, Database, Bell, Shield, Palette } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useCurrency } from '../contexts/CurrencyContext';

export function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const { displayCurrency, setDisplayCurrency } = useCurrency();
  const isDark = theme === 'dark';
  const isBTC = displayCurrency === 'BTC';

  const sections = [
    {
      icon: Palette,
      title: 'Appearance',
      description: 'Customize how Substimate looks and feels',
      settings: [
        {
          name: 'Theme',
          description: 'Choose between light and dark mode',
          control: (
            <button
              onClick={toggleTheme}
              className="neumorphic-button px-4 py-2 rounded-lg text-theme-secondary hover:text-theme-primary"
            >
              {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
            </button>
          )
        }
      ]
    },
    {
      icon: Database,
      title: 'Data Management',
      description: 'Import and manage your financial data',
      settings: [
        {
          name: 'Import Data',
          description: 'Import subscriptions from bank statements',
          control: (
            <button
              onClick={() => {}}
              className={`neumorphic-button px-4 py-2 rounded-lg ${
                isBTC ? 'text-[#f7931a]' : 'text-emerald-400'
              } hover:opacity-80`}
            >
              Import
            </button>
          )
        }
      ]
    },
    {
      icon: Bell,
      title: 'Notifications',
      description: 'Manage your notification preferences',
      settings: [
        {
          name: 'Payment Reminders',
          description: 'Get notified before payments are due',
          control: (
            <div className="flex items-center">
              <input
                type="checkbox"
                id="payment-reminders"
                className="sr-only"
                checked={true}
                onChange={() => {}}
              />
              <label
                htmlFor="payment-reminders"
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  true ? 'bg-emerald-500' : 'bg-gray-700'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  true ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </label>
            </div>
          )
        }
      ]
    },
    {
      icon: Shield,
      title: 'Security',
      description: 'Manage your security settings',
      settings: [
        {
          name: 'Two-Factor Authentication',
          description: 'Add an extra layer of security',
          control: (
            <button
              onClick={() => {}}
              className="neumorphic-button px-4 py-2 rounded-lg text-theme-secondary hover:text-theme-primary"
            >
              Enable
            </button>
          )
        }
      ]
    }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2 title-gradient">Settings</h1>
        <p className="text-theme-secondary">Customize your Substimate experience</p>
      </div>

      <div className="space-y-6">
        {sections.map((section) => (
          <div key={section.title} className="neumorphic-card rounded-xl p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className={`p-3 rounded-lg ${isBTC ? 'bg-[#f7931a]/10' : 'bg-emerald-500/10'}`}>
                <section.icon 
                  size={24} 
                  className={isBTC ? 'text-[#f7931a]' : 'text-emerald-400'} 
                />
              </div>
              <div>
                <h2 className="text-xl font-bold text-theme-primary">{section.title}</h2>
                <p className="text-theme-secondary">{section.description}</p>
              </div>
            </div>

            <div className="space-y-6">
              {section.settings.map((setting) => (
                <div key={setting.name} className="flex items-center justify-between">
                  <div>
                    <h3 className="text-theme-primary font-medium">{setting.name}</h3>
                    <p className="text-sm text-theme-secondary">{setting.description}</p>
                  </div>
                  {setting.control}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}