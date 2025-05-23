import { createClient } from "./server";

const auth = {
  createSession: async (formData) => {
    try {
      const supabase = await createClient();
      const data = Object.fromEntries(formData);
      const { email, password } = data;

      const { data: sessionData, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, message: error.message };
      }

      return { success: true, session: sessionData };
    } catch (error) {
      return { success: false, message: error.message };
    }
  },

  getUserInfoData: async () => {
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { success: false, message: "User not found." };
      }

      const { data: userInfo, error } = await supabase
        .from('UserInfo')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return { success: true, userInfo };
    } catch (error) {
      return { success: false, message: error.message };
    }
  },

  getJWT: async () => {
    try {
      const supabase = await createClient();
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        return { success: false, message: error.message };
      }

      const jwtToken = session.access_token;
      return { success: true, jwtToken };
    } catch (error) {
      return { success: false, message: error.message };
    }
  },

  getPublicURL: async (path) => {
    try {
      const supabase = await createClient();
      const { data } = await supabase
        .storage
        .from('campaignFile')
        .getPublicUrl(path);

      return { success: true, data };
    } catch (error) {
      return { success: false, message: error.message };
    }
  },

  getSession: async () => {
    try {
      const supabase = await createClient();
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error || !user) {
        return { success: false, message: error ? error.message : "User not logged in." };
      }

      return { success: true, session: user };
    } catch (error) {
      return { success: false, message: error.message };
    }
  },

  signUpUser: async (email, password) => {
    try {
      const supabase = await createClient();
      const { user, error } = await supabase.auth.signUp(
        { email, password },
        {
          data: {
            role: 'customer',
          },
        }
      );

      if (error) {
        return { success: false, message: error.message };
      }

      // After successful signup, assign role
      await auth.assignRole(user.id, 'customer');

      return { success: true, user };
    } catch (error) {
      return { success: false, message: error.message };
    }
  },

  signUpVendor: async (email, password) => {
    try {
      const supabase = await createClient();
      const { user, error } = await supabase.auth.signUp(
        { email, password },
        {
          data: {
            role: 'vendor',
          },
        }
      );

      if (error) {
        return { success: false, message: error.message };
      }

      // After successful signup, assign role
      await auth.assignRole(user.id, 'vendor');

      return { success: true, user };
    } catch (error) {
      return { success: false, message: error.message };
    }
  },

  assignRole: async (userId, roleName) => {
    try {
      const supabase = await createClient();
      const { data: role, error: roleError } = await supabase
        .from('roles')
        .select('id')
        .eq('name', roleName)
        .single();

      if (roleError) {
        return { success: false, message: 'Error fetching role: ' + roleError.message };
      }

      const { error } = await supabase
        .from('user_roles')
        .insert([{ user_id: userId, role_id: role.id }]);

      if (error) {
        return { success: false, message: 'Error assigning role: ' + error.message };
      }

      return { success: true, message: `Assigned ${roleName} role to user` };
    } catch (error) {
      return { success: false, message: error.message };
    }
  },

  deleteSession: async () => {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.signOut();

      if (error) {
        return { success: false, message: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  },
};

export default auth;
