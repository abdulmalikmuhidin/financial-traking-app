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
  Coffee, 
  Music, 
  BookOpen, 
  Dumbbell, 
  Smartphone, 
  Shield, 
  Tag,
  CircleDollarSign,
  LucideProps
} from 'lucide-react';

export const ICON_MAP: Record<string, React.FC<LucideProps>> = {
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
  Coffee,
  Music,
  BookOpen,
  Dumbbell,
  Smartphone,
  Shield,
  Tag,
  CircleDollarSign,
};

export const AVAILABLE_ICONS = Object.keys(ICON_MAP);

export const renderCategoryIcon = (iconName: string, className: string = 'w-4 h-4') => {
  const IconComponent = ICON_MAP[iconName] || Tag;
  return <IconComponent className={className} />;
};
