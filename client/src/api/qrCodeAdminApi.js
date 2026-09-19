import { adminApiRequest } from './adminApi';

export async function getAdminQRCodes(params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, value);
    }
  });

  const queryString = query.toString();

  return adminApiRequest(
    `/api/admin/qr-codes${queryString ? `?${queryString}` : ''}`
  );
}

export async function getAdminQRCodeById(id) {
  return adminApiRequest(`/api/admin/qr-codes/${id}`);
}

export async function createAdminQRCode(qrCode) {
  return adminApiRequest('/api/admin/qr-codes', {
    method: 'POST',
    body: JSON.stringify(qrCode)
  });
}

export async function updateAdminQRCode(id, qrCode) {
  return adminApiRequest(`/api/admin/qr-codes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(qrCode)
  });
}

export async function updateAdminQRCodeStatus(id, isActive) {
  return adminApiRequest(`/api/admin/qr-codes/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({
      is_active: isActive
    })
  });
}

export async function deleteAdminQRCode(id) {
  return adminApiRequest(`/api/admin/qr-codes/${id}`, {
    method: 'DELETE'
  });
}