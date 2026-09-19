import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Visitor pages
import HomePage from './pages/HomePage';
import BuildingPage from './pages/BuildingPage';
import FloorPage from './pages/FloorPage';
import VisitorOfficePage from './pages/VisitorOfficePage';
import DepartmentPage from './pages/DepartmentPage';
import ServicePage from './pages/ServicePage';
import EmployeePage from './pages/EmployeePage';
import FacilityPage from './pages/FacilityPage';
import CustomerFeedbackPage from './pages/CustomerFeedbackPage';

// Admin pages
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import BuildingsPage from './pages/admin/BuildingsPage';
import FloorsPage from './pages/admin/FloorsPage';
import OfficesPage from './pages/admin/OfficesPage';
import DepartmentsPage from './pages/admin/DepartmentsPage';
import ServicesPage from './pages/admin/ServicesPage';
import EmployeesPage from './pages/admin/EmployeesPage';
import FacilitiesPage from './pages/admin/FacilitiesPage';
import OpeningHoursPage from './pages/admin/OpeningHoursPage';
import AnnouncementsPage from './pages/admin/AnnouncementsPage';
import FeedbackPage from './pages/admin/FeedbackPage';
import QRCodesPage from './pages/admin/QRCodesPage';
import AnalyticsPage from './pages/admin/AnalyticsPage';
import ProtectedAdminRoute from './pages/admin/ProtectedAdminRoute';

function App() {
return ( <BrowserRouter> <Routes>

    {/* Visitor routes */}

    <Route
      path="/"
      element={<HomePage />}
    />

    <Route
      path="/building/:id"
      element={<BuildingPage />}
    />

    <Route
      path="/building/:id/floors"
      element={<FloorPage />}
    />

    <Route
      path="/floor/:id"
      element={<FloorPage />}
    />

    <Route
      path="/office/:id"
      element={<VisitorOfficePage />}
    />

    <Route
      path="/department/:id"
      element={<DepartmentPage />}
    />

    <Route
      path="/service/:id"
      element={<ServicePage />}
    />

    <Route
      path="/employee/:id"
      element={<EmployeePage />}
    />

    <Route
      path="/facility/:id"
      element={<FacilityPage />}
    />

    <Route
      path="/feedback"
      element={<CustomerFeedbackPage />}
    />

    {/* Admin login */}

    <Route
      path="/admin/login"
      element={<AdminLogin />}
    />

    {/* Admin dashboard */}

    <Route
      path="/admin"
      element={
        <ProtectedAdminRoute>
          <AdminDashboard />
        </ProtectedAdminRoute>
      }
    />

    {/* Admin buildings */}

    <Route
      path="/admin/buildings"
      element={
        <ProtectedAdminRoute>
          <BuildingsPage />
        </ProtectedAdminRoute>
      }
    />

    {/* Admin floors */}

    <Route
      path="/admin/floors"
      element={
        <ProtectedAdminRoute>
          <FloorsPage />
        </ProtectedAdminRoute>
      }
    />

    {/* Admin offices */}

    <Route
      path="/admin/offices"
      element={
        <ProtectedAdminRoute>
          <OfficesPage />
        </ProtectedAdminRoute>
      }
    />

    {/* Admin departments */}

    <Route
      path="/admin/departments"
      element={
        <ProtectedAdminRoute>
          <DepartmentsPage />
        </ProtectedAdminRoute>
      }
    />

    {/* Admin services */}

    <Route
      path="/admin/services"
      element={
        <ProtectedAdminRoute>
          <ServicesPage />
        </ProtectedAdminRoute>
      }
    />

    {/* Admin employees */}

    <Route
      path="/admin/employees"
      element={
        <ProtectedAdminRoute>
          <EmployeesPage />
        </ProtectedAdminRoute>
      }
    />

    {/* Admin facilities */}

    <Route
      path="/admin/facilities"
      element={
        <ProtectedAdminRoute>
          <FacilitiesPage />
        </ProtectedAdminRoute>
      }
    />

    {/* Admin opening hours */}

    <Route
      path="/admin/opening-hours"
      element={
        <ProtectedAdminRoute>
          <OpeningHoursPage />
        </ProtectedAdminRoute>
      }
    />

    {/* Admin announcements */}

    <Route
      path="/admin/announcements"
      element={
        <ProtectedAdminRoute>
          <AnnouncementsPage />
        </ProtectedAdminRoute>
      }
    />

    {/* Admin feedback */}

    <Route
      path="/admin/feedback"
      element={
        <ProtectedAdminRoute>
          <FeedbackPage />
        </ProtectedAdminRoute>
      }
    />

    <Route
      path="/admin/qr-codes"
      element={
        <ProtectedAdminRoute>
          <QRCodesPage />
        </ProtectedAdminRoute>
      }
    />

    <Route
      path="/admin/analytics"
      element={
        <ProtectedAdminRoute>
          <AnalyticsPage />
        </ProtectedAdminRoute>
      }
    />

  </Routes>
</BrowserRouter>

);
}

export default App;
