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
  if (!email || !email.includes("@")) {
    return json(res, 400, { error: "Correo inválido." });
  }

  try {
    const admin = createAdminClient();
    const existing = await listUserByEmail(admin, email);

    // Respuesta genérica para no filtrar si el correo existe o no.
    if (!existing) {
      return json(res, 404, { error: "No hay ninguna cuenta registrada con ese correo." });
    }

    const code = generate4DigitCode();
    await upsertCode(admin, {
      email,
      purpose: "password_reset",
      code,
      metadata: {},
    });

    await sendCodeEmail({
      to: email,
      subject: "Focus Zone | Recuperación de contraseña",
      heading: "Recuperar contraseña",
      code,
      description: "Usa este código para crear una nueva contraseña en Focus Zone.",
    });

    return json(res, 200, { ok: true });
  } catch (error) {
    return json(res, 500, { error: error instanceof Error ? error.message : "Unexpected error" });
  }
}
