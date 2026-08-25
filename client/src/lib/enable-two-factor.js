export async function enableRequiredTwoFactor({
  apiBase,
  password,
  fetchImpl = fetch,
}) {
  const response = await fetchImpl(`${apiBase}/api/enable-2fa`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ password }),
  });

  if (!response.ok) {
    throw new Error("No se pudo activar la verificación en dos pasos");
  }
}
