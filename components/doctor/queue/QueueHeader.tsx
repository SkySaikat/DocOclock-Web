/**
 * Queue page header (Figma Dashboard Header / Queue 368:14309): "Queue" 36px + subtitle on the left, the gradient
 * "Update Queue Status" pill on the right (opens the Queue Status modal — the caller owns the state).
 * <QueueHeader onUpdateStatus={() => ...} />
 */
import React from 'react';
import { DashboardButton, DsText, MaskIcon, DS_ICONS } from '../../dashboard';

interface QueueHeaderProps {
  onUpdateStatus: () => void;
}

export const QueueHeader: React.FC<QueueHeaderProps> = ({ onUpdateStatus }) => (
  <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
    <div className="flex flex-col gap-2 justify-center min-w-0">
      <DsText as="h1" variant="header" tone="primary">Queue</DsText>
      <DsText variant="subtitle" tone="tertiary">Manage all your queues and get ready for the next ones </DsText>
    </div>
    <DashboardButton variant="gradient" icon={<MaskIcon src={DS_ICONS.change} size={16} />} onClick={onUpdateStatus} className="self-start sm:self-auto shrink-0">
      Update Queue Status
    </DashboardButton>
  </header>
);
