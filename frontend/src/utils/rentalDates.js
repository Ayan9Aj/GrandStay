const formatLocalDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const isValidRentalDate = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
};

export function addRentalDays(dateValue, days) {
  if (!isValidRentalDate(dateValue)) return '';
  const date = new Date(`${dateValue}T12:00:00`);
  if (Number.isNaN(date.getTime())) return '';
  date.setDate(date.getDate() + days);
  return formatLocalDate(date);
}

export function getDefaultRentalDates() {
  const checkIn = addRentalDays(formatLocalDate(new Date()), 1);
  return { checkIn, checkOut: addRentalDays(checkIn, 2) };
}

export function getRentalDatesFromSearch(searchParams) {
  const defaults = getDefaultRentalDates();
  const requestedCheckIn = searchParams.get('checkIn') || '';
  const requestedCheckOut = searchParams.get('checkOut') || '';
  const checkIn = isValidRentalDate(requestedCheckIn) ? requestedCheckIn : defaults.checkIn;
  const checkOut = getRentalNights(checkIn, requestedCheckOut)
    ? requestedCheckOut
    : addRentalDays(checkIn, 1);
  return { checkIn, checkOut };
}

export function getRentalNights(checkIn, checkOut) {
  if (!isValidRentalDate(checkIn) || !isValidRentalDate(checkOut)) return null;
  const start = new Date(`${checkIn}T00:00:00Z`);
  const end = new Date(`${checkOut}T00:00:00Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
  const nights = (end - start) / 86400000;
  return Number.isInteger(nights) && nights > 0 ? nights : null;
}
