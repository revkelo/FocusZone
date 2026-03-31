import {
  createAdminClient,
  generate4DigitCode,
  getNicknameValidationError,
  json,
  listUserByEmail,
  listUserByNickname,
  normalizeEmail,
  normalizeNickname,
  sendCodeEmail,
  upsertCode,
} from "./_auth-code-utils.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return json(res, 405, { error: "Method not allowed" });
  }

  const email = normalizeEmail(req.body?.email);
  const nickname = normalizeNickname(req.body?.nickname);

  if (!email || !email.includes("@")) {
    return json(res, 400, { error: "Correo invalido." });
  }

  const nicknameError = getNicknameValidationError(nickname);
  if (nicknameError) {
    return json(res, 400, { error: nicknameError });
  }

  try {
    const admin = createAdminClient();
    const existing = await listUserByEmail(admin, email);
    if (existing) {
      return json(res, 409, { error: "Este correo ya esta registrado." });
    }

    const existingNickname = await listUserByNickname(admin, nickname);
    if (existingNickname) {
      return json(res, 409, { error: "Ese nickname ya esta en uso." });
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
      subject: "Focus Zone | Codigo de verificacion",
      heading: "Verifica tu correo",
      code,
      description: "Usa este codigo para terminar tu registro en Focus Zone.",
    });

    return json(res, 200, { ok: true });
  } catch (error) {
    return json(res, 500, { error: error instanceof Error ? error.message : "Unexpected error" });
  }
}
