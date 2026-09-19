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

function FacilitiesPage() {
  const navigate = useNavigate();

  const [admin, setAdmin] = useState(null);

  const [facilities, setFacilities] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [floors, setFloors] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [buildingFilter, setBuildingFilter] =
    useState('');

  const [floorFilter, setFloorFilter] =
    useState('');

  const [showModal, setShowModal] =
    useState(false);

  const [editingFacility, setEditingFacility] =
    useState(null);

  const [form, setForm] = useState({
    building_id: '',
    floor_id: '',
    name_en: '',
    name_am: '',
    name_om: '',
    description_en: '',
    description_am: '',
    description_om: '',
    phone: '',
    is_public: true,
    is_active: true
  });

  // --------------------------------------------------
  // HELPERS
  // --------------------------------------------------

  function clearMessages() {
    setError('');
    setSuccess('');
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

  function getFloorName(floor) {
    return (
      floor?.name_en ||
      floor?.name ||
      floor?.name_am ||
      floor?.name_om ||
      (floor?.floor_number !== undefined
        ? `Floor ${floor.floor_number}`
        : 'Unknown floor')
    );
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

    const buildingList =
      getArrayFromResponse(
        response,
        'buildings'
      );

    setBuildings(buildingList);

    return buildingList;
  }

  // --------------------------------------------------
  // LOAD FLOORS
  // --------------------------------------------------

  async function loadFloors() {
    const response =
      await adminApiRequest(
        '/api/admin/floors'
      );

    const floorList =
      getArrayFromResponse(
        response,
        'floors'
      );

    setFloors(floorList);

    return floorList;
  }

  // --------------------------------------------------
  // LOAD FACILITIES
  // --------------------------------------------------

  async function loadFacilities(
    customBuildingFilter = buildingFilter,
    customFloorFilter = floorFilter
  ) {
    const params =
      new URLSearchParams();

    if (customBuildingFilter) {
      params.set(
        'building_id',
        customBuildingFilter
      );
    }

    if (customFloorFilter) {
      params.set(
        'floor_id',
        customFloorFilter
      );
    }

    const queryString =
      params.toString();

    const endpoint =
      queryString
        ? `/api/admin/facilities?${queryString}`
        : '/api/admin/facilities';

    const response =
      await adminApiRequest(endpoint);

    const facilityList =
      getArrayFromResponse(
        response,
        'facilities'
      );

    setFacilities(facilityList);

    return facilityList;
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
          loadFloors()
        ]);

        await loadFacilities();
      } catch (err) {
        console.error(
          'Failed to initialize Facilities page:',
          err
        );

        setError(
          err.message ||
            'Failed to load facility management data.'
        );
      } finally {
        setLoading(false);
      }
    }

    initialize();
  }, []);

  // --------------------------------------------------
  // RELOAD FACILITIES WHEN FILTERS CHANGE
  // --------------------------------------------------

  useEffect(() => {
    if (loading) {
      return;
    }

    async function reloadFacilities() {
      try {
        clearMessages();

        await loadFacilities(
          buildingFilter,
          floorFilter
        );
      } catch (err) {
        console.error(
          'Failed to reload facilities:',
          err
        );

        setError(
          err.message ||
            'Failed to load facilities.'
        );
      }
    }

    reloadFacilities();
  }, [
    buildingFilter,
    floorFilter
  ]);

  // --------------------------------------------------
  // FILTER FLOORS BY BUILDING
  // --------------------------------------------------

  const filteredFloors =
    useMemo(() => {
      if (!buildingFilter) {
        return floors;
      }

      return floors.filter(
        (floor) =>
          floor.building_id ===
          buildingFilter
      );
    }, [
      floors,
      buildingFilter
    ]);

  // --------------------------------------------------
  // FORM FLOORS
  // --------------------------------------------------

  const formFloors =
    useMemo(() => {
      if (!form.building_id) {
        return floors;
      }

      return floors.filter(
        (floor) =>
          floor.building_id ===
          form.building_id
      );
    }, [
      floors,
      form.building_id
    ]);

  // --------------------------------------------------
  // FILTER HANDLERS
  // --------------------------------------------------

  function handleBuildingFilterChange(
    value
  ) {
    setBuildingFilter(value);
    setFloorFilter('');
  }

  // --------------------------------------------------
  // FORM
  // --------------------------------------------------

  function resetForm() {
    setForm({
      building_id:
        buildingFilter || '',
      floor_id: '',
      name_en: '',
      name_am: '',
      name_om: '',
      description_en: '',
      description_am: '',
      description_om: '',
      phone: '',
      is_public: true,
      is_active: true
    });
  }

  function openAddModal() {
    clearMessages();

    setEditingFacility(null);

    resetForm();

    setShowModal(true);
  }

  function openEditModal(facility) {
    clearMessages();

    setEditingFacility(facility);

    setForm({
      building_id:
        facility.building_id || '',

      floor_id:
        facility.floor_id || '',

      name_en:
        facility.name_en || '',

      name_am:
        facility.name_am || '',

      name_om:
        facility.name_om || '',

      description_en:
        facility.description_en || '',

      description_am:
        facility.description_am || '',

      description_om:
        facility.description_om || '',

      phone:
        facility.phone || '',

      is_public:
        typeof facility.is_public ===
        'boolean'
          ? facility.is_public
          : true,

      is_active:
        typeof facility.is_active ===
        'boolean'
          ? facility.is_active
          : true
    });

    setShowModal(true);
  }

  function closeModal() {
    if (saving) {
      return;
    }

    setShowModal(false);

    setEditingFacility(null);

    resetForm();
  }

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
        floor_id: ''
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
  // SAVE FACILITY
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

    if (!form.name_en.trim()) {
      setError(
        'English facility name is required.'
      );

      return;
    }

    setSaving(true);

    try {
      const payload = {
        building_id:
          form.building_id,

        floor_id:
          form.floor_id || null,

        name_en:
          form.name_en.trim(),

        name_am:
          form.name_am.trim() || null,

        name_om:
          form.name_om.trim() || null,

        description_en:
          form.description_en.trim() ||
          null,

        description_am:
          form.description_am.trim() ||
          null,

        description_om:
          form.description_om.trim() ||
          null,

        phone:
          form.phone.trim() || null,

        is_public:
          Boolean(form.is_public),

        is_active:
          Boolean(form.is_active)
      };

      if (editingFacility) {
        await adminApiRequest(
          `/api/admin/facilities/${editingFacility.id}`,
          {
            method: 'PUT',
            body: JSON.stringify(payload)
          }
        );

        setSuccess(
          'Facility updated successfully.'
        );
      } else {
        await adminApiRequest(
          '/api/admin/facilities',
          {
            method: 'POST',
            body: JSON.stringify(payload)
          }
        );

        setSuccess(
          'Facility created successfully.'
        );
      }

      setShowModal(false);

      setEditingFacility(null);

      resetForm();

      await loadFacilities();
    } catch (err) {
      console.error(
        'Failed to save facility:',
        err
      );

      setError(
        err.message ||
          'Failed to save facility.'
      );
    } finally {
      setSaving(false);
    }
  }

  // --------------------------------------------------
  // TOGGLE ACTIVE
  // --------------------------------------------------

  async function toggleActive(
    facility
  ) {
    clearMessages();

    try {
      await adminApiRequest(
        `/api/admin/facilities/${facility.id}/status`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            is_active:
              !facility.is_active
          })
        }
      );

      setSuccess(
        facility.is_active
          ? 'Facility deactivated successfully.'
          : 'Facility activated successfully.'
      );

      await loadFacilities();
    } catch (err) {
      console.error(
        'Failed to update facility status:',
        err
      );

      setError(
        err.message ||
          'Failed to update facility status.'
      );
    }
  }

  // --------------------------------------------------
  // LOOKUPS
  // --------------------------------------------------

  function findBuilding(id) {
    return buildings.find(
      (building) =>
        building.id === id
    );
  }

  function findFloor(id) {
    return floors.find(
      (floor) =>
        floor.id === id
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
            Loading facilities...
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
              Facilities
            </h1>

            <p className="mt-1 text-gray-600">
              Manage facilities and visitor resources.
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
            + Add Facility
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

          <div className="grid gap-4 md:grid-cols-2">

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

            {/* Floor */}

            <div>

              <label className="mb-2 block text-sm font-medium text-gray-700">
                Filter by floor
              </label>

              <select
                value={floorFilter}
                onChange={(event) =>
                  setFloorFilter(
                    event.target.value
                  )
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5"
              >

                <option value="">
                  All floors
                </option>

                {filteredFloors.map(
                  (floor) => (
                    <option
                      key={floor.id}
                      value={floor.id}
                    >
                      {getFloorName(
                        floor
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
            {facilities.length}{' '}
            {facilities.length === 1
              ? 'facility'
              : 'facilities'}
          </p>

        </div>

        {/* Table */}

        <div className="overflow-hidden rounded-xl bg-white shadow-sm">

          <div className="overflow-x-auto">

            <table className="min-w-full">

              <thead className="border-b border-gray-200 bg-gray-50">

                <tr>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Facility
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Building
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Floor
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Phone
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Public
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Active
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Actions
                  </th>

                </tr>

              </thead>

              <tbody className="divide-y divide-gray-100">

                {facilities.map(
                  (facility) => {

                    const building =
                      findBuilding(
                        facility.building_id
                      );

                    const floor =
                      findFloor(
                        facility.floor_id
                      );

                    return (
                      <tr
                        key={facility.id}
                        className="hover:bg-gray-50"
                      >

                        {/* Facility */}

                        <td className="px-4 py-4">

                          <div className="font-semibold text-gray-900">
                            {facility.name_en ||
                              facility.name_am ||
                              facility.name_om ||
                              'Unnamed facility'}
                          </div>

                          {facility.name_am && (
                            <div className="mt-1 text-sm text-gray-500">
                              {facility.name_am}
                            </div>
                          )}

                          {facility.phone && (
                            <div className="mt-1 text-xs text-gray-500">
                              {facility.phone}
                            </div>
                          )}

                        </td>

                        {/* Building */}

                        <td className="px-4 py-4">

                          <span className="text-sm text-gray-700">
                            {getBuildingName(
                              building
                            )}
                          </span>

                        </td>

                        {/* Floor */}

                        <td className="px-4 py-4">

                          <span className="text-sm text-gray-700">
                            {floor
                              ? getFloorName(
                                  floor
                                )
                              : 'Building-wide'}
                          </span>

                        </td>

                        {/* Phone */}

                        <td className="px-4 py-4">

                          <span className="text-sm text-gray-700">
                            {facility.phone ||
                              '—'}
                          </span>

                        </td>

                        {/* Public */}

                        <td className="px-4 py-4">

                          {facility.is_public ? (
                            <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
                              Public
                            </span>
                          ) : (
                            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">
                              Private
                            </span>
                          )}

                        </td>

                        {/* Active */}

                        <td className="px-4 py-4">

                          {facility.is_active ? (
                            <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
                              Active
                            </span>
                          ) : (
                            <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">
                              Inactive
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
                                  facility
                                )
                              }
                              className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                toggleActive(
                                  facility
                                )
                              }
                              className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                                facility.is_active
                                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                  : 'bg-green-100 text-green-700 hover:bg-green-200'
                              }`}
                            >
                              {facility.is_active
                                ? 'Deactivate'
                                : 'Activate'}
                            </button>

                          </div>

                        </td>

                      </tr>
                    );
                  }
                )}

                {facilities.length === 0 && (
                  <tr>

                    <td
                      colSpan="7"
                      className="px-4 py-12 text-center text-gray-500"
                    >
                      No facilities found.
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
                  {editingFacility
                    ? 'Edit Facility'
                    : 'Add Facility'}
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Add facility information and
                  choose its building or floor.
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

              {/* Location */}

              <section>

                <h3 className="mb-4 text-lg font-semibold text-gray-900">
                  Location
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

                  {/* Floor */}

                  <div>

                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Floor
                    </label>

                    <select
                      name="floor_id"
                      value={
                        form.floor_id
                      }
                      onChange={
                        handleFormChange
                      }
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5"
                    >

                      <option value="">
                        Building-wide
                      </option>

                      {formFloors.map(
                        (floor) => (
                          <option
                            key={floor.id}
                            value={floor.id}
                          >
                            {getFloorName(
                              floor
                            )}
                          </option>
                        )
                      )}

                    </select>

                  </div>

                </div>

              </section>

              {/* Facility Name */}

              <section>

                <h3 className="mb-4 text-lg font-semibold text-gray-900">
                  Facility Name
                </h3>

                <div className="grid gap-4 md:grid-cols-3">

                  <div>

                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      English *
                    </label>

                    <input
                      type="text"
                      name="name_en"
                      value={
                        form.name_en
                      }
                      onChange={
                        handleFormChange
                      }
                      required
                      placeholder="Reception"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5"
                    />

                  </div>

                  <div>

                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Amharic
                    </label>

                    <input
                      type="text"
                      name="name_am"
                      value={
                        form.name_am
                      }
                      onChange={
                        handleFormChange
                      }
                      placeholder="መቀበያ"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5"
                    />

                  </div>

                  <div>

                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Afaan Oromoo
                    </label>

                    <input
                      type="text"
                      name="name_om"
                      value={
                        form.name_om
                      }
                      onChange={
                        handleFormChange
                      }
                      placeholder="Fuula simannaa"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5"
                    />

                  </div>

                </div>

              </section>

              {/* Description */}

              <section>

                <h3 className="mb-4 text-lg font-semibold text-gray-900">
                  Description
                </h3>

                <div className="grid gap-4 md:grid-cols-3">

                  <div>

                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      English
                    </label>

                    <textarea
                      name="description_en"
                      value={
                        form.description_en
                      }
                      onChange={
                        handleFormChange
                      }
                      rows="4"
                      placeholder="Main reception area for visitors."
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5"
                    />

                  </div>

                  <div>

                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Amharic
                    </label>

                    <textarea
                      name="description_am"
                      value={
                        form.description_am
                      }
                      onChange={
                        handleFormChange
                      }
                      rows="4"
                      placeholder="የጎብኚዎች ዋና መቀበያ ቦታ።"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5"
                    />

                  </div>

                  <div>

                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Afaan Oromoo
                    </label>

                    <textarea
                      name="description_om"
                      value={
                        form.description_om
                      }
                      onChange={
                        handleFormChange
                      }
                      rows="4"
                      placeholder="Iddoo simannaa daawwattootaa."
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5"
                    />

                  </div>

                </div>

              </section>

              {/* Contact */}

              <section>

                <h3 className="mb-4 text-lg font-semibold text-gray-900">
                  Contact
                </h3>

                <div>

                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Phone
                  </label>

                  <input
                    type="tel"
                    name="phone"
                    value={
                      form.phone
                    }
                    onChange={
                      handleFormChange
                    }
                    placeholder="Phone number"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5"
                  />

                </div>

              </section>

              {/* Visibility */}

              <section>

                <h3 className="mb-4 text-lg font-semibold text-gray-900">
                  Visibility
                </h3>

                <div className="grid gap-4 md:grid-cols-2">

                  <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 p-4">

                    <input
                      type="checkbox"
                      name="is_public"
                      checked={
                        form.is_public
                      }
                      onChange={
                        handleFormChange
                      }
                      className="h-4 w-4"
                    />

                    <div>

                      <div className="font-medium text-gray-900">
                        Public facility
                      </div>

                      <div className="text-xs text-gray-500">
                        Visitors can see this facility
                        in the public directory.
                      </div>

                    </div>

                  </label>

                  <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 p-4">

                    <input
                      type="checkbox"
                      name="is_active"
                      checked={
                        form.is_active
                      }
                      onChange={
                        handleFormChange
                      }
                      className="h-4 w-4"
                    />

                    <div>

                      <div className="font-medium text-gray-900">
                        Active facility
                      </div>

                      <div className="text-xs text-gray-500">
                        Inactive facilities are hidden
                        from active results.
                      </div>

                    </div>

                  </label>

                </div>

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
                    : editingFacility
                    ? 'Save Changes'
                    : 'Create Facility'}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  );
}

export default FacilitiesPage;