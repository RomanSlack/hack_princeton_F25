import './globals.css'
import Navigation from '../components/Navigation'
import { ThemeProvider } from '../contexts/ThemeContext'

export const metadata = {
  title: 'GPT Agent Builder',
  description: 'Build and visualize GPT agent logic',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
        <Navigation />
        {children}
        </ThemeProvider>
      </body>
    </html>
  )
}

