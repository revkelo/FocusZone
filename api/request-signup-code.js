import {
  createAdminClient,
  generate4DigitCode,
  json,
  listUserByEmail,
  normalizeEmail,
  sendCodeEmail,
  upsertCode,
} from "./_auth-code-utils.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return json(res, 405, { error: "Method not allowed" });
  }

  const email = normalizeEmail(req.body?.email);
  const nickname = String(req.body?.nickname || "").trim();

  if (!email || !email.includes("@")) {
    return json(res, 400, { error: "Correo inválido." });
  }
  if (nickname.length < 3) {
    return json(res, 400, { error: "Nickname inválido." });
  }

  try {
    const admin = createAdminClient();
    const existing = await listUserByEmail(admin, email);
    if (existing) {
      return json(res, 409, { error: "Este correo ya está registrado." });
    }

    const code = generate4DigitCode();
    await upsertCode(admin, {
      email,
      purpose: "signup",
      code,
      metadata: { nickname },
    });

    await sendCodeEmail({
      to: email,
      subject: "Focus Zone | Código de verificación",
      heading: "Verifica tu correo",
      code,
      description: "Usa este código para terminar tu registro en Focus Zone.",
    });

    return json(res, 200, { ok: true });
  } catch (error) {
    return json(res, 500, { error: error instanceof Error ? error.message : "Unexpected error" });
  }
}
