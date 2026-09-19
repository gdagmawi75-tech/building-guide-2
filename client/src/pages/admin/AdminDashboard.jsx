import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, getAdminMe } from '../../api/adminApi';

function AdminDashboard() {
  const navigate = useNavigate();

  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdminMe()
      .then((response) => {
        const currentAdmin =
          response?.admin ||
          response?.user ||
          response?.data ||
          response;

        setAdmin(currentAdmin);
      })
      .catch((error) => {
        console.error('Failed to load admin:', error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Failed to sign out:', error);
    }

    navigate('/admin/login', {
      replace: true
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="bg-white border border-slate-200 rounded-2xl px-8 py-6 shadow-sm">
          <p className="text-slate-600">
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  const roleLabel = admin?.role
    ? admin.role.replace(/_/g, ' ')
    : 'Admin';

  return (
    <div className="min-h-screen bg-slate-100">

      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4">

          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Building Guide
            </h1>

            <p className="text-sm text-slate-500">
              Admin Dashboard
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition"
          >
            Sign out
          </button>

        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">

        <section className="mb-8">

          <h2 className="text-3xl font-bold text-slate-900">
            Welcome
            {admin?.full_name
              ? `, ${admin.full_name}`
              : ''}
          </h2>

          <p className="mt-2 text-slate-500">
            Manage your building information from one place.
          </p>

        </section>

        <section className="bg-white rounded-2xl border border-slate-200 p-6 mb-8">

          <h3 className="text-lg font-semibold text-slate-900 mb-5">
            Account
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

            <InfoItem
              label="Name"
              value={admin?.full_name || 'Admin'}
            />

            <InfoItem
              label="Role"
              value={roleLabel}
            />

            <InfoItem
              label="Status"
              value="Active"
              valueClassName="text-green-600"
            />

          </div>

        </section>

        <section>

          <div className="mb-5">

            <h3 className="text-xl font-bold text-slate-900">
              Management
            </h3>

            <p className="text-sm text-slate-500 mt-1">
              Manage Building Guide content and operations.
            </p>

          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">

            <DashboardCard
              title="Buildings"
              description="Manage buildings and building information."
              onClick={() => navigate('/admin/buildings')}
            />

            <DashboardCard
              title="Floors"
              description="Manage floors and floor information."
              onClick={() => navigate('/admin/floors')}
            />

            <DashboardCard
              title="Offices"
              description="Manage offices, locations and public information."
              onClick={() => navigate('/admin/offices')}
            />

            <DashboardCard
              title="Departments"
              description="Manage departments and organizational information."
              onClick={() => navigate('/admin/departments')}
            />

            <DashboardCard
              title="Services"
              description="Manage services, requirements and status."
              onClick={() => navigate('/admin/services')}
            />

            <DashboardCard
              title="Employees"
              description="Manage employee information, positions and office assignments."
              onClick={() => navigate('/admin/employees')}
            />

            <DashboardCard
              title="Facilities"
              description="Manage facilities available to visitors."
              onClick={() => navigate('/admin/facilities')}
            />

            <DashboardCard
              title="Opening Hours"
              description="Manage working hours and breaks."
              onClick={() => navigate('/admin/opening-hours')}
            />

            <DashboardCard
              title="Announcements"
              description="Publish building announcements and updates."
              onClick={() => navigate('/admin/announcements')}
            />

            <DashboardCard
              title="Feedback"
              description="Review and manage visitor feedback."
              onClick={() => navigate('/admin/feedback')}
            />

            <DashboardCard
              title="QR Codes"
              description="Manage QR access points around the building."
              onClick={() => navigate('/admin/qr-codes')}
            />

            <DashboardCard
              title="Analytics"
              description="View system usage, QR scans and visitor feedback."
              onClick={() => navigate('/admin/analytics')}
            />

          </div>

        </section>

      </main>
    </div>
  );
}

function InfoItem({
  label,
  value,
  valueClassName = 'text-slate-900'
}) {
  return (
    <div>
      <p className="text-sm text-slate-500">
        {label}
      </p>

      <p className={`mt-1 font-medium capitalize ${valueClassName}`}>
        {value}
      </p>
    </div>
  );
}

function DashboardCard({
  title,
  description,
  onClick,
  disabled = false
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`w-full text-left bg-white border border-slate-200 rounded-2xl p-6 transition ${
        disabled
          ? 'opacity-60 cursor-not-allowed'
          : 'hover:shadow-md hover:border-slate-300 cursor-pointer'
      }`}
    >

      <h4 className="text-lg font-semibold text-slate-900">
        {title}
      </h4>

      <p className="mt-2 text-sm text-slate-500 leading-6">
        {description}
      </p>

      <span className="inline-block mt-5 text-sm font-semibold text-slate-900">
        {disabled ? 'Coming next' : 'Manage →'}
      </span>

    </button>
  );
}

export default AdminDashboard;
