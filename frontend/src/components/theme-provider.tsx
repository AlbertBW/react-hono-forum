import * as React from "react";
import { ThemeProvider as AppThemeProvider } from "next-themes";

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof AppThemeProvider>) {
  return <AppThemeProvider {...props}>{children}</AppThemeProvider>;
}
