/**
 * EntityAvatar — Universal avatar component for all entity types.
 * Replaces DomainAvatar, OrgAvatar, BuAvatar across all 3 modules.
 * Renders a logo <img> if logoUrl is provided, otherwise renders
 * a gradient initials tile derived from the entity name.
 *
 * @module components/platform/EntityAvatar
 */

import React from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Props for the EntityAvatar component */
export interface EntityAvatarProps {
  /** Display name — used to derive gradient color and initials */
  name: string;
  /** Remote logo URL. If provided, renders an <img> instead of initials */
  logoUrl?: string | null;
  /** Square size in pixels. Default 40 */
  size?: number;
  /** Tailwind border-radius class. Default 'rounded-xl' */
  shape?: string;
  /** Extra Tailwind classes on the wrapper */
  className?: string;
}

// ---------------------------------------------------------------------------
// Gradient palette — 6 options, selected by name.charCodeAt(0) % 6
// ---------------------------------------------------------------------------

const GRADIENT_PALETTE: string[] = [
  'from-violet-500 to-purple-600',
  'from-blue-500 to-indigo-600',
  'from-teal-500 to-emerald-600',
  'from-amber-500 to-orange-500',
  'from-pink-500 to-rose-500',
  'from-cyan-500 to-blue-500',
];

function getGradient(name: string): string {
  const code = name.charCodeAt(0) || 0;
  return GRADIENT_PALETTE[code % GRADIENT_PALETTE.length]!;
}

function getInitials(name: string): string {
  const words = name.split(/[^a-zA-Z0-9]+/).filter(Boolean);
  
  if (words.length === 0) {
    const trimmed = name.trim();
    return trimmed ? trimmed.slice(0, 2).toUpperCase() : '?';
  }
  
  if (words.length >= 2) {
    return (words[0]![0]! + words[1]![0]!).toUpperCase();
  }
  
  return words[0]!.slice(0, 2).toUpperCase();
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Universal avatar for BusinessDomain, Organization, BusinessUnit.
 * Shows a logo image when available; falls back to gradient initials tile.
 */
export const EntityAvatar: React.FC<EntityAvatarProps> = ({
  name,
  logoUrl,
  size = 40,
  shape = 'rounded-xl',
  className = '',
}) => {
  const gradient = getGradient(name);
  const initials = getInitials(name);
  const fontSize = Math.round(size * 0.32);

  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={name}
        className={`${shape} object-contain border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      role="img"
      aria-label={`Avatar for ${name}`}
      className={`bg-gradient-to-br ${gradient} ${shape} flex items-center justify-center shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <span
        className="text-white font-black select-none leading-none"
        style={{
          fontSize,
          letterSpacing: '-0.02em',
        }}
      >
        {initials}
      </span>
    </div>
  );
};

export default EntityAvatar;
