const supabase = require('../../config/supabase');

const VALID_LOCATION_TYPES = [
  'entrance',
  'reception',
  'floor',
  'elevator',
  'staircase',
  'other'
];

function isValidUUID(value) {
  return (
    typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value
    )
  );
}

async function getAssignedFloorIds(adminId) {
  const { data, error } = await supabase
    .from('admin_floor_assignments')
    .select('floor_id')
    .eq('admin_id', adminId);

  if (error) {
    throw new Error(
      'Failed to verify floor assignments.'
    );
  }

  return (data || []).map(
    (item) => item.floor_id
  );
}

async function getFloorBuildingId(floorId) {
  const { data, error } = await supabase
    .from('floors')
    .select('building_id')
    .eq('id', floorId)
    .single();

  if (error || !data) {
    return null;
  }

  return data.building_id;
}

async function getQRCodeById(id) {
  const { data, error } = await supabase
    .from('qr_codes')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

async function canViewQRCode(req, qrCode) {
  const role = req.admin.role;

  if (role === 'super_admin') {
    return true;
  }

  if (role === 'building_manager') {
    return (
      qrCode.building_id ===
      req.admin.building_id
    );
  }

  if (role === 'floor_manager') {
    if (!qrCode.floor_id) {
      return false;
    }

    const assignedFloorIds =
      await getAssignedFloorIds(
        req.admin.id
      );

    return assignedFloorIds.includes(
      qrCode.floor_id
    );
  }

  return false;
}

async function canManageQRCode(req, qrCode) {
  const role = req.admin.role;

  if (role === 'super_admin') {
    return true;
  }

  if (role === 'building_manager') {
    return (
      qrCode.building_id ===
      req.admin.building_id
    );
  }

  if (role === 'floor_manager') {
    if (!qrCode.floor_id) {
      return false;
    }

    const assignedFloorIds =
      await getAssignedFloorIds(
        req.admin.id
      );

    return assignedFloorIds.includes(
      qrCode.floor_id
    );
  }

  return false;
}

const qrCodeAdminController = {
  async getAllQRCodes(req, res) {
    try {
      const {
        building_id,
        floor_id,
        location_type,
        is_active
      } = req.query;

      const role = req.admin.role;

      if (
        role !== 'super_admin' &&
        role !== 'building_manager' &&
        role !== 'floor_manager'
      ) {
        return res.status(403).json({
          success: false,
          error: 'QR code access denied.'
        });
      }

      let query = supabase
        .from('qr_codes')
        .select('*')
        .order('created_at', {
          ascending: false
        });

      if (role === 'building_manager') {
        query = query.eq(
          'building_id',
          req.admin.building_id
        );
      }

      if (role === 'floor_manager') {
        const assignedFloorIds =
          await getAssignedFloorIds(
            req.admin.id
          );

        if (assignedFloorIds.length === 0) {
          return res.json({
            success: true,
            total: 0,
            data: []
          });
        }

        query = query.in(
          'floor_id',
          assignedFloorIds
        );
      }

      if (building_id) {
        if (!isValidUUID(building_id)) {
          return res.status(400).json({
            success: false,
            error: 'Invalid building_id.'
          });
        }

        if (
          role === 'building_manager' &&
          building_id !== req.admin.building_id
        ) {
          return res.status(403).json({
            success: false,
            error: 'Building scope denied.'
          });
        }

        query = query.eq(
          'building_id',
          building_id
        );
      }

      if (floor_id) {
        if (!isValidUUID(floor_id)) {
          return res.status(400).json({
            success: false,
            error: 'Invalid floor_id.'
          });
        }

        if (role === 'floor_manager') {
          const assignedFloorIds =
            await getAssignedFloorIds(
              req.admin.id
            );

          if (
            !assignedFloorIds.includes(
              floor_id
            )
          ) {
            return res.status(403).json({
              success: false,
              error: 'Floor scope denied.'
            });
          }
        }

        query = query.eq(
          'floor_id',
          floor_id
        );
      }

      if (location_type) {
        if (
          !VALID_LOCATION_TYPES.includes(
            location_type
          )
        ) {
          return res.status(400).json({
            success: false,
            error: 'Invalid location_type.'
          });
        }

        query = query.eq(
          'location_type',
          location_type
        );
      }

      if (is_active !== undefined) {
        if (
          is_active !== 'true' &&
          is_active !== 'false'
        ) {
          return res.status(400).json({
            success: false,
            error:
              'is_active must be true or false.'
          });
        }

        query = query.eq(
          'is_active',
          is_active === 'true'
        );
      }

      const { data, error } = await query;

      if (error) {
        console.error(
          'Error fetching QR codes:',
          error
        );

        return res.status(500).json({
          success: false,
          error:
            'Failed to fetch QR codes.'
        });
      }

      return res.json({
        success: true,
        total: data?.length || 0,
        data: data || []
      });
    } catch (error) {
      console.error(
        'Admin QR code list error:',
        error
      );

      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  async getQRCodeById(req, res) {
    try {
      const { id } = req.params;

      if (!isValidUUID(id)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid QR code ID.'
        });
      }

      const qrCode =
        await getQRCodeById(id);

      if (!qrCode) {
        return res.status(404).json({
          success: false,
          error: 'QR code not found.'
        });
      }

      const allowed =
        await canViewQRCode(
          req,
          qrCode
        );

      if (!allowed) {
        return res.status(403).json({
          success: false,
          error:
            'Forbidden: QR code access denied.'
        });
      }

      return res.json({
        success: true,
        data: qrCode
      });
    } catch (error) {
      console.error(
        'Admin QR code detail error:',
        error
      );

      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  async createQRCode(req, res) {
    try {
      const {
        building_id,
        floor_id = null,
        qr_code,
        location_type = 'entrance',
        label_en = null,
        label_am = null,
        label_om = null,
        is_active = true
      } = req.body;

      if (!isValidUUID(building_id)) {
        return res.status(400).json({
          success: false,
          error:
            'Valid building_id is required.'
        });
      }

      if (
        floor_id !== null &&
        !isValidUUID(floor_id)
      ) {
        return res.status(400).json({
          success: false,
          error:
            'floor_id must be a valid UUID or null.'
        });
      }

      if (
        typeof qr_code !== 'string' ||
        !qr_code.trim()
      ) {
        return res.status(400).json({
          success: false,
          error: 'qr_code is required.'
        });
      }

      if (
        !VALID_LOCATION_TYPES.includes(
          location_type
        )
      ) {
        return res.status(400).json({
          success: false,
          error:
            'Invalid location_type.'
        });
      }

      if (
        typeof is_active !== 'boolean'
      ) {
        return res.status(400).json({
          success: false,
          error:
            'is_active must be a boolean.'
        });
      }

      if (
        label_en !== null &&
        label_en !== undefined &&
        typeof label_en !== 'string'
      ) {
        return res.status(400).json({
          success: false,
          error: 'label_en must be text.'
        });
      }

      if (
        label_am !== null &&
        label_am !== undefined &&
        typeof label_am !== 'string'
      ) {
        return res.status(400).json({
          success: false,
          error: 'label_am must be text.'
        });
      }

      if (
        label_om !== null &&
        label_om !== undefined &&
        typeof label_om !== 'string'
      ) {
        return res.status(400).json({
          success: false,
          error: 'label_om must be text.'
        });
      }

      if (
        req.admin.role ===
        'building_manager' &&
        building_id !== req.admin.building_id
      ) {
        return res.status(403).json({
          success: false,
          error:
            'Cannot create QR code for another building.'
        });
      }

      if (
        req.admin.role ===
        'floor_manager'
      ) {
        return res.status(403).json({
          success: false,
          error:
            'Floor Managers cannot create QR codes.'
        });
      }

      if (floor_id) {
        const floorBuildingId =
          await getFloorBuildingId(
            floor_id
          );

        if (!floorBuildingId) {
          return res.status(404).json({
            success: false,
            error: 'Floor not found.'
          });
        }

        if (
          floorBuildingId !== building_id
        ) {
          return res.status(400).json({
            success: false,
            error:
              'Floor does not belong to the selected building.'
          });
        }
      }

      const {
        data: building,
        error: buildingError
      } = await supabase
        .from('buildings')
        .select('id')
        .eq('id', building_id)
        .single();

      if (
        buildingError ||
        !building
      ) {
        return res.status(404).json({
          success: false,
          error: 'Building not found.'
        });
      }

      const {
        data: existingQRCode,
        error: duplicateCheckError
      } = await supabase
        .from('qr_codes')
        .select('id')
        .eq(
          'qr_code',
          qr_code.trim()
        )
        .maybeSingle();

      if (duplicateCheckError) {
        console.error(
          'QR code duplicate check error:',
          duplicateCheckError
        );

        return res.status(500).json({
          success: false,
          error:
            'Failed to validate QR code.'
        });
      }

      if (existingQRCode) {
        return res.status(409).json({
          success: false,
          error:
            'qr_code already exists.'
        });
      }

      const {
        data,
        error
      } = await supabase
        .from('qr_codes')
        .insert({
          building_id,
          floor_id,
          qr_code: qr_code.trim(),
          location_type,
          label_en:
            label_en?.trim() || null,
          label_am:
            label_am?.trim() || null,
          label_om:
            label_om?.trim() || null,
          is_active
        })
        .select()
        .single();

      if (error) {
        console.error(
          'Error creating QR code:',
          error
        );

        return res.status(500).json({
          success: false,
          error:
            'Failed to create QR code.'
        });
      }

      return res.status(201).json({
        success: true,
        data
      });
    } catch (error) {
      console.error(
        'Admin QR code create error:',
        error
      );

      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  async updateQRCode(req, res) {
    try {
      const { id } = req.params;

      if (!isValidUUID(id)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid QR code ID.'
        });
      }

      const existingQRCode =
        await getQRCodeById(id);

      if (!existingQRCode) {
        return res.status(404).json({
          success: false,
          error: 'QR code not found.'
        });
      }

      const allowed =
        await canManageQRCode(
          req,
          existingQRCode
        );

      if (!allowed) {
        return res.status(403).json({
          success: false,
          error:
            'Forbidden: QR code update denied.'
        });
      }

      const {
        building_id,
        floor_id,
        qr_code,
        location_type,
        label_en,
        label_am,
        label_om,
        is_active
      } = req.body;

      const nextBuildingId =
        building_id !== undefined
          ? building_id
          : existingQRCode.building_id;

      const nextFloorId =
        floor_id !== undefined
          ? floor_id
          : existingQRCode.floor_id;

      if (
        !isValidUUID(nextBuildingId)
      ) {
        return res.status(400).json({
          success: false,
          error:
            'Invalid building_id.'
        });
      }

      if (
        nextFloorId !== null &&
        !isValidUUID(nextFloorId)
      ) {
        return res.status(400).json({
          success: false,
          error:
            'Invalid floor_id.'
        });
      }

      if (
        req.admin.role ===
          'building_manager' &&
        nextBuildingId !==
          req.admin.building_id
      ) {
        return res.status(403).json({
          success: false,
          error:
            'Cannot move QR code to another building.'
        });
      }

      if (nextFloorId) {
        const floorBuildingId =
          await getFloorBuildingId(
            nextFloorId
          );

        if (!floorBuildingId) {
          return res.status(404).json({
            success: false,
            error: 'Floor not found.'
          });
        }

        if (
          floorBuildingId !==
          nextBuildingId
        ) {
          return res.status(400).json({
            success: false,
            error:
              'Floor does not belong to the selected building.'
          });
        }
      }

      if (
        qr_code !== undefined &&
        (
          typeof qr_code !== 'string' ||
          !qr_code.trim()
        )
      ) {
        return res.status(400).json({
          success: false,
          error: 'qr_code is invalid.'
        });
      }

      if (
        location_type !== undefined &&
        !VALID_LOCATION_TYPES.includes(
          location_type
        )
      ) {
        return res.status(400).json({
          success: false,
          error:
            'Invalid location_type.'
        });
      }

      if (
        is_active !== undefined &&
        typeof is_active !== 'boolean'
      ) {
        return res.status(400).json({
          success: false,
          error:
            'is_active must be a boolean.'
        });
      }

      const labels = {
        label_en,
        label_am,
        label_om
      };

      for (
        const [key, value]
        of Object.entries(labels)
      ) {
        if (
          value !== undefined &&
          value !== null &&
          typeof value !== 'string'
        ) {
          return res.status(400).json({
            success: false,
            error:
              `${key} must be text.`
          });
        }
      }

      if (
        qr_code !== undefined &&
        qr_code.trim() !==
          existingQRCode.qr_code
      ) {
        const {
          data: duplicateQRCode
        } = await supabase
          .from('qr_codes')
          .select('id')
          .eq(
            'qr_code',
            qr_code.trim()
          )
          .neq('id', id)
          .maybeSingle();

        if (duplicateQRCode) {
          return res.status(409).json({
            success: false,
            error:
              'qr_code already exists.'
          });
        }
      }

      const updates = {};

      if (
        building_id !== undefined
      ) {
        updates.building_id =
          nextBuildingId;
      }

      if (
        floor_id !== undefined
      ) {
        updates.floor_id =
          nextFloorId;
      }

      if (
        qr_code !== undefined
      ) {
        updates.qr_code =
          qr_code.trim();
      }

      if (
        location_type !== undefined
      ) {
        updates.location_type =
          location_type;
      }

      if (
        label_en !== undefined
      ) {
        updates.label_en =
          label_en?.trim() || null;
      }

      if (
        label_am !== undefined
      ) {
        updates.label_am =
          label_am?.trim() || null;
      }

      if (
        label_om !== undefined
      ) {
        updates.label_om =
          label_om?.trim() || null;
      }

      if (
        is_active !== undefined
      ) {
        updates.is_active =
          is_active;
      }

      const {
        data,
        error
      } = await supabase
        .from('qr_codes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error(
          'Error updating QR code:',
          error
        );

        return res.status(500).json({
          success: false,
          error:
            'Failed to update QR code.'
        });
      }

      return res.json({
        success: true,
        data
      });
    } catch (error) {
      console.error(
        'Admin QR code update error:',
        error
      );

      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  async updateQRCodeStatus(req, res) {
    try {
      const { id } = req.params;
      const { is_active } = req.body;

      if (!isValidUUID(id)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid QR code ID.'
        });
      }

      if (
        typeof is_active !== 'boolean'
      ) {
        return res.status(400).json({
          success: false,
          error:
            'is_active must be a boolean.'
        });
      }

      const existingQRCode =
        await getQRCodeById(id);

      if (!existingQRCode) {
        return res.status(404).json({
          success: false,
          error: 'QR code not found.'
        });
      }

      const allowed =
        await canManageQRCode(
          req,
          existingQRCode
        );

      if (!allowed) {
        return res.status(403).json({
          success: false,
          error:
            'Forbidden: QR code status update denied.'
        });
      }

      const {
        data,
        error
      } = await supabase
        .from('qr_codes')
        .update({
          is_active
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error(
          'Error updating QR code status:',
          error
        );

        return res.status(500).json({
          success: false,
          error:
            'Failed to update QR code status.'
        });
      }

      return res.json({
        success: true,
        data
      });
    } catch (error) {
      console.error(
        'Admin QR status error:',
        error
      );

      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  async deleteQRCode(req, res) {
    try {
      const { id } = req.params;

      if (!isValidUUID(id)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid QR code ID.'
        });
      }

      const existingQRCode =
        await getQRCodeById(id);

      if (!existingQRCode) {
        return res.status(404).json({
          success: false,
          error: 'QR code not found.'
        });
      }

      const allowed =
        await canManageQRCode(
          req,
          existingQRCode
        );

      if (!allowed) {
        return res.status(403).json({
          success: false,
          error:
            'Forbidden: QR code deletion denied.'
        });
      }

      const { error } =
        await supabase
          .from('qr_codes')
          .delete()
          .eq('id', id);

      if (error) {
        console.error(
          'Error deleting QR code:',
          error
        );

        return res.status(500).json({
          success: false,
          error:
            'Failed to delete QR code.'
        });
      }

      return res.json({
        success: true,
        message:
          'QR code deleted successfully.'
      });
    } catch (error) {
      console.error(
        'Admin QR delete error:',
        error
      );

      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
};

module.exports =
  qrCodeAdminController;