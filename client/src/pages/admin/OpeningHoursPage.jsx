import React, {
  useEffect,
  useMemo,
  useState
} from 'react';

import {
  useNavigate
} from 'react-router-dom';

import {
  adminApiRequest,
  getAdminMe
} from '../../api/adminApi';

const DAYS = [
  {
    value: 0,
    label: 'Sunday'
  },
  {
    value: 1,
    label: 'Monday'
  },
  {
    value: 2,
    label: 'Tuesday'
  },
  {
    value: 3,
    label: 'Wednesday'
  },
  {
    value: 4,
    label: 'Thursday'
  },
  {
    value: 5,
    label: 'Friday'
  },
  {
    value: 6,
    label: 'Saturday'
  }
];

function OpeningHoursPage() {
  const navigate = useNavigate();

  const [admin, setAdmin] = useState(null);

  const [openingHours, setOpeningHours] =
    useState([]);

  const [buildings, setBuildings] =
    useState([]);

  const [offices, setOffices] =
    useState([]);

  const [services, setServices] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState('');

  const [success, setSuccess] =
    useState('');

  // --------------------------------------------------
  // FILTERS
  // --------------------------------------------------

  const [buildingFilter, setBuildingFilter] =
    useState('');

  const [officeFilter, setOfficeFilter] =
    useState('');

  const [serviceFilter, setServiceFilter] =
    useState('');

  // --------------------------------------------------
  // MODAL
  // --------------------------------------------------

  const [showModal, setShowModal] =
    useState(false);

  const [editingOpeningHours, setEditingOpeningHours] =
    useState(null);

  // --------------------------------------------------
  // FORM
  // --------------------------------------------------

  const [form, setForm] = useState({
    building_id: '',
    target_type: 'building',
    office_id: '',
    service_id: '',
    day_of_week: '1',
    opening_time: '08:30',
    closing_time: '17:30',
    break_start: '',
    break_end: '',
    is_closed: false
  });

  // --------------------------------------------------
  // HELPERS
  // --------------------------------------------------

  function clearMessages() {
    setError('');
    setSuccess('');
  }

  function getArrayFromResponse(
    response,
    key
  ) {
    const possibleValues = [
      response?.[key],
      response?.data,
      response
    ];

    for (const value of possibleValues) {
      if (Array.isArray(value)) {
        return value;
      }
    }

    return [];
  }

  function getBuildingName(building) {
    return (
      building?.name_en ||
      building?.name ||
      building?.name_am ||
      building?.name_om ||
      'Unnamed building'
    );
  }

  function getOfficeName(office) {
    if (!office) {
      return 'No office';
    }

    return (
      office.office_number ||
      office.name_en ||
      office.name_am ||
      office.name_om ||
      'Unnamed office'
    );
  }

  function getServiceName(service) {
    if (!service) {
      return 'No service';
    }

    return (
      service.name_en ||
      service.name_am ||
      service.name_om ||
      'Unnamed service'
    );
  }

  function getDayName(day) {
    const found = DAYS.find(
      (item) =>
        item.value === Number(day)
    );

    return found?.label || 'Unknown day';
  }

  function formatTime(time) {
    if (!time) {
      return '—';
    }

    return time.substring(0, 5);
  }

  function getTargetLabel(record) {
    if (record.office_id) {
      const office = offices.find(
        (item) =>
          item.id === record.office_id
      );

      return getOfficeName(office);
    }

    if (record.service_id) {
      const service = services.find(
        (item) =>
          item.id === record.service_id
      );

      return getServiceName(service);
    }

    return 'Building-wide';
  }

  // --------------------------------------------------
  // LOAD ADMIN
  // --------------------------------------------------

  async function loadAdmin() {
    const response =
      await getAdminMe();

    const currentAdmin =
      response?.admin ||
      response?.user ||
      response?.data ||
      response;

    setAdmin(currentAdmin);

    return currentAdmin;
  }

  // --------------------------------------------------
  // LOAD BUILDINGS
  // --------------------------------------------------

  async function loadBuildings() {
    const response =
      await adminApiRequest(
        '/api/admin/buildings'
      );

    const list =
      getArrayFromResponse(
        response,
        'buildings'
      );

    setBuildings(list);

    return list;
  }

  // --------------------------------------------------
  // LOAD OFFICES
  // --------------------------------------------------

  async function loadOffices() {
    const response =
      await adminApiRequest(
        '/api/admin/offices'
      );

    const list =
      getArrayFromResponse(
        response,
        'offices'
      );

    setOffices(list);

    return list;
  }

  // --------------------------------------------------
  // LOAD SERVICES
  // --------------------------------------------------

  async function loadServices() {
    const response =
      await adminApiRequest(
        '/api/admin/services'
      );

    const list =
      getArrayFromResponse(
        response,
        'services'
      );

    setServices(list);

    return list;
  }

  // --------------------------------------------------
  // LOAD OPENING HOURS
  // --------------------------------------------------

  async function loadOpeningHours(
    customBuildingFilter = buildingFilter,
    customOfficeFilter = officeFilter,
    customServiceFilter = serviceFilter
  ) {
    const params =
      new URLSearchParams();

    if (customBuildingFilter) {
      params.set(
        'building_id',
        customBuildingFilter
      );
    }

    if (customOfficeFilter) {
      params.set(
        'office_id',
        customOfficeFilter
      );
    }

    if (customServiceFilter) {
      params.set(
        'service_id',
        customServiceFilter
      );
    }

    const queryString =
      params.toString();

    const endpoint =
      queryString
        ? `/api/admin/opening-hours?${queryString}`
        : '/api/admin/opening-hours';

    const response =
      await adminApiRequest(endpoint);

    const list =
      getArrayFromResponse(
        response,
        'openingHours'
      );

    setOpeningHours(list);

    return list;
  }

  // --------------------------------------------------
  // INITIAL LOAD
  // --------------------------------------------------

  useEffect(() => {
    async function initialize() {
      try {
        setLoading(true);
        clearMessages();

        await Promise.all([
          loadAdmin(),
          loadBuildings(),
          loadOffices(),
          loadServices()
        ]);

        await loadOpeningHours();
      } catch (err) {
        console.error(
          'Failed to initialize Opening Hours page:',
          err
        );

        setError(
          err.message ||
            'Failed to load opening hours.'
        );
      } finally {
        setLoading(false);
      }
    }

    initialize();
  }, []);

  // --------------------------------------------------
  // RELOAD WHEN FILTERS CHANGE
  // --------------------------------------------------

  useEffect(() => {
    if (loading) {
      return;
    }

    async function reload() {
      try {
        clearMessages();

        await loadOpeningHours(
          buildingFilter,
          officeFilter,
          serviceFilter
        );
      } catch (err) {
        console.error(
          'Failed to reload opening hours:',
          err
        );

        setError(
          err.message ||
            'Failed to load opening hours.'
        );
      }
    }

    reload();
  }, [
    buildingFilter,
    officeFilter,
    serviceFilter
  ]);

  // --------------------------------------------------
  // FILTERED OFFICES
  // --------------------------------------------------

  const filteredOffices =
    useMemo(() => {
      if (!buildingFilter) {
        return offices;
      }

      return offices.filter(
        (office) =>
          office.building_id ===
          buildingFilter
      );
    }, [
      offices,
      buildingFilter
    ]);

  // --------------------------------------------------
  // FILTERED SERVICES
  // --------------------------------------------------

  const filteredServices =
    useMemo(() => {
      if (!buildingFilter) {
        return services;
      }

      return services.filter(
        (service) =>
          service.building_id ===
          buildingFilter
      );
    }, [
      services,
      buildingFilter
    ]);

  // --------------------------------------------------
  // FORM OFFICES
  // --------------------------------------------------

  const formOffices =
    useMemo(() => {
      if (!form.building_id) {
        return offices;
      }

      return offices.filter(
        (office) =>
          office.building_id ===
          form.building_id
      );
    }, [
      offices,
      form.building_id
    ]);

  // --------------------------------------------------
  // FORM SERVICES
  // --------------------------------------------------

  const formServices =
    useMemo(() => {
      if (!form.building_id) {
        return services;
      }

      return services.filter(
        (service) =>
          service.building_id ===
          form.building_id
      );
    }, [
      services,
      form.building_id
    ]);

  // --------------------------------------------------
  // FILTER HANDLERS
  // --------------------------------------------------

  function handleBuildingFilterChange(
    value
  ) {
    setBuildingFilter(value);
    setOfficeFilter('');
    setServiceFilter('');
  }

  // --------------------------------------------------
  // FORM RESET
  // --------------------------------------------------

  function resetForm() {
    setForm({
      building_id:
        buildingFilter || '',
      target_type: 'building',
      office_id: '',
      service_id: '',
      day_of_week: '1',
      opening_time: '08:30',
      closing_time: '17:30',
      break_start: '',
      break_end: '',
      is_closed: false
    });
  }

  // --------------------------------------------------
  // OPEN ADD MODAL
  // --------------------------------------------------

  function openAddModal() {
    clearMessages();

    setEditingOpeningHours(null);

    resetForm();

    setShowModal(true);
  }

  // --------------------------------------------------
  // OPEN EDIT MODAL
  // --------------------------------------------------

  function openEditModal(record) {
    clearMessages();

    let targetType = 'building';

    if (record.office_id) {
      targetType = 'office';
    }

    if (record.service_id) {
      targetType = 'service';
    }

    setEditingOpeningHours(record);

    setForm({
      building_id:
        record.building_id || '',

      target_type:
        targetType,

      office_id:
        record.office_id || '',

      service_id:
        record.service_id || '',

      day_of_week:
        String(record.day_of_week ?? 1),

      opening_time:
        formatTime(
          record.opening_time
        ) === '—'
          ? ''
          : formatTime(
              record.opening_time
            ),

      closing_time:
        formatTime(
          record.closing_time
        ) === '—'
          ? ''
          : formatTime(
              record.closing_time
            ),

      break_start:
        formatTime(
          record.break_start
        ) === '—'
          ? ''
          : formatTime(
              record.break_start
            ),

      break_end:
        formatTime(
          record.break_end
        ) === '—'
          ? ''
          : formatTime(
              record.break_end
            ),

      is_closed:
        typeof record.is_closed ===
        'boolean'
          ? record.is_closed
          : false
    });

    setShowModal(true);
  }

  // --------------------------------------------------
  // CLOSE MODAL
  // --------------------------------------------------

  function closeModal() {
    if (saving) {
      return;
    }

    setShowModal(false);
    setEditingOpeningHours(null);
    resetForm();
  }

  // --------------------------------------------------
  // FORM CHANGE
  // --------------------------------------------------

  function handleFormChange(event) {
    const {
      name,
      value,
      type,
      checked
    } = event.target;

    if (name === 'building_id') {
      setForm((previous) => ({
        ...previous,
        building_id: value,
        office_id: '',
        service_id: ''
      }));

      return;
    }

    if (name === 'target_type') {
      setForm((previous) => ({
        ...previous,
        target_type: value,
        office_id: '',
        service_id: ''
      }));

      return;
    }

    setForm((previous) => ({
      ...previous,
      [name]:
        type === 'checkbox'
          ? checked
          : value
    }));
  }

  // --------------------------------------------------
  // SAVE
  // --------------------------------------------------

  async function handleSubmit(event) {
    event.preventDefault();

    clearMessages();

    if (!form.building_id) {
      setError(
        'Please select a building.'
      );

      return;
    }

    if (!form.is_closed) {
      if (!form.opening_time) {
        setError(
          'Opening time is required.'
        );

        return;
      }

      if (!form.closing_time) {
        setError(
          'Closing time is required.'
        );

        return;
      }
    }

    if (
      (form.break_start &&
        !form.break_end) ||
      (!form.break_start &&
        form.break_end)
    ) {
      setError(
        'Both break start and break end are required.'
      );

      return;
    }

    if (
      form.target_type === 'office' &&
      !form.office_id
    ) {
      setError(
        'Please select an office.'
      );

      return;
    }

    if (
      form.target_type === 'service' &&
      !form.service_id
    ) {
      setError(
        'Please select a service.'
      );

      return;
    }

    setSaving(true);

    try {
      const payload = {
        building_id:
          form.building_id,

        office_id:
          form.target_type === 'office'
            ? form.office_id
            : null,

        service_id:
          form.target_type === 'service'
            ? form.service_id
            : null,

        day_of_week:
          Number(form.day_of_week),

        opening_time:
          form.is_closed
            ? null
            : form.opening_time || null,

        closing_time:
          form.is_closed
            ? null
            : form.closing_time || null,

        break_start:
          form.is_closed
            ? null
            : form.break_start || null,

        break_end:
          form.is_closed
            ? null
            : form.break_end || null,

        is_closed:
          Boolean(form.is_closed)
      };

      if (editingOpeningHours) {
        await adminApiRequest(
          `/api/admin/opening-hours/${editingOpeningHours.id}`,
          {
            method: 'PUT',
            body: JSON.stringify(payload)
          }
        );

        setSuccess(
          'Opening hours updated successfully.'
        );
      } else {
        await adminApiRequest(
          '/api/admin/opening-hours',
          {
            method: 'POST',
            body: JSON.stringify(payload)
          }
        );

        setSuccess(
          'Opening hours created successfully.'
        );
      }

      setShowModal(false);
      setEditingOpeningHours(null);

      resetForm();

      await loadOpeningHours();
    } catch (err) {
      console.error(
        'Failed to save opening hours:',
        err
      );

      setError(
        err.message ||
          'Failed to save opening hours.'
      );
    } finally {
      setSaving(false);
    }
  }

  // --------------------------------------------------
  // DELETE
  // --------------------------------------------------

  async function deleteOpeningHours(record) {
    const confirmed =
      window.confirm(
        `Delete ${getDayName(
          record.day_of_week
        )} opening hours for ${getTargetLabel(
          record
        )}?`
      );

    if (!confirmed) {
      return;
    }

    clearMessages();

    try {
      await adminApiRequest(
        `/api/admin/opening-hours/${record.id}`,
        {
          method: 'DELETE'
        }
      );

      setSuccess(
        'Opening hours deleted successfully.'
      );

      await loadOpeningHours();
    } catch (err) {
      console.error(
        'Failed to delete opening hours:',
        err
      );

      setError(
        err.message ||
          'Failed to delete opening hours.'
      );
    }
  }

  // --------------------------------------------------
  // BUILDING LOOKUP
  // --------------------------------------------------

  function findBuilding(id) {
    return buildings.find(
      (building) =>
        building.id === id
    );
  }

  // --------------------------------------------------
  // LOADING
  // --------------------------------------------------

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">

        <div className="text-center">

          <div className="text-xl font-semibold text-gray-800">
            Loading opening hours...
          </div>

          <div className="mt-2 text-sm text-gray-500">
            Please wait.
          </div>

        </div>

      </div>
    );
  }

  // --------------------------------------------------
  // PAGE
  // --------------------------------------------------

  return (
    <div className="min-h-screen bg-gray-50 p-6">

      <div className="mx-auto max-w-7xl">

        {/* Header */}

        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

          <div>

            <button
              type="button"
              onClick={() =>
                navigate('/admin')
              }
              className="mb-3 text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              ← Back to Dashboard
            </button>

            <h1 className="text-3xl font-bold text-gray-900">
              Opening Hours
            </h1>

            <p className="mt-1 text-gray-600">
              Manage building, office and service working hours.
            </p>

            {admin?.full_name && (
              <p className="mt-1 text-xs text-gray-500">
                Logged in as{' '}
                {admin.full_name}
              </p>
            )}

          </div>

          <button
            type="button"
            onClick={openAddModal}
            className="rounded-lg bg-black px-5 py-3 font-semibold text-white hover:bg-gray-800"
          >
            + Add Opening Hours
          </button>

        </div>

        {/* Messages */}

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {success}
          </div>
        )}

        {/* Filters */}

        <div className="mb-6 rounded-xl bg-white p-5 shadow-sm">

          <div className="grid gap-4 md:grid-cols-3">

            {/* Building */}

            <div>

              <label className="mb-2 block text-sm font-medium text-gray-700">
                Filter by building
              </label>

              <select
                value={buildingFilter}
                onChange={(event) =>
                  handleBuildingFilterChange(
                    event.target.value
                  )
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5"
              >

                <option value="">
                  All buildings
                </option>

                {buildings.map(
                  (building) => (
                    <option
                      key={building.id}
                      value={building.id}
                    >
                      {getBuildingName(
                        building
                      )}
                    </option>
                  )
                )}

              </select>

            </div>

            {/* Office */}

            <div>

              <label className="mb-2 block text-sm font-medium text-gray-700">
                Filter by office
              </label>

              <select
                value={officeFilter}
                onChange={(event) =>
                  setOfficeFilter(
                    event.target.value
                  )
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5"
              >

                <option value="">
                  All offices
                </option>

                {filteredOffices.map(
                  (office) => (
                    <option
                      key={office.id}
                      value={office.id}
                    >
                      {getOfficeName(
                        office
                      )}
                    </option>
                  )
                )}

              </select>

            </div>

            {/* Service */}

            <div>

              <label className="mb-2 block text-sm font-medium text-gray-700">
                Filter by service
              </label>

              <select
                value={serviceFilter}
                onChange={(event) =>
                  setServiceFilter(
                    event.target.value
                  )
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5"
              >

                <option value="">
                  All services
                </option>

                {filteredServices.map(
                  (service) => (
                    <option
                      key={service.id}
                      value={service.id}
                    >
                      {getServiceName(
                        service
                      )}
                    </option>
                  )
                )}

              </select>

            </div>

          </div>

        </div>

        {/* Count */}

        <div className="mb-4">

          <p className="text-sm text-gray-600">
            {openingHours.length}{' '}
            {openingHours.length === 1
              ? 'opening-hours record'
              : 'opening-hours records'}
          </p>

        </div>

        {/* Table */}

        <div className="overflow-hidden rounded-xl bg-white shadow-sm">

          <div className="overflow-x-auto">

            <table className="min-w-full">

              <thead className="border-b border-gray-200 bg-gray-50">

                <tr>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Target
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Building
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Day
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Opening
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Closing
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Break
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Status
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Actions
                  </th>

                </tr>

              </thead>

              <tbody className="divide-y divide-gray-100">

                {openingHours.map(
                  (record) => {

                    const building =
                      findBuilding(
                        record.building_id
                      );

                    return (
                      <tr
                        key={record.id}
                        className="hover:bg-gray-50"
                      >

                        {/* Target */}

                        <td className="px-4 py-4">

                          <div className="font-semibold text-gray-900">
                            {getTargetLabel(
                              record
                            )}
                          </div>

                          <div className="mt-1 text-xs text-gray-500">
                            {record.office_id
                              ? 'Office'
                              : record.service_id
                              ? 'Service'
                              : 'Building'}
                          </div>

                        </td>

                        {/* Building */}

                        <td className="px-4 py-4">

                          <span className="text-sm text-gray-700">
                            {getBuildingName(
                              building
                            )}
                          </span>

                        </td>

                        {/* Day */}

                        <td className="px-4 py-4">

                          <span className="text-sm font-medium text-gray-800">
                            {getDayName(
                              record.day_of_week
                            )}
                          </span>

                        </td>

                        {/* Opening */}

                        <td className="px-4 py-4">

                          <span className="text-sm text-gray-700">
                            {record.is_closed
                              ? '—'
                              : formatTime(
                                  record.opening_time
                                )}
                          </span>

                        </td>

                        {/* Closing */}

                        <td className="px-4 py-4">

                          <span className="text-sm text-gray-700">
                            {record.is_closed
                              ? '—'
                              : formatTime(
                                  record.closing_time
                                )}
                          </span>

                        </td>

                        {/* Break */}

                        <td className="px-4 py-4">

                          <span className="text-sm text-gray-700">
                            {record.is_closed
                              ? '—'
                              : record.break_start &&
                                record.break_end
                              ? `${formatTime(
                                  record.break_start
                                )} – ${formatTime(
                                  record.break_end
                                )}`
                              : 'None'}
                          </span>

                        </td>

                        {/* Status */}

                        <td className="px-4 py-4">

                          {record.is_closed ? (
                            <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">
                              Closed
                            </span>
                          ) : (
                            <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
                              Open
                            </span>
                          )}

                        </td>

                        {/* Actions */}

                        <td className="px-4 py-4">

                          <div className="flex flex-wrap gap-2">

                            <button
                              type="button"
                              onClick={() =>
                                openEditModal(
                                  record
                                )
                              }
                              className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                deleteOpeningHours(
                                  record
                                )
                              }
                              className="rounded-md bg-red-100 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-200"
                            >
                              Delete
                            </button>

                          </div>

                        </td>

                      </tr>
                    );
                  }
                )}

                {openingHours.length === 0 && (
                  <tr>

                    <td
                      colSpan="8"
                      className="px-4 py-12 text-center text-gray-500"
                    >
                      No opening-hours records found.
                    </td>

                  </tr>
                )}

              </tbody>

            </table>

          </div>

        </div>

      </div>

      {/* ==================================================
          MODAL
      ================================================== */}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

            {/* Modal Header */}

            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">

              <div>

                <h2 className="text-2xl font-bold text-gray-900">
                  {editingOpeningHours
                    ? 'Edit Opening Hours'
                    : 'Add Opening Hours'}
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Set working hours for a building, office or service.
                </p>

              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="text-2xl text-gray-400 hover:text-gray-700 disabled:opacity-50"
              >
                ×
              </button>

            </div>

            {/* Form */}

            <form
              onSubmit={handleSubmit}
              className="space-y-6 p-6"
            >

              {/* Target */}

              <section>

                <h3 className="mb-4 text-lg font-semibold text-gray-900">
                  Target
                </h3>

                <div className="grid gap-4 md:grid-cols-2">

                  {/* Building */}

                  <div>

                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Building *
                    </label>

                    <select
                      name="building_id"
                      value={
                        form.building_id
                      }
                      onChange={
                        handleFormChange
                      }
                      required
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5"
                    >

                      <option value="">
                        Select building
                      </option>

                      {buildings.map(
                        (building) => (
                          <option
                            key={building.id}
                            value={building.id}
                          >
                            {getBuildingName(
                              building
                            )}
                          </option>
                        )
                      )}

                    </select>

                  </div>

                  {/* Target Type */}

                  <div>

                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Applies to *
                    </label>

                    <select
                      name="target_type"
                      value={
                        form.target_type
                      }
                      onChange={
                        handleFormChange
                      }
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5"
                    >

                      <option value="building">
                        Building-wide
                      </option>

                      <option value="office">
                        Office
                      </option>

                      <option value="service">
                        Service
                      </option>

                    </select>

                  </div>

                </div>

                {/* Office */}

                {form.target_type ===
                  'office' && (
                  <div className="mt-4">

                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Office *
                    </label>

                    <select
                      name="office_id"
                      value={
                        form.office_id
                      }
                      onChange={
                        handleFormChange
                      }
                      required
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5"
                    >

                      <option value="">
                        Select office
                      </option>

                      {formOffices.map(
                        (office) => (
                          <option
                            key={office.id}
                            value={office.id}
                          >
                            {getOfficeName(
                              office
                            )}
                          </option>
                        )
                      )}

                    </select>

                  </div>
                )}

                {/* Service */}

                {form.target_type ===
                  'service' && (
                  <div className="mt-4">

                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Service *
                    </label>

                    <select
                      name="service_id"
                      value={
                        form.service_id
                      }
                      onChange={
                        handleFormChange
                      }
                      required
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5"
                    >

                      <option value="">
                        Select service
                      </option>

                      {formServices.map(
                        (service) => (
                          <option
                            key={service.id}
                            value={service.id}
                          >
                            {getServiceName(
                              service
                            )}
                          </option>
                        )
                      )}

                    </select>

                  </div>
                )}

              </section>

              {/* Schedule */}

              <section>

                <h3 className="mb-4 text-lg font-semibold text-gray-900">
                  Schedule
                </h3>

                {/* Day */}

                <div className="mb-4">

                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Day of week *
                  </label>

                  <select
                    name="day_of_week"
                    value={
                      form.day_of_week
                    }
                    onChange={
                      handleFormChange
                    }
                    required
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5"
                  >

                    {DAYS.map(
                      (day) => (
                        <option
                          key={day.value}
                          value={
                            day.value
                          }
                        >
                          {day.label}
                        </option>
                      )
                    )}

                  </select>

                </div>

                {/* Closed */}

                <label className="mb-4 flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4">

                  <input
                    type="checkbox"
                    name="is_closed"
                    checked={
                      form.is_closed
                    }
                    onChange={
                      handleFormChange
                    }
                    className="h-4 w-4"
                  />

                  <div>

                    <div className="font-medium text-gray-900">
                      Closed on this day
                    </div>

                    <div className="text-xs text-gray-500">
                      Opening and closing times will be
                      cleared when saved as closed.
                    </div>

                  </div>

                </label>

                {/* Times */}

                {!form.is_closed && (
                  <>

                    <div className="grid gap-4 md:grid-cols-2">

                      <div>

                        <label className="mb-2 block text-sm font-medium text-gray-700">
                          Opening time *
                        </label>

                        <input
                          type="time"
                          name="opening_time"
                          value={
                            form.opening_time
                          }
                          onChange={
                            handleFormChange
                          }
                          required
                          className="w-full rounded-lg border border-gray-300 px-3 py-2.5"
                        />

                      </div>

                      <div>

                        <label className="mb-2 block text-sm font-medium text-gray-700">
                          Closing time *
                        </label>

                        <input
                          type="time"
                          name="closing_time"
                          value={
                            form.closing_time
                          }
                          onChange={
                            handleFormChange
                          }
                          required
                          className="w-full rounded-lg border border-gray-300 px-3 py-2.5"
                        />

                      </div>

                    </div>

                    <div className="mt-4">

                      <h4 className="mb-3 text-sm font-semibold text-gray-800">
                        Break time (optional)
                      </h4>

                      <div className="grid gap-4 md:grid-cols-2">

                        <div>

                          <label className="mb-2 block text-sm font-medium text-gray-700">
                            Break starts
                          </label>

                          <input
                            type="time"
                            name="break_start"
                            value={
                              form.break_start
                            }
                            onChange={
                              handleFormChange
                            }
                            className="w-full rounded-lg border border-gray-300 px-3 py-2.5"
                          />

                        </div>

                        <div>

                          <label className="mb-2 block text-sm font-medium text-gray-700">
                            Break ends
                          </label>

                          <input
                            type="time"
                            name="break_end"
                            value={
                              form.break_end
                            }
                            onChange={
                              handleFormChange
                            }
                            className="w-full rounded-lg border border-gray-300 px-3 py-2.5"
                          />

                        </div>

                      </div>

                    </div>

                  </>
                )}

              </section>

              {/* Buttons */}

              <div className="flex justify-end gap-3 border-t border-gray-200 pt-5">

                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-lg border border-gray-300 px-5 py-2.5 font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-black px-5 py-2.5 font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? 'Saving...'
                    : editingOpeningHours
                    ? 'Save Changes'
                    : 'Create Opening Hours'}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  );
}

export default OpeningHoursPage;