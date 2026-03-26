/* global process */

const LUMI_SYSTEM_PROMPT = `Eres Lumi, el chatbot del proyecto Zone Focus. Respondes unicamente preguntas relacionadas con este proyecto, en espanol, con un tono claro, cercano, juvenil y util.

Contexto:
Zone Focus es un proyecto de campana de comunicacion transmedia de la Universidad El Bosque que busca promover un uso mas consciente de las redes sociales y la tecnologia digital dentro de la biblioteca. El proyecto nace por la preocupacion sobre el uso excesivo del celular, la perdida de concentracion y el poco conocimiento de los recursos, tecnologias y espacios que ofrece la biblioteca.

Objetivo:
Visibilizar la biblioteca como un espacio de pausa digital, concentracion, bienestar academico y exploracion tecnologica, mientras se fomenta un uso mas consciente de las redes sociales.

Temas sobre los que puedes responder:
- explicacion general del proyecto
- objetivos y enfoque
- habitos digitales de los estudiantes
- uso consciente de la tecnologia
- atencion y concentracion
- ideas de campana y activaciones
- textos, copies y mensajes para piezas
- recursos y servicios de la biblioteca dentro del proyecto

Instrucciones:
- Mantente siempre centrado en Zone Focus.
- No inventes informacion.
- Si te preguntan algo fuera del proyecto, responde amablemente que solo puedes ayudar con temas relacionados con Zone Focus.
- Da respuestas breves, claras y utiles.
- Cuando ayude, relaciona las respuestas con biblioteca, pausa digital, bienestar, atencion, concentracion y tecnologia.
- Presentate siempre como Lumi si corresponde.`;

const json = (res, status, body) => {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return json(res, 405, { error: "Method not allowed" });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini";
  const siteUrl = process.env.OPENROUTER_SITE_URL || "https://focuszone.app";
  const siteName = process.env.OPENROUTER_SITE_NAME || "FocusZone";

  if (!apiKey) {
    return json(res, 500, { error: "Missing OPENROUTER_API_KEY" });
  }

  const message = req.body?.message?.toString().trim();
  if (!message) {
    return json(res, 400, { error: "message is required" });
  }

  try {
    const upstream = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": siteUrl,
        "X-Title": siteName,
      },
      body: JSON.stringify({
        model,
        temperature: 0.4,
        messages: [
          { role: "system", content: LUMI_SYSTEM_PROMPT },
          { role: "user", content: message },
        ],
      }),
    });

    if (!upstream.ok) {
      const errText = await upstream.text();
      const retryAfterRaw = upstream.headers.get("retry-after");
      const retryAfterSeconds = Number.parseInt(retryAfterRaw || "", 10);
      const retryAfter = Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0 ? retryAfterSeconds : 20;

      if (upstream.status === 429) {
        res.setHeader("Retry-After", String(retryAfter));
        return json(res, 429, {
          error: "Lumi esta temporalmente saturada. Intenta de nuevo en unos segundos.",
          retryAfter,
        });
      }

      return json(res, upstream.status, {
        error: "Upstream model request failed",
        details: errText.slice(0, 500),
      });
    }

    const data = await upstream.json();
    const answer = data?.choices?.[0]?.message?.content?.trim();

    if (!answer) {
      return json(res, 502, { error: "Model returned empty content" });
    }

    return json(res, 200, { reply: answer, model: data?.model || model });
  } catch (error) {
    return json(res, 500, {
      error: "Unexpected server error",
      details: error instanceof Error ? error.message : "unknown",
    });
  }
}
