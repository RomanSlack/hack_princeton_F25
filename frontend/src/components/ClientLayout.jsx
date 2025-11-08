'use client'

import { ThemeProvider } from '../contexts/ThemeContext';
import Navigation from './Navigation';

export default function ClientLayout({ children }) {
  return (
    <ThemeProvider>
      <Navigation />
      {children}
    </ThemeProvider>
  );
}

