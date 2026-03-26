import { createAdminClient, json, listUserByEmail, normalizeEmail, verifyCodeRecord } from "./_auth-code-utils.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return json(res, 405, { error: "Method not allowed" });
  }

  const email = normalizeEmail(req.body?.email);
  const code = String(req.body?.code || "").trim();
  const newPassword = String(req.body?.newPassword || "");

  if (!email || !email.includes("@")) {
    return json(res, 400, { error: "Correo inválido." });
  }
  if (!/^\d{4}$/.test(code)) {
    return json(res, 400, { error: "Código inválido." });
  }
  if (newPassword.length < 6) {
    return json(res, 400, { error: "La nueva contraseña debe tener mínimo 6 caracteres." });
  }

  try {
    const admin = createAdminClient();
    const verification = await verifyCodeRecord(admin, { email, purpose: "password_reset", code });
    if (!verification.ok) {
      if (verification.reason === "expired") {
        return json(res, 400, { error: "El código expiró. Solicita uno nuevo." });
      }
      if (verification.reason === "invalid") {
        return json(res, 400, { error: `Código incorrecto. Intentos restantes: ${verification.attemptsLeft}` });
      }
      return json(res, 400, { error: "No hay código activo para este correo." });
    }

    const existing = await listUserByEmail(admin, email);
    if (!existing?.id) {
      return json(res, 200, { ok: true });
    }

    const { error } = await admin.auth.admin.updateUserById(existing.id, {
      password: newPassword,
    });

    if (error) {
      return json(res, 500, { error: error.message || "No se pudo actualizar la contraseña." });
    }

    return json(res, 200, { ok: true });
  } catch (error) {
    return json(res, 500, { error: error instanceof Error ? error.message : "Unexpected error" });
  }
}
