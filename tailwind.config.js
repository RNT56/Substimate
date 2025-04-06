/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Your existing custom colors...
        'theme-primary': 'var(--text-primary)',
        'theme-secondary': 'var(--text-secondary)',
        // ... etc

        // Add Chart Colors
        'chart-1': 'var(--chart-color-1)',
        'chart-2': 'var(--chart-color-2)',
        'chart-3': 'var(--chart-color-3)',
        'chart-4': 'var(--chart-color-4)',
        'chart-5': 'var(--chart-color-5)',
        'chart-6': 'var(--chart-color-6)',
        'chart-7': 'var(--chart-color-7)',
        'chart-btc': 'var(--chart-color-btc)',
        'chart-grid': 'var(--chart-grid-color)',
        'chart-axis': 'var(--chart-axis-color)',
        'chart-text': 'var(--chart-text-color)',
        'chart-tooltip-bg': 'var(--chart-tooltip-bg)',
        'chart-tooltip-text': 'var(--chart-tooltip-text)',
        'chart-positive': 'var(--chart-positive-color)',
        'chart-negative': 'var(--chart-negative-color)',
        'chart-warning': 'var(--chart-warning-color)',
        'chart-highlight': 'var(--chart-highlight-color)',
        'analytics-text-highlight': 'var(--analytics-text-highlight-color)',
      },
      // Optional: If you need explicit fill/stroke utilities
      fill: theme => ({
        ...theme('colors'), // Include existing colors if needed
        // e.g., fill-chart-1, fill-chart-positive
      }),
      stroke: theme => ({
         ...theme('colors'), // Include existing colors if needed
         // e.g., stroke-chart-1, stroke-chart-grid
      }),
    },
  },
  plugins: [],
};