
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from '@/components/theme-provider';
import { AppHeader } from '@/components/app-header';

export const metadata: Metadata = {
  title: 'ClassHub Central',
  description: 'Your central hub for class activities and resources.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&family=Space+Grotesk:wght@300..700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
            <div className="flex flex-col">
                <AppHeader />
                <div className="flex-grow">
                    {children}
                </div>
                <footer className="text-center p-4 text-sm italic text-muted-foreground border-t">
                    Where innovation begins and ideas take flight.
                </footer>
            </div>
            <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
