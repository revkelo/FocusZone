/* global process */

import crypto from "crypto";
import nodemailer from "nodemailer";
import { createClient } from "@supabase/supabase-js";

const CODE_TTL_MINUTES = 10;
const MAX_ATTEMPTS = 5;
const MAX_NICKNAME_LENGTH = 30;
const BLOCKED_NICKNAME_TERMS = [
  "hpta",
  "hp",
  "gonorrea",
  "marica",
  "idiota",
  "imbecil",
  "estupido",
  "pendejo",
  "mierda",
  "puta",
  "puto",
  "sexo",
  "sexual",
  "porn",
  "porno",
  "xxx",
  "onlyfans",
  "nudes",
  "nude",
  "tet",
  "teta",
  "pene",
  "vagina",
  "culo",
  "verga",
  "pito",
  "monda",
];

export const json = (res, status, body) => {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
};

export const normalizeEmail = (value) => String(value || "").trim().toLowerCase();
export const normalizeNickname = (value) => String(value || "").trim();
export const toNicknameModerationForm = (value) =>
  normalizeNickname(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[013457@$]/g, (char) => {
      if (char === "0") return "o";
      if (char === "1") return "i";
      if (char === "3") return "e";
      if (char === "4") return "a";
      if (char === "5" || char === "$") return "s";
      if (char === "7") return "t";
      if (char === "@") return "a";
      return char;
    })
    .replace(/[^a-z0-9]/g, "");

export const getNicknameValidationError = (value) => {
  const nickname = normalizeNickname(value);
  if (nickname.length < 3) {
    return "Nickname inválido.";
  }
  if (nickname.length > MAX_NICKNAME_LENGTH) {
    return `El nickname no puede superar ${MAX_NICKNAME_LENGTH} caracteres.`;
  }
  if (/\s/.test(nickname)) {
    return "El nickname no puede tener espacios.";
  }

  const normalized = toNicknameModerationForm(nickname);
  const blocked = BLOCKED_NICKNAME_TERMS.some((term) => normalized.includes(term));
  if (blocked) {
    return "Ese nickname no está permitido por contenido ofensivo o sexual.";
  }

  return "";
};

export const generate4DigitCode = () => String(Math.floor(1000 + Math.random() * 9000));

export const hashCode = (code) => crypto.createHash("sha256").update(String(code)).digest("hex");

export const createAdminClient = () => {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing SUPABASE_URL/VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
};

export const getTransporter = () => {
  const host = String(process.env.SMTP_HOST || "").trim();
  const port = Number(process.env.SMTP_PORT || 587);
  const user = String(process.env.SMTP_USER || "").trim();
  const rawPass = String(process.env.SMTP_PASS || "");
  const pass = /gmail\.com$/i.test(host) ? rawPass.replace(/\s+/g, "") : rawPass.trim();

  if (!host || !user || !pass) {
    throw new Error("Missing SMTP_HOST/SMTP_USER/SMTP_PASS");
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
};

export const sendCodeEmail = async ({ to, subject, heading, code, description }) => {
  const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;
  const fromName = process.env.SMTP_FROM_NAME || "Focus Zone";
  const transporter = getTransporter();
  const year = new Date().getFullYear();

  try {
    await transporter.sendMail({
      from: `${fromName} <${fromEmail}>`,
      to,
      replyTo: fromEmail,
      subject,
      text: `${heading}\n\nCodigo: ${code}\n\n${description}\n\nEste código vence en ${CODE_TTL_MINUTES} minutos.`,
      html: `
      <div style="margin:0;padding:24px;background:#f5f2ff">
        <div style="font-family:Segoe UI,Arial,sans-serif;max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e6ddff">
          <div style="background:#5b30d9;padding:14px 18px;color:#ffffff;font-weight:700;letter-spacing:.4px">
            Focus Zone
          </div>
          <div style="padding:24px;color:#1f2937">
            <h2 style="margin:0 0 12px;color:#5b30d9;font-size:28px;line-height:1.1">${heading}</h2>
            <p style="margin:0 0 16px;font-size:16px;line-height:1.5">${description}</p>
            <div style="font-size:38px;letter-spacing:10px;font-weight:800;background:#f3efff;border:1px solid #d7c8ff;padding:16px 18px;display:inline-block;color:#5b30d9">
              ${code}
            </div>
            <p style="margin:16px 0 0;font-size:14px;color:#4b5563">Este código vence en ${CODE_TTL_MINUTES} minutos.</p>
            <p style="margin:18px 0 0;font-size:13px;color:#6b7280">
              Si no solicitaste este código, ignora este correo.
            </p>
          </div>
          <div style="padding:14px 18px;border-top:1px solid #ece7ff;color:#6b7280;font-size:12px;line-height:1.5">
            Correo transaccional automatico de seguridad.<br/>
            © ${year} Focus Zone
          </div>
        </div>
      </div>
    `,
      headers: {
        "X-Auto-Response-Suppress": "All",
        "Auto-Submitted": "auto-generated",
      },
    });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "EAUTH") {
      throw new Error(
        "No se pudo autenticar en Gmail SMTP. Verifica SMTP_USER y genera una nueva App Password (Google > Security > 2-Step Verification > App passwords)."
      );
    }
    throw error;
  }
};

export const listUserByEmail = async (admin, email) => {
  let page = 1;
  const perPage = 200;

  while (page < 50) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) {
      throw new Error(error.message || "Failed to list users");
    }

    const users = data?.users || [];
    const found = users.find((user) => String(user.email || "").toLowerCase() === email);
    if (found) {
      return found;
    }

    if (users.length < perPage) {
      return null;
    }

    page += 1;
  }

  return null;
};

export const listUserByNickname = async (admin, nickname) => {
  const normalized = normalizeNickname(nickname).toLowerCase();
  if (!normalized) {
    return null;
  }

  let page = 1;
  const perPage = 200;

  while (page < 50) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) {
      throw new Error(error.message || "Failed to list users");
    }

    const users = data?.users || [];
    const found = users.find((user) => {
      const meta = user.user_metadata || {};
      const existing = String(meta.nickname || meta.full_name || "").trim().toLowerCase();
      return existing === normalized;
    });
    if (found) {
      return found;
    }

    if (users.length < perPage) {
      return null;
    }

    page += 1;
  }

  return null;
};

export const upsertCode = async (admin, { email, purpose, code, metadata = {} }) => {
  const codeHash = hashCode(code);
  const expiresAt = new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000).toISOString();

  await admin
    .from("auth_email_codes")
    .delete()
    .eq("email", email)
    .eq("purpose", purpose)
    .is("consumed_at", null);

  const { error } = await admin.from("auth_email_codes").insert({
    email,
    purpose,
    code_hash: codeHash,
    metadata,
    attempts: 0,
    expires_at: expiresAt,
  });

  if (error) {
    throw new Error(error.message || "No se pudo guardar el código.");
  }
};

export const verifyCodeRecord = async (admin, { email, purpose, code }) => {
  const { data, error } = await admin
    .from("auth_email_codes")
    .select("id, code_hash, attempts, metadata, expires_at")
    .eq("email", email)
    .eq("purpose", purpose)
    .is("consumed_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message || "No se pudo verificar el código.");
  }

  if (!data) {
    return { ok: false, reason: "missing" };
  }

  const isExpired = Date.now() > new Date(data.expires_at).getTime();
  if (isExpired) {
    await admin.from("auth_email_codes").update({ consumed_at: new Date().toISOString() }).eq("id", data.id);
    return { ok: false, reason: "expired" };
  }

  const matches = hashCode(code) === data.code_hash;
  if (!matches) {
    const nextAttempts = (data.attempts || 0) + 1;
    await admin
      .from("auth_email_codes")
      .update({
        attempts: nextAttempts,
        consumed_at: nextAttempts >= MAX_ATTEMPTS ? new Date().toISOString() : null,
      })
      .eq("id", data.id);

    return { ok: false, reason: "invalid", attemptsLeft: Math.max(0, MAX_ATTEMPTS - nextAttempts) };
  }

  await admin.from("auth_email_codes").update({ consumed_at: new Date().toISOString() }).eq("id", data.id);
  return { ok: true, metadata: data.metadata || {} };
};
