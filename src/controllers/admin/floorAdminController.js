const supabase = require('../../config/supabase');

// GET /api/admin/floors
const getAllFloors = async (req, res) => {
  try {
    let query = supabase
      .from('floors')
      .select('*, buildings(id, name_en)');

    if (req.admin.role === 'building_manager') {
      if (!req.admin.building_id) {
        return res.status(200).json({
          success: true,
          data: []
        });
      }

      query = query.eq(
        'building_id',
        req.admin.building_id
      );
    }

    if (req.admin.role === 'floor_manager') {
      const { data: assignments, error: assignmentError } =
        await supabase
          .from('admin_floor_assignments')
          .select('floor_id, floors(building_id)')
          .eq('admin_id', req.admin.id);

      if (assignmentError) {
        throw assignmentError;
      }

      const assignedFloorIds =
        (assignments || [])
          .filter(
            (assignment) =>
              assignment.floors &&
              assignment.floors.building_id ===
                req.admin.building_id
          )
          .map(
            (assignment) => assignment.floor_id
          );

      if (assignedFloorIds.length === 0) {
        return res.status(200).json({
          success: true,
          data: []
        });
      }

      query = query.in(
        'id',
        assignedFloorIds
      );
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return res.status(200).json({
      success: true,
      data: data || []
    });
  } catch (err) {
    console.error(
      'Error fetching floors:',
      err.message
    );

    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// GET /api/admin/floors/:id
const getFloorById = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      data: floor,
      error
    } = await supabase
      .from('floors')
      .select('*, buildings(id, name_en)')
      .eq('id', id)
      .single();

    if (error || !floor) {
      return res.status(404).json({
        success: false,
        message: 'Floor not found'
      });
    }

    // Building Manager scope
    if (
      req.admin.role === 'building_manager' &&
      floor.building_id !== req.admin.building_id
    ) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this floor'
      });
    }

    // Floor Manager scope
    if (req.admin.role === 'floor_manager') {
      const {
        data: assignments,
        error: assignmentError
      } = await supabase
        .from('admin_floor_assignments')
        .select('floor_id, floors(building_id)')
        .eq('admin_id', req.admin.id);

      if (assignmentError) {
        throw assignmentError;
      }

      const allowed = (assignments || []).some(
        (assignment) =>
          assignment.floor_id === id &&
          assignment.floors &&
          assignment.floors.building_id ===
            req.admin.building_id
      );

      if (!allowed) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to unassigned floor'
        });
      }
    }

    return res.status(200).json({
      success: true,
      data: floor
    });
  } catch (err) {
    console.error(
      'Error fetching floor:',
      err.message
    );

    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// POST /api/admin/floors
const createFloor = async (req, res) => {
  try {
    const {
      building_id,
      name_en,
      name_am,
      name_om,
      floor_number,
      is_active
    } = req.body;

    if (
      !building_id ||
      !name_en ||
      typeof name_en !== 'string' ||
      floor_number === undefined
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Missing required fields: building_id, name_en, floor_number'
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

    // Scope enforcement
    if (req.admin.role === 'super_admin') {
      // Allowed for any building
    } else if (
      req.admin.role === 'building_manager'
    ) {
      if (
        !req.admin.building_id ||
        req.admin.building_id !== building_id
      ) {
        return res.status(403).json({
          success: false,
          message:
            'Building manager cannot create floors for another building'
        });
      }
    } else {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to create floors'
      });
    }

    const {
      data: building,
      error: buildingError
    } = await supabase
      .from('buildings')
      .select('id')
      .eq('id', building_id)
      .single();

    if (buildingError || !building) {
      return res.status(400).json({
        success: false,
        message:
          'Referenced building does not exist'
      });
    }

    const newFloor = {
      building_id,
      name_en: name_en.trim(),
      name_am: name_am || null,
      name_om: name_om || null,
      floor_number: Number(floor_number),
      is_active:
        is_active !== undefined
          ? is_active
          : true
    };

    const {
      data,
      error
    } = await supabase
      .from('floors')
      .insert([newFloor])
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
    console.error(
      'Error creating floor:',
      err.message
    );

    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// PUT /api/admin/floors/:id
const updateFloor = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      data: existing,
      error: fetchError
    } = await supabase
      .from('floors')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      return res.status(404).json({
        success: false,
        message: 'Floor not found'
      });
    }

    // Building Manager
    if (
      req.admin.role === 'building_manager' &&
      existing.building_id !==
        req.admin.building_id
    ) {
      return res.status(403).json({
        success: false,
        message:
          'Cannot update floor in another building'
      });
    }

    // Floor Manager
    if (req.admin.role === 'floor_manager') {
      const {
        data: assignments,
        error: assignmentError
      } = await supabase
        .from('admin_floor_assignments')
        .select('floor_id, floors(building_id)')
        .eq('admin_id', req.admin.id);

      if (assignmentError) {
        throw assignmentError;
      }

      const allowed = (assignments || []).some(
        (assignment) =>
          assignment.floor_id === id &&
          assignment.floors &&
          assignment.floors.building_id ===
            req.admin.building_id
      );

      if (!allowed) {
        return res.status(403).json({
          success: false,
          message:
            'Cannot update unassigned floor'
        });
      }
    }

    if (
      ![
        'super_admin',
        'building_manager',
        'floor_manager'
      ].includes(req.admin.role)
    ) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const {
      building_id,
      name_en,
      name_am,
      name_om,
      floor_number,
      is_active
    } = req.body;

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

    if (building_id !== undefined) {
      if (req.admin.role !== 'super_admin') {
        return res.status(403).json({
          success: false,
          message:
            'Only Super Admin can change building reference'
        });
      }

      const {
        data: building,
        error: buildingError
      } = await supabase
        .from('buildings')
        .select('id')
        .eq('id', building_id)
        .single();

      if (buildingError || !building) {
        return res.status(400).json({
          success: false,
          message:
            'Referenced building does not exist'
        });
      }

      updates.building_id =
        building_id;
    }

    if (name_en !== undefined) {
      if (
        typeof name_en !== 'string' ||
        name_en.trim() === ''
      ) {
        return res.status(400).json({
          success: false,
          message: 'Invalid name_en format'
        });
      }

      updates.name_en =
        name_en.trim();
    }

    if (name_am !== undefined) {
      updates.name_am = name_am;
    }

    if (name_om !== undefined) {
      updates.name_om = name_om;
    }

    if (floor_number !== undefined) {
      const number =
        Number(floor_number);

      if (
        !Number.isInteger(number)
      ) {
        return res.status(400).json({
          success: false,
          message:
            'floor_number must be an integer'
        });
      }

      updates.floor_number =
        number;
    }

    if (is_active !== undefined) {
      updates.is_active =
        is_active;
    }

    updates.updated_at =
      new Date().toISOString();

    const {
      data,
      error
    } = await supabase
      .from('floors')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return res.status(200).json({
      success: true,
      data
    });
  } catch (err) {
    console.error(
      'Error updating floor:',
      err.message
    );

    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// PATCH /api/admin/floors/:id/status
const patchFloorStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    if (typeof is_active !== 'boolean') {
      return res.status(400).json({
        success: false,
        message:
          'is_active boolean is required'
      });
    }

    const {
      data: existing,
      error: fetchError
    } = await supabase
      .from('floors')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      return res.status(404).json({
        success: false,
        message: 'Floor not found'
      });
    }

    if (
      req.admin.role === 'building_manager' &&
      existing.building_id !==
        req.admin.building_id
    ) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden'
      });
    }

    if (req.admin.role === 'floor_manager') {
      const {
        data: assignments,
        error: assignmentError
      } = await supabase
        .from('admin_floor_assignments')
        .select('floor_id, floors(building_id)')
        .eq('admin_id', req.admin.id);

      if (assignmentError) {
        throw assignmentError;
      }

      const allowed = (assignments || []).some(
        (assignment) =>
          assignment.floor_id === id &&
          assignment.floors &&
          assignment.floors.building_id ===
            req.admin.building_id
      );

      if (!allowed) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden'
        });
      }
    }

    if (
      ![
        'super_admin',
        'building_manager',
        'floor_manager'
      ].includes(req.admin.role)
    ) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden'
      });
    }

    const {
      data,
      error
    } = await supabase
      .from('floors')
      .update({
        is_active,
        updated_at:
          new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return res.status(200).json({
      success: true,
      data
    });
  } catch (err) {
    console.error(
      'Error patching floor status:',
      err.message
    );

    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  getAllFloors,
  getFloorById,
  createFloor,
  updateFloor,
  patchFloorStatus
};