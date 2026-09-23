import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'Dashtimer - The Aesthetic Pomodoro & Focus Space',
  description: 'An ultra-refined, animated aesthetic Pomodoro timer with dynamic wallpapers, ambient audio soundscapes, tactile Web Audio feedback, and glassmorphic design.',
  openGraph: {
    title: 'Dashtimer - The Aesthetic Pomodoro & Focus Space',
    description: 'An ultra-refined, animated aesthetic Pomodoro timer with dynamic wallpapers, ambient audio soundscapes, tactile Web Audio feedback, and glassmorphic design.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Dashtimer - The Aesthetic Pomodoro & Focus Space',
    description: 'An ultra-refined, animated aesthetic Pomodoro timer with dynamic wallpapers, ambient audio soundscapes, tactile Web Audio feedback, and glassmorphic design.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,500;0,600;1,400&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </head>
      <body suppressHydrationWarning className="overflow-x-hidden antialiased select-none">{children}</body>
    </html>
  );
}
