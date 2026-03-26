import { createAdminClient, json, listUserByEmail, normalizeEmail, verifyCodeRecord } from "./_auth-code-utils.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return json(res, 405, { error: "Method not allowed" });
  }

  const email = normalizeEmail(req.body?.email);
  const nickname = String(req.body?.nickname || "").trim();
  const password = String(req.body?.password || "");
  const code = String(req.body?.code || "").trim();

  if (!email || !email.includes("@")) {
    return json(res, 400, { error: "Correo inválido." });
  }
  if (nickname.length < 3) {
    return json(res, 400, { error: "Nickname inválido." });
  }
  if (password.length < 6) {
    return json(res, 400, { error: "La contraseña debe tener mínimo 6 caracteres." });
  }
  if (!/^\d{4}$/.test(code)) {
    return json(res, 400, { error: "Código inválido." });
  }

  try {
    const admin = createAdminClient();
    const verification = await verifyCodeRecord(admin, { email, purpose: "signup", code });
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
    if (existing) {
      return json(res, 409, { error: "Este correo ya está registrado." });
    }

    const finalNickname = String(verification.metadata?.nickname || nickname).trim();
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: finalNickname, nickname: finalNickname },
    });

    if (error || !data?.user) {
      return json(res, 500, { error: error?.message || "No se pudo crear la cuenta." });
    }

    return json(res, 200, { ok: true });
  } catch (error) {
    return json(res, 500, { error: error instanceof Error ? error.message : "Unexpected error" });
  }
}
