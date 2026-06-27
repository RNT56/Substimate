Okay, let's break down the current styling system and map out a transition to a more flexible theme-based approach.

**Current Styling System Analysis**

1.  **Core Mechanism:**
    *   **Theme Context (`ThemeContext.tsx`):** Manages a simple `'light' | 'dark'` state. It persists the choice to `localStorage` and applies it to the root HTML element via the `data-theme` attribute (`document.documentElement.setAttribute('data-theme', theme)`).
    *   **CSS Variables (`index.css`):** Defines two main blocks of CSS variables within `@layer base`:
        *   `:root[data-theme="dark"] { ... }`
        *   `:root[data-theme="light"] { ... }`
        These variables control fundamental colors (backgrounds, text, borders, etc.) for each mode.
    *   **Tailwind CSS:** Used for utility classes and the base styling framework.
    *   **Custom Component Styles (`@layer components` in `index.css`):**
        *   Defines reusable component classes (e.g., `.title-gradient`, `.dashboard-card`, `.text-theme-primary`).
        *   **Crucially, it mixes visual styles (Neumorphism, Glassmorphism) with responsiveness:**
            *   `@media (min-width: 768px)` applies neumorphic styles (`.neumorphic-button`, `.neumorphic-card`, `.neumorphic-input`) using CSS variables.
            *   `@media (max-width: 767px)` applies glassmorphic styles to the *same class names* (`.neumorphic-button`, etc.) using different CSS variables (`--glass-bg`, `--glass-border`). This forces Neumorphism on desktop and Glassmorphism on mobile, regardless of user preference.
    *   **Ad-hoc Overrides:** There's a specific override for `--highlight-color` based on `data-currency="BTC"`, which is separate from the main light/dark/visual theme system.

2.  **Strengths:**
    *   Clear separation of light/dark color palettes using CSS variables.
    *   Uses a standard React context for theme management.
    *   Leverages Tailwind CSS effectively.

3.  **Weaknesses:**
    *   **Conflates Visual Style and Responsiveness:** The primary issue is that the choice between Neumorphism and Glassmorphism is hardcoded to screen size within the CSS, not user-configurable.
    *   **Limited Theming:** Only supports light/dark modes. Adding new visual themes (e.g., "Material", "Classic Flat") would require significant refactoring of the media queries and potentially CSS variable names.
    *   **Inflexible Class Names:** Using `.neumorphic-*` class names for styles that become glassmorphic on mobile is confusing.

**Styled Components and Pages**

Based on the provided file lists, essentially *all* components and pages are participants in this styling system, as they will inherit base styles (like background and text color) and likely use custom component classes or Tailwind utilities that rely on the theme variables.

*   **Pages (`src/pages`):** `FinancePage`, `ImportDataPage`, `PaydayCalendarPage`, `SettingsPage`, `CalculatorPage`, `CostTrackerPage`.
*   **Components (`src/components`):** `Layout`, `Sidebar`, `MobileHeader`, `MobileMenu`, `SubscriptionCard`, `AddSubscriptionModal`, `EditSubscriptionModal`, `TransactionModal`, `ExpenseModal`, `IncomeModal`, `DashboardGrid`, `DraggableDashboardCard`, `DatePicker`, `ThemeToggle`, `UsageStatistics`, `AuthModal`, `CategoryFilter`, `CurrencySelector`, `IconSelector`, `LandingPage`, `SearchBar`, `SortableSubscriptionCard`, `SubscriptionAnalytics`, `SubscriptionList`, `ActionButtons`, `AssetManagementModal`, `ErrorBoundary`, and likely components within the `finance/`, `cost-tracker/`, `analytics/` subdirectories.

**Plan for Transition to Theme-Based System**

The goal is to decouple the *Color Scheme* (Light/Dark) from the *Visual Style* (Neumorphic, Glassmorphic, etc.) and allow the user to choose their preferred Visual Style, which should apply consistently across screen sizes while still respecting the selected Color Scheme.

**Phase 1: Enhance Theme Context & State**

1.  **Modify `ThemeContext.tsx`:**
    *   Introduce a `VisualStyle` type: `type VisualStyle = 'neumorphic' | 'glassmorphic'; // Add more later`.
    *   Add `visualStyle` state to the context, managed similarly to `theme` (using `useState` and `localStorage`).
    *   Add a `setVisualStyle` function to the context value.
    *   Modify the `useEffect` to set both `data-theme` and a new `data-visual-style` attribute on `document.documentElement`.
    ```typescript:src/contexts/ThemeContext.tsx
    import React, { createContext, useContext, useState, useEffect } from 'react';

    type Theme = 'dark' | 'light';
    type VisualStyle = 'neumorphic' | 'glassmorphic'; // Add more styles as needed

    interface ThemeContextType {
      theme: Theme;
      visualStyle: VisualStyle;
      toggleTheme: () => void;
      setVisualStyle: (style: VisualStyle) => void;
    }

    const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

    export function ThemeProvider({ children }: { children: React.ReactNode }) {
      const [theme, setTheme] = useState<Theme>(() => {
        const savedTheme = localStorage.getItem('theme');
        return (savedTheme as Theme) || 'dark';
      });

      const [visualStyle, setVisualStyleInternal] = useState<VisualStyle>(() => {
        const savedStyle = localStorage.getItem('visualStyle');
        // Default to neumorphic or another preferred default
        return (savedStyle as VisualStyle) || 'neumorphic';
      });

      useEffect(() => {
        localStorage.setItem('theme', theme);
        document.documentElement.setAttribute('data-theme', theme);
      }, [theme]);

      useEffect(() => {
        localStorage.setItem('visualStyle', visualStyle);
        document.documentElement.setAttribute('data-visual-style', visualStyle);
      }, [visualStyle]);

      const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
      };

      const setVisualStyle = (style: VisualStyle) => {
        setVisualStyleInternal(style);
      };

      return (
        <ThemeContext.Provider value={{ theme, visualStyle, toggleTheme, setVisualStyle }}>
          {children}
        </ThemeContext.Provider>
      );
    }

    export function useTheme() { // Keep hook name or rename to useAppTheme etc. if preferred
      const context = useContext(ThemeContext);
      if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
      }
      return context;
    }

    ```

**Phase 2: Refactor CSS (`index.css`)**

1.  **Restructure CSS Variables:** Define variables based on combinations of `data-theme` and `data-visual-style`. Remove the style-switching logic from the media queries.
    ```css:src/index.css
    @import "tailwindcss";

    @theme inline {
      --color-theme-primary: var(--text-primary);
      --color-theme-secondary: var(--text-secondary);
      --color-theme-tertiary: var(--text-tertiary);
      --color-theme-border: var(--border-color);
    }

    @layer base {
      /* --- Base Color Scheme Variables --- */
      :root[data-theme="dark"] {
        --bg-gradient-from: #1a1a1a;
        --bg-gradient-to: #2d2d2d;
        --text-primary: #ffffff;
        --text-secondary: #9ca3af;
        --text-tertiary: #6b7280;
        --border-color: #404040;
        --title-gradient: linear-gradient(135deg, #ffffff 0%, #e2e8f0 100%);
        /* Define NEUMORPHIC DARK variables */
        --neumorphic-from-dark: #2d2d2d;
        --neumorphic-to-dark: #252525;
        --neumorphic-shadow-dark-dark: #1a1a1a;
        --neumorphic-shadow-light-dark: #343434;
        --input-bg-neumorphic-dark: #2d2d2d;
        /* Define GLASSMORPHIC DARK variables */
        --glass-bg-dark: rgba(45, 45, 45, 0.8);
        --glass-border-dark: rgba(255, 255, 255, 0.1);
        --card-bg-glass-dark: var(--glass-bg-dark);
        --card-hover-glass-dark: rgba(45, 45, 45, 0.9);
      }

      :root[data-theme="light"] {
        --bg-gradient-from: #f8fafc;
        --bg-gradient-to: #f1f5f9;
        --text-primary: #1e293b;
        --text-secondary: #475569;
        --text-tertiary: #64748b;
        --border-color: #e2e8f0;
        --title-gradient: linear-gradient(135deg, #1e293b 0%, #334155 100%);
        /* Define NEUMORPHIC LIGHT variables */
        --neumorphic-from-light: #ffffff;
        --neumorphic-to-light: #f8fafc;
        --neumorphic-shadow-dark-light: #d1d5db;
        --neumorphic-shadow-light-light: #ffffff;
        --input-bg-neumorphic-light: #ffffff;
        /* Define GLASSMORPHIC LIGHT variables */
        --glass-bg-light: rgba(255, 255, 255, 0.8);
        --glass-border-light: rgba(0, 0, 0, 0.1);
        --card-bg-glass-light: var(--glass-bg-light);
        --card-hover-glass-light: rgba(255, 255, 255, 0.9);
      }

      /* --- Visual Style Specific Variables --- */

      /* Neumorphic Light */
      :root[data-visual-style="neumorphic"][data-theme="light"] {
        --card-bg: linear-gradient(145deg, var(--neumorphic-from-light), var(--neumorphic-to-light));
        --card-hover: linear-gradient(145deg, var(--neumorphic-to-light), var(--neumorphic-from-light)); /* Adjust hover */
        --card-shadow: 8px 8px 16px var(--neumorphic-shadow-dark-light), -8px -8px 16px var(--neumorphic-shadow-light-light);
        --card-border: transparent;
        --button-bg: linear-gradient(145deg, var(--neumorphic-from-light), var(--neumorphic-to-light));
        --button-shadow: 6px 6px 12px var(--neumorphic-shadow-dark-light), -6px -6px 12px var(--neumorphic-shadow-light-light);
        --button-border: transparent;
        --input-bg: var(--input-bg-neumorphic-light);
        --input-shadow: inset 4px 4px 8px var(--neumorphic-shadow-dark-light), inset -4px -4px 8px var(--neumorphic-shadow-light-light);
        --input-border: transparent;
        --icon-bg: var(--neumorphic-to-light);
        --icon-shadow: 4px 4px 8px var(--neumorphic-shadow-dark-light), -4px -4px 8px var(--neumorphic-shadow-light-light);
        --icon-border: transparent;
        --backdrop-filter: none;
      }

      /* Neumorphic Dark */
      :root[data-visual-style="neumorphic"][data-theme="dark"] {
        --card-bg: linear-gradient(145deg, var(--neumorphic-from-dark), var(--neumorphic-to-dark));
        --card-hover: linear-gradient(145deg, var(--neumorphic-to-dark), var(--neumorphic-from-dark)); /* Adjust hover */
        --card-shadow: 8px 8px 16px var(--neumorphic-shadow-dark-dark), -8px -8px 16px var(--neumorphic-shadow-light-dark);
        --card-border: transparent;
        --button-bg: linear-gradient(145deg, var(--neumorphic-from-dark), var(--neumorphic-to-dark));
        --button-shadow: 6px 6px 12px var(--neumorphic-shadow-dark-dark), -6px -6px 12px var(--neumorphic-shadow-light-dark);
        --button-border: transparent;
        --input-bg: var(--input-bg-neumorphic-dark);
        --input-shadow: inset 4px 4px 8px var(--neumorphic-shadow-dark-dark), inset -4px -4px 8px var(--neumorphic-shadow-light-dark);
        --input-border: transparent;
        --icon-bg: var(--neumorphic-from-dark);
        --icon-shadow: 4px 4px 8px var(--neumorphic-shadow-dark-dark), -4px -4px 8px var(--neumorphic-shadow-light-dark);
        --icon-border: transparent;
        --backdrop-filter: none;
      }

      /* Glassmorphic Light */
      :root[data-visual-style="glassmorphic"][data-theme="light"] {
        --card-bg: var(--card-bg-glass-light);
        --card-hover: var(--card-hover-glass-light);
        --card-shadow: none;
        --card-border: 1px solid var(--glass-border-light);
        --button-bg: var(--glass-bg-light);
        --button-shadow: none;
        --button-border: 1px solid var(--glass-border-light);
        --input-bg: var(--glass-bg-light);
        --input-shadow: none;
        --input-border: 1px solid var(--glass-border-light);
        --icon-bg: var(--glass-bg-light);
        --icon-shadow: none;
        --icon-border: 1px solid var(--glass-border-light);
        --backdrop-filter: blur(8px);
      }

      /* Glassmorphic Dark */
      :root[data-visual-style="glassmorphic"][data-theme="dark"] {
        --card-bg: var(--card-bg-glass-dark);
        --card-hover: var(--card-hover-glass-dark);
        --card-shadow: none;
        --card-border: 1px solid var(--glass-border-dark);
        --button-bg: var(--glass-bg-dark);
        --button-shadow: none;
        --button-border: 1px solid var(--glass-border-dark);
        --input-bg: var(--glass-bg-dark);
        --input-shadow: none;
        --input-border: 1px solid var(--glass-border-dark);
        --icon-bg: var(--glass-bg-dark);
        --icon-shadow: none;
        --icon-border: 1px solid var(--glass-border-dark);
        --backdrop-filter: blur(8px);
      }

      /* --- Highlight Color Override (Keep separate) --- */
      :root {
         /* Define default highlight */
         --highlight-color-default: #10B981;
         --highlight-color: var(--highlight-color-default);
      }
       :root[data-currency="BTC"] {
         --highlight-color: #f7931a;
       }

      /* --- Base Body Styles --- */
      body {
        background: linear-gradient(145deg, var(--bg-gradient-from), var(--bg-gradient-to));
        min-height: 100vh;
        color: var(--text-primary);
      }

       /* Apply backdrop filter generally if needed by a theme */
      .apply-backdrop-filter {
         backdrop-filter: var(--backdrop-filter);
      }
    }

    @layer components {
      /* --- Refactored Generic Themed Components --- */
      .themed-button {
        @apply transition-all p-2 rounded-lg;
        background: var(--button-bg);
        border: var(--button-border);
        box-shadow: var(--button-shadow);
        backdrop-filter: var(--backdrop-filter); /* Apply here if buttons need it */
      }
      .themed-button:hover {
         /* Define hover using variables if they exist, or simple opacity */
         opacity: 0.9; /* Simple example */
      }

      .themed-card {
         @apply p-4 rounded-lg transition-all;
         background: var(--card-bg);
         border: var(--card-border);
         box-shadow: var(--card-shadow);
         backdrop-filter: var(--backdrop-filter); /* Apply here if cards need it */
      }
       .themed-card:hover {
         background: var(--card-hover, var(--card-bg)); /* Use hover var if defined */
       }

      .themed-input {
         @apply p-2 rounded-lg w-full;
         background: var(--input-bg);
         border: var(--input-border);
         box-shadow: var(--input-shadow);
         color: var(--text-primary); /* Ensure text color is correct */
         backdrop-filter: var(--backdrop-filter); /* Apply here if inputs need it */
      }
       .themed-input::placeholder {
         color: var(--text-tertiary);
       }

      .themed-icon-container {
         @apply p-2 rounded-lg;
         background: var(--icon-bg);
         border: var(--icon-border);
         box-shadow: var(--icon-shadow);
         backdrop-filter: var(--backdrop-filter); /* Apply here if icons need it */
      }

      /* --- Remove Old Media Query Style Switching --- */
      /* DELETE the @media blocks that applied .neumorphic-* styles differently */

      /* --- Keep Responsive Layout Adjustments --- */
      @media (max-width: 767px) {
         /* Example: Adjust padding, margins, font sizes for mobile layout */
         .themed-card {
            @apply p-3;
         }
      }

       /* --- Utility classes based on theme vars (Keep/Update) --- */
       .title-gradient {
         background: var(--title-gradient);
         -webkit-background-clip: text;
         -webkit-text-fill-color: transparent;
         background-clip: text;
       }

      .highlight-color { color: var(--highlight-color); }
      .bg-highlight { background-color: var(--highlight-color); }
      .text-highlight { color: var(--highlight-color); }
      .border-highlight { border-color: var(--highlight-color); }

      .progress-bar-bg { /* Decide how progress bar looks per theme? Or keep simple? */
         /* Example: Make it depend on theme */
         background-color: var(--text-tertiary);
         opacity: 0.5;
         @apply rounded-full;
      }
      /* Update other utilities like text-theme-* to use primary/secondary/tertiary */
      .text-theme-primary { color: var(--text-primary); }
      .text-theme-secondary { color: var(--text-secondary); }
      .text-theme-tertiary { color: var(--text-tertiary); }

      /* Custom scrollbar styles */
      .custom-scrollbar { scrollbar-width: thin; scrollbar-color: var(--text-tertiary) transparent; }
      .custom-scrollbar::-webkit-scrollbar { width: 6px; }
      .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
      .custom-scrollbar::-webkit-scrollbar-thumb { background-color: var(--text-tertiary); border-radius: 3px; }

      /* Add class for elements needing blur */
       .needs-backdrop-filter {
           backdrop-filter: var(--backdrop-filter);
       }
    }

    ```

**Phase 3: Refactor Components**

1.  **Search & Replace:** Use IDE search/replace or `grep` to find all occurrences of `neumorphic-button`, `neumorphic-card`, `neumorphic-input`, `icon-container` across all `.tsx` files in `src/components` and `src/pages`.
2.  **Replace:** Replace them with the corresponding new generic classes: `themed-button`, `themed-card`, `themed-input`, `themed-icon-container`.
3.  **Backdrop Filter:** For components that should have the blur effect in Glassmorphism (like cards, buttons, inputs if desired), add the `needs-backdrop-filter` class in addition to the `themed-*` class. The CSS variable `--backdrop-filter` will be `none` for Neumorphic and `blur(8px)` (or similar) for Glassmorphic.

**Phase 4: Implement Theme Switching UI**

1.  **Update `SettingsPage.tsx` (or similar):**
    *   Import `useTheme` and `VisualStyle`.
    *   Add UI elements (e.g., Radio Group, Select dropdown) to display the available visual styles (`'neumorphic'`, `'glassmorphic'`).
    *   Bind the UI element's value to `visualStyle` from `useTheme`.
    *   On change, call `setVisualStyle(newStyle)`.
2.  **Modify `ThemeToggle.tsx`:** Ensure it only toggles `theme` (light/dark) and doesn't interfere with the visual style selection.

**Phase 5: Testing**

1.  Test all combinations: Light/Dark x Neumorphic/Glassmorphic.
2.  Verify on desktop and mobile viewport sizes that the chosen visual style is applied consistently.
3.  Confirm responsive *layout* adjustments still work correctly.
4.  Test components using the themed classes (`themed-button`, `themed-card`, etc.).
5.  Test the highlight color override with `data-currency="BTC"`.
6.  Test the theme persistence across page reloads.

This structured approach separates concerns effectively, making the styling system much more flexible and maintainable for adding future visual themes.
