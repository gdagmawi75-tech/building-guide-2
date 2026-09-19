import React, {
  useEffect,
  useMemo,
  useState
} from 'react';

import { useNavigate } from 'react-router-dom';

import {
  getAdminAnnouncements,
  createAdminAnnouncement,
  updateAdminAnnouncement,
  updateAdminAnnouncementStatus,
  deleteAdminAnnouncement,
  getAdminMe
} from '../../api/adminApi';

const PRIORITIES = [
  'low',
  'normal',
  'high',
  'urgent'
];

const STATUSES = [
  'active',
  'inactive',
  'scheduled',
  'expired'
];

const EMPTY_FORM = {
  title_en: '',
  title_am: '',
  title_om: '',
  description_en: '',
  description_am: '',
  description_om: '',
  priority: 'normal',
  starts_at: '',
  expires_at: '',
  is_active: true
};

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

function toDateTimeLocal(value) {
  if (!value) {
    return '';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const local = new Date(
    date.getTime() -
      date.getTimezoneOffset() * 60000
  );

  return local.toISOString().slice(0, 16);
}

function getScheduleStatus(announcement) {
  const now = new Date();

  const startsAt = announcement.starts_at
    ? new Date(announcement.starts_at)
    : null;

  const expiresAt = announcement.expires_at
    ? new Date(announcement.expires_at)
    : null;

  if (
    expiresAt &&
    !Number.isNaN(expiresAt.getTime()) &&
    now >= expiresAt
  ) {
    return 'expired';
  }

  if (
    startsAt &&
    !Number.isNaN(startsAt.getTime()) &&
    now < startsAt
  ) {
    return 'scheduled';
  }

  if (announcement.is_active === false) {
    return 'inactive';
  }

  return 'active';
}

function getPriorityClasses(priority) {
  if (priority === 'urgent') {
    return 'bg-red-100 text-red-700';
  }

  if (priority === 'high') {
    return 'bg-orange-100 text-orange-700';
  }

  if (priority === 'low') {
    return 'bg-gray-100 text-gray-700';
  }

  return 'bg-blue-100 text-blue-700';
}

function getStatusClasses(status) {
  if (status === 'active') {
    return 'bg-green-100 text-green-700';
  }

  if (status === 'scheduled') {
    return 'bg-yellow-100 text-yellow-700';
  }

  if (status === 'expired') {
    return 'bg-red-100 text-red-700';
  }

  return 'bg-gray-100 text-gray-700';
}

function getStatusLabel(status) {
  if (status === 'active') {
    return 'Active';
  }

  if (status === 'inactive') {
    return 'Inactive';
  }

  if (status === 'scheduled') {
    return 'Scheduled';
  }

  if (status === 'expired') {
    return 'Expired';
  }

  return 'Unknown';
}

export default function AnnouncementsPage() {
  const navigate = useNavigate();

  const [admin, setAdmin] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [deletingId, setDeletingId] = useState(null);
  const [statusChangingId, setStatusChangingId] = useState(null);

  const [priorityFilter, setPriorityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [form, setForm] = useState({
    ...EMPTY_FORM
  });

  const isEditing = Boolean(editingId);

  async function loadData() {
    try {
      setLoading(true);
      setError('');

      const [
        adminResponse,
        announcementResponse
      ] = await Promise.all([
        getAdminMe(),
        getAdminAnnouncements()
      ]);

      setAdmin(
        adminResponse?.data ||
        adminResponse?.admin ||
        adminResponse?.user ||
        adminResponse ||
        null
      );

      setAnnouncements(
        getResponseArray(
          announcementResponse
        )
      );
    } catch (err) {
      console.error(
        'Failed to load announcements:',
        err
      );

      setError(
        err.message ||
        'Failed to load announcements.'
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const processedAnnouncements = useMemo(() => {
    return announcements.map((announcement) => ({
      ...announcement,
      schedule_status:
        announcement.schedule_status ||
        getScheduleStatus(announcement)
    }));
  }, [announcements]);

  const visibleAnnouncements = useMemo(() => {
    let result = processedAnnouncements;

    if (priorityFilter) {
      result = result.filter(
        (announcement) =>
          announcement.priority ===
          priorityFilter
      );
    }

    if (statusFilter) {
      result = result.filter(
        (announcement) =>
          announcement.schedule_status ===
          statusFilter
      );
    }

    return result;
  }, [
    processedAnnouncements,
    priorityFilter,
    statusFilter
  ]);

  function clearMessages() {
    setError('');
    setSuccess('');
  }

  function openCreateModal() {
    clearMessages();

    setEditingId(null);
    setForm({
      ...EMPTY_FORM
    });

    setShowModal(true);
  }

  function openEditModal(announcement) {
    clearMessages();

    setEditingId(announcement.id);

    setForm({
      title_en:
        announcement.title_en || '',

      title_am:
        announcement.title_am || '',

      title_om:
        announcement.title_om || '',

      description_en:
        announcement.description_en || '',

      description_am:
        announcement.description_am || '',

      description_om:
        announcement.description_om || '',

      priority:
        announcement.priority || 'normal',

      starts_at:
        toDateTimeLocal(
          announcement.starts_at
        ),

      expires_at:
        toDateTimeLocal(
          announcement.expires_at
        ),

      is_active:
        announcement.is_active !== false
    });

    setShowModal(true);
  }

  function closeModal() {
    if (saving) {
      return;
    }

    setShowModal(false);
    setEditingId(null);

    setForm({
      ...EMPTY_FORM
    });
  }

  function handleChange(event) {
    const {
      name,
      value,
      type,
      checked
    } = event.target;

    setForm((current) => ({
      ...current,
      [name]:
        type === 'checkbox'
          ? checked
          : value
    }));
  }

  function localDateToIso(value) {
    if (!value) {
      return null;
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return null;
    }

    return date.toISOString();
  }

  async function handleSubmit(event) {
    event.preventDefault();

    clearMessages();

    if (!form.title_en.trim()) {
      setError(
        'English title is required.'
      );

      return;
    }

    const startsAt =
      localDateToIso(
        form.starts_at
      );

    const expiresAt =
      localDateToIso(
        form.expires_at
      );

    if (
      form.starts_at &&
      !startsAt
    ) {
      setError(
        'Start date/time is invalid.'
      );

      return;
    }

    if (
      form.expires_at &&
      !expiresAt
    ) {
      setError(
        'End date/time is invalid.'
      );

      return;
    }

    if (
      startsAt &&
      expiresAt &&
      new Date(expiresAt) <=
        new Date(startsAt)
    ) {
      setError(
        'End date/time must be later than start date/time.'
      );

      return;
    }

    if (!admin?.building_id) {
      setError(
        'No building is assigned to this admin account.'
      );

      return;
    }

    const payload = {
      building_id:
        admin.building_id,

      title_en:
        form.title_en.trim(),

      title_am:
        form.title_am.trim() ||
        null,

      title_om:
        form.title_om.trim() ||
        null,

      description_en:
        form.description_en.trim() ||
        null,

      description_am:
        form.description_am.trim() ||
        null,

      description_om:
        form.description_om.trim() ||
        null,

      priority:
        form.priority,

      starts_at:
        startsAt,

      expires_at:
        expiresAt,

      is_active:
        form.is_active
    };

    try {
      setSaving(true);

      let response;

      if (isEditing) {
        response =
          await updateAdminAnnouncement(
            editingId,
            payload
          );
      } else {
        response =
          await createAdminAnnouncement(
            payload
          );
      }

      if (!response?.success) {
        throw new Error(
          response?.error ||
          'Failed to save announcement.'
        );
      }

      setSuccess(
        isEditing
          ? 'Announcement updated successfully.'
          : 'Announcement created successfully.'
      );

      setShowModal(false);
      setEditingId(null);

      setForm({
        ...EMPTY_FORM
      });

      await loadData();
    } catch (err) {
      console.error(
        'Failed to save announcement:',
        err
      );

      setError(
        err.message ||
        'Failed to save announcement.'
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleStatus(
    announcement
  ) {
    clearMessages();

    try {
      setStatusChangingId(
        announcement.id
      );

      const response =
        await updateAdminAnnouncementStatus(
          announcement.id,
          !announcement.is_active
        );

      if (!response?.success) {
        throw new Error(
          response?.error ||
          'Failed to update announcement status.'
        );
      }

      setSuccess(
        announcement.is_active
          ? 'Announcement deactivated.'
          : 'Announcement activated.'
      );

      await loadData();
    } catch (err) {
      console.error(
        'Failed to change announcement status:',
        err
      );

      setError(
        err.message ||
        'Failed to update announcement status.'
      );
    } finally {
      setStatusChangingId(null);
    }
  }

  async function handleDelete(
    announcement
  ) {
    clearMessages();

    const confirmed =
      window.confirm(
        'Delete "' +
          announcement.title_en +
          '"? This cannot be undone.'
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(
        announcement.id
      );

      const response =
        await deleteAdminAnnouncement(
          announcement.id
        );

      if (!response?.success) {
        throw new Error(
          response?.error ||
          'Failed to delete announcement.'
        );
      }

      setSuccess(
        'Announcement deleted successfully.'
      );

      await loadData();
    } catch (err) {
      console.error(
        'Failed to delete announcement:',
        err
      );

      setError(
        err.message ||
        'Failed to delete announcement.'
      );
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="rounded-xl bg-white border border-gray-200 px-8 py-6 shadow-sm">
          <p className="text-gray-600">
            Loading announcements...
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
              Announcements
            </h1>

            <p className="mt-1 text-gray-600">
              Create and manage building announcements.
            </p>

          </div>

          <button
            type="button"
            onClick={
              openCreateModal
            }
            className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
          >
            + Add Announcement
          </button>

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

        {/* FILTERS */}

        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">

          <div className="grid gap-4 md:grid-cols-2">

            <div>

              <label
                htmlFor="priority-filter"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Filter by priority
              </label>

              <select
                id="priority-filter"
                value={
                  priorityFilter
                }
                onChange={(event) =>
                  setPriorityFilter(
                    event.target.value
                  )
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm"
              >

                <option value="">
                  All priorities
                </option>

                {PRIORITIES.map(
                  (priority) => (
                    <option
                      key={priority}
                      value={priority}
                    >
                      {priority
                        .charAt(0)
                        .toUpperCase() +
                        priority.slice(1)}
                    </option>
                  )
                )}

              </select>

            </div>

            <div>

              <label
                htmlFor="status-filter"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Filter by status
              </label>

              <select
                id="status-filter"
                value={
                  statusFilter
                }
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

                {STATUSES.map(
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

          </div>

        </div>

        {/* COUNT */}

        <div className="mb-5 text-sm text-gray-600">
          <strong>
            {visibleAnnouncements.length}
          </strong>{' '}
          announcement
          {visibleAnnouncements.length === 1
            ? ''
            : 's'}
        </div>

        {/* LIST */}

        {visibleAnnouncements.length === 0 ? (

          <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">

            <h2 className="text-xl font-semibold text-gray-900">
              No announcements found
            </h2>

            <p className="mt-2 text-gray-500">
              Create an announcement to display it here.
            </p>

            <button
              type="button"
              onClick={
                openCreateModal
              }
              className="mt-5 rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-700"
            >
              Create Announcement
            </button>

          </div>

        ) : (

          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">

            <div className="overflow-x-auto">

              <table className="min-w-full divide-y divide-gray-200">

                <thead className="bg-gray-50">

                  <tr>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Title
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Priority
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Schedule
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Status
                    </th>

                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Actions
                    </th>

                  </tr>

                </thead>

                <tbody className="divide-y divide-gray-200 bg-white">

                  {visibleAnnouncements.map(
                    (announcement) => {

                      const status =
                        announcement.schedule_status;

                      return (
                        <tr
                          key={
                            announcement.id
                          }
                          className="hover:bg-gray-50"
                        >

                          <td className="px-5 py-4 align-top">

                            <div className="font-semibold text-gray-900">
                              {
                                announcement.title_en
                              }
                            </div>

                            {announcement.title_am && (
                              <div className="mt-1 text-sm text-gray-600">
                                {
                                  announcement.title_am
                                }
                              </div>
                            )}

                            {announcement.title_om && (
                              <div className="mt-1 text-sm text-gray-600">
                                {
                                  announcement.title_om
                                }
                              </div>
                            )}

                            {announcement.description_en && (
                              <p className="mt-2 max-w-xl text-sm text-gray-500">
                                {
                                  announcement.description_en
                                }
                              </p>
                            )}

                          </td>

                          <td className="px-5 py-4 align-top">

                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${getPriorityClasses(
                                announcement.priority
                              )}`}
                            >
                              {
                                announcement.priority ||
                                'normal'
                              }
                            </span>

                          </td>

                          <td className="px-5 py-4 align-top text-sm text-gray-600">

                            <div>
                              Start:{' '}
                              {formatDate(
                                announcement.starts_at
                              )}
                            </div>

                            <div className="mt-1">
                              End:{' '}
                              {formatDate(
                                announcement.expires_at
                              )}
                            </div>

                          </td>

                          <td className="px-5 py-4 align-top">

                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(
                                status
                              )}`}
                            >
                              {getStatusLabel(
                                status
                              )}
                            </span>

                          </td>

                          <td className="px-5 py-4 align-top">

                            <div className="flex flex-wrap justify-end gap-2">

                              <button
                                type="button"
                                onClick={() =>
                                  openEditModal(
                                    announcement
                                  )
                                }
                                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
                              >
                                Edit
                              </button>

                              <button
                                type="button"
                                disabled={
                                  statusChangingId ===
                                  announcement.id
                                }
                                onClick={() =>
                                  handleToggleStatus(
                                    announcement
                                  )
                                }
                                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                              >
                                {statusChangingId ===
                                announcement.id
                                  ? 'Saving...'
                                  : announcement.is_active
                                    ? 'Deactivate'
                                    : 'Activate'}
                              </button>

                              <button
                                type="button"
                                disabled={
                                  deletingId ===
                                  announcement.id
                                }
                                onClick={() =>
                                  handleDelete(
                                    announcement
                                  )
                                }
                                className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                              >
                                {deletingId ===
                                announcement.id
                                  ? 'Deleting...'
                                  : 'Delete'}
                              </button>

                            </div>

                          </td>

                        </tr>
                      );
                    }
                  )}

                </tbody>

              </table>

            </div>

          </div>

        )}

        {/* MODAL */}

        {showModal && (

          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

            <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

              <div className="sticky top-0 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">

                <div>

                  <h2 className="text-xl font-bold text-gray-900">
                    {isEditing
                      ? 'Edit Announcement'
                      : 'Add Announcement'}
                  </h2>

                </div>

                <button
                  type="button"
                  onClick={
                    closeModal
                  }
                  className="rounded-lg px-3 py-2 text-gray-500 hover:bg-gray-100"
                >
                  ✕
                </button>

              </div>

              <form
                onSubmit={
                  handleSubmit
                }
                className="space-y-6 p-6"
              >

                {/* ENGLISH */}

                <section>

                  <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-700">
                    English
                  </h3>

                  <div className="space-y-4">

                    <input
                      type="text"
                      name="title_en"
                      value={
                        form.title_en
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="Announcement title"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5"
                      required
                    />

                    <textarea
                      name="description_en"
                      value={
                        form.description_en
                      }
                      onChange={
                        handleChange
                      }
                      rows="4"
                      placeholder="Announcement details"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5"
                    />

                  </div>

                </section>

                {/* AMHARIC */}

                <section>

                  <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-700">
                    Amharic
                  </h3>

                  <div className="space-y-4">

                    <input
                      type="text"
                      name="title_am"
                      value={
                        form.title_am
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="የማስታወቂያ ርዕስ"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5"
                    />

                    <textarea
                      name="description_am"
                      value={
                        form.description_am
                      }
                      onChange={
                        handleChange
                      }
                      rows="4"
                      placeholder="የማስታወቂያ ዝርዝሮች"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5"
                    />

                  </div>

                </section>

                {/* AFAAN OROMOO */}

                <section>

                  <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-700">
                    Afaan Oromoo
                  </h3>

                  <div className="space-y-4">

                    <input
                      type="text"
                      name="title_om"
                      value={
                        form.title_om
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="Mata-duree beeksisaa"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5"
                    />

                    <textarea
                      name="description_om"
                      value={
                        form.description_om
                      }
                      onChange={
                        handleChange
                      }
                      rows="4"
                      placeholder="Ibsa beeksisaa"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5"
                    />

                  </div>

                </section>

                {/* SETTINGS */}

                <section>

                  <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-700">
                    Settings
                  </h3>

                  <div className="grid gap-4 md:grid-cols-3">

                    <div>

                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Priority
                      </label>

                      <select
                        name="priority"
                        value={
                          form.priority
                        }
                        onChange={
                          handleChange
                        }
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5"
                      >

                        {PRIORITIES.map(
                          (priority) => (
                            <option
                              key={
                                priority
                              }
                              value={
                                priority
                              }
                            >
                              {priority
                                .charAt(0)
                                .toUpperCase() +
                                priority.slice(1)}
                            </option>
                          )
                        )}

                      </select>

                    </div>

                    <div>

                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Starts at
                      </label>

                      <input
                        type="datetime-local"
                        name="starts_at"
                        value={
                          form.starts_at
                        }
                        onChange={
                          handleChange
                        }
                        className="w-full rounded-lg border border-gray-300 px-3 py-2.5"
                      />

                    </div>

                    <div>

                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Expires at
                      </label>

                      <input
                        type="datetime-local"
                        name="expires_at"
                        value={
                          form.expires_at
                        }
                        onChange={
                          handleChange
                        }
                        className="w-full rounded-lg border border-gray-300 px-3 py-2.5"
                      />

                    </div>

                  </div>

                  <label className="mt-5 flex items-center gap-3">

                    <input
                      type="checkbox"
                      name="is_active"
                      checked={
                        form.is_active
                      }
                      onChange={
                        handleChange
                      }
                      className="h-4 w-4 rounded"
                    />

                    <span className="text-sm font-medium text-gray-700">
                      Active announcement
                    </span>

                  </label>

                </section>

                {/* ACTIONS */}

                <div className="flex justify-end gap-3 border-t border-gray-200 pt-5">

                  <button
                    type="button"
                    onClick={
                      closeModal
                    }
                    disabled={saving}
                    className="rounded-lg border border-gray-300 px-5 py-2.5 font-medium text-gray-700 hover:bg-gray-100"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-lg bg-blue-600 px-5 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saving
                      ? 'Saving...'
                      : isEditing
                        ? 'Update Announcement'
                        : 'Create Announcement'}
                  </button>

                </div>

              </form>

            </div>

          </div>

        )}

      </div>

    </div>
  );
}
