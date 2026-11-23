import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { SocketProvider } from '@/context/SocketContext';
import Navbar from '@/components/navbar/Navbar';

export const metadata: Metadata = {
  title: 'M1 Company • Global Academic Support & Expert Marketplace CRM',
  description: 'M1 Company Enterprise Student–Expert Marketplace with real-time Socket.io chat, file uploads, escrow payments, and zero-contact privacy enforcement.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 flex flex-col font-sans">
        <AuthProvider>
          <SocketProvider>
            <Navbar />
            <main className="flex-1">
              {children}
            </main>
          </SocketProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
