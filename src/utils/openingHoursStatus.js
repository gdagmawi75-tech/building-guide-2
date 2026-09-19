const BUILDING_TIMEZONE = 'Africa/Addis_Ababa';

function getEthiopianDateParts(date) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: BUILDING_TIMEZONE,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  });

  const parts = formatter.formatToParts(date);

  const values = {};

  for (const part of parts) {
    if (part.type !== 'literal') {
      values[part.type] = part.value;
    }
  }

  const weekdayMap = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6
  };

  return {
    dayOfWeek: weekdayMap[values.weekday],
    hour: Number(values.hour),
    minute: Number(values.minute)
  };
}

function getOpeningHoursStatus(openingHours, testDate = null) {
  if (!openingHours || openingHours.length === 0) {
    return {
      status: 'unknown',
      label: 'Hours not configured'
    };
  }

  let now;

  if (testDate) {
    /*
     * Test dates such as:
     * 2026-09-14T10:00:00
     *
     * are intentionally treated as Ethiopian local time.
     */
    if (
      typeof testDate === 'string' &&
      !testDate.includes('Z') &&
      !/[+-]\d{2}:\d{2}$/.test(testDate)
    ) {
      const [datePart, timePart = '00:00:00'] =
        testDate.split('T');

      const [year, month, day] =
        datePart.split('-').map(Number);

      const [
        hour = 0,
        minute = 0,
        second = 0
      ] = timePart.split(':').map(Number);

      /*
       * Convert the supplied Ethiopian local time
       * into a UTC Date so Intl can safely interpret it.
       *
       * Ethiopia is UTC+3 and does not use DST.
       */
      now = new Date(
        Date.UTC(
          year,
          month - 1,
          day,
          hour - 3,
          minute,
          second
        )
      );
    } else {
      now = new Date(testDate);
    }
  } else {
    now = new Date();
  }

  if (Number.isNaN(now.getTime())) {
    return {
      status: 'unknown',
      label: 'Invalid date'
    };
  }

  // Get the current Ethiopian day and time
  const ethiopianTime = getEthiopianDateParts(now);

  const currentDay = ethiopianTime.dayOfWeek;

  const currentMinutes =
    ethiopianTime.hour * 60 +
    ethiopianTime.minute;

  // Find today's schedule
  const todayHours = openingHours.find(
    (hours) =>
      Number(hours.day_of_week) === currentDay
  );

  // No schedule configured for today
  if (!todayHours) {
    return {
      status: 'closed',
      label: 'Closed'
    };
  }

  // Explicitly closed today
  if (todayHours.is_closed) {
    return {
      status: 'closed',
      label: 'Closed'
    };
  }

  // Opening or closing time missing
  if (
    !todayHours.opening_time ||
    !todayHours.closing_time
  ) {
    return {
      status: 'unknown',
      label: 'Hours not configured'
    };
  }

  // Convert opening time to minutes
  const [openHour, openMinute] =
    todayHours.opening_time
      .split(':')
      .map(Number);

  const openingMinutes =
    openHour * 60 + openMinute;

  // Convert closing time to minutes
  const [closeHour, closeMinute] =
    todayHours.closing_time
      .split(':')
      .map(Number);

  const closingMinutes =
    closeHour * 60 + closeMinute;

  // --------------------------------------------------
  // Break
  // --------------------------------------------------

  if (
    todayHours.break_start &&
    todayHours.break_end
  ) {
    const [breakStartHour, breakStartMinute] =
      todayHours.break_start
        .split(':')
        .map(Number);

    const [breakEndHour, breakEndMinute] =
      todayHours.break_end
        .split(':')
        .map(Number);

    const breakStartMinutes =
      breakStartHour * 60 +
      breakStartMinute;

    const breakEndMinutes =
      breakEndHour * 60 +
      breakEndMinute;

    if (
      currentMinutes >= breakStartMinutes &&
      currentMinutes < breakEndMinutes
    ) {
      return {
        status: 'closed',
        label: 'Closed for break'
      };
    }
  }

  // --------------------------------------------------
  // Currently open
  // --------------------------------------------------

  if (
    currentMinutes >= openingMinutes &&
    currentMinutes < closingMinutes
  ) {
    return {
      status: 'open',
      label: 'Open now'
    };
  }

  // --------------------------------------------------
  // Before opening or after closing
  // --------------------------------------------------

  return {
    status: 'closed',
    label: 'Closed'
  };
}

module.exports = {
  getOpeningHoursStatus
};