import app from "./app";
import { logger } from "./lib/logger";
import scheduledVisitsRoutes from "./routes/scheduledVisits";
import clientsRoutes from "./routes/clients";
import promotersRoutes from "./routes/promoters";
import uploadRoutes from "./routes/upload";
import supplyStatusRoutes from "./routes/supplyStatus";
import productsRoutes from "./routes/products";
import storesRoutes from "./routes/stores";
import networksRoutes from "./routes/networks";
import categoriesRoutes from "./routes/categories";
import visitsRoutes from "./routes/visits";
import reportsRoutes from "./routes/reports";
import dashboardRoutes from "./routes/dashboard";
import express from "express";
import path from "path";
import fs from "fs";

const rawPort = process.env["PORT"] || "3000";

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

// 🔥 Servir arquivos estáticos com caminho ABSOLUTO da raiz
const uploadsPath = path.resolve(process.cwd(), "../../uploads");
console.log(`📁 Servindo uploads de: ${uploadsPath}`);
console.log(`📁 Existe? ${fs.existsSync(uploadsPath)}`);

app.use("/uploads", express.static(uploadsPath));

// Registrar rotas
app.use("/api/scheduled-visits", scheduledVisitsRoutes);
app.use("/api/clients", clientsRoutes);
app.use("/api/promoters", promotersRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/supply-status", supplyStatusRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/stores", storesRoutes);
app.use("/api/networks", networksRoutes);
app.use("/api/categories", categoriesRoutes);
app.use("/api/visits", visitsRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});
