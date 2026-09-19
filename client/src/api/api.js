import axios from 'axios';

const API_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ================================
// Buildings
// ================================

export const getBuildings = async () => {
  const response = await api.get('/buildings');
  return response.data.data;
};

export const getBuildingById = async (id) => {
  const response = await api.get(`/buildings/${id}`);
  return response.data.data;
};

// ================================
// Floors
// ================================

export const getFloorsByBuildingId = async (buildingId) => {
  const response = await api.get(
    `/floors?building_id=${buildingId}`
  );

  return response.data.data;
};

// ================================
// Offices
// ================================

export const getOfficesByFloorId = async (floorId) => {
  const response = await api.get(
    `/offices?floor_id=${floorId}`
  );

  return response.data.data;
};

export const getOfficeById = async (id) => {
  const response = await api.get(`/offices/${id}`);
  return response.data.data;
};

// ================================
// Departments
// ================================

export const getDepartmentById = async (id) => {
  const response = await api.get(`/departments/${id}`);
  return response.data;
};

// ================================
// Services
// ================================

export const getServiceById = async (id) => {
  const response = await api.get(`/services/${id}`);
  return response.data;
};

// ================================
// Employees
// ================================

export const getEmployeeById = async (id) => {
  const response = await api.get(`/employees/${id}`);
  return response.data;
};

// ================================
// Facilities
// ================================

export const getFacilityById = async (id) => {
  const response = await api.get(`/facilities/${id}`);
  return response.data;
};

// ================================
// Announcements
// ================================

export const getAnnouncementsByBuildingId = async (buildingId) => {
  const response = await api.get(
    `/announcements?building_id=${buildingId}`
  );

  return response.data.data;
};

// ================================
// Feedback
// ================================

export const submitFeedback = async (feedbackData) => {
  const response = await api.post('/feedback', feedbackData);

  return response.data;
};

export default api;