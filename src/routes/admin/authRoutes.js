const express = require('express');
const { createClient } = require('@supabase/supabase-js');

const {
  authMiddleware
} = require('../../middleware/authMiddleware');

const router = express.Router();

const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL;

const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY;

// Separate Supabase client used only for authentication.
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


// POST /api/admin/auth/login
router.post('/login', async (req, res) => {
  try {
    const {
      email,
      password
    } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required.'
      });
    }

    const {
      data,
      error
    } = await authSupabase.auth.signInWithPassword({
      email,
      password
    });

    if (
      error ||
      !data?.session ||
      !data?.user
    ) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password.'
      });
    }

    return res.json({
      success: true,
      message: 'Login successful.',
      access_token: data.session.access_token,
      user: {
        id: data.user.id,
        email: data.user.email
      }
    });

  } catch (err) {
    console.error(
      'Admin login error:',
      err
    );

    return res.status(500).json({
      success: false,
      error: 'Internal server error.'
    });
  }
});


// GET /api/admin/auth/me
router.get(
  '/me',
  authMiddleware,
  (req, res) => {
    return res.json({
      authenticated: true,
      admin: {
        id: req.admin.id,
        full_name: req.admin.full_name,
        role: req.admin.role,
        building_id: req.admin.building_id
      }
    });
  }
);


module.exports = router;