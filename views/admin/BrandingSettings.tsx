import React, { useEffect, useState } from 'react';
import { Palette, RotateCcw, Save, Undo2 } from 'lucide-react';
import { useTheme, DEFAULT_THEME, ThemeColors } from '../../contexts/ThemeContext';
import { isValidHex } from '../../utils/colorScale';
import { useAuth } from '../../AuthContext';
import { useToast } from '../../components/ToastProvider';

interface ColorFieldProps {
  label: string;
  description: string;
  value: string;
  onChange: (value: string) => void;
}

const ColorField: React.FC<ColorFieldProps> = ({ label, description, value, onChange }) => {
  const [draft, setDraft] = useState(value);

  useEffect(() => setDraft(value), [value]);

  const commit = (next: string) => {
    setDraft(next);
    if (isValidHex(next)) onChange(next);
  };

  return (
    <div className="flex items-center justify-between gap-6 p-6 bg-ink-50/50 border border-ink-200 rounded-ds-md">
      <div className="min-w-0">
        <h3 className="font-display font-black text-ink-800 mb-1">{label}</h3>
        <p className="text-xs font-medium text-ink-500 max-w-sm">{description}</p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <div className="relative w-11 h-11 rounded-xl overflow-hidden border border-ink-200 shadow-ds-card shrink-0">
          <input
            type="color"
            value={isValidHex(draft) ? draft : value}
            onChange={(e) => commit(e.target.value)}
            aria-label={`${label} color picker`}
            className="absolute -inset-2 w-[calc(100%+16px)] h-[calc(100%+16px)] cursor-pointer border-0 p-0"
          />
        </div>
        <input
          type="text"
          value={draft}
          onChange={(e) => commit(e.target.value)}
          spellCheck={false}
          className={`w-28 px-3 py-2.5 rounded-xl border text-sm font-mono font-bold uppercase tracking-wide outline-none transition-colors ${
            isValidHex(draft) ? 'border-ink-200 text-ink-800 focus:border-medical-500' : 'border-red-300 text-red-600'
          }`}
        />
      </div>
    </div>
  );
};

export const BrandingSettings: React.FC = () => {
  const { colors, previewTheme, saveTheme, discardPreview, resetToDefault, saving } = useTheme();
  const { profile } = useAuth();
  const { showToast } = useToast();
  const [draft, setDraft] = useState<ThemeColors>(colors);
  const [isDirty, setIsDirty] = useState(false);

  // Keep the local draft in sync whenever the live theme changes from outside
  // this screen (e.g. after a save elsewhere, or the initial DB fetch).
  useEffect(() => {
    if (!isDirty) setDraft(colors);
  }, [colors, isDirty]);

  const updateField = (field: keyof ThemeColors) => (value: string) => {
    const next = { ...draft, [field]: value };
    setDraft(next);
    setIsDirty(true);
    previewTheme(next); // live preview across the whole open app, no reload
  };

  const handleSave = async () => {
    if (!profile?.id) {
      showToast('Could not identify your admin account. Please re-login and try again.', 'error');
      return;
    }
    const result = await saveTheme(draft, profile.id);
    if (result.success) {
      setIsDirty(false);
      showToast('Brand colors saved — live for every user now.', 'success');
    } else {
      showToast(result.error || 'Failed to save colors.', 'error');
    }
  };

  const handleDiscard = async () => {
    await discardPreview();
    setIsDirty(false);
  };

  const handleResetToDefault = () => {
    setDraft(DEFAULT_THEME);
    setIsDirty(true);
    resetToDefault();
  };

  return (
    <div className="bg-white rounded-ds-lg p-8 shadow-ds-soft animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-medical-100 rounded-2xl flex items-center justify-center text-medical-600">
            <Palette size={24} />
          </div>
          <div>
            <h2 className="text-xl font-display font-black text-ink-800">Branding</h2>
            <p className="text-sm font-bold text-ink-500">Change the platform's colors — updates live for every user, everywhere</p>
          </div>
        </div>

        {isDirty && (
          <span className="self-start md:self-auto px-3 py-1.5 bg-amber-100 text-amber-700 text-[10px] uppercase tracking-widest font-black rounded-full">
            Unsaved preview
          </span>
        )}
      </div>

      <div className="space-y-4">
        <ColorField
          label="Primary"
          description="Buttons, active nav pills, links, and chart accents across the whole app."
          value={draft.primaryColor}
          onChange={updateField('primaryColor')}
        />
        <ColorField
          label="Secondary"
          description="Dark contrast surfaces (admin headers) and the secondary chart series."
          value={draft.secondaryColor}
          onChange={updateField('secondaryColor')}
        />
        <ColorField
          label="Background"
          description="The page background behind every card, across patient, doctor, and admin screens."
          value={draft.backgroundColor}
          onChange={updateField('backgroundColor')}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3 mt-8 pt-6 border-t border-ink-100">
        <button
          onClick={handleSave}
          disabled={saving || !isDirty}
          className="btn-sheen flex items-center gap-2 px-6 py-3 bg-medical-500 hover:bg-medical-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-display font-bold rounded-full transition-all text-sm"
        >
          <Save size={16} /> {saving ? 'Saving…' : 'Save & Publish'}
        </button>
        <button
          onClick={handleDiscard}
          disabled={saving || !isDirty}
          className="flex items-center gap-2 px-5 py-3 bg-ink-100 hover:bg-ink-200 disabled:opacity-40 disabled:cursor-not-allowed text-ink-700 font-display font-bold rounded-full transition-all text-sm"
        >
          <Undo2 size={16} /> Discard
        </button>
        <button
          onClick={handleResetToDefault}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-3 text-ink-500 hover:text-ink-800 font-display font-bold rounded-full transition-all text-sm ml-auto"
        >
          <RotateCcw size={16} /> Reset to default
        </button>
      </div>
    </div>
  );
};
