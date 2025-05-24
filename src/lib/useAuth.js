// lib/useAuth.js - Enhanced auth hook with role support
'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();
  const router = useRouter();

  useEffect(() => {
    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          await fetchUserRole(session.user.id);
        } else {
          setUser(null);
          setUserRole(null);
        }
      } catch (error) {
        console.error("Error checking session:", error);
      } finally {
        setLoading(false);
      }
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event);
        if (session?.user) {
          setUser(session.user);
          await fetchUserRole(session.user.id);
        } else {
          setUser(null);
          setUserRole(null);
        }
        setLoading(false);
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, [supabase]);

  const fetchUserRole = async (userId) => {
    try {
      const { data: userRoles, error } = await supabase
        .from('user_roles')
        .select(`
          role_id,
          roles (name)
        `)
        .eq('user_id', userId);

      if (error) throw error;

      const roles = userRoles?.map(ur => ur.roles.name) || [];
      
      if (roles.includes('admin')) {
        setUserRole('admin');
      } else if (roles.includes('vendor')) {
        setUserRole('vendor');
      } else {
        setUserRole('customer');
      }
    } catch (error) {
      console.error('Error fetching user role:', error);
      setUserRole('customer'); // Default role
    }
  };

  const login = async (email, password, isVendor = false) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (!data?.user) {
        throw new Error("Login failed - user not found");
      }

      // Fetch user role
      await fetchUserRole(data.user.id);

      // Redirect based on role if vendor login was attempted
      if (isVendor) {
        const { data: userRoles } = await supabase
          .from('user_roles')
          .select(`roles (name)`)
          .eq('user_id', data.user.id);

        const hasVendorRole = userRoles?.some(ur => ur.roles.name === 'vendor' || ur.roles.name === 'admin');
        
        if (!hasVendorRole) {
          await supabase.auth.signOut();
          throw new Error("Access denied. Vendor privileges required.");
        }
        
        router.push('/vendor/dashboard');
      } else {
        router.push('/app/dashboard');
      }

      return data.user;
    } catch (error) {
      console.error("Login failed:", error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.push('/');
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  };

  const value = {
    user,
    userRole,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
    isVendor: userRole === 'vendor' || userRole === 'admin',
    isAdmin: userRole === 'admin',
    isCustomer: userRole === 'customer',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
