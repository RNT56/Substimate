import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const DEFAULT_LAYOUT = ['dashboard-card-0', 'dashboard-card-1', 'dashboard-card-2', 'dashboard-card-3'];

export function useDashboardLayout() {
  const [layout, setLayout] = useState<string[]>(DEFAULT_LAYOUT);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const createDefaultLayout = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('dashboard_layouts')
        .insert({
          user_id: user.id,
          layout: DEFAULT_LAYOUT
        })
        .select()
        .single();

      if (error) throw error;
      setLayout(data.layout);
    } catch (error) {
      console.error('Error creating default layout:', error);
      // Fallback to default layout on error
      setLayout(DEFAULT_LAYOUT);
    }
  }, [user]);

  const fetchLayout = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('dashboard_layouts')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (!data) {
        // No layout found, create default
        await createDefaultLayout();
      } else {
        setLayout(data.layout);
      }
    } catch (error) {
      console.error('Error fetching dashboard layout:', error);
      // Fallback to default layout on error
      setLayout(DEFAULT_LAYOUT);
    } finally {
      setLoading(false);
    }
  }, [user, createDefaultLayout]);

  useEffect(() => {
    if (!user) {
      setLayout(DEFAULT_LAYOUT);
      setLoading(false);
      return;
    }

    void fetchLayout();
  }, [user, fetchLayout]);

  const saveLayout = async (newLayout: string[]) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('dashboard_layouts')
        .update({ layout: newLayout })
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      setLayout(data.layout);
    } catch (error) {
      console.error('Error saving dashboard layout:', error);
      // Revert to previous layout on error
      setLayout(layout);
    }
  };

  return {
    layout,
    loading,
    saveLayout
  };
}
