/* global process */

import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

const json = (res, status, body) => {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return json(res, 405, { error: "Method not allowed" });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
  const vapidSubject = process.env.VAPID_SUBJECT || "mailto:admin@focuszone.app";

  if (!supabaseUrl || !serviceRoleKey || !vapidPublicKey || !vapidPrivateKey) {
    return json(res, 500, { error: "Missing push env vars in server" });
  }

  const { userId, title, body } = req.body ?? {};
  if (!userId) {
    return json(res, 400, { error: "userId is required" });
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: subscriptions, error } = await admin
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth, subscription")
    .eq("user_id", userId);

  if (error) {
    return json(res, 500, { error: "Failed to load subscriptions" });
  }

  if (!subscriptions || subscriptions.length === 0) {
    return json(res, 404, { error: "No push subscriptions for user" });
  }

  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

  const payload = JSON.stringify({
    title: title || "FocusZone | Prueba Push",
    body: body || "Notificación push real enviada a tu dispositivo.",
    icon: "/favicon.svg",
    badge: "/favicon.svg",
    tag: "focuszone-push-test",
    url: "/dashboard",
  });

  let sent = 0;
  const staleIds = [];

  for (const row of subscriptions) {
    const subscription = row.subscription ?? {
      endpoint: row.endpoint,
      keys: {
        p256dh: row.p256dh,
        auth: row.auth,
      },
    };

    try {
      await webpush.sendNotification(subscription, payload);
      sent += 1;
    } catch (pushError) {
      const statusCode = pushError?.statusCode ?? 0;
      if (statusCode === 404 || statusCode === 410) {
        staleIds.push(row.id);
      }
    }
  }

  if (staleIds.length > 0) {
    await admin.from("push_subscriptions").delete().in("id", staleIds);
  }

  if (sent === 0) {
    return json(res, 502, { error: "Push provider rejected all subscriptions" });
  }

  return json(res, 200, { ok: true, sent, removed: staleIds.length });
}
