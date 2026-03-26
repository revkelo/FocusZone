import { defineConfig, loadEnv } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Buffer } from "node:buffer";
import lumiChatHandler from "./api/lumi-chat.js";
import pushTestHandler from "./api/push-test.js";
import requestSignupCodeHandler from "./api/request-signup-code.js";
import completeSignupWithCodeHandler from "./api/complete-signup-with-code.js";
import requestPasswordResetCodeHandler from "./api/request-password-reset-code.js";
import resetPasswordWithCodeHandler from "./api/reset-password-with-code.js";

const rootDir = fileURLToPath(new URL(".", import.meta.url));
const srcRoot = resolve(rootDir, "src");

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
  Object.assign(process.env, env);

  return {
    root: srcRoot,
    envDir: rootDir,
    publicDir: resolve(rootDir, "public"),
    plugins: [
    react(),
    tailwindcss(),
      {
        name: "dev-api-endpoints",
        configureServer(server) {
          const handlers = new Map([
            ["/lumi-chat", lumiChatHandler],
            ["/push-test", pushTestHandler],
            ["/request-signup-code", requestSignupCodeHandler],
            ["/complete-signup-with-code", completeSignupWithCodeHandler],
            ["/request-password-reset-code", requestPasswordResetCodeHandler],
            ["/reset-password-with-code", resetPasswordWithCodeHandler],
          ]);

          server.middlewares.use("/api", async (req, res, next) => {
            const requestPath = (req.url || "").split("?")[0];
            const handler = handlers.get(requestPath);
            if (!handler) {
              next();
              return;
            }

            try {
              if (req.method === "POST" || req.method === "PUT" || req.method === "PATCH") {
                req.body = await parseRequestBody(req);
              } else {
                req.body = req.body ?? {};
              }

              await handler(req, res);
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
