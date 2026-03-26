import { defineConfig, loadEnv } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Buffer } from "node:buffer";
import process from "node:process";

const rootDir = fileURLToPath(new URL(".", import.meta.url));
const srcRoot = resolve(rootDir, "src");
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

const parseRequestBody = async (request) => {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }

  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw) {
    return {};
  }
  return JSON.parse(raw);
};

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, rootDir, "");

  return {
    root: srcRoot,
    envDir: rootDir,
    publicDir: resolve(rootDir, "public"),
    plugins: [
    react(),
    tailwindcss(),
    {
      name: "dev-lumi-chat-endpoint",
      configureServer(server) {
        server.middlewares.use("/api/lumi-chat", async (req, res) => {
          if (req.method !== "POST") {
            res.statusCode = 405;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "Method not allowed" }));
            return;
          }

          try {
            const body = await parseRequestBody(req);
            const message = String(body?.message ?? "").trim();
            if (!message) {
              res.statusCode = 400;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ error: "message is required" }));
              return;
            }

            const apiKey = env.OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY;
            const model = env.OPENROUTER_MODEL || process.env.OPENROUTER_MODEL || "openrouter/free";
            const siteUrl = env.OPENROUTER_SITE_URL || process.env.OPENROUTER_SITE_URL || "https://focuszone.app";
            const siteName = env.OPENROUTER_SITE_NAME || process.env.OPENROUTER_SITE_NAME || "FocusZone";

            if (!apiKey) {
              res.statusCode = 500;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ error: "Missing OPENROUTER_API_KEY" }));
              return;
            }

            const upstream = await fetch("https://openrouter.ai/api/v1/chat/completions", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
                "HTTP-Referer": siteUrl,
                "X-OpenRouter-Title": siteName,
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
              const text = await upstream.text();
              res.statusCode = upstream.status;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ error: "Upstream model request failed", details: text.slice(0, 500) }));
              return;
            }

            const data = await upstream.json();
            const reply = data?.choices?.[0]?.message?.content?.trim();
            if (!reply) {
              res.statusCode = 502;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ error: "Model returned empty content" }));
              return;
            }

            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ reply, model: data?.model || model }));
          } catch (error) {
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.end(
              JSON.stringify({
                error: "Unexpected server error",
                details: error instanceof Error ? error.message : "unknown",
              }),
            );
          }
        });
      },
    },
    ],
    build: {
      outDir: resolve(rootDir, "dist"),
      emptyOutDir: true,
      rollupOptions: {
        input: {
          index: resolve(srcRoot, "index.html"),
        },
      },
    },
    server: {
      allowedHosts: true,
    },
  };
});
