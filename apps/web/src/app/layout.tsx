import type { Metadata } from 'next';
import './globals.css';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileNav } from '@/components/layout/MobileNav';
import { ThemeProvider } from '@/components/ThemeProvider';
import { ChatButton } from '@/components/chat';

export const metadata: Metadata = {
  title: 'WealthCraft | Modern Financial Planning',
  description: 'Investor-ready financial planning tools for the modern wealth builder.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link href="https://api.fontshare.com/v2/css?f[]=clash-display@400,500,600,700&f[]=satoshi@400,500,700&display=swap" rel="stylesheet" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased font-body bg-slate-50 text-foreground selection:bg-brand-gold selection:text-white flex h-screen overflow-hidden">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          forcedTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >

          {/* Sidebar for Desktop */}
          <Sidebar />

          {/* Main Content Area */}
          <main className="flex-1 h-full overflow-y-auto relative pb-16 md:pb-0" id="main-content">
            {children}
          </main>

          <MobileNav />

          {/* AI Chat — floating, lazy-loaded */}
          <ChatButton />

          {/* Background Effects */}
          <div className="pointer-events-none fixed inset-0 z-[-1]">
            <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-brand-gold/5 blur-[120px]" />
            <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-brand-blue/5 blur-[120px]" />
          </div>

        </ThemeProvider>
      </body>
    </html>
  );
}
