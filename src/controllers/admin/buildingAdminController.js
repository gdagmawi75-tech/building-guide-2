const supabase = require('../../config/supabase');

// GET /api/admin/buildings
const getAllBuildings = async (req, res) => {
  try {
    let query = supabase
      .from('buildings')
      .select('*');

    // Non-super-admin users only see their assigned building
    if (
      req.admin &&
      req.admin.role !== 'super_admin' &&
      req.admin.building_id
    ) {
      query = query.eq('id', req.admin.building_id);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return res.status(200).json({
      success: true,
      data
    });
  } catch (err) {
    console.error('Error fetching buildings:', err.message);

    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// GET /api/admin/buildings/:id
const getBuildingById = async (req, res) => {
  try {
    const { id } = req.params;

    // Non-super-admin users can only access their own building
    if (req.admin && req.admin.role !== 'super_admin') {
      if (
        !req.admin.building_id ||
        req.admin.building_id !== id
      ) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this building'
        });
      }
    }

    const { data, error } = await supabase
      .from('buildings')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return res.status(404).json({
        success: false,
        message: 'Building not found'
      });
    }

    return res.status(200).json({
      success: true,
      data
    });
  } catch (err) {
    console.error('Error fetching building:', err.message);

    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// POST /api/admin/buildings
// Super Admin only
const createBuilding = async (req, res) => {
  try {
    if (req.admin.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Only Super Admin can create buildings'
      });
    }

    const {
      name_en,
      name_am,
      name_om,
      address_en,
      address_am,
      address_om,
      description_en,
      description_am,
      description_om,
      phone,
      emil,
      total_floors,
      opening_time,
      closing_time,
      is_active
    } = req.body;

    if (
      !name_en ||
      typeof name_en !== 'string' ||
      name_en.trim() === ''
    ) {
      return res.status(400).json({
        success: false,
        message: 'Required field name_en is missing or invalid'
      });
    }

    if (
      is_active !== undefined &&
      typeof is_active !== 'boolean'
    ) {
      return res.status(400).json({
        success: false,
        message: 'is_active must be a boolean'
      });
    }

    const newBuilding = {
      name_en: name_en.trim(),
      name_am: name_am || null,
      name_om: name_om || null,
      address_en: address_en || null,
      address_am: address_am || null,
      address_om: address_om || null,
      description_en: description_en || null,
      description_am: description_am || null,
      description_om: description_om || null,
      phone: phone || null,
      emil: emil || null,
      total_floors:
        total_floors !== undefined ? total_floors : null,
      opening_time: opening_time || null,
      closing_time: closing_time || null,
      is_active:
        is_active !== undefined ? is_active : true
    };

    const { data, error } = await supabase
      .from('buildings')
      .insert([newBuilding])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return res.status(201).json({
      success: true,
      data
    });
  } catch (err) {
    console.error('Error creating building:', err.message);

    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// PUT /api/admin/buildings/:id
const updateBuilding = async (req, res) => {
  try {
    const { id } = req.params;

    // Non-super-admin users can only update their own building
    if (req.admin.role !== 'super_admin') {
      if (
        !req.admin.building_id ||
        req.admin.building_id !== id
      ) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: Cannot update another building'
        });
      }
    }

    const {
      name_en,
      name_am,
      name_om,
      address_en,
      address_am,
      address_om,
      description_en,
      description_am,
      description_om,
      phone,
      emil,
      total_floors,
      opening_time,
      closing_time,
      is_active
    } = req.body;

    if (
      name_en !== undefined &&
      (
        typeof name_en !== 'string' ||
        name_en.trim() === ''
      )
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid name_en format'
      });
    }

    if (
      is_active !== undefined &&
      typeof is_active !== 'boolean'
    ) {
      return res.status(400).json({
        success: false,
        message: 'is_active must be a boolean'
      });
    }

    const updates = {};

    if (name_en !== undefined) {
      updates.name_en = name_en.trim();
    }

    if (name_am !== undefined) {
      updates.name_am = name_am;
    }

    if (name_om !== undefined) {
      updates.name_om = name_om;
    }

    if (address_en !== undefined) {
      updates.address_en = address_en;
    }

    if (address_am !== undefined) {
      updates.address_am = address_am;
    }

    if (address_om !== undefined) {
      updates.address_om = address_om;
    }

    if (description_en !== undefined) {
      updates.description_en = description_en;
    }

    if (description_am !== undefined) {
      updates.description_am = description_am;
    }

    if (description_om !== undefined) {
      updates.description_om = description_om;
    }

    if (phone !== undefined) {
      updates.phone = phone;
    }

    if (emil !== undefined) {
      updates.emil = emil;
    }

    if (total_floors !== undefined) {
      updates.total_floors = total_floors;
    }

    if (opening_time !== undefined) {
      updates.opening_time = opening_time;
    }

    if (closing_time !== undefined) {
      updates.closing_time = closing_time;
    }

    // Only Super Admin can change building status
    if (is_active !== undefined) {
      if (req.admin.role !== 'super_admin') {
        return res.status(403).json({
          success: false,
          message: 'Only Super Admin can change building status'
        });
      }

      updates.is_active = is_active;
    }

    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('buildings')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      return res.status(404).json({
        success: false,
        message: 'Building not found or update failed'
      });
    }

    return res.status(200).json({
      success: true,
      data
    });
  } catch (err) {
    console.error('Error updating building:', err.message);

    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// PATCH /api/admin/buildings/:id/status
// Super Admin only
const patchBuildingStatus = async (req, res) => {
  try {
    if (req.admin.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Only Super Admin can modify building status'
      });
    }

    const { id } = req.params;
    const { is_active } = req.body;

    if (typeof is_active !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'is_active boolean field is required'
      });
    }

    const { data, error } = await supabase
      .from('buildings')
      .update({
        is_active,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      return res.status(404).json({
        success: false,
        message: 'Building not found'
      });
    }

    return res.status(200).json({
      success: true,
      data
    });
  } catch (err) {
    console.error('Error patching building status:', err.message);

    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  getAllBuildings,
  getBuildingById,
  createBuilding,
  updateBuilding,
  patchBuildingStatus
};