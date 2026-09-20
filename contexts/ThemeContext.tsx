import React, { createContext, useContext, useLayoutEffect, useRef, useState } from 'react';
import { supabase } from '../supabase';
import { COLOR_SCALE_STEPS, generateColorScale, isValidHex } from '../utils/colorScale';

export interface ThemeColors {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
}

export const DEFAULT_THEME: ThemeColors = {
  primaryColor: '#0ca768',
  secondaryColor: '#03402a',
  backgroundColor: '#f5f7f6',
};

const STORAGE_KEY = 'dococlock_theme';

interface ThemeContextType {
  colors: ThemeColors;
  /** Applies colors live (in-memory + CSS vars) without persisting — used for preview while editing. */
  previewTheme: (colors: ThemeColors) => void;
  /** Persists colors via the update-theme Edge Function, then applies them. */
  saveTheme: (colors: ThemeColors, profileId: string) => Promise<{ success: boolean; error?: string }>;
  /** Re-fetches the last-saved theme from the database and applies it (discards any unsaved preview). */
  discardPreview: () => Promise<void>;
  resetToDefault: () => void;
  saving: boolean;
  loading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function applyToDocument(colors: ThemeColors) {
  const root = document.documentElement.style;
  const primaryScale = generateColorScale(colors.primaryColor);
  const secondaryScale = generateColorScale(colors.secondaryColor);
  const backgroundRgb = generateColorScale(colors.backgroundColor)[500];

  // Steps 50-900 plus 950 (Figma's Accent-950 -> `primary-950` / `secondary-950`).
  COLOR_SCALE_STEPS.forEach(step => {
    root.setProperty(`--color-primary-${step}`, primaryScale[step]);
    root.setProperty(`--color-secondary-${step}`, secondaryScale[step]);
  });
  root.setProperty('--color-background', backgroundRgb);
}

function sanitize(colors: Partial<ThemeColors>): ThemeColors {
  return {
    primaryColor: isValidHex(colors.primaryColor || '') ? colors.primaryColor! : DEFAULT_THEME.primaryColor,
    secondaryColor: isValidHex(colors.secondaryColor || '') ? colors.secondaryColor! : DEFAULT_THEME.secondaryColor,
    backgroundColor: isValidHex(colors.backgroundColor || '') ? colors.backgroundColor! : DEFAULT_THEME.backgroundColor,
  };
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [colors, setColors] = useState<ThemeColors>(() => {
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      return cached ? sanitize(JSON.parse(cached)) : DEFAULT_THEME;
    } catch {
      return DEFAULT_THEME;
    }
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const hasAppliedCache = useRef(false);

  // Apply the cached (or default) theme synchronously before paint, so
  // repeat visitors never see a flash of the default color before their
  // saved theme kicks in.
  useLayoutEffect(() => {
    if (!hasAppliedCache.current) {
      applyToDocument(colors);
      hasAppliedCache.current = true;
    }
  }, [colors]);

  // Background-refresh from the database (works for logged-out visitors too —
  // theme_settings is publicly readable) and re-apply/re-cache if it differs.
  useLayoutEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase.from('theme_settings').select('*').eq('id', 1).maybeSingle();
        if (cancelled || error || !data) return;

        const fetched = sanitize({
          primaryColor: data.primary_color,
          secondaryColor: data.secondary_color,
          backgroundColor: data.background_color,
        });

        setColors(prev => {
          const changed = prev.primaryColor !== fetched.primaryColor
            || prev.secondaryColor !== fetched.secondaryColor
            || prev.backgroundColor !== fetched.backgroundColor;
          if (changed) {
            applyToDocument(fetched);
            try { localStorage.setItem(STORAGE_KEY, JSON.stringify(fetched)); } catch { /* ignore quota/private-mode errors */ }
          }
          return fetched;
        });
      } catch (err) {
        console.error('Failed to load theme_settings', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const previewTheme = (next: ThemeColors) => {
    const sanitized = sanitize(next);
    setColors(sanitized);
    applyToDocument(sanitized);
  };

  const saveTheme = async (next: ThemeColors, profileId: string) => {
    const sanitized = sanitize(next);
    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke('update-theme', {
        body: {
          profileId,
          primaryColor: sanitized.primaryColor,
          secondaryColor: sanitized.secondaryColor,
          backgroundColor: sanitized.backgroundColor,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setColors(sanitized);
      applyToDocument(sanitized);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized)); } catch { /* ignore */ }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to save theme' };
    } finally {
      setSaving(false);
    }
  };

  const discardPreview = async () => {
    try {
      const { data } = await supabase.from('theme_settings').select('*').eq('id', 1).maybeSingle();
      const fetched = sanitize({
        primaryColor: data?.primary_color,
        secondaryColor: data?.secondary_color,
        backgroundColor: data?.background_color,
      });
      setColors(fetched);
      applyToDocument(fetched);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(fetched)); } catch { /* ignore */ }
    } catch (err) {
      console.error('Failed to discard theme preview', err);
    }
  };

  const resetToDefault = () => {
    setColors(DEFAULT_THEME);
    applyToDocument(DEFAULT_THEME);
  };

  return (
    <ThemeContext.Provider value={{ colors, previewTheme, saveTheme, discardPreview, resetToDefault, saving, loading }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
};
