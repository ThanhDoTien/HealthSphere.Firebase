'use client';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Icons } from './icons';
import type { Locale } from '@/lib/dictionaries';

interface LanguageSwitcherProps {
  lang: Locale;
  setLang: (lang: Locale) => void;
}

export function LanguageSwitcher({ lang, setLang }: LanguageSwitcherProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="gap-1.5">
          <Icons.globe className="h-4 w-4" />
          {lang === 'en' ? 'English' : 'Tiếng Việt'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setLang('en')}>
          English
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setLang('vi')}>
          Tiếng Việt
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
