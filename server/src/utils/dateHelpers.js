function toUTC(date) {
  return new Date(date).toISOString();
}

function isToday(date) {
  const d = new Date(date);
  const now = new Date();
  return d.getUTCFullYear() === now.getUTCFullYear()
    && d.getUTCMonth() === now.getUTCMonth()
    && d.getUTCDate() === now.getUTCDate();
}

function formatDate(date, locale = 'es-AR') {
  return new Date(date).toLocaleDateString(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatTime(date, locale = 'es-AR') {
  return new Date(date).toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getDateString(date = new Date()) {
  return date.toISOString().split('T')[0];
}

module.exports = { toUTC, isToday, formatDate, formatTime, getDateString };
