// components/Navigation.js - Updated to use new auth hook
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { 
  Home, 
  Heart, 
  Package, 
  LogIn, 
  LogOut, 
  User, 
  Plus,
  Settings,
  BarChart3,
  MessageSquare,
  Menu,
  X,
  Store,
  Sparkles
} from 'lucide-react';
import { useAuth } from '@/lib/useAuth';

export default function Navigation() {
  const pathname = usePathname();
  const { user, userRole, logout, loading, isVendor, isAdmin, isCustomer } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <nav className="bg-white border-b shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-xl text-gray-900">
            <Sparkles className="text-indigo-600" size={24} />
            JewelryTryOn
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {/* Main Navigation */}
            <Link
              href="/"
              className={`flex items-center gap-2 px-3 py-2 rounded-md transition ${
                pathname === '/' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Home size={18} />
              <span>Home</span>
            </Link>
            
            <Link
              href="/products"
              className={`flex items-center gap-2 px-3 py-2 rounded-md transition ${
                pathname === '/products' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Package size={18} />
              <span>Products</span>
            </Link>
            
            {/* Customer-specific navigation */}
            {user && isCustomer && (
              <Link
                href="/favorites"
                className={`flex items-center gap-2 px-3 py-2 rounded-md transition ${
                  pathname === '/favorites' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Heart size={18} />
                <span>Favorites</span>
              </Link>
            )}

            {/* Vendor-specific navigation */}
            {user && isVendor && (
              <>
                <div className="h-6 w-px bg-gray-300 mx-2" />
                <Link
                  href="/vendor/products"
                  className={`flex items-center gap-2 px-3 py-2 rounded-md transition ${
                    pathname.startsWith('/vendor/products') ? 'bg-indigo-100 text-indigo-700' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Store size={18} />
                  <span>My Products</span>
                </Link>
                
                <Link
                  href="/vendor/create-product"
                  className={`flex items-center gap-2 px-3 py-2 rounded-md transition ${
                    pathname === '/vendor/create-product' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Plus size={18} />
                  <span>Add Product</span>
                </Link>
                
                <Link
                  href="/vendor/inquiries"
                  className={`flex items-center gap-2 px-3 py-2 rounded-md transition ${
                    pathname === '/vendor/inquiries' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <MessageSquare size={18} />
                  <span>Inquiries</span>
                </Link>
                
                <Link
                  href="/vendor/dashboard"
                  className={`flex items-center gap-2 px-3 py-2 rounded-md transition ${
                    pathname === '/vendor/dashboard' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <BarChart3 size={18} />
                  <span>Analytics</span>
                </Link>
              </>
            )}

            {/* Admin-specific navigation */}
            {user && isAdmin && (
              <>
                <div className="h-6 w-px bg-gray-300 mx-2" />
                <Link
                  href="/admin/dashboard"
                  className={`flex items-center gap-2 px-3 py-2 rounded-md transition ${
                    pathname === '/admin/dashboard' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <BarChart3 size={18} />
                  <span>Admin</span>
                </Link>
              </>
            )}
          </div>

          {/* User Actions */}
          <div className="hidden md:flex items-center space-x-2">
            {!loading && (
              <>
                {user ? (
                  <div className="flex items-center gap-2">
                    {/* Role Badge */}
                    {userRole && (
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        userRole === 'admin' ? 'bg-red-100 text-red-700' :
                        userRole === 'vendor' ? 'bg-green-100 text-green-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
                      </span>
                    )}
                    
                    <Link
                      href="/profile"
                      className={`flex items-center gap-2 px-3 py-2 rounded-md transition ${
                        pathname === '/profile' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <User size={18} />
                      <span>Profile</span>
                    </Link>
                    
                    <button
                      onClick={logout}
                      className="flex items-center gap-2 px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100 transition"
                    >
                      <LogOut size={18} />
                      <span>Logout</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Link
                      href="/login"
                      className={`flex items-center gap-2 px-3 py-2 rounded-md transition ${
                        pathname === '/login' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <LogIn size={18} />
                      <span>Login</span>
                    </Link>
                    
                    <Link
                      href="/register"
                      className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition"
                    >
                      Sign Up
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-gray-700 hover:bg-gray-100"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t bg-white">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {/* Main Navigation */}
              <Link
                href="/"
                onClick={closeMobileMenu}
                className={`flex items-center gap-3 px-3 py-2 rounded-md transition ${
                  pathname === '/' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Home size={20} />
                <span>Home</span>
              </Link>
              
              <Link
                href="/products"
                onClick={closeMobileMenu}
                className={`flex items-center gap-3 px-3 py-2 rounded-md transition ${
                  pathname === '/products' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Package size={20} />
                <span>Products</span>
              </Link>
              
              {/* Customer-specific mobile navigation */}
              {user && isCustomer && (
                <Link
                  href="/favorites"
                  onClick={closeMobileMenu}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md transition ${
                    pathname === '/favorites' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Heart size={20} />
                  <span>Favorites</span>
                </Link>
              )}

              {/* Vendor-specific mobile navigation */}
              {user && isVendor && (
                <>
                  <div className="border-t my-2" />
                  <div className="px-3 py-2 text-sm font-medium text-gray-500">Vendor Tools</div>
                  
                  <Link
                    href="/vendor/products"
                    onClick={closeMobileMenu}
                    className={`flex items-center gap-3 px-3 py-2 rounded-md transition ${
                      pathname.startsWith('/vendor/products') ? 'bg-indigo-100 text-indigo-700' : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Store size={20} />
                    <span>My Products</span>
                  </Link>
                  
                  <Link
                    href="/vendor/create-product"
                    onClick={closeMobileMenu}
                    className={`flex items-center gap-3 px-3 py-2 rounded-md transition ${
                      pathname === '/vendor/create-product' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Plus size={20} />
                    <span>Add Product</span>
                  </Link>
                  
                  <Link
                    href="/vendor/inquiries"
                    onClick={closeMobileMenu}
                    className={`flex items-center gap-3 px-3 py-2 rounded-md transition ${
                      pathname === '/vendor/inquiries' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <MessageSquare size={20} />
                    <span>Inquiries</span>
                  </Link>
                  
                  <Link
                    href="/vendor/dashboard"
                    onClick={closeMobileMenu}
                    className={`flex items-center gap-3 px-3 py-2 rounded-md transition ${
                      pathname === '/vendor/dashboard' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <BarChart3 size={20} />
                    <span>Analytics</span>
                  </Link>
                </>
              )}

              {/* Admin-specific mobile navigation */}
              {user && isAdmin && (
                <>
                  <div className="border-t my-2" />
                  <div className="px-3 py-2 text-sm font-medium text-gray-500">Admin Tools</div>
                  
                  <Link
                    href="/admin/dashboard"
                    onClick={closeMobileMenu}
                    className={`flex items-center gap-3 px-3 py-2 rounded-md transition ${
                      pathname === '/admin/dashboard' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <BarChart3 size={20} />
                    <span>Admin Dashboard</span>
                  </Link>
                </>
              )}

              {/* User Actions Mobile */}
              {!loading && (
                <>
                  <div className="border-t my-2" />
                  {user ? (
                    <>
                      {/* Role Badge Mobile */}
                      {userRole && (
                        <div className="px-3 py-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            userRole === 'admin' ? 'bg-red-100 text-red-700' :
                            userRole === 'vendor' ? 'bg-green-100 text-green-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
                          </span>
                        </div>
                      )}
                      
                      <Link
                        href="/profile"
                        onClick={closeMobileMenu}
                        className={`flex items-center gap-3 px-3 py-2 rounded-md transition ${
                          pathname === '/profile' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <User size={20} />
                        <span>Profile</span>
                      </Link>
                      
                      <button
                        onClick={() => {
                          logout();
                          closeMobileMenu();
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100 transition"
                      >
                        <LogOut size={20} />
                        <span>Logout</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/login"
                        onClick={closeMobileMenu}
                        className={`flex items-center gap-3 px-3 py-2 rounded-md transition ${
                          pathname === '/login' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <LogIn size={20} />
                        <span>Login</span>
                      </Link>
                      
                      <Link
                        href="/register"
                        onClick={closeMobileMenu}
                        className="mx-3 my-2 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition text-center block"
                      >
                        Sign Up
                      </Link>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
