// app/vendor/inquiries/page.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { 
  MessageSquare, 
  Mail, 
  Phone, 
  Calendar, 
  ExternalLink,
  CheckCircle,
  Clock,
  AlertCircle,
  Filter,
  Search
} from 'lucide-react';

export default function VendorInquiriesPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [user, setUser] = useState(null);
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, new, contacted, resolved
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    checkVendorAccess();
  }, []);

  useEffect(() => {
    if (user) {
      fetchInquiries();
    }
  }, [user, filter, searchTerm]);

  const checkVendorAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/auth/login?redirect=/vendor/inquiries');
        return;
      }

      // Check if user has vendor role
      const { data: userRoles, error } = await supabase
        .from('user_roles')
        .select(`
          role_id,
          roles (name)
        `)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error checking user roles:', error);
        router.push('/');
        return;
      }

      const hasVendorRole = userRoles.some(ur => ur.roles.name === 'vendor');
      
      if (!hasVendorRole) {
        alert('Access denied. You need vendor privileges to view inquiries.');
        router.push('/');
        return;
      }

      setUser(user);
    } catch (error) {
      console.error('Error in vendor access check:', error);
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  const fetchInquiries = async () => {
    try {
      setLoading(true);
      
      // Get all products for this vendor first
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, name')
        .eq('user_id', user.id);

      if (productsError) throw productsError;

      if (products.length === 0) {
        setInquiries([]);
        return;
      }

      const productIds = products.map(p => p.id);

      // Build query for inquiries
      let query = supabase
        .from('inquiries')
        .select(`
          *,
          products (
            id,
            name,
            price,
            category
          )
        `)
        .in('product_id', productIds);

      // Apply status filter
      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      // Apply search filter
      if (searchTerm) {
        query = query.or(`customer_name.ilike.%${searchTerm}%,customer_email.ilike.%${searchTerm}%,message.ilike.%${searchTerm}%`);
      }

      const { data: inquiriesData, error: inquiriesError } = await query
        .order('created_at', { ascending: false });

      if (inquiriesError) throw inquiriesError;

      // Get product images for inquiries
      const inquiriesWithImages = await Promise.all(
        inquiriesData.map(async (inquiry) => {
          if (inquiry.product_id) {
            const { data: image } = await supabase
              .from('product_images')
              .select('image_url')
              .eq('product_id', inquiry.product_id)
              .eq('is_primary', true)
              .single();
            
            return {
              ...inquiry,
              product_image: image?.image_url
            };
          }
          return inquiry;
        })
      );

      setInquiries(inquiriesWithImages);
    } catch (error) {
      console.error('Error fetching inquiries:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateInquiryStatus = async (inquiryId, newStatus) => {
    try {
      const { error } = await supabase
        .from('inquiries')
        .update({ status: newStatus })
        .eq('id', inquiryId);

      if (error) throw error;

      // Update local state
      setInquiries(inquiries.map(inquiry => 
        inquiry.id === inquiryId ? { ...inquiry, status: newStatus } : inquiry
      ));
    } catch (error) {
      console.error('Error updating inquiry status:', error);
      alert('Failed to update inquiry status.');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'new':
        return <AlertCircle className="text-orange-500" size={16} />;
      case 'contacted':
        return <Clock className="text-blue-500" size={16} />;
      case 'resolved':
        return <CheckCircle className="text-green-500" size={16} />;
      default:
        return <MessageSquare className="text-gray-500" size={16} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'new':
        return 'bg-orange-100 text-orange-800';
      case 'contacted':
        return 'bg-blue-100 text-blue-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  const statusCounts = {
    all: inquiries.length,
    new: inquiries.filter(i => i.status === 'new').length,
    contacted: inquiries.filter(i => i.status === 'contacted').length,
    resolved: inquiries.filter(i => i.status === 'resolved').length
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-indigo-100 p-3 rounded-lg">
          <MessageSquare size={24} className="text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customer Inquiries</h1>
          <p className="text-gray-600">Manage inquiries about your products</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-gray-900">{statusCounts.all}</div>
          <div className="text-sm text-gray-600">Total Inquiries</div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-orange-600">{statusCounts.new}</div>
          <div className="text-sm text-gray-600">New</div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-blue-600">{statusCounts.contacted}</div>
          <div className="text-sm text-gray-600">In Progress</div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-green-600">{statusCounts.resolved}</div>
          <div className="text-sm text-gray-600">Resolved</div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search inquiries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        
        <div className="flex gap-2">
          {['all', 'new', 'contacted', 'resolved'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === status
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
              {status !== 'all' && (
                <span className="ml-1 text-xs">({statusCounts[status]})</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Inquiries List */}
      {inquiries.length === 0 ? (
        <div className="text-center py-12">
          <MessageSquare size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No inquiries found</h3>
          <p className="text-gray-500">
            {filter === 'all' 
              ? "You don't have any customer inquiries yet." 
              : `No ${filter} inquiries found.`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {inquiries.map((inquiry) => (
            <div key={inquiry.id} className="bg-white border rounded-lg p-6 hover:shadow-md transition">
              <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                {/* Product Info */}
                <div className="flex items-center gap-4 flex-shrink-0">
                  {inquiry.product_image && (
                    <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
                      <Image
                        src={inquiry.product_image}
                        alt={inquiry.products?.name || 'Product'}
                        width={64}
                        height={64}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}
                  <div>
                    <h3 className="font-medium">{inquiry.products?.name}</h3>
                    <p className="text-sm text-gray-600">{inquiry.products?.category}</p>
                    <p className="text-sm font-medium">${inquiry.products?.price?.toFixed(2)}</p>
                  </div>
                </div>

                {/* Inquiry Details */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{inquiry.customer_name}</h4>
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(inquiry.status)}`}>
                          {getStatusIcon(inquiry.status)}
                          {inquiry.status.charAt(0).toUpperCase() + inquiry.status.slice(1)}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Mail size={14} />
                          <a href={`mailto:${inquiry.customer_email}`} className="hover:text-indigo-600">
                            {inquiry.customer_email}
                          </a>
                        </div>
                        {inquiry.customer_phone && (
                          <div className="flex items-center gap-1">
                            <Phone size={14} />
                            <a href={`tel:${inquiry.customer_phone}`} className="hover:text-indigo-600">
                              {inquiry.customer_phone}
                            </a>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Calendar size={14} />
                          {formatDate(inquiry.created_at)}
                        </div>
                      </div>
                    </div>
                    
                    <Link
                      href={`/product/${inquiry.product_id}`}
                      className="text-indigo-600 hover:text-indigo-800"
                      target="_blank"
                    >
                      <ExternalLink size={16} />
                    </Link>
                  </div>

                  {/* Message */}
                  <div className="bg-gray-50 rounded-lg p-3 mb-4">
                    <p className="text-gray-700 whitespace-pre-wrap">{inquiry.message}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    {inquiry.status === 'new' && (
                      <button
                        onClick={() => updateInquiryStatus(inquiry.id, 'contacted')}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition"
                      >
                        Mark as Contacted
                      </button>
                    )}
                    
                    {inquiry.status === 'contacted' && (
                      <button
                        onClick={() => updateInquiryStatus(inquiry.id, 'resolved')}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition"
                      >
                        Mark as Resolved
                      </button>
                    )}
                    
                    {inquiry.status === 'resolved' && (
                      <button
                        onClick={() => updateInquiryStatus(inquiry.id, 'contacted')}
                        className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm transition"
                      >
                        Reopen
                      </button>
                    )}
                    
                    <a
                      href={`mailto:${inquiry.customer_email}?subject=Re: ${inquiry.products?.name}&body=Hi ${inquiry.customer_name},%0A%0AThank you for your interest in ${inquiry.products?.name}.%0A%0A`}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm transition flex items-center gap-1"
                    >
                      <Mail size={14} />
                      Reply via Email
                    </a>
                    
                    {inquiry.customer_phone && (
                      <a
                        href={`tel:${inquiry.customer_phone}`}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm transition flex items-center gap-1"
                      >
                        <Phone size={14} />
                        Call
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}