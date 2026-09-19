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

function EmployeesPage() {
  const navigate = useNavigate();

  const [admin, setAdmin] = useState(null);

  const [employees, setEmployees] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [offices, setOffices] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [buildingFilter, setBuildingFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] =
    useState('');
  const [officeFilter, setOfficeFilter] =
    useState('');

  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] =
    useState(null);

  const [form, setForm] = useState({
    building_id: '',
    department_id: '',
    office_id: '',
    first_name: '',
    middle_name: '',
    last_name: '',
    position_en: '',
    position_am: '',
    position_om: '',
    phone: '',
    email: '',
    is_public: false,
    is_active: true
  });

  // --------------------------------------------------
  // HELPERS
  // --------------------------------------------------

  function clearMessages() {
    setError('');
    setSuccess('');
  }

  function getEmployeeName(employee) {
    return [
      employee.first_name,
      employee.middle_name,
      employee.last_name
    ]
      .filter(Boolean)
      .join(' ');
  }

  function getDepartmentName(department) {
    return (
      department?.name_en ||
      department?.name_am ||
      department?.name_om ||
      'No department'
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
      'No office'
    );
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

  // --------------------------------------------------
  // NORMALIZE API ARRAY RESPONSE
  // --------------------------------------------------

  function getArrayFromResponse(response, key) {
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
    try {
      const response = await getAdminMe();

      const currentAdmin =
        response?.admin ||
        response?.user ||
        response?.data ||
        response;

      setAdmin(currentAdmin);
    } catch (err) {
      console.error(
        'Failed to load admin information:',
        err
      );

      throw err;
    }
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
  // LOAD DEPARTMENTS
  // --------------------------------------------------

  async function loadDepartments() {
    const response =
      await adminApiRequest(
        '/api/admin/departments'
      );

    const departmentList =
      getArrayFromResponse(
        response,
        'departments'
      );

    setDepartments(departmentList);

    return departmentList;
  }

  // --------------------------------------------------
  // LOAD OFFICES
  // --------------------------------------------------

  async function loadOffices() {
    const response =
      await adminApiRequest(
        '/api/admin/offices'
      );

    const officeList =
      getArrayFromResponse(
        response,
        'offices'
      );

    setOffices(officeList);

    return officeList;
  }

  // --------------------------------------------------
  // LOAD EMPLOYEES
  // --------------------------------------------------

  async function loadEmployees(
    customBuildingFilter = buildingFilter,
    customDepartmentFilter = departmentFilter,
    customOfficeFilter = officeFilter
  ) {
    const params =
      new URLSearchParams();

    if (customBuildingFilter) {
      params.set(
        'building_id',
        customBuildingFilter
      );
    }

    if (customDepartmentFilter) {
      params.set(
        'department_id',
        customDepartmentFilter
      );
    }

    if (customOfficeFilter) {
      params.set(
        'office_id',
        customOfficeFilter
      );
    }

    const queryString =
      params.toString();

    const endpoint =
      queryString
        ? `/api/admin/employees?${queryString}`
        : '/api/admin/employees';

    const response =
      await adminApiRequest(endpoint);

    const employeeList =
      getArrayFromResponse(
        response,
        'employees'
      );

    setEmployees(employeeList);

    return employeeList;
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
          loadDepartments(),
          loadOffices()
        ]);

        await loadEmployees();
      } catch (err) {
        console.error(
          'Failed to initialize Employees page:',
          err
        );

        setError(
          err.message ||
            'Failed to load employee management data.'
        );
      } finally {
        setLoading(false);
      }
    }

    initialize();
  }, []);

  // --------------------------------------------------
  // RELOAD EMPLOYEES WHEN FILTERS CHANGE
  // --------------------------------------------------

  useEffect(() => {
    if (loading) {
      return;
    }

    async function reloadEmployees() {
      try {
        clearMessages();

        await loadEmployees(
          buildingFilter,
          departmentFilter,
          officeFilter
        );
      } catch (err) {
        console.error(
          'Failed to reload employees:',
          err
        );

        setError(
          err.message ||
            'Failed to load employees.'
        );
      }
    }

    reloadEmployees();
  }, [
    buildingFilter,
    departmentFilter,
    officeFilter
  ]);

  // --------------------------------------------------
  // FILTERED DEPARTMENTS
  // --------------------------------------------------

  const filteredDepartments =
    useMemo(() => {
      if (!form.building_id) {
        return departments;
      }

      return departments.filter(
        (department) =>
          department.building_id ===
          form.building_id
      );
    }, [
      departments,
      form.building_id
    ]);

  // --------------------------------------------------
  // FILTERED OFFICES
  // --------------------------------------------------

  const filteredOffices =
    useMemo(() => {
      let result = offices;

      if (form.building_id) {
        result = result.filter(
          (office) =>
            office.building_id ===
            form.building_id
        );
      }

      if (form.department_id) {
        result = result.filter(
          (office) =>
            office.department_id ===
            form.department_id
        );
      }

      return result;
    }, [
      offices,
      form.building_id,
      form.department_id
    ]);

  // --------------------------------------------------
  // FILTER HANDLERS
  // --------------------------------------------------

  function handleBuildingFilterChange(value) {
    setBuildingFilter(value);
    setDepartmentFilter('');
    setOfficeFilter('');
  }

  function handleDepartmentFilterChange(value) {
    setDepartmentFilter(value);
    setOfficeFilter('');
  }

  // --------------------------------------------------
  // FORM
  // --------------------------------------------------

  function resetForm() {
    setForm({
      building_id:
        buildingFilter || '',
      department_id: '',
      office_id: '',
      first_name: '',
      middle_name: '',
      last_name: '',
      position_en: '',
      position_am: '',
      position_om: '',
      phone: '',
      email: '',
      is_public: false,
      is_active: true
    });
  }

  function openAddModal() {
    clearMessages();

    setEditingEmployee(null);

    resetForm();

    setShowModal(true);
  }

  function openEditModal(employee) {
    clearMessages();

    setEditingEmployee(employee);

    setForm({
      building_id:
        employee.building_id || '',

      department_id:
        employee.department_id || '',

      office_id:
        employee.office_id || '',

      first_name:
        employee.first_name || '',

      middle_name:
        employee.middle_name || '',

      last_name:
        employee.last_name || '',

      position_en:
        employee.position_en || '',

      position_am:
        employee.position_am || '',

      position_om:
        employee.position_om || '',

      phone:
        employee.phone || '',

      email:
        employee.email || '',

      is_public:
        typeof employee.is_public === 'boolean'
          ? employee.is_public
          : false,

      is_active:
        typeof employee.is_active === 'boolean'
          ? employee.is_active
          : true
    });

    setShowModal(true);
  }

  function closeModal() {
    if (saving) {
      return;
    }

    setShowModal(false);

    setEditingEmployee(null);

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

  // --------------------------------------------------
  // SAVE EMPLOYEE
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

    if (!form.first_name.trim()) {
      setError(
        'First name is required.'
      );

      return;
    }

    setSaving(true);

    try {
      const payload = {
        building_id:
          form.building_id,

        department_id:
          form.department_id || null,

        office_id:
          form.office_id || null,

        first_name:
          form.first_name.trim(),

        middle_name:
          form.middle_name.trim() || null,

        last_name:
          form.last_name.trim() || null,

        position_en:
          form.position_en.trim() || null,

        position_am:
          form.position_am.trim() || null,

        position_om:
          form.position_om.trim() || null,

        phone:
          form.phone.trim() || null,

        email:
          form.email.trim() || null,

        is_public:
          Boolean(form.is_public),

        is_active:
          Boolean(form.is_active)
      };

      if (editingEmployee) {
        await adminApiRequest(
          `/api/admin/employees/${editingEmployee.id}`,
          {
            method: 'PUT',
            body: JSON.stringify(payload)
          }
        );

        setSuccess(
          'Employee updated successfully.'
        );
      } else {
        await adminApiRequest(
          '/api/admin/employees',
          {
            method: 'POST',
            body: JSON.stringify(payload)
          }
        );

        setSuccess(
          'Employee created successfully.'
        );
      }

      setShowModal(false);
      setEditingEmployee(null);

      resetForm();

      await loadEmployees();
    } catch (err) {
      console.error(
        'Failed to save employee:',
        err
      );

      setError(
        err.message ||
          'Failed to save employee.'
      );
    } finally {
      setSaving(false);
    }
  }

  // --------------------------------------------------
  // TOGGLE ACTIVE
  // --------------------------------------------------

  async function toggleActive(employee) {
    clearMessages();

    try {
      await adminApiRequest(
        `/api/admin/employees/${employee.id}/status`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            is_active:
              !employee.is_active
          })
        }
      );

      setSuccess(
        employee.is_active
          ? 'Employee deactivated successfully.'
          : 'Employee activated successfully.'
      );

      await loadEmployees();
    } catch (err) {
      console.error(
        'Failed to update employee status:',
        err
      );

      setError(
        err.message ||
          'Failed to update employee status.'
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

  function findDepartment(id) {
    return departments.find(
      (department) =>
        department.id === id
    );
  }

  function findOffice(id) {
    return offices.find(
      (office) =>
        office.id === id
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
            Loading employees...
          </div>

          <div className="text-sm text-gray-500 mt-2">
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
              Employees
            </h1>

            <p className="mt-1 text-gray-600">
              Manage employees, positions,
              departments and office assignments.
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
            + Add Employee
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
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5"
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

            {/* Department */}

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Filter by department
              </label>

              <select
                value={departmentFilter}
                onChange={(event) =>
                  handleDepartmentFilterChange(
                    event.target.value
                  )
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5"
              >
                <option value="">
                  All departments
                </option>

                {departments
                  .filter(
                    (department) =>
                      !buildingFilter ||
                      department.building_id ===
                        buildingFilter
                  )
                  .map(
                    (department) => (
                      <option
                        key={department.id}
                        value={department.id}
                      >
                        {getDepartmentName(
                          department
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
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5"
              >
                <option value="">
                  All offices
                </option>

                {offices
                  .filter(
                    (office) =>
                      (!buildingFilter ||
                        office.building_id ===
                          buildingFilter) &&
                      (!departmentFilter ||
                        office.department_id ===
                          departmentFilter)
                  )
                  .map(
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

          </div>
        </div>

        {/* Count */}

        <div className="mb-4">
          <p className="text-sm text-gray-600">
            {employees.length}{' '}
            {employees.length === 1
              ? 'employee'
              : 'employees'}
          </p>
        </div>

        {/* Table */}

        <div className="overflow-hidden rounded-xl bg-white shadow-sm">

          <div className="overflow-x-auto">

            <table className="min-w-full">

              <thead className="border-b border-gray-200 bg-gray-50">

                <tr>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Employee
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Position
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Department
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Office
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

                {employees.map(
                  (employee) => {

                    const department =
                      findDepartment(
                        employee.department_id
                      );

                    const office =
                      findOffice(
                        employee.office_id
                      );

                    const building =
                      findBuilding(
                        employee.building_id
                      );

                    return (
                      <tr
                        key={employee.id}
                        className="hover:bg-gray-50"
                      >

                        {/* Employee */}

                        <td className="px-4 py-4">

                          <div className="font-semibold text-gray-900">
                            {getEmployeeName(
                              employee
                            )}
                          </div>

                          <div className="mt-1 text-xs text-gray-500">
                            {getBuildingName(
                              building
                            )}
                          </div>

                          {employee.phone && (
                            <div className="mt-1 text-xs text-gray-500">
                              {employee.phone}
                            </div>
                          )}

                        </td>

                        {/* Position */}

                        <td className="px-4 py-4">

                          <div className="text-sm text-gray-800">
                            {employee.position_en ||
                              employee.position_am ||
                              employee.position_om ||
                              'No position'}
                          </div>

                        </td>

                        {/* Department */}

                        <td className="px-4 py-4">

                          <span className="text-sm text-gray-700">
                            {getDepartmentName(
                              department
                            )}
                          </span>

                        </td>

                        {/* Office */}

                        <td className="px-4 py-4">

                          <span className="text-sm text-gray-700">
                            {getOfficeName(
                              office
                            )}
                          </span>

                        </td>

                        {/* Public */}

                        <td className="px-4 py-4">

                          {employee.is_public ? (
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

                          {employee.is_active ? (
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
                                  employee
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
                                  employee
                                )
                              }
                              className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                                employee.is_active
                                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                  : 'bg-green-100 text-green-700 hover:bg-green-200'
                              }`}
                            >
                              {employee.is_active
                                ? 'Deactivate'
                                : 'Activate'}
                            </button>

                          </div>

                        </td>

                      </tr>
                    );
                  }
                )}

                {employees.length === 0 && (
                  <tr>
                    <td
                      colSpan="7"
                      className="px-4 py-12 text-center text-gray-500"
                    >
                      No employees found.
                    </td>
                  </tr>
                )}

              </tbody>

            </table>

          </div>

        </div>

      </div>

      {/* ==================================================
          EMPLOYEE MODAL
      ================================================== */}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

            {/* Modal Header */}

            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">

              <div>

                <h2 className="text-2xl font-bold text-gray-900">
                  {editingEmployee
                    ? 'Edit Employee'
                    : 'Add Employee'}
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Add employee information and
                  assign a department and office.
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

              {/* Organization */}

              <section>

                <h3 className="mb-4 text-lg font-semibold text-gray-900">
                  Organization
                </h3>

                <div className="grid gap-4 md:grid-cols-3">

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

                  {/* Department */}

                  <div>

                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Department
                    </label>

                    <select
                      name="department_id"
                      value={
                        form.department_id
                      }
                      onChange={
                        handleFormChange
                      }
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5"
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
                            {getDepartmentName(
                              department
                            )}
                          </option>
                        )
                      )}

                    </select>

                  </div>

                  {/* Office */}

                  <div>

                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Office
                    </label>

                    <select
                      name="office_id"
                      value={
                        form.office_id
                      }
                      onChange={
                        handleFormChange
                      }
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5"
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
                            {getOfficeName(
                              office
                            )}
                          </option>
                        )
                      )}

                    </select>

                  </div>

                </div>

              </section>

              {/* Personal Information */}

              <section>

                <h3 className="mb-4 text-lg font-semibold text-gray-900">
                  Personal Information
                </h3>

                <div className="grid gap-4 md:grid-cols-3">

                  <div>

                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      First name *
                    </label>

                    <input
                      type="text"
                      name="first_name"
                      value={
                        form.first_name
                      }
                      onChange={
                        handleFormChange
                      }
                      required
                      placeholder="First name"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5"
                    />

                  </div>

                  <div>

                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Middle name
                    </label>

                    <input
                      type="text"
                      name="middle_name"
                      value={
                        form.middle_name
                      }
                      onChange={
                        handleFormChange
                      }
                      placeholder="Middle name"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5"
                    />

                  </div>

                  <div>

                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Last name
                    </label>

                    <input
                      type="text"
                      name="last_name"
                      value={
                        form.last_name
                      }
                      onChange={
                        handleFormChange
                      }
                      placeholder="Last name"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5"
                    />

                  </div>

                </div>

              </section>

              {/* Position */}

              <section>

                <h3 className="mb-4 text-lg font-semibold text-gray-900">
                  Position
                </h3>

                <div className="grid gap-4 md:grid-cols-3">

                  <div>

                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Position — English
                    </label>

                    <input
                      type="text"
                      name="position_en"
                      value={
                        form.position_en
                      }
                      onChange={
                        handleFormChange
                      }
                      placeholder="Finance Officer"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5"
                    />

                  </div>

                  <div>

                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Position — Amharic
                    </label>

                    <input
                      type="text"
                      name="position_am"
                      value={
                        form.position_am
                      }
                      onChange={
                        handleFormChange
                      }
                      placeholder="የስራ መደብ"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5"
                    />

                  </div>

                  <div>

                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Position — Afaan Oromoo
                    </label>

                    <input
                      type="text"
                      name="position_om"
                      value={
                        form.position_om
                      }
                      onChange={
                        handleFormChange
                      }
                      placeholder="Maqaa hojii"
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

                <div className="grid gap-4 md:grid-cols-2">

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

                  <div>

                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Email
                    </label>

                    <input
                      type="email"
                      name="email"
                      value={
                        form.email
                      }
                      onChange={
                        handleFormChange
                      }
                      placeholder="Email address"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5"
                    />

                  </div>

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
                        Public employee
                      </div>

                      <div className="text-xs text-gray-500">
                        Can appear in the
                        visitor-facing directory.
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
                        Active employee
                      </div>

                      <div className="text-xs text-gray-500">
                        Inactive employees are
                        hidden from active results.
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
                    : editingEmployee
                    ? 'Save Changes'
                    : 'Create Employee'}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  );
}

export default EmployeesPage;