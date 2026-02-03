import { Laptop, Moon, Sun } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { type Theme, useTheme } from '@/components/theme-provider';

export function ModeToggle() {
  const { theme, setTheme } = useTheme();

  const handleValueChange = (value: string) => {
    setTheme(value as Theme);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" size="icon" className="relative">
            <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
        }
      ></DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuRadioGroup value={theme} onValueChange={handleValueChange}>
          <DropdownMenuRadioItem
            value="light"
            className="flex items-center gap-2"
          >
            <Sun className="size-4" />
            <span className="flex-1">Light</span>
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem
            value="dark"
            className="flex items-center gap-2"
          >
            <Moon className="size-4" />
            <span className="flex-1">Dark</span>
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem
            value="system"
            className="flex items-center gap-2"
          >
            <Laptop className="size-4" />
            <span className="flex-1">System</span>
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
