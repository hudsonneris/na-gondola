import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, storesTable, insertStoreSchema } from "@workspace/db";
import { CreateStoreBody, UpdateStoreBody } from "@workspace/api-zod";

const router = Router();

router.get("/", async (req, res) => {
  const stores = await db.select().from(storesTable).orderBy(storesTable.name);
  res.json(stores.map(s => ({ ...s, createdAt: s.createdAt.toISOString() })));
});

router.post("/", async (req, res) => {
  const parsed = CreateStoreBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }
  const [store] = await db.insert(storesTable).values(parsed.data).returning();
  res.status(201).json({ ...store, createdAt: store.createdAt.toISOString() });
});

router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [store] = await db.select().from(storesTable).where(eq(storesTable.id, id));
  if (!store) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...store, createdAt: store.createdAt.toISOString() });
});

router.put("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const parsed = UpdateStoreBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }
  const [store] = await db.update(storesTable).set(parsed.data).where(eq(storesTable.id, id)).returning();
  if (!store) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...store, createdAt: store.createdAt.toISOString() });
});

router.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [deleted] = await db.delete(storesTable).where(eq(storesTable.id, id)).returning();
  if (!deleted) { res.status(404).json({ error: "Not found" }); return; }
  res.status(204).end();
});

export default router;
