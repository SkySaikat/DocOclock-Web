import React from 'react';
import { MaskIcon, DS_ICONS } from '../../dashboard';

// Panel title row (Figma "Hospitals" / "Assistants"): 24px title + "Add … +" text action.
export const PanelHeader: React.FC<{ title: string; action: string; onAction?: () => void }> = ({ title, action, onAction }) => (
    <div className="flex items-center justify-between gap-3">
        <h2 className="text-ds-title-24 text-content-primary">{title}</h2>
        {onAction && (
            <button type="button" onClick={onAction} className="flex items-center gap-2 text-ds-paragraph text-content-tertiary transition-colors duration-ds-fast ease-ds-out hover:text-primary-600">
                {action} <MaskIcon src={DS_ICONS.add} size={12} />
            </button>
        )}
    </div>
);
