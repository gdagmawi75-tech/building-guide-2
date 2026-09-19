import React, {
  useEffect,
  useMemo,
  useState
} from 'react';

import { useNavigate } from 'react-router-dom';

import {
  getAdminFeedback,
  updateAdminFeedbackStatus,
  getAdminMe
} from '../../api/adminApi';

const FEEDBACK_STATUSES = [
  'new',
  'reviewed',
  'resolved',
  'archived'
];

function getResponseArray(response) {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  return [];
}

function formatDate(value) {
  if (!value) {
    return '—';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return date.toLocaleString();
}

function getStatusClasses(status) {
  switch (status) {
    case 'new':
      return 'bg-blue-100 text-blue-700';

    case 'reviewed':
      return 'bg-yellow-100 text-yellow-700';

    case 'resolved':
      return 'bg-green-100 text-green-700';

    case 'archived':
      return 'bg-gray-100 text-gray-700';

    default:
      return 'bg-gray-100 text-gray-700';
  }
}

function getStatusLabel(status) {
  switch (status) {
    case 'new':
      return 'New';

    case 'reviewed':
      return 'Reviewed';

    case 'resolved':
      return 'Resolved';

    case 'archived':
      return 'Archived';

    default:
      return status || 'Unknown';
  }
}

function renderStars(rating) {
  if (!rating) {
    return '—';
  }

  return '★'.repeat(rating) +
    '☆'.repeat(5 - rating);
}

export default function FeedbackPage() {
  const navigate = useNavigate();

  const [admin, setAdmin] = useState(null);

  const [feedback, setFeedback] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState('');

  const [success, setSuccess] = useState('');

  const [statusFilter, setStatusFilter] =
    useState('');

  const [ratingFilter, setRatingFilter] =
    useState('');

  const [updatingId, setUpdatingId] =
    useState(null);

  const [selectedFeedback, setSelectedFeedback] =
    useState(null);

  const canManage =
    admin?.role === 'super_admin' ||
    admin?.role === 'building_manager' ||
    admin?.role === 'feedback_manager';

  const isFloorManager =
    admin?.role === 'floor_manager';

  async function loadData() {
    try {
      setLoading(true);
      setError('');

      const [
        adminResponse,
        feedbackResponse
      ] = await Promise.all([
        getAdminMe(),
        getAdminFeedback()
      ]);

      const currentAdmin =
        adminResponse?.data ||
        adminResponse?.admin ||
        adminResponse?.user ||
        adminResponse ||
        null;

      setAdmin(currentAdmin);

      setFeedback(
        getResponseArray(
          feedbackResponse
        )
      );
    } catch (err) {
      console.error(
        'Failed to load feedback:',
        err
      );

      setError(
        err.message ||
        'Failed to load feedback.'
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const visibleFeedback = useMemo(() => {
    let result = feedback;

    if (statusFilter) {
      result = result.filter(
        (item) =>
          item.status === statusFilter
      );
    }

    if (ratingFilter) {
      result = result.filter(
        (item) =>
          String(item.rating) ===
          ratingFilter
      );
    }

    return result;
  }, [
    feedback,
    statusFilter,
    ratingFilter
  ]);

  function clearMessages() {
    setError('');
    setSuccess('');
  }

  async function handleStatusChange(
    item,
    newStatus
  ) {
    clearMessages();

    try {
      setUpdatingId(item.id);

      const response =
        await updateAdminFeedbackStatus(
          item.id,
          newStatus
        );

      if (!response?.success) {
        throw new Error(
          response?.error ||
          'Failed to update feedback status.'
        );
      }

      setSuccess(
        'Feedback status updated successfully.'
      );

      setSelectedFeedback(
        null
      );

      await loadData();
    } catch (err) {
      console.error(
        'Failed to update feedback:',
        err
      );

      setError(
        err.message ||
        'Failed to update feedback status.'
      );
    } finally {
      setUpdatingId(null);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="rounded-xl bg-white border border-gray-200 px-8 py-6 shadow-sm">
          <p className="text-gray-600">
            Loading feedback...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">

      <div className="mx-auto max-w-7xl px-6 py-8">

        {/* HEADER */}

        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

          <div>

            <button
              type="button"
              onClick={() =>
                navigate('/admin')
              }
              className="mb-4 text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              ← Back to Dashboard
            </button>

            <h1 className="text-3xl font-bold text-gray-900">
              Visitor Feedback
            </h1>

            <p className="mt-1 text-gray-600">
              Review visitor feedback and track its resolution.
            </p>

            {admin?.full_name && (
              <p className="mt-2 text-sm text-gray-500">
                Logged in as{' '}
                <span className="font-medium">
                  {admin.full_name}
                </span>
              </p>
            )}

          </div>

        </div>

        {/* MESSAGES */}

        {error && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {success}
          </div>
        )}

        {/* ROLE INFORMATION */}

        {isFloorManager && (
          <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
            Floor Managers can view feedback but cannot change its status.
          </div>
        )}

        {/* FILTERS */}

        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">

          <div className="grid gap-4 md:grid-cols-2">

            {/* STATUS */}

            <div>

              <label
                htmlFor="feedback-status-filter"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Filter by status
              </label>

              <select
                id="feedback-status-filter"
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value
                  )
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm"
              >

                <option value="">
                  All statuses
                </option>

                {FEEDBACK_STATUSES.map(
                  (status) => (
                    <option
                      key={status}
                      value={status}
                    >
                      {getStatusLabel(
                        status
                      )}
                    </option>
                  )
                )}

              </select>

            </div>

            {/* RATING */}

            <div>

              <label
                htmlFor="feedback-rating-filter"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Filter by rating
              </label>

              <select
                id="feedback-rating-filter"
                value={ratingFilter}
                onChange={(event) =>
                  setRatingFilter(
                    event.target.value
                  )
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm"
              >

                <option value="">
                  All ratings
                </option>

                <option value="5">
                  5 stars
                </option>

                <option value="4">
                  4 stars
                </option>

                <option value="3">
                  3 stars
                </option>

                <option value="2">
                  2 stars
                </option>

                <option value="1">
                  1 star
                </option>

              </select>

            </div>

          </div>

        </div>

        {/* COUNT */}

        <div className="mb-5 text-sm text-gray-600">
          <strong>
            {visibleFeedback.length}
          </strong>{' '}
          feedback
          {visibleFeedback.length === 1
            ? ''
            : ' items'}
        </div>

        {/* EMPTY STATE */}

        {visibleFeedback.length === 0 ? (

          <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">

            <h2 className="text-xl font-semibold text-gray-900">
              No feedback found
            </h2>

            <p className="mt-2 text-gray-500">
              There is no feedback matching the selected filters.
            </p>

          </div>

        ) : (

          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">

            <div className="overflow-x-auto">

              <table className="min-w-full divide-y divide-gray-200">

                <thead className="bg-gray-50">

                  <tr>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Rating
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Feedback
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Context
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Status
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Date
                    </th>

                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Action
                    </th>

                  </tr>

                </thead>

                <tbody className="divide-y divide-gray-200">

                  {visibleFeedback.map(
                    (item) => (

                      <tr
                        key={item.id}
                        className="hover:bg-gray-50"
                      >

                        {/* RATING */}

                        <td className="px-5 py-4 align-top">

                          <div className="text-sm font-medium text-yellow-600">
                            {renderStars(
                              item.rating
                            )}
                          </div>

                          {item.rating && (
                            <div className="mt-1 text-xs text-gray-500">
                              {item.rating}/5
                            </div>
                          )}

                        </td>

                        {/* MESSAGE */}

                        <td className="max-w-md px-5 py-4 align-top">

                          <p className="whitespace-pre-wrap text-sm text-gray-800">
                            {item.message ||
                              'No written message.'}
                          </p>

                        </td>

                        {/* CONTEXT */}

                        <td className="px-5 py-4 align-top text-sm text-gray-600">

                          {item.floor_id && (
                            <div>
                              Floor ID:{' '}
                              {item.floor_id}
                            </div>
                          )}

                          {item.office_id && (
                            <div className="mt-1">
                              Office ID:{' '}
                              {item.office_id}
                            </div>
                          )}

                          {item.service_id && (
                            <div className="mt-1">
                              Service ID:{' '}
                              {item.service_id}
                            </div>
                          )}

                          {!item.floor_id &&
                            !item.office_id &&
                            !item.service_id && (
                              <span>
                                Building-wide
                              </span>
                            )}

                        </td>

                        {/* STATUS */}

                        <td className="px-5 py-4 align-top">

                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(
                              item.status
                            )}`}
                          >
                            {getStatusLabel(
                              item.status
                            )}
                          </span>

                        </td>

                        {/* DATE */}

                        <td className="px-5 py-4 align-top text-sm text-gray-600 whitespace-nowrap">
                          {formatDate(
                            item.created_at
                          )}
                        </td>

                        {/* ACTION */}

                        <td className="px-5 py-4 align-top text-right">

                          <button
                            type="button"
                            onClick={() =>
                              setSelectedFeedback(
                                item
                              )
                            }
                            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
                          >
                            View
                          </button>

                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

          </div>

        )}

        {/* DETAIL MODAL */}

        {selectedFeedback && (

          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

              <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">

                <h2 className="text-xl font-bold text-gray-900">
                  Feedback Details
                </h2>

                <button
                  type="button"
                  onClick={() =>
                    setSelectedFeedback(
                      null
                    )
                  }
                  className="rounded-lg px-3 py-2 text-gray-500 hover:bg-gray-100"
                >
                  ✕
                </button>

              </div>

              <div className="space-y-6 p-6">

                {/* RATING */}

                <div>

                  <p className="text-sm font-medium text-gray-500">
                    Rating
                  </p>

                  <p className="mt-1 text-lg text-yellow-600">
                    {renderStars(
                      selectedFeedback.rating
                    )}
                  </p>

                </div>

                {/* MESSAGE */}

                <div>

                  <p className="text-sm font-medium text-gray-500">
                    Message
                  </p>

                  <p className="mt-1 whitespace-pre-wrap text-gray-900">
                    {selectedFeedback.message ||
                      'No written message.'}
                  </p>

                </div>

                {/* STATUS */}

                <div>

                  <p className="text-sm font-medium text-gray-500">
                    Current status
                  </p>

                  <span
                    className={`mt-1 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(
                      selectedFeedback.status
                    )}`}
                  >
                    {getStatusLabel(
                      selectedFeedback.status
                    )}
                  </span>

                </div>

                {/* CONTEXT */}

                <div>

                  <p className="mb-2 text-sm font-medium text-gray-500">
                    Context
                  </p>

                  <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-700">

                    {selectedFeedback.floor_id && (
                      <p>
                        Floor ID:{' '}
                        {
                          selectedFeedback.floor_id
                        }
                      </p>
                    )}

                    {selectedFeedback.office_id && (
                      <p>
                        Office ID:{' '}
                        {
                          selectedFeedback.office_id
                        }
                      </p>
                    )}

                    {selectedFeedback.service_id && (
                      <p>
                        Service ID:{' '}
                        {
                          selectedFeedback.service_id
                        }
                      </p>
                    )}

                    {selectedFeedback.qr_code_id && (
                      <p>
                        QR Code ID:{' '}
                        {
                          selectedFeedback.qr_code_id
                        }
                      </p>
                    )}

                    {!selectedFeedback.floor_id &&
                      !selectedFeedback.office_id &&
                      !selectedFeedback.service_id &&
                      !selectedFeedback.qr_code_id && (
                        <p>
                          Building-wide
                        </p>
                      )}

                  </div>

                </div>

                {/* DATE */}

                <div>

                  <p className="text-sm font-medium text-gray-500">
                    Submitted
                  </p>

                  <p className="mt-1 text-gray-900">
                    {formatDate(
                      selectedFeedback.created_at
                    )}
                  </p>

                </div>

                {/* STATUS ACTIONS */}

                {canManage && (

                  <div className="border-t border-gray-200 pt-5">

                    <p className="mb-3 text-sm font-medium text-gray-700">
                      Change status
                    </p>

                    <div className="flex flex-wrap gap-2">

                      {FEEDBACK_STATUSES.map(
                        (status) => (

                          <button
                            key={status}
                            type="button"
                            disabled={
                              updatingId ===
                              selectedFeedback.id ||
                              status ===
                                selectedFeedback.status
                            }
                            onClick={() =>
                              handleStatusChange(
                                selectedFeedback,
                                status
                              )
                            }
                            className={`rounded-lg border px-3 py-2 text-sm font-medium ${
                              status ===
                              selectedFeedback.status
                                ? 'cursor-default border-gray-200 bg-gray-100 text-gray-400'
                                : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                            } disabled:opacity-50`}
                          >
                            {updatingId ===
                            selectedFeedback.id
                              ? 'Saving...'
                              : getStatusLabel(
                                  status
                                )}
                          </button>

                        )
                      )}

                    </div>

                  </div>

                )}

              </div>

            </div>

          </div>

        )}

      </div>

    </div>
  );
}