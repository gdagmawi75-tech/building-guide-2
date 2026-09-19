const {
  getOpeningHoursStatus
} = require('./src/utils/openingHoursStatus');

const openingHours = [
  {
    day_of_week: 1, // Monday
    opening_time: '08:30:00',
    closing_time: '15:30:00',
    break_start: '12:30:00',
    break_end: '13:30:00',
    is_closed: false
  }
];

function getEffectiveStatus(manualStatus, scheduleStatus) {
  // Manual temporary closure has highest priority
  if (manualStatus === 'temporarily_unavailable') {
    return {
      status: 'temporarily_unavailable',
      label: 'Temporarily Unavailable',
      source: 'manual'
    };
  }

  // Manual closed has second priority
  if (manualStatus === 'closed') {
    return {
      status: 'closed',
      label: 'Closed',
      source: 'manual'
    };
  }

  // Otherwise use the opening-hours schedule
  return {
    ...scheduleStatus,
    source: 'schedule'
  };
}

function runTest(name, manualStatus, date) {
  const scheduleStatus = getOpeningHoursStatus(
    openingHours,
    date
  );

  const effectiveStatus = getEffectiveStatus(
    manualStatus,
    scheduleStatus
  );

  console.log(`\n${name}`);
  console.log(`Manual status: ${manualStatus}`);
  console.log(`Time: ${date}`);
  console.log('Schedule:', scheduleStatus);
  console.log('Effective:', effectiveStatus);
}

// TEST 1
// Schedule says OPEN.
// No manual override.
// Expected: OPEN NOW
runTest(
  'TEST 1 — Normal schedule',
  'open',
  '2026-09-14T10:00:00'
);

// TEST 2
// Schedule says OPEN.
// Manual status says CLOSED.
// Expected: CLOSED
runTest(
  'TEST 2 — Manual closed override',
  'closed',
  '2026-09-14T10:00:00'
);

// TEST 3
// Schedule says OPEN.
// Manual status says TEMPORARILY UNAVAILABLE.
// Expected: TEMPORARILY UNAVAILABLE
runTest(
  'TEST 3 — Manual temporary override',
  'temporarily_unavailable',
  '2026-09-14T10:00:00'
);

// TEST 4
// Schedule says CLOSED because it is after hours.
// Manual status is OPEN.
// Expected: CLOSED
runTest(
  'TEST 4 — Manual open does not override schedule',
  'open',
  '2026-09-14T16:00:00'
);

// TEST 5
// Schedule says CLOSED FOR BREAK.
// No manual override.
// Expected: CLOSED FOR BREAK
runTest(
  'TEST 5 — Break status',
  'open',
  '2026-09-14T13:00:00'
);