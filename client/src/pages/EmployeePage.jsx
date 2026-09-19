import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getEmployeeById } from '../api/api';
import Header from '../components/Header';
import FloatingHelp from '../components/FloatingHelp';

export default function EmployeePage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchEmployee() {
      try {
        setLoading(true);
        setError(null);

        const res = await getEmployeeById(id);

        if (!isMounted) return;

        if (res && res.success && res.data) {
          setEmployee(res.data);
        } else {
          setError('Employee not found.');
        }
      } catch (err) {
        console.error('Error loading employee:', err);

        if (isMounted) {
          setError('Failed to load employee details.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchEmployee();

    return () => {
      isMounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <>
        <Header />

        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="flex items-center space-x-2 text-indigo-600">
            <div className="w-6 h-6 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="font-medium">
              Loading Employee...
            </span>
          </div>
        </div>

        <FloatingHelp />
      </>
    );
  }

  if (error || !employee) {
    return (
      <>
        <Header />

        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Employee Not Found
          </h2>

          <p className="text-gray-600 mb-6">
            {error || 'The requested employee does not exist or is unavailable.'}
          </p>

          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700 transition"
          >
            Go Back
          </button>
        </div>

        <FloatingHelp />
      </>
    );
  }

  const fullName = [
    employee.first_name,
    employee.middle_name,
    employee.last_name
  ]
    .filter(Boolean)
    .join(' ');

  const position = employee.position_en || 'Employee';

  const buildingName =
    employee.building?.name_en ||
    employee.office?.building?.name_en ||
    'Building information unavailable';

  const floorName =
    employee.floor?.name_en ||
    employee.office?.floors?.name_en ||
    null;

  const floorNumber =
    employee.floor?.floor_number ??
    employee.office?.floors?.floor_number ??
    null;

  const officeNumber =
    employee.office?.office_number || null;

  const officeName =
    employee.office?.name_en || null;

  const departmentName =
    employee.department?.name_en ||
    employee.departments?.name_en ||
    null;

  return (
    <>
      <Header />

      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">

          {/* Back */}
          <button
            onClick={() => navigate(-1)}
            className="mb-6 inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800"
          >
            ← Back
          </button>

          {/* Main Card */}
          <div className="bg-white shadow rounded-lg overflow-hidden p-6 sm:p-8">

            {/* Employee Header */}
            <div className="text-center border-b border-gray-200 pb-6 mb-6">

              {/* Initials */}
              <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-indigo-100 flex items-center justify-center">
                <span className="text-2xl font-bold text-indigo-600">
                  {employee.first_name?.charAt(0)}
                  {employee.last_name?.charAt(0)}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                {fullName}
              </h1>

              <p className="mt-2 text-lg font-semibold text-indigo-600">
                {position}
              </p>

              {departmentName && (
                <p className="mt-1 text-gray-600">
                  Department: {departmentName}
                </p>
              )}
            </div>

            {/* Location & Office */}
            <div className="border-t border-gray-100 pt-6">

              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Location & Office
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                {/* Building */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <span className="block text-gray-500 text-xs mb-1">
                    Building
                  </span>

                  <span className="font-medium text-gray-800">
                    {buildingName}
                  </span>
                </div>

                {/* Floor */}
                {floorNumber !== null && (
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <span className="block text-gray-500 text-xs mb-1">
                      Floor
                    </span>

                    <span className="font-medium text-gray-800">
                      {floorName
                        ? `Floor ${floorNumber} — ${floorName}`
                        : `Floor ${floorNumber}`}
                    </span>
                  </div>
                )}

                {/* Office */}
                {officeNumber && (
                  <Link
                    to={`/office/${employee.office_id}`}
                    className="sm:col-span-2 bg-gray-50 p-4 rounded-lg border border-gray-200 hover:bg-indigo-50 hover:border-indigo-200 transition"
                  >
                    <span className="block text-gray-500 text-xs mb-1">
                      Office Room
                    </span>

                    <span className="font-medium text-indigo-600">
                      {officeName || `Suite ${officeNumber}`}
                    </span>
                  </Link>
                )}

              </div>
            </div>

            {/* Contact */}
            {(employee.phone || employee.email) && (
              <div className="border-t border-gray-200 mt-6 pt-6">

                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Contact
                </h2>

                <div className="space-y-3">

                  {employee.phone && (
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <span className="block text-gray-500 text-xs mb-1">
                        Phone
                      </span>

                      <a
                        href={`tel:${employee.phone}`}
                        className="font-medium text-indigo-600 hover:underline"
                      >
                        {employee.phone}
                      </a>
                    </div>
                  )}

                  {employee.email && (
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <span className="block text-gray-500 text-xs mb-1">
                        Email
                      </span>

                      <a
                        href={`mailto:${employee.email}`}
                        className="font-medium text-indigo-600 hover:underline"
                      >
                        {employee.email}
                      </a>
                    </div>
                  )}

                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      <FloatingHelp />
    </>
  );
}