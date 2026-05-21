function success(res, data, meta = {}) {
  return res.status(200).json({ success: true, data, meta });
}

function paginated(res, data, { page, perPage, total }) {
  return res.status(200).json({
    success: true,
    data,
    meta: {
      page,
      per_page: perPage,
      total,
      total_pages: Math.ceil(total / perPage),
    },
  });
}

function created(res, data) {
  return res.status(201).json({ success: true, data });
}

function noContent(res) {
  return res.status(204).end();
}

function error(res, status, code, message, details = null) {
  const body = { success: false, error: { code, message } };
  if (details) body.error.details = details;
  return res.status(status).json(body);
}

module.exports = { success, paginated, created, noContent, error };
