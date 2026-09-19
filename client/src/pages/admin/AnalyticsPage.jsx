import React, {
  useEffect,
  useState
} from 'react';

import {
  adminApiRequest
} from '../../api/adminApi';

function AnalyticsPage() {
  const [analytics, setAnalytics] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  async function loadAnalytics() {
    try {
      setLoading(true);
      setError('');

      const response =
        await adminApiRequest(
          '/api/admin/analytics'
        );

      setAnalytics(
        response?.success
          ? response
          : null
      );
    } catch (err) {
      console.error(
        'Failed to load analytics:',
        err
      );

      setError(
        err?.message ||
          'Failed to load analytics.'
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <p className="text-sm text-slate-500">
          Loading analytics...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {error}
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
        <p className="text-sm text-slate-500">
          No analytics data available.
        </p>
      </div>
    );
  }

  const {
    content,
    qrCodes,
    feedback
  } = analytics;

  const contentCards = [
    {
      label: 'Buildings',
      total: content.buildings.total,
      active: content.buildings.active
    },
    {
      label: 'Floors',
      total: content.floors.total,
      active: content.floors.active
    },
    {
      label: 'Offices',
      total: content.offices.total,
      active: content.offices.active
    },
    {
      label: 'Departments',
      total: content.departments.total,
      active: content.departments.active
    },
    {
      label: 'Services',
      total: content.services.total,
      active: content.services.active
    },
    {
      label: 'Employees',
      total: content.employees.total,
      active: content.employees.active
    },
    {
      label: 'Facilities',
      total: content.facilities.total,
      active: content.facilities.active
    }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Analytics
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Overview of your Building Guide system usage.
        </p>
      </div>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-slate-900">
          QR Activity
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <MetricCard
            label="Total QR Codes"
            value={qrCodes.total}
          />

          <MetricCard
            label="Active QR Codes"
            value={qrCodes.active}
          />

          <MetricCard
            label="Total Scans"
            value={qrCodes.totalScans}
          />
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-slate-900">
          Feedback
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <MetricCard
            label="Total Feedback"
            value={feedback.total}
          />

          <MetricCard
            label="Today"
            value={feedback.today}
          />

          <MetricCard
            label="Last 7 Days"
            value={
              feedback.lastSevenDays
            }
          />

          <MetricCard
            label="Average Rating"
            value={
              feedback.averageRating
            }
          />
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-slate-900">
          Content
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {contentCards.map(
            (item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <p className="text-sm text-slate-500">
                  {item.label}
                </p>

                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {item.total}
                </p>

                <p className="mt-2 text-xs text-green-600">
                  {item.active} active
                </p>
              </div>
            )
          )}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-slate-900">
          Most Scanned QR Codes
        </h2>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {qrCodes.topQRs.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">
              No QR codes available.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {qrCodes.topQRs.map(
                (qrCode) => (
                  <div
                    key={qrCode.id}
                    className="flex items-center justify-between gap-4 p-5"
                  >
                    <div>
                      <p className="font-medium text-slate-900">
                        {qrCode.label}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {qrCode.locationType}
                      </p>
                    </div>

                    <p className="text-sm font-semibold text-slate-900">
                      {qrCode.scanCount} scans
                    </p>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-slate-900">
          Feedback Status
        </h2>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatusCard
            label="New"
            value={
              feedback.statusCounts
                .new
            }
          />

          <StatusCard
            label="Reviewed"
            value={
              feedback.statusCounts
                .reviewed
            }
          />

          <StatusCard
            label="Resolved"
            value={
              feedback.statusCounts
                .resolved
            }
          />

          <StatusCard
            label="Archived"
            value={
              feedback.statusCounts
                .archived
            }
          />
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-slate-900">
          Rating Distribution
        </h2>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          {[5, 4, 3, 2, 1].map(
            (rating) => {
              const count =
                feedback
                  .ratingCounts[
                    String(rating)
                  ] || 0;

              const percentage =
                feedback.total > 0
                  ? Math.round(
                      (count /
                        feedback.total) *
                        100
                    )
                  : 0;

              return (
                <div
                  key={rating}
                  className="mb-4 last:mb-0"
                >
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="font-medium text-slate-700">
                      {rating} stars
                    </span>

                    <span className="text-slate-500">
                      {count}
                    </span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-blue-600"
                      style={{
                        width:
                          `${percentage}%`
                      }}
                    />
                  </div>
                </div>
              );
            }
          )}
        </div>
      </section>
    </div>
  );
}

function MetricCard({
  label,
  value
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-3xl font-bold text-slate-900">
        {value}
      </p>
    </div>
  );
}

function StatusCard({
  label,
  value
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-sm text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-2xl font-bold text-slate-900">
        {value}
      </p>
    </div>
  );
}

export default AnalyticsPage;