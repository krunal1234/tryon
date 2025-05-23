import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

class AuthService {
  constructor() {
    this.supabase = null;
  }

  async getSupabaseClient() {
    if (!this.supabase) {
      const cookieStore = cookies();
      this.supabase = createServerComponentClient({
        cookies: () => cookieStore,
      });
    }
    return this.supabase;
  }

  async signUpUser(email, password) {
    try {
      const supabase = await this.getSupabaseClient();
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: 'customer'
          }
        }
      });

      if (error) throw error;

      // Add customer role to user_roles table
      if (data.user) {
        console.log('User created:', data.user.id);
        
        const customerRoleId = await this.getRoleId('customer');
        console.log('Customer role ID:', customerRoleId);
        
        if (customerRoleId) {
          const { error: roleError } = await supabase
            .from('user_roles')
            .insert({
              user_id: data.user.id,
              role_id: customerRoleId
            });

          if (roleError) {
            console.error('Error assigning customer role:', roleError);
          } else {
            console.log('Customer role assigned successfully');
          }
        }
      }

      return {
        success: true,
        message: 'Registration successful! Please check your email to verify your account.',
        user: data.user
      };
    } catch (error) {
      console.error('Customer registration error:', error);
      return {
        success: false,
        message: error.message || 'Registration failed'
      };
    }
  }

  async signUpVendor(email, password, storeName) {
    try {
      const supabase = await this.getSupabaseClient();
      
      console.log('Starting vendor registration for:', email);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: 'vendor',
            store_name: storeName
          }
        }
      });

      if (error) {
        console.error('Supabase auth error:', error);
        throw error;
      }

      console.log('Vendor user created:', data.user?.id);

      // Add vendor role to user_roles table
      if (data.user) {
        const vendorRoleId = await this.getRoleId('vendor');
        console.log('Vendor role ID:', vendorRoleId);
        
        if (!vendorRoleId) {
          throw new Error('Vendor role not found in database');
        }

        // Insert user role
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: data.user.id,
            role_id: vendorRoleId
          });

        if (roleError) {
          console.error('Error assigning vendor role:', roleError);
          throw new Error('Failed to assign vendor role: ' + roleError.message);
        }

        console.log('Vendor role assigned successfully');

        // Create vendor profile
        const { error: profileError } = await supabase
          .from('vendor_profiles')
          .insert({
            user_id: data.user.id,
            store_name: storeName,
            email: email
          });

        if (profileError) {
          console.error('Error creating vendor profile:', profileError);
          // Don't throw error here, as role assignment is more critical
        } else {
          console.log('Vendor profile created successfully');
        }
      }

      return {
        success: true,
        message: 'Vendor registration successful! Please check your email to verify your account.',
        user: data.user
      };
    } catch (error) {
      console.error('Vendor registration error:', error);
      return {
        success: false,
        message: error.message || 'Vendor registration failed'
      };
    }
  }

  async createSession(formData) {
    try {
      const email = formData.get('email');
      const password = formData.get('password');

      console.log('Login attempt for:', email);

      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      const supabase = await this.getSupabaseClient();
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Login error:', error);
        throw error;
      }

      console.log('Login successful for user:', data.user.id);

      return {
        success: true,
        message: 'Login successful',
        user: data.user,
        session: data.session
      };
    } catch (error) {
      console.error('Session creation error:', error);
      return {
        success: false,
        message: error.message || 'Login failed'
      };
    }
  }

  async getRoleId(roleName) {
    try {
      const supabase = await this.getSupabaseClient();
      const { data, error } = await supabase
        .from('roles')
        .select('id')
        .eq('name', roleName)
        .single();

      if (error) {
        console.error(`Error getting role ID for ${roleName}:`, error);
        return null;
      }
      
      console.log(`Role ID for ${roleName}:`, data.id);
      return data.id;
    } catch (error) {
      console.error(`Error getting role ID for ${roleName}:`, error);
      return null;
    }
  }

  async getUserRole(userId) {
    try {
      console.log('Getting user role for:', userId);
      
      const supabase = await this.getSupabaseClient();
      const { data, error } = await supabase
        .from('user_roles')
        .select(`
          role_id,
          roles (name)
        `)
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching user roles:', error);
        throw error;
      }

      console.log('User roles data:', data);

      if (!data || data.length === 0) {
        console.log('No roles found for user, assigning default customer role');
        return 'customer';
      }

      const roles = data.map(ur => ur.roles.name);
      console.log('User roles:', roles);
      
      if (roles.includes('admin')) return 'admin';
      if (roles.includes('vendor')) return 'vendor';
      if (roles.includes('customer')) return 'customer';
      
      return 'customer'; // Default role
    } catch (error) {
      console.error('Error getting user role:', error);
      return 'customer';
    }
  }

  // Helper method to manually assign vendor role (for debugging)
  async assignVendorRole(userId) {
    try {
      const supabase = await this.getSupabaseClient();
      const vendorRoleId = await this.getRoleId('vendor');
      
      if (!vendorRoleId) {
        throw new Error('Vendor role not found');
      }

      const { error } = await supabase
        .from('user_roles')
        .upsert({
          user_id: userId,
          role_id: vendorRoleId
        });

      if (error) throw error;

      console.log('Vendor role assigned manually');
      return { success: true };
    } catch (error) {
      console.error('Error manually assigning vendor role:', error);
      return { success: false, error: error.message };
    }
  }
}

const auth = new AuthService();
export default auth;