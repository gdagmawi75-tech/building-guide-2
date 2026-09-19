import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminApiRequest, getAdminMe } from "../../api/adminApi";

function OfficePage() {
  const navigate = useNavigate();

  const [offices, setOffices] = useState([]);
  const [floors, setFloors] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [departments, setDepartments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingOffice, setEditingOffice] = useState(null);

  const [form, setForm] = useState({
    building_id: "",
    floor_id: "",
    department_id: "",
    office_number: "",
    name_en: "",
    name_am: "",
    name_om: "",
    description_en: "",
    description_am: "",
    description_om: "",
    phone: "",
    email: "",
    status: "open",
    is_public: true,
    is_active: true,
  });

  const [selectedBuilding, setSelectedBuilding] = useState("");

  useEffect(() => {
    loadPage();
  }, []);

  async function loadPage() {
    try {
      setLoading(true);
      setError("");

      const [
        adminData,
        officesData,
        floorsData,
        buildingsData,
        departmentsData,
      ] = await Promise.all([
        getAdminMe(),
        adminApiRequest("/api/admin/offices"),
        adminApiRequest("/api/admin/floors"),
        adminApiRequest("/api/admin/buildings"),
        adminApiRequest("/api/admin/departments"),
      ]);

      console.log("Admin:", adminData);
      console.log("Offices:", officesData);
      console.log("Floors:", floorsData);
      console.log("Buildings:", buildingsData);
      console.log("Departments:", departmentsData);

      setOffices(
        officesData?.data ||
          officesData?.offices ||
          officesData ||
          []
      );

      setFloors(
        floorsData?.data ||
          floorsData?.floors ||
          floorsData ||
          []
      );

      setBuildings(
        buildingsData?.data ||
          buildingsData?.buildings ||
          buildingsData ||
          []
      );

      setDepartments(
        departmentsData?.data ||
          departmentsData?.departments ||
          departmentsData ||
          []
      );
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load offices.");
    } finally {
      setLoading(false);
    }
  }

  function openAddModal() {
    setEditingOffice(null);

    setForm({
      building_id: "",
      floor_id: "",
      department_id: "",
      office_number: "",
      name_en: "",
      name_am: "",
      name_om: "",
      description_en: "",
      description_am: "",
      description_om: "",
      phone: "",
      email: "",
      status: "open",
      is_public: true,
      is_active: true,
    });

    setShowModal(true);
  }

  function openEditModal(office) {
    setEditingOffice(office);

    setForm({
      building_id: office.building_id || "",
      floor_id: office.floor_id || "",
      department_id: office.department_id || "",
      office_number: office.office_number || "",
      name_en: office.name_en || "",
      name_am: office.name_am || "",
      name_om: office.name_om || "",
      description_en: office.description_en || "",
      description_am: office.description_am || "",
      description_om: office.description_om || "",
      phone: office.phone || "",
      email: office.email || "",
      status: office.status || "open",
      is_public:
        typeof office.is_public === "boolean"
          ? office.is_public
          : true,
      is_active:
        typeof office.is_active === "boolean"
          ? office.is_active
          : true,
    });

    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingOffice(null);
  }

  function handleChange(event) {
    const { name, value, type, checked } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setError("");

      const payload = {
        ...form,
      };

      if (editingOffice) {
        await adminApiRequest(
          `/api/admin/offices/${editingOffice.id}`,
          {
            method: "PUT",
            body: JSON.stringify(payload),
          }
        );
      } else {
        await adminApiRequest("/api/admin/offices", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }

      closeModal();
      await loadPage();
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to save office.");
    }
  }

  async function toggleStatus(office) {
    const newStatus =
      office.status === "open" ? "closed" : "open";

    try {
      await adminApiRequest(
        `/api/admin/offices/${office.id}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({
            status: newStatus,
          }),
        }
      );

      await loadPage();
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to update office status.");
    }
  }

  async function toggleActive(office) {
    try {
      await adminApiRequest(
        `/api/admin/offices/${office.id}`,
        {
          method: "PUT",
          body: JSON.stringify({
            is_active: !office.is_active,
          }),
        }
      );

      await loadPage();
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to update office.");
    }
  }

  function getBuildingName(buildingId) {
    const building = buildings.find(
      (item) => item.id === buildingId
    );

    return (
      building?.name_en ||
      building?.name ||
      "Unknown building"
    );
  }

  function getFloorName(floorId) {
    const floor = floors.find(
      (item) => item.id === floorId
    );

    return (
      floor?.name_en ||
      floor?.name ||
      floor?.floor_name ||
      "Unknown floor"
    );
  }

  function getDepartmentName(departmentId) {
    const department = departments.find(
      (item) => item.id === departmentId
    );

    return (
      department?.name_en ||
      department?.name ||
      "No department"
    );
  }

  const filteredFloors = floors.filter(
    (floor) =>
      !form.building_id ||
      floor.building_id === form.building_id
  );

  const filteredDepartments = departments.filter(
    (department) =>
      !form.building_id ||
      department.building_id === form.building_id
  );

  const visibleOffices = offices.filter((office) => {
    if (!selectedBuilding) return true;

    return office.building_id === selectedBuilding;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-gray-600">Loading offices...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <button
              onClick={() => navigate("/admin")}
              className="text-sm text-blue-600 hover:underline mb-2"
            >
              ← Back to Dashboard
            </button>

            <h1 className="text-3xl font-bold text-gray-900">
              Offices
            </h1>

            <p className="text-gray-600 mt-1">
              Manage offices inside your buildings.
            </p>
          </div>

          <button
            onClick={openAddModal}
            className="bg-blue-600 text-white px-5 py-3 rounded-lg hover:bg-blue-700"
          >
            + Add Office
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {/* Filter */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filter by building
          </label>

          <select
            value={selectedBuilding}
            onChange={(event) =>
              setSelectedBuilding(event.target.value)
            }
            className="w-full md:w-80 border border-gray-300 rounded-lg px-3 py-2"
          >
            <option value="">All buildings</option>

            {buildings.map((building) => (
              <option key={building.id} value={building.id}>
                {building.name_en || building.name}
              </option>
            ))}
          </select>
        </div>

        {/* Offices table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">
              {visibleOffices.length} office
              {visibleOffices.length !== 1 ? "s" : ""}
            </h2>
          </div>

          {visibleOffices.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No offices found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-6 py-3 text-sm font-semibold text-gray-700">
                      Office
                    </th>
                    <th className="text-left px-6 py-3 text-sm font-semibold text-gray-700">
                      Building
                    </th>
                    <th className="text-left px-6 py-3 text-sm font-semibold text-gray-700">
                      Floor
                    </th>
                    <th className="text-left px-6 py-3 text-sm font-semibold text-gray-700">
                      Department
                    </th>
                    <th className="text-left px-6 py-3 text-sm font-semibold text-gray-700">
                      Status
                    </th>
                    <th className="text-left px-6 py-3 text-sm font-semibold text-gray-700">
                      Active
                    </th>
                    <th className="text-right px-6 py-3 text-sm font-semibold text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200">
                  {visibleOffices.map((office) => (
                    <tr key={office.id}>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900">
                          {office.office_number}
                        </div>

                        <div className="text-sm text-gray-500">
                          {office.name_en || "Unnamed office"}
                        </div>
                      </td>

                      <td className="px-6 py-4 text-sm text-gray-700">
                        {getBuildingName(office.building_id)}
                      </td>

                      <td className="px-6 py-4 text-sm text-gray-700">
                        {getFloorName(office.floor_id)}
                      </td>

                      <td className="px-6 py-4 text-sm text-gray-700">
                        {getDepartmentName(
                          office.department_id
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                            office.status === "open"
                              ? "bg-green-100 text-green-700"
                              : office.status === "closed"
                              ? "bg-red-100 text-red-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {office.status ||
                            "temporarily_unavailable"}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                            office.is_active
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {office.is_active
                            ? "Active"
                            : "Inactive"}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() =>
                              openEditModal(office)
                            }
                            className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                          >
                            Edit
                          </button>

                          <button
                            onClick={() =>
                              toggleStatus(office)
                            }
                            className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                          >
                            {office.status === "open"
                              ? "Close"
                              : "Open"}
                          </button>

                          <button
                            onClick={() =>
                              toggleActive(office)
                            }
                            className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                          >
                            {office.is_active
                              ? "Deactivate"
                              : "Activate"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-xl font-bold text-gray-900">
                {editingOffice
                  ? "Edit Office"
                  : "Add Office"}
              </h2>

              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-800 text-2xl"
              >
                ×
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="p-6 space-y-6"
            >
              {/* Location */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">
                  Location
                </h3>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
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

                      {buildings.map((building) => (
                        <option
                          key={building.id}
                          value={building.id}
                        >
                          {building.name_en || building.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Floor *
                    </label>

                    <select
                      name="floor_id"
                      value={form.floor_id}
                      onChange={handleChange}
                      required
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    >
                      <option value="">
                        Select floor
                      </option>

                      {filteredFloors.map((floor) => (
                        <option
                          key={floor.id}
                          value={floor.id}
                        >
                          {floor.name_en ||
                            floor.name ||
                            floor.floor_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
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
                              department.name}
                          </option>
                        )
                      )}
                    </select>
                  </div>
                </div>
              </div>

              {/* Basic information */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">
                  Office Information
                </h3>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Office Number *
                    </label>

                    <input
                      type="text"
                      name="office_number"
                      value={form.office_number}
                      onChange={handleChange}
                      required
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      placeholder="101"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Status
                    </label>

                    <select
                      name="status"
                      value={form.status}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    >
                      <option value="open">Open</option>
                      <option value="closed">Closed</option>
                      <option value="temporarily_unavailable">
                        Temporarily unavailable
                      </option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Multilingual names */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">
                  Office Name
                </h3>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
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
                    <label className="block text-sm font-medium mb-1">
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
                    <label className="block text-sm font-medium mb-1">
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
              </div>

              {/* Description */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">
                  Description
                </h3>

                <div className="grid md:grid-cols-3 gap-4">
                  <textarea
                    name="description_en"
                    value={form.description_en}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="English"
                  />

                  <textarea
                    name="description_am"
                    value={form.description_am}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="Amharic"
                  />

                  <textarea
                    name="description_om"
                    value={form.description_om}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="Afaan Oromoo"
                  />
                </div>
              </div>

              {/* Contact */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">
                  Contact
                </h3>

                <div className="grid md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="Phone"
                  />

                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="Email"
                  />
                </div>
              </div>

              {/* Settings */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">
                  Settings
                </h3>

                <div className="flex flex-col gap-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="is_public"
                      checked={form.is_public}
                      onChange={handleChange}
                    />
                    <span className="text-sm">
                      Publicly visible
                    </span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={form.is_active}
                      onChange={handleChange}
                    />
                    <span className="text-sm">
                      Active
                    </span>
                  </label>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-5 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingOffice
                    ? "Save Changes"
                    : "Create Office"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default OfficePage;