/**
 * Nav Link - Dashboard (Figma 317:13571) + the white `Navlinks` pill that holds them (317:13559).
 * <NavLink active onClick>label</NavLink>  - 41px tall, px-5 py-3, r12; active = primary fill / white SemiBold 14,
 *   inactive = Text/disabled Regular 14. No hover style exists in Figma; active state fades in 300ms EASE_OUT.
 * <NavLinksPill items={[{id,label}]} activeId onSelect ariaLabel /> - `bg-white rounded-2xl p-1 gap-2`.
 * The pill only decides styling; the parent owns routing (`onSelect(id)`).
 */
import React from 'react';

interface NavLinkProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  active?: boolean;
  children: React.ReactNode;
}

export const NavLink: React.FC<NavLinkProps> = ({ active = false, className = '', children, type = 'button', ...rest }) => (
  <button
    type={type}
    aria-current={active ? 'page' : undefined}
    className={`inline-flex items-center justify-center px-5 py-3 rounded-xl font-display text-ds-body whitespace-nowrap shrink-0 cursor-pointer transition-colors duration-ds-fast ease-ds-out motion-reduce:transition-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 ${active ? 'bg-primary-500 text-white font-semibold' : 'text-content-disabled font-normal'} ${className}`}
    {...rest}
  >
    {children}
  </button>
);

export interface NavLinkItem {
  id: string;
  label: string;
}

interface NavLinksPillProps {
  items: NavLinkItem[];
  activeId?: string | null;
  onSelect: (id: string) => void;
  ariaLabel?: string;
  className?: string;
}

export const NavLinksPill: React.FC<NavLinksPillProps> = ({ items, activeId, onSelect, ariaLabel = 'Primary', className = '' }) => (
  <div role="group" aria-label={ariaLabel} className={`bg-white rounded-2xl p-1 flex items-center gap-2 ${className}`}>
    {items.map(item => (
      <NavLink key={item.id} active={item.id === activeId} onClick={() => onSelect(item.id)}>
        {item.label}
      </NavLink>
    ))}
  </div>
);
