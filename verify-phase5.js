const http = require('http');
const supabase = require('./src/config/supabase');

const request = (path) => {
  return new Promise((resolve) => {
    http.get(`http://localhost:3000${path}`, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    }).on('error', (err) => {
      resolve({ status: 500, error: err.message });
    });
  });
};

(async () => {
  console.log('=== STARTING LIVE PHASE 5 BACKEND VERIFICATION ===\n');
  let allPassed = true;

  const health = await request('/api/health');
  console.log(`GET /api/health -> Status: ${health.status} | Passed: ${health.status === 200}`);

  const { data: dept } = await supabase.from('departments').select('id').limit(1).single();
  const { data: serv } = await supabase.from('services').select('id').limit(1).single();
  const { data: emp } = await supabase.from('employees').select('id').eq('is_public', true).eq('is_active', true).limit(1).single();
  const { data: fac } = await supabase.from('facilities').select('id').limit(1).single();
  const { data: privEmp } = await supabase.from('employees').select('id').or('is_public.eq.false,is_active.eq.false').limit(1).single();

  if (dept) {
    const res = await request(`/api/departments/${dept.id}`);
    const passed = res.status === 200 && res.body.success === true && res.body.data.id === dept.id && Array.isArray(res.body.data.offices) && Array.isArray(res.body.data.services) && Array.isArray(res.body.data.employees);
    console.log(`GET /api/departments/${dept.id} -> Status: ${res.status} | success: ${res.body.success} | ID Match: ${res.body.data?.id === dept.id} | Has Offices/Services/Employees: ${passed} | Result: ${passed ? 'PASS' : 'FAIL'}`);
    if (!passed) allPassed = false;
  }

  if (serv) {
    const res = await request(`/api/services/${serv.id}`);
    const data = res.body.data || {};
    const hasBuilding = data.building || data.office || data.building_id;
    const hasHours = Array.isArray(data.opening_hours);
    const passed = res.status === 200 && res.body.success === true && data.id === serv.id && hasBuilding && hasHours;
    console.log(`GET /api/services/${serv.id} -> Status: ${res.status} | success: ${res.body.success} | Resolves Building/Office Context: ${!!hasBuilding} | Returns Opening Hours: ${hasHours} | Result: ${passed ? 'PASS' : 'FAIL'}`);
    if (!passed) allPassed = false;
  }

  if (emp) {
    const res = await request(`/api/employees/${emp.id}`);
    const data = res.body.data || {};
    const hasContext = data.building || data.office || data.building_id;
    const passed = res.status === 200 && res.body.success === true && data.id === emp.id && hasContext;
    console.log(`GET /api/employees/${emp.id} -> Status: ${res.status} | success: ${res.body.success} | Resolves Location Context: ${!!hasContext} | Result: ${passed ? 'PASS' : 'FAIL'}`);
    if (!passed) allPassed = false;
  }

  if (fac) {
    const res = await request(`/api/facilities/${fac.id}`);
    const data = res.body.data || {};
    const hasContext = data.building || data.floor || data.building_id;
    const passed = res.status === 200 && res.body.success === true && data.id === fac.id && hasContext;
    console.log(`GET /api/facilities/${fac.id} -> Status: ${res.status} | success: ${res.body.success} | Resolves Building/Floor Context: ${!!hasContext} | Result: ${passed ? 'PASS' : 'FAIL'}`);
    if (!passed) allPassed = false;
  }

  if (privEmp) {
    const res = await request(`/api/employees/${privEmp.id}`);
    const passed = res.status === 404;
    console.log(`GET /api/employees/${privEmp.id} (Private/Inactive) -> Status: ${res.status} (Expected 404) | Result: ${passed ? 'PASS' : 'FAIL'}`);
    if (!passed) allPassed = false;
  }

  const fakeRes = await request('/api/departments/00000000-0000-0000-0000-000000000000');
  const fakePassed = fakeRes.status === 404;
  console.log(`GET /api/departments/00000000-0000-0000-0000-000000000000 -> Status: ${fakeRes.status} (Expected 404) | Result: ${fakePassed ? 'PASS' : 'FAIL'}`);
  if (!fakePassed) allPassed = false;

  console.log('\n========================================');
  if (allPassed) {
    console.log('PHASE 5 BACKEND: VERIFIED PASS');
  } else {
    console.log('PHASE 5 BACKEND: FAIL');
  }
  console.log('========================================');
})();