import express from "express";
import httpProxy from "http-proxy";
import { fileURLToPath } from "node:url";

const app = express();
const port = Number(process.env.PORT || 3000);
const frontendDirectory = fileURLToPath(
  new URL("./dist/", import.meta.url),
);

if (!process.env.API_TARGET) {
  throw new Error("Falta configurar API_TARGET.");
}

const target = new URL(process.env.API_TARGET);

const proxy = httpProxy.createProxyServer({
  target: target.origin,
  changeOrigin: true,
  xfwd: true,
  secure: true,
  proxyTimeout: 30000,
});

proxy.on("error", (error, _request, response) => {
  console.error("Error al conectar con la API:", error.message);

  if (!response.headersSent) {
    response.writeHead(502, {
      "Content-Type": "application/json",
    });
  }

  response.end(JSON.stringify({
    message: "No se pudo conectar con la API.",
  }));
});

app.disable("x-powered-by");

app.use((request, response, next) => {
  if (request.path === "/api" || request.path.startsWith("/api/")) {
    proxy.web(request, response);
    return;
  }

  next();
});

app.use(express.static(frontendDirectory));

app.get("/{*route}", (_request, response) => {
  response.sendFile(`${frontendDirectory}index.html`);
});

const server = app.listen(port, "0.0.0.0", () => {
  console.log(`Frontend disponible en el puerto ${port}`);
});

process.on("SIGTERM", () => {
  server.close(() => {
    proxy.close();
    process.exit(0);
  });
});