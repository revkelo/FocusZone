import { createAdminClient, json, listUserByEmail, normalizeEmail, verifyCodeRecord } from "./_auth-code-utils.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return json(res, 405, { error: "Method not allowed" });
  }

  const email = normalizeEmail(req.body?.email);
  const code = String(req.body?.code || "").trim();

  if (!email || !email.includes("@")) {
    return json(res, 400, { error: "Correo inválido." });
  }
  if (!/^\d{4}$/.test(code)) {
    return json(res, 400, { error: "Código inválido." });
  }

  try {
    const admin = createAdminClient();
    const verification = await verifyCodeRecord(admin, { email, purpose: "verify_email", code });
    if (!verification.ok) {
      if (verification.reason === "expired") {
        return json(res, 400, { error: "El código expiró. Solicita uno nuevo." });
      }
      if (verification.reason === "invalid") {
        return json(res, 400, { error: `Código incorrecto. Intentos restantes: ${verification.attemptsLeft}` });
      }
      return json(res, 400, { error: "No hay código activo para este correo." });
    }

    const user = await listUserByEmail(admin, email);
    if (!user?.id) {
      return json(res, 404, { error: "No existe una cuenta con ese correo." });
    }

    const { error } = await admin.auth.admin.updateUserById(user.id, {
      email_confirm: true,
    });
    if (error) {
      return json(res, 500, { error: error.message || "No se pudo verificar el correo." });
    }

    return json(res, 200, { ok: true });
  } catch (error) {
    return json(res, 500, { error: error instanceof Error ? error.message : "Unexpected error" });
  }
}

