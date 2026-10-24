/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Home,
  Utensils,
  Car,
  Zap,
  ShoppingBag,
  Tv,
  HeartPulse,
  GraduationCap,
  Plane,
  TrendingUp,
  Briefcase,
  Laptop,
  PiggyBank,
  Gift,
  Tag,
  CircleDollarSign,
  Coffee,
  Fuel,
  Film,
  Smartphone,
  BookOpen,
} from 'lucide-react';

const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  Home,
  Utensils,
  Car,
  Zap,
  ShoppingBag,
  Tv,
  HeartPulse,
  GraduationCap,
  Plane,
  TrendingUp,
  Briefcase,
  Laptop,
  PiggyBank,
  Gift,
  Tag,
  CircleDollarSign,
  Coffee,
  Fuel,
  Film,
  Smartphone,
  BookOpen,
};

export const AVAILABLE_CATEGORY_ICONS = Object.keys(ICON_MAP);

export function renderCategoryIcon(iconName: string, className: string = 'w-4 h-4'): React.ReactNode {
  const IconComponent = ICON_MAP[iconName] || Tag;
  return <IconComponent className={className} />;
}
