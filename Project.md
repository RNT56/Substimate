# Substimate Project Documentation

## Project Overview

Substimate is a comprehensive financial management application focused on helping users track and manage their subscriptions and financial data. The application provides features for subscription tracking, financial analytics, cost tracking, and more.

## Tech Stack

- **Frontend Framework**: React with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Backend/Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Routing**: React Router
- **Charts/Visualization**: Recharts, D3-Sankey
- **Drag and Drop**: @dnd-kit libraries

## Project Structure

```
├── src/                # Application source code
│   ├── components/     # React components
│   ├── contexts/       # React context providers
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Core utilities and configurations
│   ├── pages/          # Page components
│   ├── utils/          # Utility functions
│   ├── App.tsx         # Main application component
│   ├── main.tsx        # Application entry point
│   ├── types.ts        # TypeScript type definitions
│   └── index.css       # Global styles
├── supabase/           # Supabase configuration
│   └── migrations/     # Database migration files
├── public/             # Static assets
├── vite.config.ts      # Vite configuration
├── tailwind.config.js  # Tailwind CSS configuration
├── tsconfig.json       # TypeScript configuration
└── package.json        # Project dependencies and scripts
```

## Core Features

1. **Subscription Management**
   - Add, edit, delete, and reorder subscriptions
   - Track monthly costs and payment methods
   - Categorize subscriptions
   - Mark usage state (active, paused, etc.)

2. **Financial Analytics**
   - Subscription cost analytics
   - Category-based spending analysis
   - Usage statistics

3. **Cost Tracking**
   - Track fixed and variable expenses
   - Income source management
   - Financial overview

4. **Calendar View**
   - Payday calendar for tracking income dates

5. **Budget Calculator**
   - Financial planning and calculations

6. **Settings and Preferences**
   - Theme customization (light/dark mode)
   - Currency preferences
   - User profile management

## State Management

The application uses React Context API for global state management:

1. **AuthContext**: Manages user authentication state
   - User login/signup/logout
   - Session persistence
   - Protected routes

2. **ThemeContext**: Manages application theme
   - Light/dark mode toggle
   - Theme persistence

3. **CurrencyContext**: Manages currency settings
   - Currency selection
   - Exchange rate conversions

4. **SubscriptionContext**: Manages subscription data globally
   - CRUD operations for subscriptions
   - Optimistic updates
   - Real-time synchronization with Supabase

## Custom Hooks

The application uses several custom hooks for data management and UI functionality:

1. **useSubscriptions**: Provides access to the SubscriptionContext
   - CRUD operations for subscriptions
   - Optimistic updates
   - Real-time synchronization with Supabase

2. **useFinancialData**: Manages financial data
   - Income sources
   - Fixed expenses
   - Variable expenses

3. **useSubscriptionAnalytics**: Provides analytics for subscriptions
   - Cost calculations
   - Category analytics
   - Usage patterns

4. **useFinanceAnalytics**: Analyzes financial data
   - Income vs expenses
   - Budget calculations
   - Trend analysis

5. **useDashboardLayout**: Manages dashboard UI state
   - Layout configuration
   - Component visibility
   - Responsive adjustments

6. **useDevice**: Detects device type for responsive UI

## Database Schema

The application uses Supabase (PostgreSQL) with the following main tables:

1. **subscriptions**
   - id, user_id, name, url, icon, monthly_cost
   - billing_period, payment_method, category
   - usage_state, start_date, favorite
   - created_at, updated_at

2. **subscription_price_history**
   - Tracks historical price changes for subscriptions

3. **income_sources**
   - Tracks user income sources

4. **fixed_expenses**
   - Tracks recurring fixed expenses

5. **variable_expenses**
   - Tracks one-time or variable expenses

6. **user_preferences**
   - Stores user-specific settings

All tables implement Row Level Security (RLS) to ensure users can only access their own data.

## Authentication

Authentication is handled by Supabase Auth:
- Email/password authentication
- Session management
- Protected routes using React Router

## Installation and Setup

1. Clone the repository
2. Install dependencies with `npm install`
3. Copy `.env.example` to `.env` and set the required Supabase public project values:
   ```
   VITE_SUPABASE_URL=<your-supabase-url>
   VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>
   ```
4. Run the development server with `npm run dev`
5. Build for production with `npm run build`

## Key Dependencies

### Production Dependencies
- React and React DOM (v18.3.1)
- React Router DOM (v6.22.3)
- Supabase Auth UI and JS client (v2.39.7)
- DND Kit for drag and drop (v6.1.0)
- Recharts for charts (v2.12.2)
- D3-Sankey for flow diagrams (v0.12.3)
- Date-fns for date manipulation (v3.3.1)
- Lucide React for icons (v0.344.0)

### Development Dependencies
- TypeScript (v5.5.3)
- Vite (v5.4.2)
- ESLint (v9.9.1)
- Tailwind CSS (v3.4.1)
- PostCSS and Autoprefixer

## Responsive Design

The application is fully responsive, with specific components for different screen sizes:
- MobileHeader and MobileMenu for small screens
- Sidebar for larger screens
- DashboardGrid for flexible layout management

## Data Flow

1. **User Authentication**:
   - User logs in through AuthContext
   - Session is stored in Supabase and local state

2. **Data Fetching**:
   - Global SubscriptionContext fetches data from Supabase
   - Data is stored in centralized state and updated in real-time
   - Components access this shared state through the useSubscriptions hook

3. **UI Rendering**:
   - Data is accessed via context hooks
   - Components react to state changes automatically

4. **Data Mutations**:
   - Changes are made optimistically in global state
   - Then sent to Supabase for persistence
   - Real-time updates are received through Supabase subscriptions

## Error Handling

The application includes:
- Global error boundary (ErrorBoundary component)
- Form validation
- API error handling with user feedback
- Authentication error recovery

## Future Enhancements

Potential future features and improvements could include:
- Mobile application
- Data export/import capabilities
- Advanced analytics and forecasting
- Integration with banking APIs
- Collaborative sharing of subscription data
- Email notifications for upcoming payments 

## Changelog

### v1.2.0 (Current)

#### Custom DatePicker Component Implementation
- **Created themeable DatePicker component**: Implemented a custom date picker with modern UI and theme support
  - Supports both light and dark mode themes via the ThemeContext
  - Features iOS-style scrolling lists for year and month selection
  - Limits date selection to prevent selection of future dates

- **Enhanced User Experience in Subscription Forms**:
  - Replaced native date inputs with custom DatePicker in AddSubscriptionModal
  - Added DatePicker to EditSubscriptionModal for consistent UI
  - Improved visual feedback when interacting with date fields

- **Added Toast Notification System**:
  - Created ToastContext for managing global notifications
  - Implemented visual feedback for async operations
  - Added support for different toast types (success, error, warning, info)

- **Updated Types System**:
  - Enhanced type definitions for better TypeScript support
  - Added proper typing for subscription-related entities

#### Key Code Changes

1. **Created Custom DatePicker Component**:
   ```tsx
   // src/components/DatePicker.tsx
   
   import React, { useState, useRef, useEffect } from 'react';
   import { Calendar } from 'lucide-react';
   import { useTheme } from '../contexts/ThemeContext';

   interface DatePickerProps {
     value: string;
     onChange: (value: string) => void;
     min?: string;
     max?: string;
     required?: boolean;
     disabled?: boolean;
   }

   export function DatePicker({ value, onChange, min, max, required, disabled }: DatePickerProps) {
     const [isOpen, setIsOpen] = useState(false);
     const datePickerRef = useRef<HTMLDivElement>(null);
     const { theme } = useTheme();
     
     // Convert string date to Date object for internal use
     const currentDate = value ? new Date(value) : new Date();
     const [viewedMonth, setViewedMonth] = useState(currentDate.getMonth());
     const [viewedYear, setViewedYear] = useState(currentDate.getFullYear());
     
     // Close when clicking outside
     useEffect(() => {
       const handleClickOutside = (event: MouseEvent) => {
         if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
           setIsOpen(false);
         }
       };
       
       document.addEventListener('mousedown', handleClickOutside);
       return () => document.removeEventListener('mousedown', handleClickOutside);
     }, []);
     
     // Generate days for the calendar
     const generateCalendarDays = () => {
       // ... calendar generation logic
     };
     
     return (
       <div className="relative" ref={datePickerRef}>
         <div className="relative">
           <input
             type="text"
             readOnly
             value={value ? new Date(value).toLocaleDateString() : ''}
             onClick={() => !disabled && setIsOpen(!isOpen)}
             className="w-full neumorphic-input rounded-lg pl-10 pr-4 py-3 text-theme-primary focus:outline-none focus:ring-2 focus:ring-emerald-500"
             required={required}
             disabled={disabled}
           />
           <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-secondary" size={16} />
         </div>
         
         {isOpen && !disabled && (
           <div className={`absolute z-10 mt-1 w-full rounded-lg shadow-lg ${
             theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'
           } p-3`}>
             {/* Month and year selectors */}
             <div className="flex justify-between mb-2">
               {/* ... month/year selectors */}
             </div>
             
             {/* Calendar grid */}
             <div className="grid grid-cols-7 gap-1">
               {/* ... days of week */}
               {/* ... calendar days */}
             </div>
           </div>
         )}
       </div>
     );
   }
   ```

2. **Created Toast Notification System**:
   ```tsx
   // src/contexts/ToastContext.tsx
   
   import React, { createContext, useContext, useState, ReactNode } from 'react';

   type ToastType = 'success' | 'error' | 'info' | 'warning';

   interface Toast {
     id: string;
     message: string;
     type: ToastType;
     duration?: number;
   }

   interface ToastContextType {
     toasts: Toast[];
     showToast: (message: string, type: ToastType, duration?: number) => void;
     hideToast: (id: string) => void;
     submitting: boolean;
     setSubmitting: (value: boolean) => void;
   }

   const ToastContext = createContext<ToastContextType | undefined>(undefined);

   export function ToastProvider({ children }: { children: ReactNode }) {
     const [toasts, setToasts] = useState<Toast[]>([]);
     const [submitting, setSubmitting] = useState(false);

     // ... toast implementation
     
     return (
       <ToastContext.Provider value={{ toasts, showToast, hideToast, submitting, setSubmitting }}>
         {children}
         
         {/* Toast container */}
         {toasts.length > 0 && (
           <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
             {/* ... toast rendering */}
           </div>
         )}
       </ToastContext.Provider>
     );
   }

   export function useToast() {
     const context = useContext(ToastContext);
     if (context === undefined) {
       throw new Error('useToast must be used within a ToastProvider');
     }
     return context;
   }
   ```

3. **Updated App with ToastProvider**:
   ```tsx
   // src/App.tsx
   
   export default function AppWithProviders() {
     return (
       <BrowserRouter>
         <ErrorBoundary fallback={...}>
           <AuthProvider>
             <ThemeProvider>
               <CurrencyProvider>
                 <SubscriptionProvider>
                   <ToastProvider>
                     <App />
                   </ToastProvider>
                 </SubscriptionProvider>
               </CurrencyProvider>
             </ThemeProvider>
           </AuthProvider>
         </ErrorBoundary>
       </BrowserRouter>
     );
   }
   ```

### v1.1.0 (2023-06-15)

#### Improved State Management Architecture
- **Created SubscriptionContext**: Implemented a centralized global state management system for subscriptions
  - Moved subscription data and CRUD operations from a local hook to a global context
  - Ensures consistent state across all components

- **Enhanced Optimistic Update Patterns**:
  - Fixed issues with favorite toggling not updating UI immediately
  - Improved edit subscription modal updates to show changes instantly
  - Added visual feedback during deletion operations
  - Ensured consistent optimistic update pattern across all subscription operations

- **State Architecture Changes**:
  - Changed from multiple local states to a single global state
  - Added proper tracking of optimistic updates to prevent UI flickering
  - Improved error handling with proper state rollback on failures

- **Performance Improvements**:
  - Better memoization of filtered subscriptions
  - Reduced unnecessary rerenders
  - Improved perceived performance during data operations

#### Key Code Changes

1. **Created SubscriptionContext Provider**:
   ```tsx
   // src/contexts/SubscriptionContext.tsx
   
   import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
   import { supabase } from '../lib/supabase';
   import type { Subscription, PriceChangeOptions } from '../types';
   import { useAuth } from './AuthContext';

   interface SubscriptionContextType {
     subscriptions: Subscription[];
     loading: boolean;
     addSubscription: (subscription: Omit<Subscription, 'id'>) => Promise<void>;
     updateSubscription: (subscription: Subscription, priceChangeOptions?: PriceChangeOptions) => Promise<void>;
     deleteSubscription: (id: string) => Promise<void>;
     toggleFavorite: (subscriptionId: string) => Promise<void>;
     reorderSubscriptions: (reorderedSubscriptions: Subscription[]) => Promise<void>;
   }

   const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

   export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
     const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
     const [loading, setLoading] = useState(true);
     const { user } = useAuth();
     const optimisticUpdatesRef = useRef<Set<string>>(new Set());
     
     // ... implementation details
     
     return (
       <SubscriptionContext.Provider value={{
         subscriptions,
         loading,
         addSubscription,
         updateSubscription: updateSubscriptionWithPriceHistory,
         deleteSubscription,
         toggleFavorite,
         reorderSubscriptions
       }}>
         {children}
       </SubscriptionContext.Provider>
     );
   }

   export function useSubscriptions() {
     const context = useContext(SubscriptionContext);
     if (context === undefined) {
       throw new Error('useSubscriptions must be used within a SubscriptionProvider');
     }
     return context;
   }
   ```

2. **Added Dedicated Favorite Toggle Function**:
   ```tsx
   const toggleFavorite = async (subscriptionId: string) => {
     // Find subscription
     const subscription = subscriptions.find(s => s.id === subscriptionId);
     if (!subscription) return;
     
     // Store previous state
     const previousSubscriptions = [...subscriptions];
     
     // Track optimistic update
     optimisticUpdatesRef.current.add(subscriptionId);
     
     // Apply optimistic update immediately
     setSubscriptions(prev => 
       prev.map(sub => sub.id === subscriptionId 
         ? {...sub, isFavorite: !sub.isFavorite} 
         : sub
       )
     );

     try {
       // Send to server
       const { error } = await supabase
         .from('subscriptions')
         .update({ favorite: !subscription.isFavorite })
         .eq('id', subscriptionId)
         .eq('user_id', user?.id);

       if (error) throw error;
       
       // Remove from tracked updates on success
       optimisticUpdatesRef.current.delete(subscriptionId);
     } catch (error) {
       // Revert on failure
       setSubscriptions(previousSubscriptions);
       optimisticUpdatesRef.current.delete(subscriptionId);
       console.error('Error updating favorite status:', error);
       throw error;
     }
   };
   ```

3. **Updated App Component to Use Provider**:
   ```tsx
   // src/App.tsx
   
   export default function AppWithProviders() {
     return (
       <BrowserRouter>
         <ErrorBoundary fallback={...}>
           <AuthProvider>
             <ThemeProvider>
               <CurrencyProvider>
                 <SubscriptionProvider>
                   <App />
                 </SubscriptionProvider>
               </CurrencyProvider>
             </ThemeProvider>
           </AuthProvider>
         </ErrorBoundary>
       </BrowserRouter>
     );
   }
   ```

4. **Updated SortableSubscriptionCard for Optimistic Favorite Updates**:
   ```tsx
   // src/components/SortableSubscriptionCard.tsx
   
   export function SortableSubscriptionCard({ subscription, onUpdate, onDelete }: Props) {
     const { toggleFavorite } = useSubscriptions();
     
     // ... other code
     
     const handleFavoriteToggle = async () => {
       try {
         // Use the optimistic update function for favorites
         await toggleFavorite(subscription.id);
       } catch (error) {
         console.error('Error toggling favorite:', error);
       }
     };
     
     // ... render JSX
   }
   ```

5. **Enhanced UI Feedback for Operations**:
   ```tsx
   // src/components/SubscriptionCard.tsx
   
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
   
   // In render:
   <div className={`neumorphic-card rounded-xl overflow-hidden relative ${isDeleting ? 'opacity-50 pointer-events-none' : ''}`}>
     {/* ... */}
   </div>
   ```

6. **Improved EditSubscriptionModal for Better UX**:
   ```tsx
   // src/components/EditSubscriptionModal.tsx
   
   const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
     
     // Set submitting state for UI feedback
     setSubmitting(true);
     
     // ... create updated subscription
     
     try {
       // Close modal immediately for better UX
       onClose();
       
       // Perform update in background
       await onUpdate(updatedSubscription, priceChangeOpts);
     } catch (error) {
       console.error('Error updating subscription:', error);
       setSubmitting(false);
     }
   };
   ```
