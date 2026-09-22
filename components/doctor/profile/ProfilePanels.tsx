/**
 * Shared pieces of Figma "Doctor Profile" (276:12374) and "Edit Doctor Profile" (276:12338):
 * page header (title + subtitle + actions), white r24 panels, label-over-field rows, and the entry card used in
 * Experiences / Education (title + calendar-dated subtitle, #fafafa r20).
 */
import React from 'react';

export const ProfileHeader: React.FC<{ title: string; subtitle: string; children?: React.ReactNode }> = ({ title, subtitle, children }) => (
  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
    <div className="flex flex-col gap-2">
      <h1 className="text-[24px] font-normal leading-[normal] text-content-primary lg:text-ds-h36">{title}</h1>
      <p className="text-ds-subtitle text-content-tertiary max-lg:text-ds-small">{subtitle}</p>
    </div>
    {children && <div className="flex items-center gap-2">{children}</div>}
  </div>
);

export const Panel: React.FC<{ title: string; action?: React.ReactNode; className?: string; children: React.ReactNode }> = ({ title, action, className = '', children }) => (
  <section aria-label={title} className={`flex min-w-0 flex-col gap-6 rounded-ds-lg bg-white p-5 ${className}`}>
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-ds-title-24 text-content-primary">{title}</h2>
      {action}
    </div>
    {children}
  </section>
);

export const FIELD = 'h-[38px] w-full rounded-2xl bg-ink-50 px-3 font-display text-ds-body text-content-primary outline-none placeholder:text-content-tertiary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-500';

export const Row: React.FC<{ label: string; children: React.ReactNode; className?: string }> = ({ label, children, className = '' }) => (
  <label className={`flex min-w-0 flex-col gap-3 ${className}`}>
    <span className="text-ds-paragraph text-content-secondary">{label}</span>
    {children}
  </label>
);

/** Read-only value styled like the Figma input box. */
export const Value: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <span className={`${FIELD} flex items-center truncate ${children ? '' : 'text-content-tertiary'}`}>{children || '—'}</span>
);

export const EntryCard: React.FC<{ title: string; subtitle?: string; meta?: string }> = ({ title, subtitle, meta }) => (
  <div className="flex items-start justify-between gap-3 rounded-[20px] bg-page p-4">
    <div className="flex min-w-0 flex-col gap-2">
      <p className="truncate text-ds-paragraph text-content-primary">{title}</p>
      {subtitle && <p className="truncate text-ds-body text-content-secondary">{subtitle}</p>}
    </div>
    {meta && <span className="shrink-0 text-ds-small text-content-secondary">{meta}</span>}
  </div>
);

export const Avatar: React.FC<{ src?: string; name?: string; size?: number }> = ({ src, name, size = 78 }) => (
  <span className="grid shrink-0 place-items-center overflow-hidden rounded-full bg-primary-50 text-ds-title-24 text-primary-600 shadow-ds-pill" style={{ width: size, height: size }}>
    {src ? <img src={src} alt="" className="size-full object-cover" /> : (name || 'D').replace(/^dr\.?\s+/i, '').charAt(0)}
  </span>
);
