Okay, here is a comprehensive guide based on our discussion and analysis, detailing the steps to refactor your chart styling system for theme-specific appearances.

---

## Guide: Implementing Theme-Specific Chart Styling

**Goal:** Refactor the current chart and visualization styling to leverage the existing theme system (`src/styles/*.css`), allowing charts, diagrams, and related UI elements to adopt styles specific to the selected theme (Minimal, Glassmorphism, Neumorphism, etc.) instead of using universally hardcoded or basic theme colors.

**Affected Components & Libraries:**

*   **Charting Library:** Recharts (`LineChart`, `PieChart`, `BarChart`, `ComposedChart`)
*   **Recharts Components:**
    *   `src/components/finance/MonthlyTrendsChart.tsx`
    *   `src/components/finance/CategoryDistributionChart.tsx`
    *   `src/components/analytics/CategoryDistribution.tsx`
    *   `src/components/analytics/LifetimeCosts.tsx`
    *   `src/components/analytics/MonthlyTrends.tsx`
*   **Custom Visualization Components:**
    *   `src/components/UsageStatistics.tsx` (Uses Tailwind CSS for progress bars, tables, trend indicators)

**Strategy:**

The core strategy is to define a set of CSS variables for chart-related styles within each theme file. These variables will then be referenced directly in Recharts component props and used to define semantic color classes in Tailwind for styling custom elements.

**Step-by-Step Implementation:**

**Step 1: Define Chart-Specific CSS Variables in Theme Files**

1.  **Identify Necessary Variables:** Determine the different elements within your charts that need theming. A good starting point includes:
    *   Multiple series colors (for lines, bars, pie slices)
    *   Axis lines and text
    *   Grid lines
    *   Tooltip background and text
    *   Colors for positive/negative/neutral trends or states (used in `UsageStatistics`)
    *   Special colors (e.g., for BTC)

2.  **Add Variables to *Each* Theme File:** Open every `.css` file in `src/styles/` and add a dedicated section for chart variables within the `:root` selector. Ensure the variable names are consistent across all files, but assign color values appropriate for that specific theme.

    *Example (`src/styles/minimal.css`):*
    ```css
    /* src/styles/minimal.css */
    :root {
      /* ... existing variables ... */
      --text-primary: #111827; /* Example existing */
      --text-secondary: #6b7280; /* Example existing */
      --background-primary: #ffffff; /* Example existing */
      --background-secondary: #f9fafb; /* Example existing */
      --border-color: #e5e7eb; /* Example existing */
      --accent-color: #10b981; /* Example existing (Emerald-500) */

      /* --- Chart Theme Variables --- */
      /* Base Palette */
      --chart-color-1: #10b981; /* Emerald 500 */
      --chart-color-2: #f59e0b; /* Amber 500 */
      --chart-color-3: #3b82f6; /* Blue 500 */
      --chart-color-4: #8b5cf6; /* Violet 500 */
      --chart-color-5: #ec4899; /* Pink 500 */
      --chart-color-6: #ef4444; /* Red 500 */
      --chart-color-7: #f97316; /* Orange 500 */
      --chart-color-btc: #f7931a; /* Specific BTC Orange */

      /* UI Elements */
      --chart-grid-color: var(--border-color); /* Grid lines */
      --chart-axis-color: var(--text-secondary); /* Axis lines */
      --chart-text-color: var(--text-secondary); /* Axis/Legend text */
      --chart-tooltip-bg: var(--background-secondary); /* Tooltip background */
      --chart-tooltip-text: var(--text-primary); /* Tooltip text */

      /* Semantic Colors (for Usage Statistics & Trends) */
      --chart-positive-color: var(--chart-color-1); /* Green for growth/active */
      --chart-negative-color: var(--chart-color-6); /* Red for decrease/unused */
      --chart-warning-color: var(--chart-color-2); /* Amber for 'not much' */
      --chart-highlight-color: var(--accent-color); /* General highlight, can be primary chart color */

      /* Recharts Specific (can often reuse base palette) */
      --chart-line-stroke: var(--chart-color-1);
      --chart-line-dot-stroke: var(--chart-line-stroke);
      --chart-line-dot-fill: var(--background-primary);
      --chart-bar-fill: var(--chart-color-1);
      --chart-area-fill-1: var(--chart-color-1);
      --chart-area-stroke-1: var(--chart-color-1);
      --chart-area-fill-2: var(--chart-color-6); /* Example for expense stack */
      --chart-area-stroke-2: var(--chart-color-6);
      /* Add more area fills/strokes as needed for stacking */

      /* Pie Chart Slices (map to base palette) */
      --chart-pie-slice-1: var(--chart-color-1);
      --chart-pie-slice-2: var(--chart-color-2);
      --chart-pie-slice-3: var(--chart-color-3);
      --chart-pie-slice-4: var(--chart-color-4);
      --chart-pie-slice-5: var(--chart-color-5);
      /* Add more if needed */
    }
    ```
    *   **Action:** Repeat this process for `glassmorphism.css`, `neumorphism.css`, `aurora.css`, etc., choosing colors that fit each theme's aesthetic. You can reuse existing theme colors (like `--text-primary`) where appropriate.

**Step 2: Register Tailwind Theme Tokens**

Tailwind CSS 4 uses CSS-first configuration. To apply chart colors to custom elements in `UsageStatistics.tsx` and tooltips, register the semantic chart colors in `src/index.css` with `@theme inline`.

1.  **Edit `src/index.css`:** Add the chart CSS variables to the existing `@theme inline` block.

    ```css
    @import "tailwindcss";

    @theme inline {
      --color-theme-primary: var(--text-primary);
      --color-theme-secondary: var(--text-secondary);
      --color-chart-1: var(--chart-color-1);
      --color-chart-2: var(--chart-color-2);
      --color-chart-3: var(--chart-color-3);
      --color-chart-4: var(--chart-color-4);
      --color-chart-5: var(--chart-color-5);
      --color-chart-6: var(--chart-color-6);
      --color-chart-7: var(--chart-color-7);
      --color-chart-btc: var(--chart-color-btc);
      --color-chart-grid: var(--chart-grid-color);
      --color-chart-axis: var(--chart-axis-color);
      --color-chart-text: var(--chart-text-color);
      --color-chart-tooltip-bg: var(--chart-tooltip-bg);
      --color-chart-tooltip-text: var(--chart-tooltip-text);
      --color-chart-positive: var(--chart-positive-color);
      --color-chart-negative: var(--chart-negative-color);
      --color-chart-warning: var(--chart-warning-color);
      --color-chart-highlight: var(--chart-highlight-color);
    }
    ```
    *   **Note:** The app uses `@tailwindcss/vite`, so there is no project-level `tailwind.config.js` or Tailwind PostCSS plugin to update.

**Step 3: Refactor Recharts Components**

Now, modify the Recharts components to use the CSS variables.

1.  **Axes and Grid:**
    *   Find `CartesianGrid`, `XAxis`, `YAxis`.
    *   Replace `stroke={isDark ? ... : ...}` with `stroke="var(--chart-grid-color)"` for `CartesianGrid`.
    *   Replace `stroke={isDark ? ... : ...}` with `stroke="var(--chart-axis-color)"` for `XAxis` and `YAxis`.
    *   Replace `tick={{ fill: isDark ? ... : ... }}` with `tick={{ fill: "var(--chart-text-color)" }}` for axes.

    *Example (`src/components/analytics/MonthlyTrends.tsx`):*
    ```diff
    --- a/src/components/analytics/MonthlyTrends.tsx
    +++ b/src/components/analytics/MonthlyTrends.tsx
    @@ -32,17 +32,17 @@
       <h2 className="text-xl font-semibold mb-4 text-theme-primary">Monthly Trends</h2>
       <ResponsiveContainer width="100%" height={400}>
         <LineChart data={data}>
    -      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e2e8f0'} />
    +      <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid-color)" />
           <XAxis
             dataKey="month"
    -        stroke={isDark ? '#9CA3AF' : '#475569'}
    -        tick={{ fill: isDark ? '#9CA3AF' : '#475569' }}
    +        stroke="var(--chart-axis-color)"
    +        tick={{ fill: "var(--chart-text-color)" }}
           />
           <YAxis
    -        stroke={isDark ? '#9CA3AF' : '#475569'}
    -        tick={{ fill: isDark ? '#9CA3AF' : '#475569' }}
    +        stroke="var(--chart-axis-color)"
    +        tick={{ fill: "var(--chart-text-color)" }}
             tickFormatter={(value) => formatAmount(value, displayCurrency)}
             domain={[0, yAxisMax]}
             tickCount={tickCount}

    ```

2.  **Lines, Bars, Areas:**
    *   Find `Line`, `Bar`, `Area` components.
    *   Replace hardcoded `fill` and `stroke` props (e.g., `'#10B981'`) with the appropriate CSS variable (e.g., `fill="var(--chart-bar-fill)"`, `stroke="var(--chart-line-stroke)"`).
    *   Handle the `isBTC` logic by conditionally applying `var(--chart-color-btc)` or a standard chart variable.
    *   For stacked areas/bars or multiple lines, use different numbered variables (`--chart-color-1`, `--chart-color-2`, etc.).

    *Example (`src/components/analytics/MonthlyTrends.tsx`):*
    ```diff
    --- a/src/components/analytics/MonthlyTrends.tsx
    +++ b/src/components/analytics/MonthlyTrends.tsx
    @@ -58,17 +58,17 @@
             type="monotone"
             dataKey="totalCost"
             name="Total Cost"
    -        stroke={isBTC ? '#f7931a' : '#10B981'}
    +        stroke={isBTC ? 'var(--chart-color-btc)' : 'var(--chart-line-stroke)'}
             strokeWidth={2}
             dot={{
    -          stroke: isBTC ? '#f7931a' : '#10B981',
    +          stroke: isBTC ? 'var(--chart-color-btc)' : 'var(--chart-line-dot-stroke)',
               strokeWidth: 2,
               r: 4,
    -          fill: isDark ? '#1f2937' : '#ffffff'
    +          fill: 'var(--chart-line-dot-fill)' // Use background color
             }}
             activeDot={{
    -          stroke: isBTC ? '#f7931a' : '#10B981',
    +          stroke: isBTC ? 'var(--chart-color-btc)' : 'var(--chart-line-dot-stroke)',
               strokeWidth: 2,
               r: 6,
    -          fill: isDark ? '#1f2937' : '#ffffff'
    +          fill: 'var(--chart-line-dot-fill)' // Use background color
             }}
           />
         </LineChart>

    ```
    *Example (`src/components/analytics/LifetimeCosts.tsx`):*
    ```diff
    --- a/src/components/analytics/LifetimeCosts.tsx
    +++ b/src/components/analytics/LifetimeCosts.tsx
    @@ -153,7 +153,7 @@
         <Bar
           dataKey="totalSpent"
           name="Total Spent"
    -      fill={isBTC ? '#f7931a' : '#10B981'}
    +      fill={isBTC ? 'var(--chart-color-btc)' : 'var(--chart-bar-fill)'}
           radius={[4, 4, 0, 0]}
         />
       </BarChart>

    ```

3.  **Pie Charts:**
    *   Find `Pie` components and the mapping over `data` to create `Cell`s.
    *   Remove the hardcoded `COLORS` array.
    *   Modify the `fill` prop in `Cell` to dynamically use `--chart-pie-slice-` variables based on the index. Handle the `isBTC` case.

    *Example (`src/components/analytics/CategoryDistribution.tsx`):*
    ```diff
    --- a/src/components/analytics/CategoryDistribution.tsx
    +++ b/src/components/analytics/CategoryDistribution.tsx
    @@ -5,8 +5,6 @@
     import { useCurrency } from '../../contexts/CurrencyContext';
     import type { CategoryAnalytics } from '../../types';

    -const COLORS = [\'#10B981\', \'#F59E0B\', \'#EF4444\', \'#8B5CF6\', \'#EC4899\'];
    -
     interface Props {\n       data: CategoryAnalytics[];\n     }\n    @@ -32,7 +30,9 @@
             {data.map((entry, index) => (\n               <Cell
                 key={entry.name}
    -            fill={isBTC ? '#f7931a' : COLORS[index % COLORS.length]}
    +            // Cycle through --chart-pie-slice-1, -2, -3 etc.
    +            // Adjust '5' if you defined more/fewer slice variables
    +            fill={isBTC ? 'var(--chart-color-btc)' : `var(--chart-pie-slice-${(index % 5) + 1})`}
               />
             ))}\n           </Pie>

    ```
    *   **Action:** Apply similar changes to `src/components/finance/CategoryDistributionChart.tsx`. You might need to adjust the number (`5` in the example) based on how many `--chart-pie-slice-` variables you defined.

4.  **Tooltips:**
    *   Find `Tooltip` components and their `content` render prop.
    *   Style the container div using Tailwind classes that map to your CSS variables (e.g., `bg-chart-tooltip-bg`, `text-chart-tooltip-text`, `border-chart-grid`). You might already have a `themed-card` class that works or can be adapted.
    *   Replace hardcoded text color classes within the tooltip (like `text-emerald-500`, `text-red-500`) with the new semantic Tailwind classes (`text-chart-positive`, `text-chart-negative`, `text-chart-1`, etc.).

    *Example (`src/components/analytics/MonthlyTrends.tsx` Tooltip):*
    ```diff
    --- a/src/components/analytics/MonthlyTrends.tsx
    +++ b/src/components/analytics/MonthlyTrends.tsx
    @@ -43,11 +43,12 @@
               if (!active || !payload?.[0]) return null;

               return (
    -            <div className="p-4 rounded-lg shadow-lg backdrop-blur-md bg-gray-900/95 border border-gray-700">
    +            // Use theme-aware classes for background, border, text
    +            <div className="themed-tooltip p-4 rounded-lg shadow-lg border">
                   <p className="font-medium text-base mb-2">{label}</p>
                   <div className="flex justify-between gap-4">
                     <span className="text-theme-secondary">Total Cost:</span>
    -                <span className={isBTC ? 'text-[#f7931a]' : 'text-emerald-500'}>
    +                <span className={isBTC ? 'text-chart-btc' : 'text-chart-positive'}> {/* Or text-chart-1 */}
                       {formatAmount(payload[0].value, displayCurrency)}
                     </span>
                   </div>

    ```
    *   **Note:** You might need to define the `themed-tooltip` class or adjust existing `themed-card` styles to use the `--chart-tooltip-bg`, `--chart-tooltip-text`, and `border-chart-grid` variables/classes.

**Step 4: Refactor `UsageStatistics.tsx`**

This component uses custom elements styled with Tailwind.

1.  **Identify Hardcoded Colors:** Find all instances of `bg-emerald-500`, `text-emerald-500`, `text-red-500`, `bg-red-500`, `text-amber-500`, `bg-amber-500`, `text-[#f7931a]`, `bg-[#f7931a]`, and the `highlight-color` class (if it's hardcoded or should be theme-dependent).
2.  **Replace with Semantic Classes:** Replace these with the corresponding Tailwind classes defined in Step 2.

    *Example (`src/components/UsageStatistics.tsx` - Progress Bars & Trends):*
    ```diff
    --- a/src/components/UsageStatistics.tsx
    +++ b/src/components/UsageStatistics.tsx
    @@ -174,11 +174,11 @@
                 <div className="flex items-center justify-between mb-1">
                   <span className="text-sm text-theme-secondary">New Subscriptions</span>
                   <div className="flex items-center gap-2">
    -                <span className={trends.subscriptionGrowth.trend >= 0 ? 'highlight-color' : 'text-red-500'}>
    +                <span className={trends.subscriptionGrowth.trend >= 0 ? 'text-chart-positive' : 'text-chart-negative'}>
                       {trends.subscriptionGrowth.trend.toFixed(1)}%
                     </span>
     -                {trends.subscriptionGrowth.trend >= 0 ?
     -                  <TrendingUp size={16} className="highlight-color" /> :
     -                  <TrendingDown size={16} className="text-red-500" />}
    +                {trends.subscriptionGrowth.trend >= 0 ?
    +                  <TrendingUp size={16} className="text-chart-positive" /> :
    +                  <TrendingDown size={16} className="text-chart-negative" />}
                   </div>
                 </div>
                 <div className="progress-bar-bg">
     -              <div
     -                className={`${isBTC ? 'bg-[#f7931a]' : 'bg-emerald-500'} h-2 rounded-full transition-all`}
     +              <div // Use background color for positive trend
     +                className={`${isBTC ? 'bg-chart-btc' : 'bg-chart-positive'} h-2 rounded-full transition-all`}
                     style={{ width: `${Math.min(Math.abs(trends.subscriptionGrowth.trend), 100)}%` }}
                   />
                 </div>
    @@ -187,17 +187,17 @@
                 <div className="flex items-center justify-between mb-1">
                   <span className="text-sm text-theme-secondary">Monthly Cost</span>
                   <div className="flex items-center gap-2">
    -                <span className={trends.costGrowth.trend >= 0 ? 'highlight-color' : 'text-red-500'}>
    +                <span className={trends.costGrowth.trend >= 0 ? 'text-chart-positive' : 'text-chart-negative'}>
                       {trends.costGrowth.trend.toFixed(1)}%
                     </span>
     -                {trends.costGrowth.trend >= 0 ?
     -                  <TrendingUp size={16} className="highlight-color" /> :
     -                  <TrendingDown size={16} className="text-red-500" />}
    +                {trends.costGrowth.trend >= 0 ?
    +                  <TrendingUp size={16} className="text-chart-positive" /> :
    +                  <TrendingDown size={16} className="text-chart-negative" />}
                   </div>
                 </div>
                 <div className="progress-bar-bg">
     -              <div
     -                className={`${isBTC ? 'bg-[#f7931a]' : 'bg-emerald-500'} h-2 rounded-full transition-all`}
     +              <div // Use background color for positive trend
     +                className={`${isBTC ? 'bg-chart-btc' : 'bg-chart-positive'} h-2 rounded-full transition-all`}
                     style={{ width: `${Math.min(Math.abs(trends.costGrowth.trend), 100)}%` }}
                   />
                 </div>
    @@ -212,11 +212,11 @@
             <div>
               <div className="flex items-center justify-between mb-1">
                 <span className="text-sm text-theme-secondary">Active</span>
    -            <span className="highlight-color">{trends.usageDistribution.active.toFixed(1)}%</span>
    +            <span className="text-chart-positive">{trends.usageDistribution.active.toFixed(1)}%</span>
               </div>
               <div className="progress-bar-bg">
                 <div
     -              className={`${isBTC ? 'bg-[#f7931a]' : 'bg-emerald-500'} h-2 rounded-full transition-all`}
    +              className={`${isBTC ? 'bg-chart-btc' : 'bg-chart-positive'} h-2 rounded-full transition-all`}
                   style={{ width: `${trends.usageDistribution.active}%` }}
                 />
               </div>
    @@ -224,11 +224,11 @@
             <div>
               <div className="flex items-center justify-between mb-1">
                 <span className="text-sm text-theme-secondary">Not Much</span>
    -            <span className="text-amber-500">{trends.usageDistribution.notMuch.toFixed(1)}%</span>
    +            <span className="text-chart-warning">{trends.usageDistribution.notMuch.toFixed(1)}%</span>
               </div>
               <div className="progress-bar-bg">
                 <div
    -              className="bg-amber-500 h-2 rounded-full transition-all"
    +              className="bg-chart-warning h-2 rounded-full transition-all"
                   style={{ width: `${trends.usageDistribution.notMuch}%` }}
                 />
               </div>
    @@ -236,11 +236,11 @@
             <div>
               <div className="flex items-center justify-between mb-1">
                 <span className="text-sm text-theme-secondary">Unused</span>
    -            <span className="text-red-500">{trends.usageDistribution.unused.toFixed(1)}%</span>
    +            <span className="text-chart-negative">{trends.usageDistribution.unused.toFixed(1)}%</span>
               </div>
               <div className="progress-bar-bg">
                 <div
    -              className="bg-red-500 h-2 rounded-full transition-all"
    +              className="bg-chart-negative h-2 rounded-full transition-all"
                   style={{ width: `${trends.usageDistribution.unused}%` }}
                 />
               </div>
    @@ -255,11 +255,11 @@
             <div>
               <div className="flex items-center justify-between mb-1">
                 <span className="text-sm text-theme-secondary">Monthly Plans</span>
    -            <span className="highlight-color">{trends.billingDistribution.monthly.toFixed(1)}%</span>
    +            <span className="text-chart-highlight">{trends.billingDistribution.monthly.toFixed(1)}%</span>
               </div>
               <div className="progress-bar-bg">
                 <div
    -              className={`${isBTC ? 'bg-[#f7931a]' : 'bg-emerald-500'} h-2 rounded-full transition-all`}
    +              className={`${isBTC ? 'bg-chart-btc' : 'bg-chart-highlight'} h-2 rounded-full transition-all`}
                   style={{ width: `${trends.billingDistribution.monthly}%` }}
                 />
               </div>
    @@ -267,11 +267,11 @@
             <div>
               <div className="flex items-center justify-between mb-1">
                 <span className="text-sm text-theme-secondary">Yearly Plans</span>
    -            <span className="highlight-color">{trends.billingDistribution.yearly.toFixed(1)}%</span>
    +            <span className="text-chart-highlight">{trends.billingDistribution.yearly.toFixed(1)}%</span>
               </div>
               <div className="progress-bar-bg">
                 <div
    -              className={`${isBTC ? 'bg-[#f7931a]' : 'bg-emerald-500'} h-2 rounded-full transition-all`}
    +              className={`${isBTC ? 'bg-chart-btc' : 'bg-chart-highlight'} h-2 rounded-full transition-all`}
                   style={{ width: `${trends.billingDistribution.yearly}%` }}
                 />
               </div>
    @@ -284,11 +284,11 @@
           <div className="space-y-4">
             <div className="flex items-center justify-between">
               <span className="text-sm text-theme-secondary">New Subscriptions (3mo)</span>
    -          <span className="highlight-color">{trends.subscriptionGrowth.recent}</span>
    +          <span className="text-chart-highlight">{trends.subscriptionGrowth.recent}</span>
             </div>
             <div className="flex items-center justify-between">
               <span className="text-sm text-theme-secondary">Added Monthly Cost</span>
    -          <span className="highlight-color">
    +          <span className="text-chart-highlight">
                 {formatAmount(trends.costGrowth.recent, displayCurrency)}
               </span>
             </div>

    ```
    *   **Action:** Apply similar replacements throughout `UsageStatistics.tsx`, including the Payment Method stats, Category Usage stats, and the main table (e.g., for the Usage Status badges). Use the appropriate semantic classes (`text-chart-positive`, `text-chart-negative`, `text-chart-warning`, `bg-chart-...`, etc.).

**Step 5: Testing**

1.  **Switch Themes:** Thoroughly test the application by switching between all available themes.
2.  **Check Charts:** Verify that all charts (lines, bars, pies, composed) and the elements in `UsageStatistics` correctly adopt the colors defined in the active theme's CSS file.
3.  **Check BTC Mode:** Ensure charts and stats still display the correct BTC orange color when Bitcoin is selected as the display currency.
4.  **Inspect Tooltips:** Hover over chart elements to check if tooltips are styled correctly according to the theme.
5.  **Cross-Browser Check:** If necessary, perform basic checks in different browsers.

---

This step-by-step guide provides a clear path to integrating your chart styling with your theme system. Remember to carefully define the CSS variables in each theme file to match its specific aesthetic.
