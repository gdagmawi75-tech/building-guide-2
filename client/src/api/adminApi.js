import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY;

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  'http://localhost:3000';

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

export async function adminApiRequest(
  endpoint,
  options = {}
) {
  const {
    data: { session },
    error: sessionError
  } = await supabase.auth.getSession();

  if (sessionError || !session) {
    throw new Error(
      'Authentication required'
    );
  }

  const token =
    session.access_token;

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
    ...(options.headers || {})
  };

  const url =
    endpoint.startsWith('http')
      ? endpoint
      : `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers
  });

  const contentType =
    response.headers.get(
      'content-type'
    ) || '';

  let data = {};

  if (
    contentType.includes(
      'application/json'
    )
  ) {
    data = await response.json()
      .catch(() => ({}));
  } else {
    const text =
      await response.text()
        .catch(() => '');

    console.error(
      'Non-JSON API response:',
      text
    );

    throw new Error(
      `API returned a non-JSON response (${response.status})`
    );
  }

  if (response.status === 401) {
    throw new Error(
      data.error ||
      'Authentication required'
    );
  }

  if (response.status === 403) {
    throw new Error(
      data.error ||
      'Admin access required'
    );
  }

  if (!response.ok) {
    throw new Error(
      data.error ||
      data.message ||
      'Request failed'
    );
  }

  return data;
}

// --------------------------------------------------
// CURRENT ADMIN
// --------------------------------------------------

export async function getAdminMe() {
  return adminApiRequest(
    '/api/admin/auth/me'
  );
}

// --------------------------------------------------
// ANNOUNCEMENTS
// --------------------------------------------------

// GET all announcements
export async function getAdminAnnouncements(
  params = {}
) {
  const searchParams =
    new URLSearchParams();

  if (params.building_id) {
    searchParams.set(
      'building_id',
      params.building_id
    );
  }

  if (params.priority) {
    searchParams.set(
      'priority',
      params.priority
    );
  }

  if (
    params.is_active !== undefined &&
    params.is_active !== null
  ) {
    searchParams.set(
      'is_active',
      String(params.is_active)
    );
  }

  const query =
    searchParams.toString();

  return adminApiRequest(
    `/api/admin/announcements${
      query ? `?${query}` : ''
    }`
  );
}

// GET one announcement
export async function getAdminAnnouncementById(
  id
) {
  return adminApiRequest(
    `/api/admin/announcements/${id}`
  );
}

// CREATE announcement
export async function createAdminAnnouncement(
  announcement
) {
  return adminApiRequest(
    '/api/admin/announcements',
    {
      method: 'POST',
      body: JSON.stringify(
        announcement
      )
    }
  );
}

// UPDATE announcement
export async function updateAdminAnnouncement(
  id,
  announcement
) {
  return adminApiRequest(
    `/api/admin/announcements/${id}`,
    {
      method: 'PUT',
      body: JSON.stringify(
        announcement
      )
    }
  );
}

// UPDATE active status
export async function updateAdminAnnouncementStatus(
  id,
  is_active
) {
  return adminApiRequest(
    `/api/admin/announcements/${id}/status`,
    {
      method: 'PATCH',
      body: JSON.stringify({
        is_active
      })
    }
  );
}

// DELETE announcement
export async function deleteAdminAnnouncement(
  id
) {
  return adminApiRequest(
    `/api/admin/announcements/${id}`,
    {
      method: 'DELETE'
    }
  );
}// --------------------------------------------------
// FEEDBACK
// --------------------------------------------------

// GET all feedback
export async function getAdminFeedback(
  params = {}
) {
  const searchParams =
    new URLSearchParams();

  if (params.status) {
    searchParams.set(
      'status',
      params.status
    );
  }

  if (params.rating) {
    searchParams.set(
      'rating',
      String(params.rating)
    );
  }

  if (params.floor_id) {
    searchParams.set(
      'floor_id',
      params.floor_id
    );
  }

  if (params.office_id) {
    searchParams.set(
      'office_id',
      params.office_id
    );
  }

  if (params.service_id) {
    searchParams.set(
      'service_id',
      params.service_id
    );
  }

  if (params.from) {
    searchParams.set(
      'from',
      params.from
    );
  }

  if (params.to) {
    searchParams.set(
      'to',
      params.to
    );
  }

  const query =
    searchParams.toString();

  return adminApiRequest(
    `/api/admin/feedback${
      query
        ? `?${query}`
        : ''
    }`
  );
}

// GET one feedback item
export async function getAdminFeedbackById(
  id
) {
  return adminApiRequest(
    `/api/admin/feedback/${id}`
  );
}

// UPDATE feedback status
export async function updateAdminFeedbackStatus(
  id,
  status
) {
  return adminApiRequest(
    `/api/admin/feedback/${id}/status`,
    {
      method: 'PATCH',
      body: JSON.stringify({
        status
      })
    }
  );
}