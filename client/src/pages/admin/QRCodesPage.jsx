import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { adminApiRequest } from '../../api/adminApi';
import {
  getPublicAppOrigin,
  toPublicAppUrl
} from '../../utils/publicAppUrl';

const LOCATION_TYPES = [
  {
    value: 'entrance',
    label: 'Entrance'
  },
  {
    value: 'reception',
    label: 'Reception'
  },
  {
    value: 'floor',
    label: 'Floor'
  },
  {
    value: 'elevator',
    label: 'Elevator'
  },
  {
    value: 'staircase',
    label: 'Staircase'
  },
  {
    value: 'other',
    label: 'Other'
  }
];

const EMPTY_FORM = {
  building_id: '',
  floor_id: '',
  qr_code: '',
  location_type: 'entrance',
  label_en: '',
  label_am: '',
  label_om: '',
  is_active: true
};

function QRCodesPage() {
  const [qrCodes, setQrCodes] = useState([]);
  const [qrImages, setQrImages] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    ...EMPTY_FORM
  });

  function createQRCodeToken() {
    if (
      typeof crypto !== 'undefined' &&
      typeof crypto.randomUUID === 'function'
    ) {
      return crypto.randomUUID();
    }

    return (
      'qr-' +
      Date.now() +
      '-' +
      Math.random()
        .toString(36)
        .slice(2, 10)
    );
  }

  function getVisitorPath() {
    const buildingId =
      form.building_id.trim();

    const floorId =
      form.floor_id.trim();

    if (!buildingId) {
      return '';
    }

    if (floorId) {
      return `/floor/${floorId}`;
    }

    return `/building/${buildingId}`;
  }

  function getVisitorUrl() {
    const path =
      getVisitorPath();
    const origin =
      getPublicAppOrigin();

    if (!path || !origin) {
      return '';
    }

    return origin + path;
  }

  function buildQRCodeUrl(existingValue = '') {
    const path =
      getVisitorPath();
    const origin =
      getPublicAppOrigin();

    if (!path || !origin) {
      return '';
    }

    let token = '';

    try {
      if (existingValue) {
        const existingUrl =
          new URL(
            existingValue,
            origin
          );

        token =
          existingUrl.searchParams.get(
            'qr'
          ) || '';
      }
    } catch {
      token = '';
    }

    if (!token) {
      token =
        createQRCodeToken();
    }

    return (
      origin +
      path +
      `?qr=${encodeURIComponent(token)}`
    );
  }

  async function loadQRCodes() {
    try {
      setLoading(true);
      setError('');

      const response =
        await adminApiRequest(
          '/api/admin/qr-codes'
        );

      const data = Array.isArray(
        response?.data
      )
        ? response.data
        : [];

      setQrCodes(data);

      const generatedImages = {};

      for (
        const qrCode of data
      ) {
        if (!qrCode.qr_code) {
          continue;
        }

        try {
          const image =
            await QRCode.toDataURL(
              toPublicAppUrl(
                qrCode.qr_code
              ),
              {
                width: 220,
                margin: 2,
                errorCorrectionLevel:
                  'M'
              }
            );

          generatedImages[
            qrCode.id
          ] = image;
        } catch (imageError) {
          console.error(
            'Failed to generate QR image:',
            imageError
          );
        }
      }

      setQrImages(
        generatedImages
      );
    } catch (err) {
      console.error(
        'Failed to load QR codes:',
        err
      );

      setError(
        err?.message ||
          'Failed to load QR codes.'
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadQRCodes();
  }, []);

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

  function openCreateForm() {
    setEditingId(null);

    setForm({
      ...EMPTY_FORM
    });

    setError('');
    setSuccess('');
    setShowForm(true);
  }

  function openEditForm(qrCode) {
    setEditingId(qrCode.id);

    setForm({
      building_id:
        qrCode.building_id || '',
      floor_id:
        qrCode.floor_id || '',
      qr_code:
        qrCode.qr_code || '',
      location_type:
        qrCode.location_type ||
        'entrance',
      label_en:
        qrCode.label_en || '',
      label_am:
        qrCode.label_am || '',
      label_om:
        qrCode.label_om || '',
      is_active:
        qrCode.is_active !== false
    });

    setError('');
    setSuccess('');
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);

    setForm({
      ...EMPTY_FORM
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError('');
    setSuccess('');

    if (
      !form.building_id.trim()
    ) {
      setError(
        'Building ID is required.'
      );
      return;
    }

    if (
      form.location_type ===
        'floor' &&
      !form.floor_id.trim()
    ) {
      setError(
        'Floor ID is required for a floor QR code.'
      );
      return;
    }

    try {
      setSaving(true);

      const qrCodeUrl =
        buildQRCodeUrl(
          editingId
            ? form.qr_code
            : ''
        );

      if (!qrCodeUrl) {
        setError(
          'Could not generate the visitor URL.'
        );
        return;
      }

      const body = {
        building_id:
          form.building_id.trim(),

        floor_id:
          form.floor_id.trim()
            ? form.floor_id.trim()
            : null,

        qr_code:
          qrCodeUrl,

        location_type:
          form.location_type,

        label_en:
          form.label_en.trim()
            ? form.label_en.trim()
            : null,

        label_am:
          form.label_am.trim()
            ? form.label_am.trim()
            : null,

        label_om:
          form.label_om.trim()
            ? form.label_om.trim()
            : null,

        is_active:
          form.is_active
      };

      if (editingId) {
        await adminApiRequest(
          `/api/admin/qr-codes/${editingId}`,
          {
            method: 'PUT',
            body: JSON.stringify(body)
          }
        );

        setSuccess(
          'QR code updated successfully.'
        );
      } else {
        await adminApiRequest(
          '/api/admin/qr-codes',
          {
            method: 'POST',
            body: JSON.stringify(body)
          }
        );

        setSuccess(
          'QR code created successfully.'
        );
      }

      closeForm();
      await loadQRCodes();
    } catch (err) {
      console.error(
        'Failed to save QR code:',
        err
      );

      setError(
        err?.message ||
          'Failed to save QR code.'
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleStatus(qrCode) {
    try {
      setError('');
      setSuccess('');

      await adminApiRequest(
        `/api/admin/qr-codes/${qrCode.id}/status`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            is_active:
              !qrCode.is_active
          })
        }
      );

      setSuccess(
        qrCode.is_active
          ? 'QR code deactivated successfully.'
          : 'QR code activated successfully.'
      );

      await loadQRCodes();
    } catch (err) {
      console.error(
        'Failed to update QR code status:',
        err
      );

      setError(
        err?.message ||
          'Failed to update QR code status.'
      );
    }
  }

  async function handleDelete(qrCode) {
    const name =
      qrCode.label_en ||
      qrCode.qr_code ||
      'this QR code';

    const confirmed =
      window.confirm(
        `Delete "${name}"?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setError('');
      setSuccess('');

      await adminApiRequest(
        `/api/admin/qr-codes/${qrCode.id}`,
        {
          method: 'DELETE'
        }
      );

      setSuccess(
        'QR code deleted successfully.'
      );

      await loadQRCodes();
    } catch (err) {
      console.error(
        'Failed to delete QR code:',
        err
      );

      setError(
        err?.message ||
          'Failed to delete QR code.'
      );
    }
  }

  function downloadQRCode(qrCode) {
    const image =
      qrImages[qrCode.id];

    if (!image) {
      setError(
        'QR image is not ready yet.'
      );
      return;
    }

    const link =
      document.createElement('a');

    link.href = image;

    link.download =
      `${
        qrCode.label_en ||
        'building-guide-qr'
      }.png`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function getLocationLabel(
    locationType
  ) {
    const location =
      LOCATION_TYPES.find(
        (item) =>
          item.value === locationType
      );

    return (
      location?.label ||
      locationType ||
      'Unknown'
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            QR Codes
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage QR access points around the building.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateForm}
          className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Create QR Code
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      )}

      {showForm && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-lg font-semibold text-slate-900">
            {editingId
              ? 'Edit QR Code'
              : 'Create QR Code'}
          </h2>

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <label
                  htmlFor="building_id"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Building ID
                </label>

                <input
                  id="building_id"
                  name="building_id"
                  type="text"
                  value={
                    form.building_id
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Building UUID"
                  required
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
                />
              </div>

              <div>
                <label
                  htmlFor="floor_id"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Floor ID
                </label>

                <input
                  id="floor_id"
                  name="floor_id"
                  type="text"
                  value={
                    form.floor_id
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Optional floor UUID"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
                />
              </div>

              <div>
                <label
                  htmlFor="qr_code"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Visitor URL
                </label>

                <input
                  id="qr_code"
                  name="qr_code"
                  type="text"
                  value={
                    getVisitorUrl()
                  }
                  readOnly
                  placeholder="Enter building ID to generate URL"
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-600"
                />

                <p className="mt-1 text-xs text-slate-500">
                  Encoded into the QR code. Set VITE_PUBLIC_APP_URL to your Vercel URL so scans always open production.
                </p>
              </div>

              <div>
                <label
                  htmlFor="location_type"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Location Type
                </label>

                <select
                  id="location_type"
                  name="location_type"
                  value={
                    form.location_type
                  }
                  onChange={
                    handleChange
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm"
                >
                  {LOCATION_TYPES.map(
                    (location) => (
                      <option
                        key={
                          location.value
                        }
                        value={
                          location.value
                        }
                      >
                        {location.label}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div>
                <label
                  htmlFor="label_en"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  English Label
                </label>

                <input
                  id="label_en"
                  name="label_en"
                  type="text"
                  value={
                    form.label_en
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Main Entrance"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
                />
              </div>

              <div>
                <label
                  htmlFor="label_am"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Amharic Label
                </label>

                <input
                  id="label_am"
                  name="label_am"
                  type="text"
                  value={
                    form.label_am
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="ዋና መግቢያ"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
                />
              </div>

              <div>
                <label
                  htmlFor="label_om"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Afaan Oromoo Label
                </label>

                <input
                  id="label_om"
                  name="label_om"
                  type="text"
                  value={
                    form.label_om
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Seensa Guddaa"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
                />
              </div>

              <div className="flex items-center">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={
                      form.is_active
                    }
                    onChange={
                      handleChange
                    }
                  />

                  Active
                </label>
              </div>
            </div>

            <div className="flex gap-3 border-t border-slate-100 pt-5">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {saving
                  ? 'Saving...'
                  : editingId
                    ? 'Update QR Code'
                    : 'Create QR Code'}
              </button>

              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">
            QR Code Directory
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {qrCodes.length} QR code
            {qrCodes.length === 1
              ? ''
              : 's'}
          </p>
        </div>

        {loading ? (
          <div className="px-6 py-12 text-center text-sm text-slate-500">
            Loading QR codes...
          </div>
        ) : qrCodes.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm text-slate-500">
              No QR codes found.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 p-6 lg:grid-cols-2">
            {qrCodes.map((qrCode) => (
              <div
                key={qrCode.id}
                className="rounded-2xl border border-slate-200 p-5"
              >
                <div className="flex flex-col gap-5 sm:flex-row">
                  <div className="flex h-40 w-40 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white p-2">
                    {qrImages[qrCode.id] ? (
                      <img
                        src={
                          qrImages[qrCode.id]
                        }
                        alt="QR code"
                        className="h-full w-full"
                      />
                    ) : (
                      <span className="text-xs text-slate-400">
                        Generating...
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">
                          {qrCode.label_en ||
                            qrCode.label_am ||
                            qrCode.label_om ||
                            'Unnamed QR Code'}
                        </h3>

                        <p className="mt-1 text-sm text-slate-500">
                          {getLocationLabel(
                            qrCode.location_type
                          )}
                        </p>
                      </div>

                      <span
                        className={
                          qrCode.is_active
                            ? 'rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700'
                            : 'rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600'
                        }
                      >
                        {qrCode.is_active
                          ? 'Active'
                          : 'Inactive'}
                      </span>
                    </div>

                    <div className="mt-4 space-y-2 text-sm">
                      <p>
                        <span className="font-medium text-slate-700">
                          QR URL:
                        </span>{' '}
                        <span className="break-all text-slate-500">
                          {toPublicAppUrl(
                            qrCode.qr_code
                          )}
                        </span>
                      </p>

                      <p>
                        <span className="font-medium text-slate-700">
                          Scans:
                        </span>{' '}
                        <span className="text-slate-500">
                          {qrCode.scan_count || 0}
                        </span>
                      </p>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          downloadQRCode(
                            qrCode
                          )
                        }
                        className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                      >
                        Download QR
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          openEditForm(
                            qrCode
                          )
                        }
                        className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleStatus(
                            qrCode
                          )
                        }
                        className={
                          qrCode.is_active
                            ? 'rounded-lg bg-yellow-100 px-3 py-2 text-xs font-semibold text-yellow-700 hover:bg-yellow-200'
                            : 'rounded-lg bg-green-100 px-3 py-2 text-xs font-semibold text-green-700 hover:bg-green-200'
                        }
                      >
                        {qrCode.is_active
                          ? 'Deactivate'
                          : 'Activate'}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleDelete(
                            qrCode
                          )
                        }
                        className="rounded-lg bg-red-100 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-200"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default QRCodesPage;