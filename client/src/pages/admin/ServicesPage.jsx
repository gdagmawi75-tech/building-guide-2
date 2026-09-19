import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApiRequest } from '../../api/adminApi';

function ServicesPage() {
  const navigate = useNavigate();

  const [services, setServices] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [offices, setOffices] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState(null);

  const [selectedBuilding, setSelectedBuilding] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');

  const [form, setForm] = useState({
    building_id: '',
    department_id: '',
    office_id: '',
    name_en: '',
    name_am: '',
    name_om: '',
    description_en: '',
    description_am: '',
    description_om: '',
    requirements_en: '',
    requirements_am: '',
    requirements_om: '',
    fees_en: '',
    fees_am: '',
    fees_om: '',
    processing_info_en: '',
    processing_info_am: '',
    processing_info_om: '',
    phone: '',
    email: '',
    status: 'open',
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
        servicesResponse,
        buildingsResponse,
        departmentsResponse,
        officesResponse
      ] = await Promise.all([
        adminApiRequest('/api/admin/services'),
        adminApiRequest('/api/admin/buildings'),
        adminApiRequest('/api/admin/departments'),
        adminApiRequest('/api/admin/offices')
      ]);

      const services =
        servicesResponse?.services ||
        servicesResponse?.data ||
        servicesResponse ||
        [];

      const buildings =
        buildingsResponse?.buildings ||
        buildingsResponse?.data ||
        buildingsResponse ||
        [];

      const departments =
        departmentsResponse?.departments ||
        departmentsResponse?.data ||
        departmentsResponse ||
        [];

      const offices =
        officesResponse?.offices ||
        officesResponse?.data ||
        officesResponse ||
        [];

      setServices(
        Array.isArray(services)
          ? services
          : []
      );

      setBuildings(
        Array.isArray(buildings)
          ? buildings
          : []
      );

      setDepartments(
        Array.isArray(departments)
          ? departments
          : []
      );

      setOffices(
        Array.isArray(offices)
          ? offices
          : []
      );
    } catch (err) {
      console.error(
        'Failed to load services:',
        err
      );

      setError(
        err.message ||
        'Failed to load services.'
      );
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setForm({
      building_id: '',
      department_id: '',
      office_id: '',
      name_en: '',
      name_am: '',
      name_om: '',
      description_en: '',
      description_am: '',
      description_om: '',
      requirements_en: '',
      requirements_am: '',
      requirements_om: '',
      fees_en: '',
      fees_am: '',
      fees_om: '',
      processing_info_en: '',
      processing_info_am: '',
      processing_info_om: '',
      phone: '',
      email: '',
      status: 'open',
      is_public: true,
      is_active: true
    });
  }

  function openAddModal() {
    setEditingService(null);
    resetForm();
    setShowModal(true);
  }

  function openEditModal(service) {
    setEditingService(service);

    setForm({
      building_id:
        service.building_id || '',

      department_id:
        service.department_id || '',

      office_id:
        service.office_id || '',

      name_en:
        service.name_en || '',

      name_am:
        service.name_am || '',

      name_om:
        service.name_om || '',

      description_en:
        service.description_en || '',

      description_am:
        service.description_am || '',

      description_om:
        service.description_om || '',

      requirements_en:
        service.requirements_en || '',

      requirements_am:
        service.requirements_am || '',

      requirements_om:
        service.requirements_om || '',

      fees_en:
        service.fees_en || '',

      fees_am:
        service.fees_am || '',

      fees_om:
        service.fees_om || '',

      processing_info_en:
        service.processing_info_en || '',

      processing_info_am:
        service.processing_info_am || '',

      processing_info_om:
        service.processing_info_om || '',

      phone:
        service.phone || '',

      email:
        service.email || '',

      status:
        service.status || 'open',

      is_public:
        typeof service.is_public === 'boolean'
          ? service.is_public
          : true,

      is_active:
        typeof service.is_active === 'boolean'
          ? service.is_active
          : true
    });

    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingService(null);
    resetForm();
  }

  function handleChange(event) {
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
        department_id: '',
        office_id: ''
      }));

      return;
    }

    if (name === 'department_id') {
      setForm((previous) => ({
        ...previous,
        department_id: value,
        office_id: ''
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
          'English service name is required.'
        );
        return;
      }

      const payload = {
        building_id:
          form.building_id,

        department_id:
          form.department_id || null,

        office_id:
          form.office_id || null,

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

        requirements_en:
          form.requirements_en.trim() || null,

        requirements_am:
          form.requirements_am.trim() || null,

        requirements_om:
          form.requirements_om.trim() || null,

        fees_en:
          form.fees_en.trim() || null,

        fees_am:
          form.fees_am.trim() || null,

        fees_om:
          form.fees_om.trim() || null,

        processing_info_en:
          form.processing_info_en.trim() ||
          null,

        processing_info_am:
          form.processing_info_am.trim() ||
          null,

        processing_info_om:
          form.processing_info_om.trim() ||
          null,

        phone:
          form.phone.trim() || null,

        email:
          form.email.trim() || null,

        status:
          form.status,

        is_public:
          form.is_public,

        is_active:
          form.is_active
      };

      if (editingService) {
        await adminApiRequest(
          `/api/admin/services/${editingService.id}`,
          {
            method: 'PUT',
            body: JSON.stringify(payload)
          }
        );
      } else {
        await adminApiRequest(
          '/api/admin/services',
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
        'Failed to save service:',
        err
      );

      setError(
        err.message ||
        'Failed to save service.'
      );
    }
  }

  async function changeServiceStatus(
    service,
    status
  ) {
    try {
      setError('');

      await adminApiRequest(
        `/api/admin/services/${service.id}/status`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            status
          })
        }
      );

      await loadPage();
    } catch (err) {
      console.error(
        'Failed to change service status:',
        err
      );

      setError(
        err.message ||
        'Failed to change service status.'
      );
    }
  }

  async function toggleActive(service) {
    try {
      setError('');

      await adminApiRequest(
        `/api/admin/services/${service.id}`,
        {
          method: 'PUT',
          body: JSON.stringify({
            is_active:
              !service.is_active
          })
        }
      );

      await loadPage();
    } catch (err) {
      console.error(
        'Failed to update service:',
        err
      );

      setError(
        err.message ||
        'Failed to update service.'
      );
    }
  }

  function getBuildingName(
    buildingId
  ) {
    const building =
      buildings.find(
        (item) =>
          item.id === buildingId
      );

    return (
      building?.name_en ||
      building?.name ||
      'Unknown building'
    );
  }

  function getDepartmentName(
    departmentId
  ) {
    if (!departmentId) {
      return 'No department';
    }

    const department =
      departments.find(
        (item) =>
          item.id === departmentId
      );

    return (
      department?.name_en ||
      department?.name ||
      'Unknown department'
    );
  }

  function getOfficeName(officeId) {
    if (!officeId) {
      return 'No office';
    }

    const office =
      offices.find(
        (item) =>
          item.id === officeId
      );

    if (!office) {
      return 'Unknown office';
    }

    return `${office.office_number || ''} ${
      office.name_en || ''
    }`.trim();
  }

  const visibleServices =
    services.filter((service) => {
      if (
        selectedBuilding &&
        service.building_id !==
          selectedBuilding
      ) {
        return false;
      }

      if (
        selectedDepartment &&
        service.department_id !==
          selectedDepartment
      ) {
        return false;
      }

      return true;
    });

  const filteredDepartments =
    departments.filter(
      (department) => {
        if (!form.building_id) {
          return true;
        }

        return (
          department.building_id ===
          form.building_id
        );
      }
    );

  const filteredOffices =
    offices.filter((office) => {
      if (
        form.building_id &&
        office.building_id !==
          form.building_id
      ) {
        return false;
      }

      if (
        form.department_id &&
        office.department_id !==
          form.department_id
      ) {
        return false;
      }

      return true;
    });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">

          <div className="text-xl font-semibold text-gray-800">
            Loading services...
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
              type="button"
              onClick={() =>
                navigate('/admin')
              }
              className="text-sm text-blue-600 hover:underline mb-3"
            >
              ← Back to Dashboard
            </button>

            <h1 className="text-3xl font-bold text-gray-900">
              Services
            </h1>

            <p className="text-gray-600 mt-1">
              Manage services, requirements, fees and status.
            </p>

          </div>

          <button
            type="button"
            onClick={openAddModal}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-3 rounded-lg"
          >
            + Add Service
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

        {/* Filters */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6 shadow-sm">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by building
              </label>

              <select
                value={selectedBuilding}
                onChange={(event) => {
                  setSelectedBuilding(
                    event.target.value
                  );
                  setSelectedDepartment('');
                }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white"
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by department
              </label>

              <select
                value={selectedDepartment}
                onChange={(event) =>
                  setSelectedDepartment(
                    event.target.value
                  )
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white"
              >

                <option value="">
                  All departments
                </option>

                {departments
                  .filter(
                    (department) =>
                      !selectedBuilding ||
                      department.building_id ===
                        selectedBuilding
                  )
                  .map(
                    (department) => (
                      <option
                        key={department.id}
                        value={department.id}
                      >
                        {department.name_en ||
                          department.name ||
                          'Unnamed department'}
                      </option>
                    )
                  )}

              </select>
            </div>

          </div>

        </div>

        {/* Services Table */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">

          <div className="px-6 py-4 border-b border-gray-200">

            <h2 className="font-semibold text-gray-900">
              {visibleServices.length}{' '}
              service
              {visibleServices.length === 1
                ? ''
                : 's'}
            </h2>

          </div>

          {visibleServices.length === 0 ? (

            <div className="p-10 text-center">

              <div className="text-gray-500">
                No services found.
              </div>

              <div className="text-sm text-gray-400 mt-2">
                There are currently no services available for this account.
              </div>

            </div>

          ) : (

            <div className="overflow-x-auto">

              <table className="w-full">

                <thead className="bg-gray-50">

                  <tr>

                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">
                      Service
                    </th>

                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">
                      Department
                    </th>

                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">
                      Office
                    </th>

                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">
                      Status
                    </th>

                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">
                      Public
                    </th>

                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">
                      Active
                    </th>

                    <th className="text-right px-6 py-4 text-sm font-semibold text-gray-700">
                      Actions
                    </th>

                  </tr>

                </thead>

                <tbody className="divide-y divide-gray-200">

                  {visibleServices.map(
                    (service) => (

                      <tr
                        key={service.id}
                        className="hover:bg-gray-50"
                      >

                        <td className="px-6 py-4">

                          <div className="font-semibold text-gray-900">
                            {service.name_en}
                          </div>

                          {service.name_am && (
                            <div className="text-sm text-gray-500 mt-1">
                              {service.name_am}
                            </div>
                          )}

                        </td>

                        <td className="px-6 py-4 text-sm text-gray-700">
                          {getDepartmentName(
                            service.department_id
                          )}
                        </td>

                        <td className="px-6 py-4 text-sm text-gray-700">
                          {getOfficeName(
                            service.office_id
                          )}
                        </td>

                        <td className="px-6 py-4">

                          <span
                            className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                              service.status === 'open'
                                ? 'bg-green-100 text-green-700'
                                : service.status === 'closed'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-yellow-100 text-yellow-700'
                            }`}
                          >
                            {service.status === 'open'
                              ? 'Open'
                              : service.status === 'closed'
                              ? 'Closed'
                              : 'Temporarily unavailable'}
                          </span>

                        </td>

                        <td className="px-6 py-4">

                          <span
                            className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                              service.is_public
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {service.is_public
                              ? 'Public'
                              : 'Private'}
                          </span>

                        </td>

                        <td className="px-6 py-4">

                          <span
                            className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                              service.is_active
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {service.is_active
                              ? 'Active'
                              : 'Inactive'}
                          </span>

                        </td>

                        <td className="px-6 py-4">

                          <div className="flex flex-wrap justify-end gap-2">

                            <button
                              type="button"
                              onClick={() =>
                                openEditModal(
                                  service
                                )
                              }
                              className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                              Edit
                            </button>

                            {service.status === 'open' ? (

                              <button
                                type="button"
                                onClick={() =>
                                  changeServiceStatus(
                                    service,
                                    'closed'
                                  )
                                }
                                className="px-3 py-2 text-sm border border-red-200 text-red-600 rounded-lg hover:bg-red-50"
                              >
                                Close
                              </button>

                            ) : (

                              <button
                                type="button"
                                onClick={() =>
                                  changeServiceStatus(
                                    service,
                                    'open'
                                  )
                                }
                                className="px-3 py-2 text-sm border border-green-200 text-green-600 rounded-lg hover:bg-green-50"
                              >
                                Open
                              </button>

                            )}

                            <button
                              type="button"
                              onClick={() =>
                                toggleActive(
                                  service
                                )
                              }
                              className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                              {service.is_active
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

          <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl max-h-[92vh] overflow-y-auto">

            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200">

              <div>

                <h2 className="text-xl font-bold text-gray-900">
                  {editingService
                    ? 'Edit Service'
                    : 'Add Service'}
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  Add complete visitor-facing service information.
                </p>

              </div>

              <button
                type="button"
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

              {/* Location */}
              <section>

                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Location
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                  <div>

                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Building *
                    </label>

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

                  </div>

                  <div>

                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Department
                    </label>

                    <select
                      name="department_id"
                      value={form.department_id}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    >

                      <option value="">
                        No department
                      </option>

                      {filteredDepartments.map(
                        (department) => (
                          <option
                            key={department.id}
                            value={department.id}
                          >
                            {department.name_en ||
                              department.name ||
                              'Unnamed department'}
                          </option>
                        )
                      )}

                    </select>

                  </div>

                  <div>

                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Office
                    </label>

                    <select
                      name="office_id"
                      value={form.office_id}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    >

                      <option value="">
                        No office
                      </option>

                      {filteredOffices.map(
                        (office) => (
                          <option
                            key={office.id}
                            value={office.id}
                          >
                            {office.office_number ||
                              ''}{' '}
                            {office.name_en ||
                              ''}
                          </option>
                        )
                      )}

                    </select>

                  </div>

                </div>

              </section>

              {/* Basic Information */}
              <section>

                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Service Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  <div>

                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>

                    <select
                      name="status"
                      value={form.status}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    >

                      <option value="open">
                        Open
                      </option>

                      <option value="closed">
                        Closed
                      </option>

                      <option value="temporarily_unavailable">
                        Temporarily unavailable
                      </option>

                    </select>

                  </div>

                </div>

              </section>

              {/* Names */}
              <section>

                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Service Name
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

                  <textarea
                    name="description_en"
                    value={form.description_en}
                    onChange={handleChange}
                    rows="4"
                    placeholder="English description"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />

                  <textarea
                    name="description_am"
                    value={form.description_am}
                    onChange={handleChange}
                    rows="4"
                    placeholder="Amharic description"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />

                  <textarea
                    name="description_om"
                    value={form.description_om}
                    onChange={handleChange}
                    rows="4"
                    placeholder="Afaan Oromoo description"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />

                </div>

              </section>

              {/* Requirements */}
              <section>

                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Requirements
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                  <textarea
                    name="requirements_en"
                    value={form.requirements_en}
                    onChange={handleChange}
                    rows="5"
                    placeholder="English requirements"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />

                  <textarea
                    name="requirements_am"
                    value={form.requirements_am}
                    onChange={handleChange}
                    rows="5"
                    placeholder="Amharic requirements"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />

                  <textarea
                    name="requirements_om"
                    value={form.requirements_om}
                    onChange={handleChange}
                    rows="5"
                    placeholder="Afaan Oromoo requirements"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />

                </div>

              </section>

              {/* Fees */}
              <section>

                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Fees
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                  <textarea
                    name="fees_en"
                    value={form.fees_en}
                    onChange={handleChange}
                    rows="3"
                    placeholder="English fee information"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />

                  <textarea
                    name="fees_am"
                    value={form.fees_am}
                    onChange={handleChange}
                    rows="3"
                    placeholder="Amharic fee information"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />

                  <textarea
                    name="fees_om"
                    value={form.fees_om}
                    onChange={handleChange}
                    rows="3"
                    placeholder="Afaan Oromoo fee information"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />

                </div>

              </section>

              {/* Processing Information */}
              <section>

                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Processing Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                  <textarea
                    name="processing_info_en"
                    value={form.processing_info_en}
                    onChange={handleChange}
                    rows="4"
                    placeholder="English processing information"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />

                  <textarea
                    name="processing_info_am"
                    value={form.processing_info_am}
                    onChange={handleChange}
                    rows="4"
                    placeholder="Amharic processing information"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />

                  <textarea
                    name="processing_info_om"
                    value={form.processing_info_om}
                    onChange={handleChange}
                    rows="4"
                    placeholder="Afaan Oromoo processing information"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />

                </div>

              </section>

              {/* Contact */}
              <section>

                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Contact
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  <input
                    type="text"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="Phone"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />

                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="Email"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />

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
                  {editingService
                    ? 'Save Changes'
                    : 'Create Service'}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}

export default ServicesPage;