import { ReactNode } from 'react';
import { ClerkProvider } from '@clerk/nextjs';
import { Inter } from 'next/font/google';
import Link from 'next/link';
import { BarChart3, Database, Settings, Shield, Users } from 'lucide-react';

const inter = Inter({ subsets: ['latin'] });

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className={`min-h-screen bg-background ${inter.className}`}>
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <div className="w-64 bg-card border-r border-border hidden md:block">
          <div className="p-6">
            <h1 className="text-xl font-bold">ChatterSphere Admin</h1>
          </div>
            <nav className="px-3 py-2">
              <ul className="space-y-1">
                <li>
                  <Link
                    href="/admin/dashboard"
                    className="flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                  >
                    <BarChart3 className="h-4 w-4" />
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link
                    href="/admin/users"
                    className="flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                  >
                    <Users className="h-4 w-4" />
                    Users
                  </Link>
                </li>
                <li>
                  <Link
                    href="/admin/communities"
                    className="flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                  >
                    <Users className="h-4 w-4" />
                    Communities
                  </Link>
                </li>
                <li>
                  <Link
                    href="/admin/monitoring"
                    className="flex items-center gap-3 rounded-md px-3 py-2 text-sm bg-accent text-accent-foreground"
                  >
                    <BarChart3 className="h-4 w-4" />
                    Monitoring
                  </Link>
                </li>
                <li>
                  <Link
                    href="/admin/database"
                    className="flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                  >
                    <Database className="h-4 w-4" />
                    Database
                  </Link>
                </li>
                <li>
                  <Link
                    href="/admin/security"
                    className="flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                  >
                    <Shield className="h-4 w-4" />
                    Security
                  </Link>
                </li>
                <li>
                  <Link
                    href="/admin/settings"
                    className="flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </Link>
                </li>
              </ul>
            </nav>
          </div>

          {/* Main content */}
          <div className="flex-1 overflow-auto">
            <main>{children}</main>
          </div>
        </div>
      </div>
    </div>
  );
}
