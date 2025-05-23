// Create this as components/DebugRoleChecker.js
'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/useAuth';

export default function DebugRoleChecker() {
  const { user } = useAuth();
  const [debugInfo, setDebugInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [assignmentResult, setAssignmentResult] = useState(null);

  const checkUserRole = async () => {
    if (!user) {
      alert('Please login first');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/debug/user-role');
      const data = await response.json();
      setDebugInfo(data);
    } catch (error) {
      console.error('Error checking user role:', error);
      setDebugInfo({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const assignVendorRole = async () => {
    if (!user) {
      alert('Please login first');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/debug/assign-vendor-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userEmail: user.email }),
      });
      
      const data = await response.json();
      setAssignmentResult(data);
      
      if (data.success) {
        alert('Vendor role assigned! Please refresh the page and try logging in again.');
      }
    } catch (error) {
      console.error('Error assigning vendor role:', error);
      setAssignmentResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white border rounded-lg shadow-sm">
      <h2 className="text-2xl font-bold mb-4">Role Debug Tool</h2>
      
      {user ? (
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold">Current User:</h3>
            <p>Email: {user.email}</p>
            <p>ID: {user.id}</p>
          </div>

          <div className="flex gap-4">
            <button
              onClick={checkUserRole}
              disabled={loading}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? 'Checking...' : 'Check User Roles'}
            </button>

            <button
              onClick={assignVendorRole}
              disabled={loading}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
            >
              {loading ? 'Assigning...' : 'Assign Vendor Role'}
            </button>
          </div>

          {debugInfo && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Debug Information:</h3>
              <pre className="text-sm overflow-auto bg-white p-3 rounded border">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </div>
          )}

          {assignmentResult && (
            <div className={`p-4 rounded-lg ${
              assignmentResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}>
              <h3 className="font-semibold mb-2">Assignment Result:</h3>
              <pre className="text-sm">
                {JSON.stringify(assignmentResult, null, 2)}
              </pre>
            </div>
          )}
        </div>
      ) : (
        <p className="text-gray-600">Please login to debug role assignments.</p>
      )}
    </div>
  );
}
