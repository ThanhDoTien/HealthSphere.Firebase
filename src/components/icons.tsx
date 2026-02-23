import {
  Heart,
  HeartPulse,
  LayoutDashboard,
  User,
  Utensils,
  Dumbbell,
  BookOpen,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Globe,
  Zap,
  Shield,
  Mail,
  type LucideIcon,
} from 'lucide-react';

export type Icon = LucideIcon;

export const Icons = {
  logo: HeartPulse,
  dashboard: LayoutDashboard,
  profile: User,
  recipes: Utensils,
  workouts: Dumbbell,
  learn: BookOpen,
  logout: LogOut,
  chevronLeft: ChevronLeft,
  chevronRight: ChevronRight,
  sun: Sun,
  moon: Moon,
  globe: Globe,
  zap: Zap,
  shield: Shield,
  heart: Heart,
  mail: Mail,
  google: () => (
    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2">
      <title>Google</title>
      <path fill="#4285F4" d="M22.46 12.3c0-.81-.07-1.58-.2-2.31H12v4.37h5.84c-.25 1.41-.99 2.61-2.05 3.41v2.84h3.65c2.13-1.96 3.37-4.85 3.37-8.31z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.65-2.84c-.98.66-2.23 1.06-3.63 1.06-2.79 0-5.16-1.88-6.01-4.4H2.26v2.92C4.1 20.94 7.8 23 12 23z"/>
      <path fill="#FBBC05" d="M5.99 14.25c-.24-.7-.38-1.45-.38-2.25s.14-1.55.38-2.25V6.84H2.26C1.46 8.45.96 10.16.96 12s.5 3.55 1.3 5.16l3.73-2.91z"/>
      <path fill="#EA4335" d="M12 5.54c1.61 0 3.03.55 4.15 1.62l3.25-3.25C17.45 2.18 14.97 1 12 1 7.8 1 4.1 3.06 2.26 6.84l3.73 2.91c.85-2.52 3.22-4.21 6.01-4.21z"/>
    </svg>
  ),
  apple: () => (
    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 -mt-0.5">
        <title>Apple</title>
        <path fill="currentColor" d="M12.003 4.85C9.94 4.85 8.648 6.204 7.98 7.42c-1.39 2.535-1.043 6.32.96 8.358.747.747 1.57 1.57 2.657 1.57s1.785-.707 2.656-1.57c1.39-1.39 1.74-3.665 1.25-5.613-.245-.98.08-1.956.88-2.615.39-.31.86-.54 1.34-.6V4.93s-.04-.04-.04-.04c-.66.04-1.35.35-1.87.89-.98.98-1.5 2.37-1.83 2.37-.35 0-.7-.94-.7-2.02-.02-1.284-1.06-2.485-2.27-2.485zM14.65 3.33c.94-.04 1.83.7 2.41 1.29-.62.94-1.5 1.37-2.45 1.37-.94.04-1.83-.7-2.41-1.29.58-.94 1.5-1.37 2.45-1.37z"/>
    </svg>
  ),
};
