const supabase = require('../config/supabase');

const feedbackController = {
  // Submit visitor feedback
  async createFeedback(req, res) {
    try {
      const {
        building_id,
        floor_id,
        office_id,
        service_id,
        qr_code_id,
        rating,
        message
      } = req.body;

      // Building is required
      if (!building_id) {
        return res.status(400).json({
          success: false,
          error: 'building_id is required.'
        });
      }

      // Rating is optional, but if provided it must be 1-5
      if (
        rating !== undefined &&
        rating !== null &&
        (!Number.isInteger(rating) || rating < 1 || rating > 5)
      ) {
        return res.status(400).json({
          success: false,
          error: 'Rating must be an integer between 1 and 5.'
        });
      }

      // Message is optional, but if provided it must contain text
      const cleanedMessage =
        typeof message === 'string' ? message.trim() : null;

      if (message !== undefined && message !== null && !cleanedMessage) {
        return res.status(400).json({
          success: false,
          error: 'Message cannot be empty.'
        });
      }

      // At least a rating or message should be provided
      if (rating === undefined && !cleanedMessage) {
        return res.status(400).json({
          success: false,
          error: 'Please provide a rating or message.'
        });
      }

      const { data, error } = await supabase
        .from('feedback')
        .insert({
          building_id,
          floor_id: floor_id || null,
          office_id: office_id || null,
          service_id: service_id || null,
          qr_code_id: qr_code_id || null,
          rating: rating ?? null,
          message: cleanedMessage || null,
          status: 'new'
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating feedback:', error);

        return res.status(500).json({
          success: false,
          error: 'Failed to submit feedback.'
        });
      }

      return res.status(201).json({
        success: true,
        message: 'Feedback submitted successfully.',
        data
      });
    } catch (err) {
      console.error('Error creating feedback:', err);

      return res.status(500).json({
        success: false,
        error: 'Internal server error.'
      });
    }
  }
};

module.exports = feedbackController;