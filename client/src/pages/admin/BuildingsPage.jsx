import React, { useEffect, useState } from 'react';
import { adminApiRequest, getAdminMe } from '../../api/adminApi';

const emptyForm = {
  name_en: '',
  name_am: '',
  name_om: '',
  address_en: '',
  address_am: '',
  address_om: '',
  description_en: '',
  description_am: '',
  description_om: '',
  phone: '',
  emil: '',
  total_floors: '',
  opening_time: '',
  closing_time: '',
  is_active: true
};

function BuildingsPage() {
  const [buildings, setBuildings] = useState([]);
  const [admin, setAdmin] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editingBuilding, setEditingBuilding] = useState(null);

  const [form, setForm] = useState(emptyForm);

  const isSuperAdmin = admin?.role === 'super_admin';
  const isBuildingManager = admin?.role === 'building_manager';

  useEffect(() => {
    loadAdminAndBuildings();
  }, []);

  async function loadAdminAndBuildings() {
    try {
      setLoading(true);
      setError('');

      const adminResponse = await getAdminMe();

      const currentAdmin =
        adminResponse.admin ||
        adminResponse.user ||
        adminResponse;

      setAdmin(currentAdmin);

      const buildingsResponse =
        await adminApiRequest('/api/admin/buildings');

      setBuildings(buildingsResponse.data || []);
    } catch (err) {
      setError(
        err.message ||
        'Failed to load buildings.'
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

    setEditingBuilding(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function openEditForm(building) {
    clearMessages();

    setEditingBuilding(building);

    setForm({
      name_en: building.name_en || '',
      name_am: building.name_am || '',
      name_om: building.name_om || '',
      address_en: building.address_en || '',
      address_am: building.address_am || '',
      address_om: building.address_om || '',
      description_en: building.description_en || '',
      description_am: building.description_am || '',
      description_om: building.description_om || '',
      phone: building.phone || '',
      emil: building.emil || '',
      total_floors:
        building.total_floors ?? '',
      opening_time:
        building.opening_time || '',
      closing_time:
        building.closing_time || '',
      is_active:
        building.is_active !== false
    });

    setShowForm(true);
  }

  function closeForm() {
    if (saving) {
      return;
    }

    setShowForm(false);
    setEditingBuilding(null);
    setForm(emptyForm);
  }

  function handleChange(event) {
    const { name, value, type, checked } =
      event.target;

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
        'Building name in English is required.'
      );
      return;
    }

    if (
      form.total_floors !== '' &&
      (
        Number.isNaN(
          Number(form.total_floors)
        ) ||
        Number(form.total_floors) < 0
      )
    ) {
      setError(
        'Total floors must be a valid number.'
      );
      return;
    }

    try {
      setSaving(true);

      const payload = {
        name_en: form.name_en.trim(),
        name_am:
          form.name_am.trim() || null,
        name_om:
          form.name_om.trim() || null,

        address_en:
          form.address_en.trim() || null,
        address_am:
          form.address_am.trim() || null,
        address_om:
          form.address_om.trim() || null,

        description_en:
          form.description_en.trim() || null,
        description_am:
          form.description_am.trim() || null,
        description_om:
          form.description_om.trim() || null,

        phone:
          form.phone.trim() || null,

        // IMPORTANT:
        // Your real database column is "emil".
        emil:
          form.emil.trim() || null,

        total_floors:
          form.total_floors === ''
            ? null
            : Number(form.total_floors),

        opening_time:
          form.opening_time || null,

        closing_time:
          form.closing_time || null,

        is_active:
          form.is_active
      };

      let response;

      if (editingBuilding) {
        response = await adminApiRequest(
          `/api/admin/buildings/${editingBuilding.id}`,
          {
            method: 'PUT',
            body: JSON.stringify(payload)
          }
        );
      } else {
        response = await adminApiRequest(
          '/api/admin/buildings',
          {
            method: 'POST',
            body: JSON.stringify(payload)
          }
        );
      }

      const updatedBuilding = response.data;

      if (editingBuilding) {
        setBuildings((current) =>
          current.map((building) =>
            building.id === updatedBuilding.id
              ? updatedBuilding
              : building
          )
        );

        setSuccess(
          'Building updated successfully.'
        );
      } else {
        setBuildings((current) => [
          ...current,
          updatedBuilding
        ]);

        setSuccess(
          'Building created successfully.'
        );
      }

      closeForm();
    } catch (err) {
      setError(
        err.message ||
        'Failed to save building.'
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleStatus(building) {
    clearMessages();

    if (!isSuperAdmin) {
      setError(
        'Only Super Admin can change building status.'
      );
      return;
    }

    const nextStatus = !building.is_active;

    const confirmed = window.confirm(
      `${nextStatus ? 'Activate' : 'Deactivate'} "${building.name_en}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setSaving(true);

      const response = await adminApiRequest(
        `/api/admin/buildings/${building.id}/status`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            is_active: nextStatus
          })
        }
      );

      const updatedBuilding =
        response.data;

      setBuildings((current) =>
        current.map((item) =>
          item.id === updatedBuilding.id
            ? updatedBuilding
            : item
        )
      );

      setSuccess(
        `Building ${
          nextStatus
            ? 'activated'
            : 'deactivated'
        } successfully.`
      );
    } catch (err) {
      setError(
        err.message ||
        'Failed to change building status.'
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 px-8 py-6">
          <p className="text-slate-600">
            Loading buildings...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Buildings
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Manage your buildings and building information.
              </p>
            </div>

            {isSuperAdmin && (
              <button
                type="button"
                onClick={openCreateForm}
                className="px-5 py-3 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 transition"
              >
                + Add Building
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Messages */}
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

        {/* Role information */}
        <div className="mb-6 bg-white border border-slate-200 rounded-2xl p-5">
          <p className="text-sm text-slate-500">
            Signed in as
          </p>

          <p className="mt-1 font-semibold text-slate-900">
            {admin?.full_name || 'Admin'}
          </p>

          <p className="mt-1 text-sm text-slate-500 capitalize">
            {admin?.role
              ? admin.role.replace(/_/g, ' ')
              : 'Admin'}
          </p>
        </div>

        {/* Buildings */}
        {buildings.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
            <h2 className="text-xl font-semibold text-slate-900">
              No buildings found
            </h2>

            <p className="mt-2 text-slate-500">
              There are currently no buildings available for this account.
            </p>

            {isSuperAdmin && (
              <button
                type="button"
                onClick={openCreateForm}
                className="mt-6 px-5 py-3 rounded-xl bg-slate-900 text-white font-semibold"
              >
                Add your first building
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {buildings.map((building) => (
              <article
                key={building.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm"
              >
                {/* Title row */}
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="text-xl font-bold text-slate-900">
                      {building.name_en}
                    </h2>

                    {building.address_en && (
                      <p className="mt-2 text-sm text-slate-500">
                        {building.address_en}
                      </p>
                    )}
                  </div>

                  <span
                    className={`shrink-0 px-3 py-1 rounded-full text-xs font-semibold ${
                      building.is_active
                        ? 'bg-green-100 text-green-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {building.is_active
                      ? 'Active'
                      : 'Inactive'}
                  </span>
                </div>

                {/* Details */}
                <div className="mt-6 grid grid-cols-2 gap-4">
                  <DetailBox
                    label="Floors"
                    value={
                      building.total_floors ??
                      '—'
                    }
                  />

                  <DetailBox
                    label="Phone"
                    value={
                      building.phone || '—'
                    }
                  />

                  <DetailBox
                    label="Opening"
                    value={
                      building.opening_time ||
                      '—'
                    }
                  />

                  <DetailBox
                    label="Closing"
                    value={
                      building.closing_time ||
                      '—'
                    }
                  />
                </div>

                {/* Actions */}
                <div className="mt-6 flex flex-wrap gap-3">
                  {(isSuperAdmin ||
                    isBuildingManager) && (
                    <button
                      type="button"
                      onClick={() =>
                        openEditForm(building)
                      }
                      className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition"
                    >
                      Edit
                    </button>
                  )}

                  {isSuperAdmin && (
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() =>
                        handleToggleStatus(
                          building
                        )
                      }
                      className={`px-4 py-2 rounded-xl font-medium transition ${
                        building.is_active
                          ? 'border border-red-200 text-red-700 hover:bg-red-50'
                          : 'border border-green-200 text-green-700 hover:bg-green-50'
                      }`}
                    >
                      {building.is_active
                        ? 'Deactivate'
                        : 'Activate'}
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      {/* Create / Edit modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl">
            {/* Modal header */}
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {editingBuilding
                    ? 'Edit Building'
                    : 'Add Building'}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {editingBuilding
                    ? 'Update the building information.'
                    : 'Create a new building.'}
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                className="text-slate-500 hover:text-slate-900 text-2xl"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {/* Form */}
            <form
              onSubmit={handleSubmit}
              className="p-6 space-y-8"
            >
              {/* Basic information */}
              <FormSection title="Basic Information">
                <InputField
                  label="Building name (English)"
                  name="name_en"
                  value={form.name_en}
                  onChange={handleChange}
                  required
                />

                <InputField
                  label="Building name (Amharic)"
                  name="name_am"
                  value={form.name_am}
                  onChange={handleChange}
                />

                <InputField
                  label="Building name (Afaan Oromoo)"
                  name="name_om"
                  value={form.name_om}
                  onChange={handleChange}
                />
              </FormSection>

              {/* Address */}
              <FormSection title="Address">
                <InputField
                  label="Address (English)"
                  name="address_en"
                  value={form.address_en}
                  onChange={handleChange}
                />

                <InputField
                  label="Address (Amharic)"
                  name="address_am"
                  value={form.address_am}
                  onChange={handleChange}
                />

                <InputField
                  label="Address (Afaan Oromoo)"
                  name="address_om"
                  value={form.address_om}
                  onChange={handleChange}
                />
              </FormSection>

              {/* Description */}
              <FormSection title="Description">
                <TextAreaField
                  label="Description (English)"
                  name="description_en"
                  value={form.description_en}
                  onChange={handleChange}
                />

                <TextAreaField
                  label="Description (Amharic)"
                  name="description_am"
                  value={form.description_am}
                  onChange={handleChange}
                />

                <TextAreaField
                  label="Description (Afaan Oromoo)"
                  name="description_om"
                  value={form.description_om}
                  onChange={handleChange}
                />
              </FormSection>

              {/* Contact */}
              <FormSection title="Contact">
                <InputField
                  label="Phone"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  type="tel"
                />

                <InputField
                  label="Email"
                  name="emil"
                  value={form.emil}
                  onChange={handleChange}
                  type="email"
                />
              </FormSection>

              {/* Operations */}
              <FormSection title="Operations">
                <InputField
                  label="Total floors"
                  name="total_floors"
                  value={form.total_floors}
                  onChange={handleChange}
                  type="number"
                  min="0"
                />

                <InputField
                  label="Opening time"
                  name="opening_time"
                  value={form.opening_time}
                  onChange={handleChange}
                  type="time"
                />

                <InputField
                  label="Closing time"
                  name="closing_time"
                  value={form.closing_time}
                  onChange={handleChange}
                  type="time"
                />

                {isSuperAdmin && (
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={form.is_active}
                      onChange={handleChange}
                      className="w-4 h-4"
                    />

                    <span className="text-sm font-medium text-slate-700">
                      Building is active
                    </span>
                  </label>
                )}
              </FormSection>

              {/* Buttons */}
              <div className="flex justify-end gap-3 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  className="px-5 py-3 rounded-xl border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-3 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 disabled:opacity-50 transition"
                >
                  {saving
                    ? 'Saving...'
                    : editingBuilding
                      ? 'Save Changes'
                      : 'Create Building'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function FormSection({
  title,
  children
}) {
  return (
    <section>
      <h3 className="text-lg font-semibold text-slate-900 mb-4">
        {title}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {children}
      </div>
    </section>
  );
}

function InputField({
  label,
  name,
  value,
  onChange,
  type = 'text',
  required = false,
  min
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
        min={min}
        className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 outline-none focus:ring-2 focus:ring-slate-900"
      />
    </div>
  );
}

function TextAreaField({
  label,
  name,
  value,
  onChange
}) {
  return (
    <div className="md:col-span-2">
      <label
        htmlFor={name}
        className="block text-sm font-medium text-slate-700 mb-2"
      >
        {label}
      </label>

      <textarea
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        rows={4}
        className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 outline-none focus:ring-2 focus:ring-slate-900 resize-y"
      />
    </div>
  );
}

function DetailBox({
  label,
  value
}) {
  return (
    <div className="bg-slate-50 rounded-xl p-4">
      <p className="text-xs text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold text-slate-900 break-words">
        {value}
      </p>
    </div>
  );
}

export default BuildingsPage;