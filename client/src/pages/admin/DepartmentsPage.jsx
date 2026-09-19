import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApiRequest } from '../../api/adminApi';

function DepartmentsPage() {
  const navigate = useNavigate();

  const [departments, setDepartments] = useState([]);
  const [buildings, setBuildings] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);

  const [selectedBuilding, setSelectedBuilding] = useState('');

  const [form, setForm] = useState({
    building_id: '',
    name_en: '',
    name_am: '',
    name_om: '',
    description_en: '',
    description_am: '',
    description_om: '',
    phone: '',
    email: '',
    is_public: true,
    is_active: true
  });

  useEffect(() => {
    loadPage();
  }, []);

  async function loadPage() {
    try {
      setLoading(true);
      setError('');

      const [
        departmentsResponse,
        buildingsResponse
      ] = await Promise.all([
        adminApiRequest('/api/admin/departments'),
        adminApiRequest('/api/admin/buildings')
      ]);

      const departments =
        departmentsResponse?.departments ||
        departmentsResponse?.data ||
        departmentsResponse ||
        [];

      const buildings =
        buildingsResponse?.buildings ||
        buildingsResponse?.data ||
        buildingsResponse ||
        [];

      setDepartments(
        Array.isArray(departments)
          ? departments
          : []
      );

      setBuildings(
        Array.isArray(buildings)
          ? buildings
          : []
      );
    } catch (err) {
      console.error(
        'Failed to load departments:',
        err
      );

      setError(
        err.message ||
        'Failed to load departments.'
      );
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setForm({
      building_id: '',
      name_en: '',
      name_am: '',
      name_om: '',
      description_en: '',
      description_am: '',
      description_om: '',
      phone: '',
      email: '',
      is_public: true,
      is_active: true
    });
  }

  function openAddModal() {
    setEditingDepartment(null);
    resetForm();
    setShowModal(true);
  }

  function openEditModal(department) {
    setEditingDepartment(department);

    setForm({
      building_id:
        department.building_id || '',

      name_en:
        department.name_en || '',

      name_am:
        department.name_am || '',

      name_om:
        department.name_om || '',

      description_en:
        department.description_en || '',

      description_am:
        department.description_am || '',

      description_om:
        department.description_om || '',

      phone:
        department.phone || '',

      email:
        department.email || '',

      is_public:
        typeof department.is_public === 'boolean'
          ? department.is_public
          : true,

      is_active:
        typeof department.is_active === 'boolean'
          ? department.is_active
          : true
    });

    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingDepartment(null);
    resetForm();
  }

  function handleChange(event) {
    const {
      name,
      value,
      type,
      checked
    } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]:
        type === 'checkbox'
          ? checked
          : value
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setError('');

      if (!form.building_id) {
        setError(
          'Please select a building.'
        );
        return;
      }

      if (!form.name_en.trim()) {
        setError(
          'English department name is required.'
        );
        return;
      }

      const payload = {
        building_id: form.building_id,

        name_en:
          form.name_en.trim(),

        name_am:
          form.name_am.trim() || null,

        name_om:
          form.name_om.trim() || null,

        description_en:
          form.description_en.trim() || null,

        description_am:
          form.description_am.trim() || null,

        description_om:
          form.description_om.trim() || null,

        phone:
          form.phone.trim() || null,

        email:
          form.email.trim() || null,

        is_public:
          form.is_public,

        is_active:
          form.is_active
      };

      if (editingDepartment) {
        await adminApiRequest(
          `/api/admin/departments/${editingDepartment.id}`,
          {
            method: 'PUT',
            body: JSON.stringify(payload)
          }
        );
      } else {
        await adminApiRequest(
          '/api/admin/departments',
          {
            method: 'POST',
            body: JSON.stringify(payload)
          }
        );
      }

      closeModal();
      await loadPage();
    } catch (err) {
      console.error(
        'Failed to save department:',
        err
      );

      setError(
        err.message ||
        'Failed to save department.'
      );
    }
  }

  async function toggleActive(department) {
    try {
      setError('');

      await adminApiRequest(
        `/api/admin/departments/${department.id}/status`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            is_active:
              !department.is_active
          })
        }
      );

      await loadPage();
    } catch (err) {
      console.error(
        'Failed to update department status:',
        err
      );

      setError(
        err.message ||
        'Failed to update department status.'
      );
    }
  }

  function getBuildingName(buildingId) {
    const building = buildings.find(
      (item) =>
        item.id === buildingId
    );

    return (
      building?.name_en ||
      building?.name ||
      'Unknown building'
    );
  }

  const visibleDepartments =
    departments.filter((department) => {
      if (!selectedBuilding) {
        return true;
      }

      return (
        department.building_id ===
        selectedBuilding
      );
    });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl font-semibold text-gray-800">
            Loading departments...
          </div>

          <div className="text-sm text-gray-500 mt-2">
            Please wait.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <button
              onClick={() =>
                navigate('/admin')
              }
              className="text-sm text-blue-600 hover:underline mb-3"
            >
              ← Back to Dashboard
            </button>

            <h1 className="text-3xl font-bold text-gray-900">
              Departments
            </h1>

            <p className="text-gray-600 mt-1">
              Manage departments and their public information.
            </p>
          </div>

          <button
            onClick={openAddModal}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-3 rounded-lg"
          >
            + Add Department
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700">
            <div className="font-semibold">
              Error
            </div>

            <div className="mt-1">
              {error}
            </div>
          </div>
        )}

        {/* Filter */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6 shadow-sm">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filter by building
          </label>

          <select
            value={selectedBuilding}
            onChange={(event) =>
              setSelectedBuilding(
                event.target.value
              )
            }
            className="w-full md:w-96 border border-gray-300 rounded-lg px-3 py-2 bg-white"
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
                  {building.name_en ||
                    building.name ||
                    'Unnamed building'}
                </option>
              )
            )}
          </select>
        </div>

        {/* Department Table */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">

          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">
              {visibleDepartments.length}{' '}
              department
              {visibleDepartments.length === 1
                ? ''
                : 's'}
            </h2>
          </div>

          {visibleDepartments.length === 0 ? (
            <div className="p-10 text-center">
              <div className="text-gray-500">
                No departments found.
              </div>

              <div className="text-sm text-gray-400 mt-2">
                There are currently no departments available for this account.
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">

                <thead className="bg-gray-50">
                  <tr>

                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">
                      Department
                    </th>

                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">
                      Building
                    </th>

                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">
                      Phone
                    </th>

                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">
                      Email
                    </th>

                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">
                      Public
                    </th>

                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">
                      Status
                    </th>

                    <th className="text-right px-6 py-4 text-sm font-semibold text-gray-700">
                      Actions
                    </th>

                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200">

                  {visibleDepartments.map(
                    (department) => (
                      <tr
                        key={department.id}
                        className="hover:bg-gray-50"
                      >

                        <td className="px-6 py-4">
                          <div className="font-semibold text-gray-900">
                            {department.name_en}
                          </div>

                          {department.name_am && (
                            <div className="text-sm text-gray-500 mt-1">
                              {department.name_am}
                            </div>
                          )}

                          {department.name_om && (
                            <div className="text-sm text-gray-400 mt-1">
                              {department.name_om}
                            </div>
                          )}
                        </td>

                        <td className="px-6 py-4 text-sm text-gray-700">
                          {getBuildingName(
                            department.building_id
                          )}
                        </td>

                        <td className="px-6 py-4 text-sm text-gray-700">
                          {department.phone || '—'}
                        </td>

                        <td className="px-6 py-4 text-sm text-gray-700">
                          {department.email || '—'}
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                              department.is_public
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {department.is_public
                              ? 'Public'
                              : 'Private'}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                              department.is_active
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {department.is_active
                              ? 'Active'
                              : 'Inactive'}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex flex-wrap justify-end gap-2">

                            <button
                              onClick={() =>
                                openEditModal(
                                  department
                                )
                              }
                              className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                              Edit
                            </button>

                            <button
                              onClick={() =>
                                toggleActive(
                                  department
                                )
                              }
                              className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                              {department.is_active
                                ? 'Deactivate'
                                : 'Activate'}
                            </button>

                          </div>
                        </td>

                      </tr>
                    )
                  )}

                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">

          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">

            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200">

              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {editingDepartment
                    ? 'Edit Department'
                    : 'Add Department'}
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  Add or update department information.
                </p>
              </div>

              <button
                onClick={closeModal}
                className="text-2xl text-gray-400 hover:text-gray-700"
              >
                ×
              </button>

            </div>

            <form
              onSubmit={handleSubmit}
              className="p-6 space-y-8"
            >

              {/* Building */}
              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Building
                </h3>

                <select
                  name="building_id"
                  value={form.building_id}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
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
                        {building.name_en ||
                          building.name ||
                          'Unnamed building'}
                      </option>
                    )
                  )}
                </select>
              </section>

              {/* Department Name */}
              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Department Name
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      English *
                    </label>

                    <input
                      type="text"
                      name="name_en"
                      value={form.name_en}
                      onChange={handleChange}
                      required
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Amharic
                    </label>

                    <input
                      type="text"
                      name="name_am"
                      value={form.name_am}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Afaan Oromoo
                    </label>

                    <input
                      type="text"
                      name="name_om"
                      value={form.name_om}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>

                </div>
              </section>

              {/* Description */}
              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Description
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      English
                    </label>

                    <textarea
                      name="description_en"
                      value={form.description_en}
                      onChange={handleChange}
                      rows="4"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Amharic
                    </label>

                    <textarea
                      name="description_am"
                      value={form.description_am}
                      onChange={handleChange}
                      rows="4"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Afaan Oromoo
                    </label>

                    <textarea
                      name="description_om"
                      value={form.description_om}
                      onChange={handleChange}
                      rows="4"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>

                </div>
              </section>

              {/* Contact */}
              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Contact
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone
                    </label>

                    <input
                      type="text"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>

                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>

                </div>
              </section>

              {/* Settings */}
              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Settings
                </h3>

                <div className="space-y-3">

                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      name="is_public"
                      checked={form.is_public}
                      onChange={handleChange}
                    />

                    <span className="text-sm text-gray-700">
                      Publicly visible
                    </span>
                  </label>

                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={form.is_active}
                      onChange={handleChange}
                    />

                    <span className="text-sm text-gray-700">
                      Active
                    </span>
                  </label>

                </div>
              </section>

              {/* Buttons */}
              <div className="flex justify-end gap-3 pt-5 border-t border-gray-200">

                <button
                  type="button"
                  onClick={closeModal}
                  className="px-5 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
                >
                  {editingDepartment
                    ? 'Save Changes'
                    : 'Create Department'}
                </button>

              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default DepartmentsPage;