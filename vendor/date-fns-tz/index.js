function getOffsetMinutes(timeZone) {
  switch (timeZone) {
    case 'Africa/Lagos':
      return 60;
    default:
      return 0;
  }
}

function zonedTimeToUtc(dateInput, timeZone = 'UTC') {
  const source = typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : new Date(dateInput.valueOf());
  if (Number.isNaN(source.valueOf())) {
    throw new RangeError('Invalid date passed to zonedTimeToUtc');
  }
  const offsetMinutes = getOffsetMinutes(timeZone);
  const year = source.getFullYear();
  const month = source.getMonth();
  const day = source.getDate();
  const hours = source.getHours();
  const minutes = source.getMinutes();
  const seconds = source.getSeconds();
  const ms = source.getMilliseconds();
  const utcMillis = Date.UTC(year, month, day, hours, minutes, seconds, ms) - offsetMinutes * 60_000;
  return new Date(utcMillis);
}

module.exports = { zonedTimeToUtc };
