const { createClient } = require('@supabase/supabase-js');

const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL;

const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY;

// Separate client used ONLY for verifying the user's JWT.
// This prevents auth operations from changing the server DB client's auth context.
const authSupabase = createClient(
  supabaseUrl,
  supabaseServiceKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  }
);

async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (
      !authHeader ||
      !authHeader.startsWith('Bearer ')
    ) {
      return res.status(401).json({
        error: 'Authentication required'
      });
    }

    const token = authHeader
      .split(' ')
      .slice(1)
      .join(' ')
      .trim();

    if (!token) {
      return res.status(401).json({
        error: 'Authentication required'
      });
    }

    // Verify JWT using the separate auth client.
    const {
      data: { user },
      error: authError
    } = await authSupabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({
        error: 'Authentication required'
      });
    }

    // Use a fresh database client for the admins lookup.
    const {
      data: adminRecord,
      error: adminError
    } = await authSupabase
      .from('admins')
      .select(
        'id, building_id, role, full_name, is_active'
      )
      .eq('id', user.id)
      .single();

    if (
      adminError ||
      !adminRecord ||
      !adminRecord.is_active
    ) {
      return res.status(403).json({
        error: 'Admin access required'
      });
    }

    // Attach only trusted information from the database.
    req.admin = {
      id: adminRecord.id,
      full_name: adminRecord.full_name,
      role: adminRecord.role,
      building_id: adminRecord.building_id,
      is_active: adminRecord.is_active
    };

    req.user = user;

    next();

  } catch (err) {
    console.error('Authentication middleware error:', err);

    return res.status(401).json({
      error: 'Authentication required'
    });
  }
}

module.exports = {
  authMiddleware
};