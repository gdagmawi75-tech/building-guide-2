require('dotenv').config();

const express = require('express');
const cors = require('cors');

const supabase = require('./config/supabase');

// --------------------------------------------------
// PUBLIC / VISITOR ROUTES
// --------------------------------------------------

const buildingRoutes = require('./routes/buildingRoutes');
const locationRoutes = require('./routes/locationRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const facilityRoutes = require('./routes/facilityRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const announcementRoutes = require('./routes/announcementRoutes');
const searchRoutes = require('./routes/searchRoutes');

// --------------------------------------------------
// ADMIN ROUTES
// --------------------------------------------------

const adminAuthRouter = require('./routes/admin/authRoutes');
const adminFeedbackRoutes = require('./routes/admin/feedbackRoutes');
const serviceAdminRoutes = require('./routes/admin/serviceAdminRoutes');

const buildingAdminRoutes =
require('./controllers/admin/buildingAdminRoutes');

const floorAdminRoutes =
require('./controllers/admin/floorAdminRoutes');

const officeAdminRoutes =
require('./controllers/admin/officeAdminRoutes');

const departmentAdminRoutes =
require('./controllers/admin/departmentAdminRoutes');

const employeeAdminRoutes =
require('./controllers/admin/employeeAdminRoutes');

const facilityAdminRoutes =
require('./controllers/admin/facilityAdminRoutes');

const openingHoursAdminRoutes =
require('./controllers/admin/openingHoursAdminRoutes');

const announcementAdminRoutes =
require('./controllers/admin/announcementAdminRoutes');

const qrCodeAdminRoutes =
require('./routes/admin/qrCodeAdminRoutes');

const analyticsAdminRoutes =
require('./routes/admin/analyticsAdminRoutes');

// --------------------------------------------------
// APP
// --------------------------------------------------

const app = express();

const PORT = process.env.PORT || 3000;

// --------------------------------------------------
// MIDDLEWARE
// --------------------------------------------------

app.use(cors());

app.use(express.json());

// --------------------------------------------------
// HEALTH CHECK
// --------------------------------------------------

app.get('/api/health', (req, res) => {
res.json({
status: 'ok',
message: 'Building Guide API is running successfully'
});
});

// --------------------------------------------------
// DATABASE TEST
// --------------------------------------------------

app.get('/api/test-db', async (req, res) => {
try {
const { data, error } = await supabase
.from('buildings')
.select('*');

```
if (error) {
  return res.status(400).json({
    success: false,
    error: error.message
  });
}

return res.json({
  success: true,
  buildings: data
});
```

} catch (err) {
return res.status(500).json({
success: false,
error: err.message
});
}
});

// --------------------------------------------------
// PUBLIC / VISITOR ROUTES
// --------------------------------------------------

app.use(
'/api/buildings',
buildingRoutes
);

app.use(
'/api',
locationRoutes
);

app.use(
'/api/departments',
departmentRoutes
);

app.use(
'/api/services',
serviceRoutes
);

app.use(
'/api/employees',
employeeRoutes
);

app.use(
'/api/facilities',
facilityRoutes
);

app.use(
'/api/feedback',
feedbackRoutes
);

app.use(
'/api/announcements',
announcementRoutes
);

app.use(
'/api/search',
searchRoutes
);

// --------------------------------------------------
// ADMIN ROUTES
// --------------------------------------------------

// Authentication
app.use(
'/api/admin/auth',
adminAuthRouter
);

// Buildings
app.use(
'/api/admin/buildings',
buildingAdminRoutes
);

// Floors
app.use(
'/api/admin/floors',
floorAdminRoutes
);

// Offices
app.use(
'/api/admin/offices',
officeAdminRoutes
);

// Departments
app.use(
'/api/admin/departments',
departmentAdminRoutes
);

// Employees
app.use(
'/api/admin/employees',
employeeAdminRoutes
);

// Facilities
app.use(
'/api/admin/facilities',
facilityAdminRoutes
);

// Opening Hours
app.use(
'/api/admin/opening-hours',
openingHoursAdminRoutes
);

// Announcements
app.use(
'/api/admin/announcements',
announcementAdminRoutes
);

// Feedback
app.use(
'/api/admin/feedback',
adminFeedbackRoutes
);

// Services
app.use(
'/api/admin/services',
serviceAdminRoutes
);

// QR Codes
app.use(
'/api/admin/qr-codes',
qrCodeAdminRoutes
);

// Analytics
app.use(
'/api/admin/analytics',
analyticsAdminRoutes
);

// --------------------------------------------------
// 404 HANDLER
// --------------------------------------------------

app.use((req, res) => {
return res.status(404).json({
success: false,
error: 'Route not found.'
});
});

// --------------------------------------------------
// GLOBAL ERROR HANDLER
// --------------------------------------------------

app.use((err, req, res, next) => {
console.error(
'Unhandled server error:',
err
);

return res.status(500).json({
success: false,
error: 'Internal server error.'
});
});

// --------------------------------------------------
// START SERVER
// --------------------------------------------------

app.listen(PORT, () => {
console.log(
`Server is running on port ${PORT}`
);
});
