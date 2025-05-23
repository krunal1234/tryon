// app/profile/page.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Edit,
  Save,
  X,
  Shield,
  Store,
  Package,
  Heart,
  MessageSquare,
  Settings,
  Key,
  Bell,
  Camera,
  Upload
} from 'lucide-react';
import { useAuth } from '@/lib/useAuth';
import ChangePasswordModal from '@/app/components/ChangePasswordModal';

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const supabase = createClientComponentClient();
  
  const [userRole, setUserRole] = useState(null);
  const [userStats, setUserStats] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  
  const [profileData, setProfileData] = useState({
    full_name: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    store_name: '',
    store_description: '',
    website: '',
    avatar_url: ''
  });

  const [originalData, setOriginalData] = useState({});

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login?redirect=/profile');
      return;
    }
    
    if (user) {
      fetchUserProfile();
    }
  }, [user, authLoading, router]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);

      // Get user role
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select(`
          role_id,
          roles (name)
        `)
        .eq('user_id', user.id);

      if (rolesError) {
        console.error('Error fetching user roles:', rolesError);
      } else {
        const hasVendorRole = userRoles.some(ur => ur.roles.name === 'vendor');
        const hasAdminRole = userRoles.some(ur => ur.roles.name === 'admin');
        
        if (hasAdminRole) {
          setUserRole('admin');
        } else if (hasVendorRole) {
          setUserRole('vendor');
        } else {
          setUserRole('customer');
        }
      }

      // Set initial profile data from user metadata
      const initialData = {
        full_name: user.user_metadata?.full_name || '',
        phone: user.user_metadata?.phone || '',
        address: user.user_metadata?.address || '',
        city: user.user_metadata?.city || '',
        country: user.user_metadata?.country || '',
        store_name: user.user_metadata?.store_name || '',
        store_description: user.user_metadata?.store_description || '',
        website: user.user_metadata?.website || '',
        avatar_url: user.user_metadata?.avatar_url || ''
      };

      setProfileData(initialData);
      setOriginalData(initialData);

      // Fetch user statistics based on role
      await fetchUserStats(userRoles);

    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async (userRoles) => {
    try {
      const hasVendorRole = userRoles.some(ur => ur.roles.name === 'vendor');
      const hasAdminRole = userRoles.some(ur => ur.roles.name === 'admin');

      if (hasVendorRole) {
        // Fetch vendor stats
        const { data: products } = await supabase
          .from('products')
          .select('id')
          .eq('user_id', user.id);

        const productIds = products?.map(p => p.id) || [];

        const { count: inquiriesCount } = await supabase
          .from('inquiries')
          .select('id', { count: 'exact' })
          .in('product_id', productIds);

        const { count: favoritesCount } = await supabase
          .from('favorites')
          .select('id', { count: 'exact' })
          .in('product_id', productIds);

        setUserStats({
          totalProducts: products?.length || 0,
          totalInquiries: inquiriesCount || 0,
          totalFavorites: favoritesCount || 0
        });

      } else if (!hasAdminRole) {
        // Fetch customer stats
        const { count: favoritesCount } = await supabase
          .from('favorites')
          .select('id', { count: 'exact' })
          .eq('user_id', user.id);

        const { count: inquiriesCount } = await supabase
          .from('inquiries')
          .select('id', { count: 'exact' })
          .eq('customer_id', user.id);

        setUserStats({
          totalFavorites: favoritesCount || 0,
          totalInquiries: inquiriesCount || 0
        });
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    
    try {
      // Update user metadata
      const { error } = await supabase.auth.updateUser({
        data: profileData
      });

      if (error) throw error;

      setOriginalData(profileData);
      setIsEditing(false);
      alert('Profile updated successfully!');

    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setProfileData(originalData);
    setIsEditing(false);
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setSaving(true);
      
      // Upload avatar to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update profile with new avatar URL
      const updatedProfileData = {
        ...profileData,
        avatar_url: data.publicUrl
      };

      const { error: updateError } = await supabase.auth.updateUser({
        data: updatedProfileData
      });

      if (updateError) throw updateError;

      setProfileData(updatedProfileData);
      setOriginalData(updatedProfileData);

    } catch (error) {
      console.error('Error uploading avatar:', error);
      alert('Failed to upload avatar. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="relative">
            <div className="w-20 h-20 bg-gray-200 rounded-full overflow-hidden">
              {profileData.avatar_url ? (
                <img
                  src={profileData.avatar_url}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User size={32} className="text-gray-500" />
                </div>
              )}
            </div>
            <label className="absolute bottom-0 right-0 bg-indigo-600 text-white p-1 rounded-full cursor-pointer hover:bg-indigo-700 transition">
              <Camera size={14} />
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </label>
          </div>
          
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {profileData.full_name || 'Your Profile'}
            </h1>
            <p className="text-gray-600">{user.email}</p>
            <div className="flex items-center gap-2 mt-1">
              {userRole && (
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  userRole === 'admin' ? 'bg-red-100 text-red-700' :
                  userRole === 'vendor' ? 'bg-green-100 text-green-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  <Shield size={12} className="inline mr-1" />
                  {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
                </span>
              )}
              <span className="text-xs text-gray-500">
                Member since {formatDate(user.created_at)}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex gap-2">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition"
            >
              <Edit size={16} />
              Edit Profile
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleCancel}
                className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition"
              >
                <X size={16} />
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition disabled:opacity-70"
              >
                <Save size={16} />
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Profile Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-medium mb-4">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="full_name"
                    value={profileData.full_name}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                ) : (
                  <p className="text-gray-900">{profileData.full_name || 'Not provided'}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <p className="text-gray-900 flex items-center gap-2">
                  <Mail size={16} className="text-gray-500" />
                  {user.email}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    name="phone"
                    value={profileData.phone}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                ) : (
                  <p className="text-gray-900 flex items-center gap-2">
                    <Phone size={16} className="text-gray-500" />
                    {profileData.phone || 'Not provided'}
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="address"
                    value={profileData.address}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                ) : (
                  <p className="text-gray-900 flex items-center gap-2">
                    <MapPin size={16} className="text-gray-500" />
                    {profileData.address || 'Not provided'}
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="city"
                    value={profileData.city}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                ) : (
                  <p className="text-gray-900">{profileData.city || 'Not provided'}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Country
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="country"
                    value={profileData.country}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                ) : (
                  <p className="text-gray-900">{profileData.country || 'Not provided'}</p>
                )}
              </div>
            </div>
          </div>

          {/* Vendor Information */}
          {userRole === 'vendor' && (
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-medium mb-4">Store Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Store Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="store_name"
                      value={profileData.store_name}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  ) : (
                    <p className="text-gray-900 flex items-center gap-2">
                      <Store size={16} className="text-gray-500" />
                      {profileData.store_name || 'Not provided'}
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Store Description
                  </label>
                  {isEditing ? (
                    <textarea
                      name="store_description"
                      value={profileData.store_description}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  ) : (
                    <p className="text-gray-900">{profileData.store_description || 'Not provided'}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Website
                  </label>
                  {isEditing ? (
                    <input
                      type="url"
                      name="website"
                      value={profileData.website}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  ) : (
                    <p className="text-gray-900">
                      {profileData.website ? (
                        <a href={profileData.website} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800">
                          {profileData.website}
                        </a>
                      ) : (
                        'Not provided'
                      )}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Statistics */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-medium mb-4">Your Activity</h3>
            <div className="space-y-3">
              {userRole === 'vendor' ? (
                <>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Package size={16} className="text-blue-500" />
                      <span className="text-sm text-gray-600">Products</span>
                    </div>
                    <span className="font-medium">{userStats.totalProducts || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageSquare size={16} className="text-orange-500" />
                      <span className="text-sm text-gray-600">Inquiries</span>
                    </div>
                    <span className="font-medium">{userStats.totalInquiries || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Heart size={16} className="text-red-500" />
                      <span className="text-sm text-gray-600">Favorites</span>
                    </div>
                    <span className="font-medium">{userStats.totalFavorites || 0}</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Heart size={16} className="text-red-500" />
                      <span className="text-sm text-gray-600">Favorites</span>
                    </div>
                    <span className="font-medium">{userStats.totalFavorites || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageSquare size={16} className="text-orange-500" />
                      <span className="text-sm text-gray-600">Inquiries</span>
                    </div>
                    <span className="font-medium">{userStats.totalInquiries || 0}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Account Settings */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-medium mb-4">Account Settings</h3>
            <div className="space-y-3">
              <button 
                onClick={() => setShowChangePassword(true)}
                className="w-full flex items-center gap-2 text-left p-2 hover:bg-gray-50 rounded-md transition"
              >
                <Key size={16} className="text-gray-500" />
                <span className="text-sm">Change Password</span>
              </button>
              <button className="w-full flex items-center gap-2 text-left p-2 hover:bg-gray-50 rounded-md transition">
                <Bell size={16} className="text-gray-500" />
                <span className="text-sm">Notification Settings</span>
              </button>
              <button className="w-full flex items-center gap-2 text-left p-2 hover:bg-gray-50 rounded-md transition">
                <Settings size={16} className="text-gray-500" />
                <span className="text-sm">Privacy Settings</span>
              </button>
            </div>
          </div>

          {/* Account Info */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-medium mb-4">Account Info</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Calendar size={14} />
                <span>Joined {formatDate(user.created_at)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail size={14} />
                <span>Email verified</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={showChangePassword} 
        onClose={() => setShowChangePassword(false)} 
      />
    </div>
  );
}