import app from "./app";
import { logger } from "./lib/logger";
import scheduledVisitsRoutes from "./routes/scheduledVisits";
import clientsRoutes from "./routes/clients";
import promotersRoutes from "./routes/promoters";
import uploadRoutes from "./routes/upload";
import supplyStatusRoutes from "./routes/supplyStatus";
import productsRoutes from "./routes/products";
import storesRoutes from "./routes/stores";
import networksRoutes from "./routes/networks";     // 🔥 NOVO
import categoriesRoutes from "./routes/categories"; // 🔥 NOVO
import express from "express";
import path from "path";

const rawPort = process.env["PORT"] || "3000";

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

// Registrar rotas
app.use("/api/scheduled-visits", scheduledVisitsRoutes);
app.use("/api/clients", clientsRoutes);
app.use("/api/promoters", promotersRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/supply-status", supplyStatusRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/stores", storesRoutes);
app.use("/api/networks", networksRoutes);     // 🔥 NOVO
app.use("/api/categories", categoriesRoutes); // 🔥 NOVO

// Servir arquivos estáticos
app.use("/uploads", express.static(path.join(__dirname, "../../uploads")));

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});