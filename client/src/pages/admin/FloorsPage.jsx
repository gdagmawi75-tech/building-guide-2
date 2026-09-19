import React, { useEffect, useState } from 'react';
import {
  adminApiRequest,
  getAdminMe
} from '../../api/adminApi';

const emptyForm = {
  building_id: '',
  name_en: '',
  name_am: '',
  name_om: '',
  floor_number: '',
  is_active: true
};

function FloorsPage() {
  const [floors, setFloors] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [admin, setAdmin] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editingFloor, setEditingFloor] = useState(null);

  const [form, setForm] = useState(emptyForm);

  const isSuperAdmin = admin?.role === 'super_admin';
  const isBuildingManager =
    admin?.role === 'building_manager';

  const canCreate = isSuperAdmin || isBuildingManager;
  const canEdit = isSuperAdmin || isBuildingManager;

  useEffect(() => {
    loadPage();
  }, []);

  async function loadPage() {
    try {
      setLoading(true);
      setError('');

      const adminResponse = await getAdminMe();

      const currentAdmin =
        adminResponse.admin ||
        adminResponse.user ||
        adminResponse;

      setAdmin(currentAdmin);

      const floorsResponse =
        await adminApiRequest(
          '/api/admin/floors'
        );

      setFloors(
        floorsResponse.data || []
      );

      if (
        currentAdmin.role ===
        'super_admin'
      ) {
        const buildingsResponse =
          await adminApiRequest(
            '/api/admin/buildings'
          );

        setBuildings(
          buildingsResponse.data || []
        );
      } else if (
        currentAdmin.building_id
      ) {
        setBuildings([
          {
            id: currentAdmin.building_id,
            name_en:
              floorsResponse.data?.[0]
                ?.buildings?.name_en ||
              'Assigned Building'
          }
        ]);
      }
    } catch (err) {
      setError(
        err.message ||
          'Failed to load floors.'
      );
    } finally {
      setLoading(false);
    }
  }

  function clearMessages() {
    setError('');
    setSuccess('');
  }

  function openCreateForm() {
    clearMessages();

    setEditingFloor(null);

    setForm({
      ...emptyForm,
      building_id: isSuperAdmin
        ? ''
        : admin?.building_id || ''
    });

    setShowForm(true);
  }

  function openEditForm(floor) {
    clearMessages();

    setEditingFloor(floor);

    setForm({
      building_id:
        floor.building_id || '',
      name_en:
        floor.name_en || '',
      name_am:
        floor.name_am || '',
      name_om:
        floor.name_om || '',
      floor_number:
        floor.floor_number ?? '',
      is_active:
        floor.is_active !== false
    });

    setShowForm(true);
  }

  function closeForm() {
    if (saving) {
      return;
    }

    setShowForm(false);
    setEditingFloor(null);
    setForm(emptyForm);
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

  async function handleSubmit(event) {
    event.preventDefault();

    clearMessages();

    if (!form.name_en.trim()) {
      setError(
        'Floor name in English is required.'
      );
      return;
    }

    if (!form.building_id) {
      setError(
        'A building must be selected.'
      );
      return;
    }

    if (
      form.floor_number === '' ||
      !Number.isInteger(
        Number(form.floor_number)
      )
    ) {
      setError(
        'Floor number must be an integer.'
      );
      return;
    }

    try {
      setSaving(true);

      const payload = {
        building_id:
          form.building_id,
        name_en:
          form.name_en.trim(),
        name_am:
          form.name_am.trim() || null,
        name_om:
          form.name_om.trim() || null,
        floor_number:
          Number(form.floor_number),
        is_active:
          form.is_active
      };

      let response;

      if (editingFloor) {
        response =
          await adminApiRequest(
            `/api/admin/floors/${editingFloor.id}`,
            {
              method: 'PUT',
              body: JSON.stringify(
                payload
              )
            }
          );
      } else {
        response =
          await adminApiRequest(
            '/api/admin/floors',
            {
              method: 'POST',
              body: JSON.stringify(
                payload
              )
            }
          );
      }

      const savedFloor =
        response.data;

      if (editingFloor) {
        setFloors((current) =>
          current.map((floor) =>
            floor.id ===
            savedFloor.id
              ? {
                  ...floor,
                  ...savedFloor
                }
              : floor
          )
        );

        setSuccess(
          'Floor updated successfully.'
        );
      } else {
        setFloors((current) => [
          ...current,
          savedFloor
        ]);

        setSuccess(
          'Floor created successfully.'
        );
      }

      closeForm();
    } catch (err) {
      setError(
        err.message ||
          'Failed to save floor.'
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleStatus(
    floor
  ) {
    clearMessages();

    const nextStatus =
      !floor.is_active;

    const confirmed =
      window.confirm(
        `${nextStatus ? 'Activate' : 'Deactivate'} "${floor.name_en}"?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setSaving(true);

      const response =
        await adminApiRequest(
          `/api/admin/floors/${floor.id}/status`,
          {
            method: 'PATCH',
            body: JSON.stringify({
              is_active:
                nextStatus
            })
          }
        );

      const updatedFloor =
        response.data;

      setFloors((current) =>
        current.map((item) =>
          item.id ===
          updatedFloor.id
            ? {
                ...item,
                ...updatedFloor
              }
            : item
        )
      );

      setSuccess(
        `Floor ${
          nextStatus
            ? 'activated'
            : 'deactivated'
        } successfully.`
      );
    } catch (err) {
      setError(
        err.message ||
          'Failed to change floor status.'
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="bg-white border border-slate-200 rounded-2xl px-8 py-6">
          <p className="text-slate-600">
            Loading floors...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Floors
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Manage building floors and floor information.
              </p>
            </div>

            {canCreate && (
              <button
                type="button"
                onClick={
                  openCreateForm
                }
                className="px-5 py-3 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 transition"
              >
                + Add Floor
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3">
            {success}
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        <div className="mb-6 bg-white border border-slate-200 rounded-2xl p-5">
          <p className="text-sm text-slate-500">
            Signed in as
          </p>

          <p className="mt-1 font-semibold text-slate-900">
            {admin?.full_name ||
              'Admin'}
          </p>

          <p className="mt-1 text-sm text-slate-500 capitalize">
            {admin?.role
              ? admin.role.replace(
                  /_/g,
                  ' '
                )
              : 'Admin'}
          </p>
        </div>

        {floors.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
            <h2 className="text-xl font-semibold text-slate-900">
              No floors found
            </h2>

            <p className="mt-2 text-slate-500">
              There are currently no floors available for this account.
            </p>

            {canCreate && (
              <button
                type="button"
                onClick={
                  openCreateForm
                }
                className="mt-6 px-5 py-3 rounded-xl bg-slate-900 text-white font-semibold"
              >
                Add Floor
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Floor
                    </th>

                    <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Building
                    </th>

                    <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Number
                    </th>

                    <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Status
                    </th>

                    <th className="text-right px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200">
                  {floors.map(
                    (floor) => (
                      <tr
                        key={floor.id}
                        className="hover:bg-slate-50"
                      >
                        <td className="px-6 py-5">
                          <p className="font-semibold text-slate-900">
                            {floor.name_en}
                          </p>

                          {floor.name_am && (
                            <p className="mt-1 text-sm text-slate-500">
                              {floor.name_am}
                            </p>
                          )}
                        </td>

                        <td className="px-6 py-5 text-sm text-slate-700">
                          {floor.buildings
                            ?.name_en ||
                            '—'}
                        </td>

                        <td className="px-6 py-5 text-sm font-medium text-slate-900">
                          {floor.floor_number}
                        </td>

                        <td className="px-6 py-5">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              floor.is_active
                                ? 'bg-green-100 text-green-700'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {floor.is_active
                              ? 'Active'
                              : 'Inactive'}
                          </span>
                        </td>

                        <td className="px-6 py-5">
                          <div className="flex justify-end gap-2">
                            {canEdit && (
                              <button
                                type="button"
                                onClick={() =>
                                  openEditForm(
                                    floor
                                  )
                                }
                                className="px-3 py-2 rounded-lg border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50"
                              >
                                Edit
                              </button>
                            )}

                            {canEdit && (
                              <button
                                type="button"
                                disabled={
                                  saving
                                }
                                onClick={() =>
                                  handleToggleStatus(
                                    floor
                                  )
                                }
                                className={`px-3 py-2 rounded-lg text-sm font-medium ${
                                  floor.is_active
                                    ? 'border border-red-200 text-red-700 hover:bg-red-50'
                                    : 'border border-green-200 text-green-700 hover:bg-green-50'
                                }`}
                              >
                                {floor.is_active
                                  ? 'Deactivate'
                                  : 'Activate'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {editingFloor
                    ? 'Edit Floor'
                    : 'Add Floor'}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {editingFloor
                    ? 'Update the floor information.'
                    : 'Create a new floor.'}
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                className="text-2xl text-slate-500 hover:text-slate-900"
              >
                ×
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="p-6 space-y-6"
            >
              <div>
                <label
                  htmlFor="building_id"
                  className="block text-sm font-medium text-slate-700 mb-2"
                >
                  Building
                </label>

                <select
                  id="building_id"
                  name="building_id"
                  value={
                    form.building_id
                  }
                  onChange={
                    handleChange
                  }
                  disabled={
                    !isSuperAdmin
                  }
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 outline-none focus:ring-2 focus:ring-slate-900 disabled:bg-slate-100"
                >
                  <option value="">
                    Select building
                  </option>

                  {buildings.map(
                    (building) => (
                      <option
                        key={
                          building.id
                        }
                        value={
                          building.id
                        }
                      >
                        {
                          building.name_en
                        }
                      </option>
                    )
                  )}
                </select>
              </div>

              <InputField
                label="Floor name (English)"
                name="name_en"
                value={form.name_en}
                onChange={
                  handleChange
                }
                required
              />

              <InputField
                label="Floor name (Amharic)"
                name="name_am"
                value={form.name_am}
                onChange={
                  handleChange
                }
              />

              <InputField
                label="Floor name (Afaan Oromoo)"
                name="name_om"
                value={form.name_om}
                onChange={
                  handleChange
                }
              />

              <InputField
                label="Floor number"
                name="floor_number"
                value={
                  form.floor_number
                }
                onChange={
                  handleChange
                }
                type="number"
                required
              />

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={
                    form.is_active
                  }
                  onChange={
                    handleChange
                  }
                  className="w-4 h-4"
                />

                <span className="text-sm font-medium text-slate-700">
                  Floor is active
                </span>
              </label>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  className="px-5 py-3 rounded-xl border border-slate-300 text-slate-700 font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-3 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 disabled:opacity-50"
                >
                  {saving
                    ? 'Saving...'
                    : editingFloor
                      ? 'Save Changes'
                      : 'Create Floor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function InputField({
  label,
  name,
  value,
  onChange,
  type = 'text',
  required = false
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="block text-sm font-medium text-slate-700 mb-2"
      >
        {label}

        {required && (
          <span className="text-red-500 ml-1">
            *
          </span>
        )}
      </label>

      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 outline-none focus:ring-2 focus:ring-slate-900"
      />
    </div>
  );
}

export default FloorsPage;