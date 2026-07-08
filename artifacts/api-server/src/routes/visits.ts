import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, visitsTable, visitItemsTable, storesTable, productsTable } from "@workspace/db";
import { CreateVisitBody, UpdateVisitBody } from "@workspace/api-zod";

const router = Router();

async function buildVisitResponse(visitId: number) {
  const [visit] = await db
    .select({
      id: visitsTable.id,
      storeId: visitsTable.storeId,
      storeName: storesTable.name,
      storeCity: storesTable.city,
      storeState: storesTable.state,
      storeChannel: storesTable.channel,
      visitedAt: visitsTable.visitedAt,
      notes: visitsTable.notes,
    })
    .from(visitsTable)
    .innerJoin(storesTable, eq(visitsTable.storeId, storesTable.id))
    .where(eq(visitsTable.id, visitId));

  if (!visit) return null;

  const items = await db
    .select({
      id: visitItemsTable.id,
      visitId: visitItemsTable.visitId,
      productId: visitItemsTable.productId,
      productName: productsTable.name,
      productCategory: productsTable.category,
      inStock: visitItemsTable.inStock,
      price: visitItemsTable.price,
      shelfCondition: visitItemsTable.shelfCondition,
      notes: visitItemsTable.notes,
    })
    .from(visitItemsTable)
    .innerJoin(productsTable, eq(visitItemsTable.productId, productsTable.id))
    .where(eq(visitItemsTable.visitId, visitId));

  return {
    ...visit,
    visitedAt: visit.visitedAt.toISOString(),
    items: items.map(item => ({
      ...item,
      price: item.price != null ? parseFloat(item.price) : null,
    })),
  };
}

router.get("/", async (req, res) => {
  const visits = await db
    .select({
      id: visitsTable.id,
      storeId: visitsTable.storeId,
      storeName: storesTable.name,
      storeCity: storesTable.city,
      storeState: storesTable.state,
      storeChannel: storesTable.channel,
      visitedAt: visitsTable.visitedAt,
      notes: visitsTable.notes,
    })
    .from(visitsTable)
    .innerJoin(storesTable, eq(visitsTable.storeId, storesTable.id))
    .orderBy(visitsTable.visitedAt);

  const visitIds = visits.map(v => v.id);
  const allItems = visitIds.length > 0
    ? await db
        .select({
          id: visitItemsTable.id,
          visitId: visitItemsTable.visitId,
          productId: visitItemsTable.productId,
          productName: productsTable.name,
          productCategory: productsTable.category,
          inStock: visitItemsTable.inStock,
          price: visitItemsTable.price,
          shelfCondition: visitItemsTable.shelfCondition,
          notes: visitItemsTable.notes,
        })
        .from(visitItemsTable)
        .innerJoin(productsTable, eq(visitItemsTable.productId, productsTable.id))
    : [];

  const itemsByVisit = new Map<number, typeof allItems>();
  for (const item of allItems) {
    if (!itemsByVisit.has(item.visitId)) itemsByVisit.set(item.visitId, []);
    itemsByVisit.get(item.visitId)!.push(item);
  }

  res.json(
    visits.map(v => ({
      ...v,
      visitedAt: v.visitedAt.toISOString(),
      items: (itemsByVisit.get(v.id) || []).map(item => ({
        ...item,
        price: item.price != null ? parseFloat(item.price) : null,
      })),
    }))
  );
});

router.post("/", async (req, res) => {
  const parsed = CreateVisitBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }
  const { storeId, visitedAt, notes, items } = parsed.data;

  const visitId = await db.transaction(async (tx) => {
    const [visit] = await tx
      .insert(visitsTable)
      .values({ storeId, visitedAt: new Date(visitedAt), notes: notes ?? null })
      .returning();

    if (items && items.length > 0) {
      await tx.insert(visitItemsTable).values(
        items.map(item => ({
          visitId: visit.id,
          productId: item.productId,
          inStock: item.inStock,
          price: item.price != null ? String(item.price) : null,
          shelfCondition: item.shelfCondition,
          notes: item.notes ?? null,
        }))
      );
    }
    return visit.id;
  });

  const result = await buildVisitResponse(visitId);
  res.status(201).json(result);
});

router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const result = await buildVisitResponse(id);
  if (!result) { res.status(404).json({ error: "Not found" }); return; }
  res.json(result);
});

router.put("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const parsed = UpdateVisitBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }
  const { storeId, visitedAt, notes, items } = parsed.data;

  let found = false;
  await db.transaction(async (tx) => {
    const [updated] = await tx
      .update(visitsTable)
      .set({ storeId, visitedAt: new Date(visitedAt), notes: notes ?? null })
      .where(eq(visitsTable.id, id))
      .returning();

    if (!updated) return;
    found = true;

    await tx.delete(visitItemsTable).where(eq(visitItemsTable.visitId, id));
    if (items && items.length > 0) {
      await tx.insert(visitItemsTable).values(
        items.map(item => ({
          visitId: id,
          productId: item.productId,
          inStock: item.inStock,
          price: item.price != null ? String(item.price) : null,
          shelfCondition: item.shelfCondition,
          notes: item.notes ?? null,
        }))
      );
    }
  });

  if (!found) { res.status(404).json({ error: "Not found" }); return; }

  const result = await buildVisitResponse(id);
  res.json(result);
});

router.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [deleted] = await db.delete(visitsTable).where(eq(visitsTable.id, id)).returning();
  if (!deleted) { res.status(404).json({ error: "Not found" }); return; }
  res.status(204).end();
});

export default router;
