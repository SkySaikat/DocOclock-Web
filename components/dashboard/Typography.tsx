/**
 * Typography - Dashboard (Figma 302:12624). Instrument Sans, `font-display`.
 * <DsText variant="header|title24|title20|subtitle|paragraph|button|value|small" tone="primary|secondary|tertiary|disabled|inverse|inherit"
 *         as="p" weight="normal|medium|semibold|bold" className>. Every variant defaults to Figma's
 * Regular / Text-tertiary; instances override weight + tone. `dsTextClass` / `dsToneClass` expose the raw class
 * strings for elements that cannot be swapped for <DsText>.
 */
import React from 'react';

export type DsTextVariant = 'header' | 'title24' | 'title20' | 'subtitle' | 'paragraph' | 'button' | 'value' | 'small';
export type DsTextTone = 'primary' | 'secondary' | 'tertiary' | 'disabled' | 'inverse' | 'inherit';

// Sizes / line-heights / tracking come from the `text-ds-*` tokens in tailwind.config.js (tokens.md §2.2).
export const dsTextClass: Record<DsTextVariant, string> = {
  header: 'font-display text-ds-h36',
  title24: 'font-display text-ds-title-24',
  title20: 'font-display text-ds-title-20',
  subtitle: 'font-display text-ds-subtitle',
  paragraph: 'font-display text-ds-paragraph',
  button: 'font-display text-[16px] leading-[normal]',
  value: 'font-display text-ds-body',
  small: 'font-display text-ds-small',
};

export const dsToneClass: Record<DsTextTone, string> = {
  primary: 'text-content-primary',
  secondary: 'text-content-secondary',
  tertiary: 'text-content-tertiary',
  disabled: 'text-content-disabled',
  inverse: 'text-white',
  inherit: '',
};

const WEIGHT: Record<string, string> = {
  normal: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
};

interface DsTextProps {
  variant: DsTextVariant;
  tone?: DsTextTone;
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  as?: React.ElementType;
  className?: string;
  children?: React.ReactNode;
}

export const DsText: React.FC<DsTextProps> = ({ variant, tone = 'tertiary', weight = 'normal', as: Tag = 'p', className = '', children }) => (
  <Tag className={`${dsTextClass[variant]} ${dsToneClass[tone]} ${WEIGHT[weight]} ${className}`.trim()}>{children}</Tag>
);
