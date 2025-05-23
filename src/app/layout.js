// app/layout.js
import Navigation from './components/ui/Navigation';
import './globals.css';
import { AuthProvider } from '@/lib/useAuth';

export const metadata = {
  title: 'Jewelry Virtual Try-On',
  description: 'Try on jewelry virtually before you buy',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <main>{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
