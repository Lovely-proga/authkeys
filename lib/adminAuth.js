export function checkAdmin(request) {
  const provided = request.headers.get("x-admin-key");
  const real = process.env.ADMIN_SECRET_KEY;
  return Boolean(real) && provided === real;
}
