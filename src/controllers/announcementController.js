const supabase = require('../config/supabase');

const announcementController = {
  // Get active announcements
  async getAnnouncements(req, res) {
    try {
      const { building_id } = req.query;

      let query = supabase
        .from('announcements')
        .select('*')
        .eq('is_active', true)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });

      if (building_id) {
        query = query.eq('building_id', building_id);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching announcements:', error);

        return res.status(500).json({
          success: false,
          error: 'Failed to fetch announcements.'
        });
      }

      const now = new Date();

      const activeAnnouncements = (data || []).filter((announcement) => {
        const startsAt = announcement.starts_at
          ? new Date(announcement.starts_at)
          : null;

        const expiresAt = announcement.expires_at
          ? new Date(announcement.expires_at)
          : null;

        if (startsAt && now < startsAt) {
          return false;
        }

        if (expiresAt && now >= expiresAt) {
          return false;
        }

        return true;
      });

      return res.json({
        success: true,
        data: activeAnnouncements
      });

    } catch (err) {
      console.error('Error fetching announcements:', err);

      return res.status(500).json({
        success: false,
        error: 'Internal server error.'
      });
    }
  },

  // Get one active announcement
  async getAnnouncementById(req, res) {
    try {
      const { id } = req.params;

      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        return res.status(404).json({
          success: false,
          error: 'Announcement not found.'
        });
      }

      const now = new Date();

      const startsAt = data.starts_at
        ? new Date(data.starts_at)
        : null;

      const expiresAt = data.expires_at
        ? new Date(data.expires_at)
        : null;

      if (startsAt && now < startsAt) {
        return res.status(404).json({
          success: false,
          error: 'Announcement is not active yet.'
        });
      }

      if (expiresAt && now >= expiresAt) {
        return res.status(404).json({
          success: false,
          error: 'Announcement has expired.'
        });
      }

      return res.json({
        success: true,
        data
      });

    } catch (err) {
      console.error('Error fetching announcement:', err);

      return res.status(500).json({
        success: false,
        error: 'Internal server error.'
      });
    }
  }
};

module.exports = announcementController;