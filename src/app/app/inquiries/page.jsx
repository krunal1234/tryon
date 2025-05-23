// components/InquiryForm.js
'use client';
import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';

export default function InquiryForm({ product, vendorId, onClose }) {
  const { user } = useAuth();
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    message: `Hi, I'm interested in the ${product?.name}. Can you provide more information?`,
  });
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Get current user
    const getUser = async () => {
      if (!user) {
        // Redirect to login if not authenticated
        router.push(`/auth/login?redirect=/product/${product.id}`);
        onClose();
        return;
      }
      // Pre-fill form with user data if available
      setFormData(prev => ({
        ...prev,
        customer_email: user.email || '',
        customer_name: user.user_metadata?.full_name || ''
      }));
    };
    
    getUser();
  }, [product.id, router, onClose]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Save inquiry to database
      const { error: inquiryError } = await supabase
        .from('inquiries')
        .insert([
          { 
            product_id: product.id,
            user_id: vendorId, // The vendor who owns the product
            customer_id: user.id, // The customer making the inquiry
            customer_name: formData.customer_name,
            customer_email: formData.customer_email,
            customer_phone: formData.customer_phone,
            message: formData.message,
            status: 'new',
            whatsapp_sent: false
          }
        ]);
      
      if (inquiryError) throw inquiryError;
      
      // Optional: Send notification to vendor
      // This could trigger a Supabase Edge Function or webhook
      
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 3000);
      
    } catch (error) {
      console.error('Error submitting inquiry:', error);
      setError('Failed to submit inquiry. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  if (!user) {
    return null; // Will redirect to login
  }
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6 relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <X size={20} />
        </button>
        
        <h2 className="text-xl font-bold mb-1">Product Inquiry</h2>
        <p className="text-gray-600 mb-4">
          Ask about {product?.name}
        </p>
        
        {success ? (
          <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-lg">
            <p className="font-medium">Inquiry sent successfully!</p>
            <p className="text-sm mt-1">The vendor will contact you shortly.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your Name
                </label>
                <input
                  type="text"
                  name="customer_name"
                  value={formData.customer_name}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  name="customer_email"
                  value={formData.customer_email}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number (Optional)
                </label>
                <input
                  type="tel"
                  name="customer_phone"
                  value={formData.customer_phone}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={4}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md">
                  {error}
                </div>
              )}
              
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-md font-medium transition disabled:opacity-70"
              >
                {loading ? 'Sending...' : 'Send Inquiry'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}