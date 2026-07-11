import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, visitsTable, visitItemsTable, storesTable, productsTable, networksTable } from "@workspace/db";
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
      networkId: storesTable.networkId,
      networkName: networksTable.name,
      visitedAt: visitsTable.visitedAt,
      notes: visitsTable.notes,
      checkIn: visitsTable.checkIn,
      checkOut: visitsTable.checkOut,
      durationMinutes: visitsTable.durationMinutes,
      status: visitsTable.status,
      photoBefore: visitsTable.photoBefore,
      photoAfter: visitsTable.photoAfter,
      photoBeforeTimestamp: visitsTable.photoBeforeTimestamp,
      photoAfterTimestamp: visitsTable.photoAfterTimestamp,
      photoBeforeLocation: visitsTable.photoBeforeLocation,
      photoAfterLocation: visitsTable.photoAfterLocation,
    })
    .from(visitsTable)
    .innerJoin(storesTable, eq(visitsTable.storeId, storesTable.id))
    .leftJoin(networksTable, eq(storesTable.networkId, networksTable.id))
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
      notes: visitItemsTable.notes,
      supplyStatus: visitItemsTable.supplyStatus,
    })
    .from(visitItemsTable)
    .innerJoin(productsTable, eq(visitItemsTable.productId, productsTable.id))
    .where(eq(visitItemsTable.visitId, visitId));

  return {
    ...visit,
    visitedAt: visit.visitedAt.toISOString(),
    checkIn: visit.checkIn ? visit.checkIn.toISOString() : null,
    checkOut: visit.checkOut ? visit.checkOut.toISOString() : null,
    photoBeforeTimestamp: visit.photoBeforeTimestamp ? visit.photoBeforeTimestamp.toISOString() : null,
    photoAfterTimestamp: visit.photoAfterTimestamp ? visit.photoAfterTimestamp.toISOString() : null,
    items: items.map(item => ({
      ...item,
      price: item.price != null ? parseFloat(item.price) : null,
    })),
  };
}

// 🔥 Buscar visitas por status (incluindo rascunhos)
router.get("/", async (req, res) => {
  const { status } = req.query;
  
  let query = db
    .select({
      id: visitsTable.id,
      storeId: visitsTable.storeId,
      storeName: storesTable.name,
      storeCity: storesTable.city,
      storeState: storesTable.state,
      storeChannel: storesTable.channel,
      visitedAt: visitsTable.visitedAt,
      notes: visitsTable.notes,
      checkIn: visitsTable.checkIn,
      checkOut: visitsTable.checkOut,
      durationMinutes: visitsTable.durationMinutes,
      status: visitsTable.status,
      photoBefore: visitsTable.photoBefore,
      photoAfter: visitsTable.photoAfter,
    })
    .from(visitsTable)
    .innerJoin(storesTable, eq(visitsTable.storeId, storesTable.id));

  if (status) {
    query = query.where(eq(visitsTable.status, status as string));
  }

  const visits = await query.orderBy(visitsTable.visitedAt);

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
          notes: visitItemsTable.notes,
          supplyStatus: visitItemsTable.supplyStatus,
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
      checkIn: v.checkIn ? v.checkIn.toISOString() : null,
      checkOut: v.checkOut ? v.checkOut.toISOString() : null,
      items: (itemsByVisit.get(v.id) || []).map(item => ({
        ...item,
        price: item.price != null ? parseFloat(item.price) : null,
      })),
    }))
  );
});

// 🔥 Criar visita (sempre como rascunho inicialmente)
router.post("/", async (req, res) => {
  const parsed = CreateVisitBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }
  const { storeId, visitedAt, notes, items, checkIn, checkOut, status, photoBefore, photoAfter } = parsed.data;

  const visitId = await db.transaction(async (tx) => {
    const [visit] = await tx
      .insert(visitsTable)
      .values({ 
        storeId, 
        visitedAt: new Date(visitedAt), 
        notes: notes ?? null,
        checkIn: checkIn ? new Date(checkIn) : null,
        checkOut: checkOut ? new Date(checkOut) : null,
        status: status ?? "draft",
        photoBefore: photoBefore || null,
        photoAfter: photoAfter || null,
        photoBeforeTimestamp: photoBefore ? new Date() : null,
        photoAfterTimestamp: photoAfter ? new Date() : null,
      })
      .returning();

    if (checkIn && checkOut) {
      const diffMs = new Date(checkOut).getTime() - new Date(checkIn).getTime();
      const durationMinutes = Math.round(diffMs / 60000);
      await tx
        .update(visitsTable)
        .set({ durationMinutes })
        .where(eq(visitsTable.id, visit.id));
    }

    if (items && items.length > 0) {
      await tx.insert(visitItemsTable).values(
        items.map(item => ({
          visitId: visit.id,
          productId: item.productId,
          inStock: item.inStock,
          price: item.price != null ? String(item.price) : null,
          notes: item.notes ?? null,
          supplyStatus: item.supplyStatus ?? [],
        }))
      );
    }
    return visit.id;
  });

  const result = await buildVisitResponse(visitId);
  res.status(201).json(result);
});

// 🔥 Buscar visita por ID
router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const result = await buildVisitResponse(id);
  if (!result) { res.status(404).json({ error: "Not found" }); return; }
  res.json(result);
});

// 🔥 Atualizar visita
router.put("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const parsed = UpdateVisitBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }
  const { storeId, visitedAt, notes, items, checkIn, checkOut, status, photoBefore, photoAfter } = parsed.data;

  let found = false;
  await db.transaction(async (tx) => {
    const [updated] = await tx
      .update(visitsTable)
      .set({ 
        storeId, 
        visitedAt: new Date(visitedAt), 
        notes: notes ?? null,
        checkIn: checkIn ? new Date(checkIn) : null,
        checkOut: checkOut ? new Date(checkOut) : null,
        status: status ?? "draft",
        photoBefore: photoBefore !== undefined ? photoBefore : null,
        photoAfter: photoAfter !== undefined ? photoAfter : null,
      })
      .where(eq(visitsTable.id, id))
      .returning();

    if (!updated) return;
    found = true;

    if (checkIn && checkOut) {
      const diffMs = new Date(checkOut).getTime() - new Date(checkIn).getTime();
      const durationMinutes = Math.round(diffMs / 60000);
      await tx
        .update(visitsTable)
        .set({ durationMinutes })
        .where(eq(visitsTable.id, id));
    }

    await tx.delete(visitItemsTable).where(eq(visitItemsTable.visitId, id));
    if (items && items.length > 0) {
      await tx.insert(visitItemsTable).values(
        items.map(item => ({
          visitId: id,
          productId: item.productId,
          inStock: item.inStock,
          price: item.price != null ? String(item.price) : null,
          notes: item.notes ?? null,
          supplyStatus: item.supplyStatus ?? [],
        }))
      );
    }
  });

  if (!found) { res.status(404).json({ error: "Not found" }); return; }

  const result = await buildVisitResponse(id);
  res.json(result);
});

// 🔥 Excluir visita
router.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [deleted] = await db.delete(visitsTable).where(eq(visitsTable.id, id)).returning();
  if (!deleted) { res.status(404).json({ error: "Not found" }); return; }
  res.status(204).end();
});

// 🔥 Finalizar visita
router.post("/:id/finish", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { 
    res.status(400).json({ error: "ID inválido" }); 
    return; 
  }

  const now = new Date();
  
  const [visit] = await db
    .select({ 
      checkIn: visitsTable.checkIn,
      status: visitsTable.status 
    })
    .from(visitsTable)
    .where(eq(visitsTable.id, id));

  if (!visit) { 
    res.status(404).json({ error: "Visita não encontrada" }); 
    return; 
  }

  if (visit.status === "completed") {
    res.status(400).json({ error: "Visita já está finalizada" }); 
    return; 
  }

  let checkInTime = visit.checkIn;
  if (!checkInTime) {
    const [visitData] = await db
      .select({ visitedAt: visitsTable.visitedAt })
      .from(visitsTable)
      .where(eq(visitsTable.id, id));
    checkInTime = visitData?.visitedAt || now;
  }

  const diffMs = now.getTime() - new Date(checkInTime).getTime();
  const durationMinutes = Math.max(1, Math.round(diffMs / 60000));

  const [updated] = await db
    .update(visitsTable)
    .set({ 
      status: "completed",
      checkOut: now,
      durationMinutes: durationMinutes,
    })
    .where(eq(visitsTable.id, id))
    .returning();

  if (!updated) { 
    res.status(404).json({ error: "Visita não encontrada" }); 
    return; 
  }

  const result = await buildVisitResponse(id);
  res.json(result);
});

// 🔥 Check-in
router.post("/:id/checkin", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { 
    res.status(400).json({ error: "ID inválido" }); 
    return; 
  }

  const now = new Date();
  const [updated] = await db
    .update(visitsTable)
    .set({ 
      checkIn: now,
      visitedAt: now,
      status: "in_progress",
    })
    .where(eq(visitsTable.id, id))
    .returning();

  if (!updated) { 
    res.status(404).json({ error: "Visita não encontrada" }); 
    return; 
  }

  const result = await buildVisitResponse(id);
  res.json(result);
});

// 🔥 Check-out
router.post("/:id/checkout", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { 
    res.status(400).json({ error: "ID inválido" }); 
    return; 
  }

  const now = new Date();

  const [visit] = await db
    .select({ checkIn: visitsTable.checkIn })
    .from(visitsTable)
    .where(eq(visitsTable.id, id));

  if (!visit) { 
    res.status(404).json({ error: "Visita não encontrada" }); 
    return; 
  }

  if (!visit.checkIn) { 
    res.status(400).json({ error: "Check-in não realizado" }); 
    return; 
  }

  const diffMs = now.getTime() - new Date(visit.checkIn).getTime();
  const durationMinutes = Math.round(diffMs / 60000);

  const [updated] = await db
    .update(visitsTable)
    .set({ 
      checkOut: now,
      durationMinutes: durationMinutes,
    })
    .where(eq(visitsTable.id, id))
    .returning();

  if (!updated) { 
    res.status(404).json({ error: "Visita não encontrada" }); 
    return; 
  }

  const result = await buildVisitResponse(id);
  res.json(result);
});

export default router;