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
    const user = await listUserByEmail(admin, email);
    if (!user) {
      return json(res, 404, { error: "No existe una cuenta con ese correo." });
    }

    if (user.email_confirmed_at) {
      return json(res, 409, { error: "Ese correo ya está verificado." });
    }

    const code = generate4DigitCode();
    await upsertCode(admin, {
      email,
      purpose: "verify_email",
      code,
      metadata: {},
    });

    await sendCodeEmail({
      to: email,
      subject: "Focus Zone | Verifica tu correo",
      heading: "Verificar correo",
      code,
      description: "Usa este código para verificar tu correo y poder iniciar sesión.",
    });

    return json(res, 200, { ok: true });
  } catch (error) {
    return json(res, 500, { error: error instanceof Error ? error.message : "Unexpected error" });
  }
}

