import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { getAdminMe, supabase } from '../../api/adminApi';

function ProtectedAdminRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function checkAdmin() {
      try {
        setLoading(true);
        setError('');

        const {
          data: { session },
          error: sessionError
        } = await supabase.auth.getSession();

        if (sessionError) {
          throw new Error(sessionError.message);
        }

        if (!session) {
          throw new Error('No Supabase session found.');
        }

        const response = await getAdminMe();

        console.log('Admin /me response:', response);

        setAuthorized(true);
      } catch (err) {
        console.error('Admin authentication check failed:', err);

        setError(err.message || 'Admin authentication failed.');
        setAuthorized(false);

        // Do NOT sign out yet.
        // We need to see the actual error first.
      } finally {
        setLoading(false);
      }
    }

    checkAdmin();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
          <p className="text-slate-700 font-medium">
            Checking admin access...
          </p>
        </div>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
        <div className="w-full max-w-lg bg-white rounded-2xl shadow-sm border border-red-200 p-8">
          <h1 className="text-2xl font-bold text-slate-900">
            Admin access failed
          </h1>

          <p className="mt-3 text-red-600">
            {error || 'You are not authorized to access this page.'}
          </p>

          <button
            type="button"
            onClick={() => {
              window.location.href = '/admin/login';
            }}
            className="mt-6 px-5 py-3 rounded-xl bg-slate-900 text-white font-semibold"
          >
            Back to login
          </button>
        </div>
      </div>
    );
  }

  return children;
}

export default ProtectedAdminRoute;