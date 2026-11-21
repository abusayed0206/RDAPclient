'use client';

import { Moon, Sun } from 'lucide-react';

export function ThemeToggle() {
  const toggle = () => {
    const dark = !document.documentElement.classList.contains('dark');
    document.documentElement.classList.toggle('dark', dark);
    try {
      localStorage.setItem('theme-mode', dark ? 'dark' : 'light');
    } catch {
      // storage unavailable (private mode)
    }
  };

  // Both icons render; CSS shows the right one, so there's no hydration mismatch.
  return (
    <button
      type='button'
      onClick={toggle}
      aria-label='Toggle dark mode'
      className='text-ink hover:bg-sunk grid size-9 place-items-center rounded-full transition-colors'
    >
      <Moon className='size-4 dark:hidden' aria-hidden />
      <Sun className='hidden size-4 dark:block' aria-hidden />
    </button>
  );
}
