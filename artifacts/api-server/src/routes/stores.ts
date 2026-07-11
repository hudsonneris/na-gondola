import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { db, storesTable, networksTable } from "@workspace/db";

const router = Router();

// 🔥 Buscar todas as lojas
router.get("/", async (req, res) => {
  try {
    const stores = await db
      .select({
        id: storesTable.id,
        name: storesTable.name,
        networkId: storesTable.networkId,
        networkName: networksTable.name,
        street: storesTable.street,
        number: storesTable.number,
        neighborhood: storesTable.neighborhood,
        complement: storesTable.complement,
        city: storesTable.city,
        state: storesTable.state,
        zipCode: storesTable.zipCode,
        phone: storesTable.phone,
        channel: storesTable.channel,
        storeCode: storesTable.storeCode,
        visitValue: storesTable.visitValue,
        createdAt: storesTable.createdAt,
      })
      .from(storesTable)
      .leftJoin(networksTable, eq(storesTable.networkId, networksTable.id))
      .orderBy(storesTable.name);

    console.log("📦 Lojas encontradas:", stores.length);
    res.json(stores.map(s => ({
      ...s,
      createdAt: s.createdAt?.toISOString(),
      visitValue: s.visitValue ? parseFloat(s.visitValue) : null
    })));
  } catch (error) {
    console.error("❌ Erro ao buscar lojas:", error);
    res.status(500).json({ error: "Erro ao buscar lojas" });
  }
});

// 🔥 Buscar lojas por rede
router.get("/network/:networkId", async (req, res) => {
  const networkId = Number(req.params.networkId);
  if (isNaN(networkId)) {
    res.status(400).json({ error: "ID da rede inválido" });
    return;
  }

  try {
    const stores = await db
      .select({
        id: storesTable.id,
        name: storesTable.name,
        city: storesTable.city,
        state: storesTable.state,
        storeCode: storesTable.storeCode,
      })
      .from(storesTable)
      .where(eq(storesTable.networkId, networkId))
      .orderBy(storesTable.name);

    res.json(stores);
  } catch (error) {
    console.error("❌ Erro ao buscar lojas da rede:", error);
    res.status(500).json({ error: "Erro ao buscar lojas da rede" });
  }
});

// 🔥 Buscar loja por ID
router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "ID inválido" });
    return;
  }

  try {
    const [store] = await db
      .select({
        id: storesTable.id,
        name: storesTable.name,
        networkId: storesTable.networkId,
        street: storesTable.street,
        number: storesTable.number,
        neighborhood: storesTable.neighborhood,
        complement: storesTable.complement,
        city: storesTable.city,
        state: storesTable.state,
        zipCode: storesTable.zipCode,
        phone: storesTable.phone,
        channel: storesTable.channel,
        storeCode: storesTable.storeCode,
        visitValue: storesTable.visitValue,
        createdAt: storesTable.createdAt,
      })
      .from(storesTable)
      .where(eq(storesTable.id, id));

    if (!store) {
      res.status(404).json({ error: "Loja não encontrada" });
      return;
    }

    res.json({
      ...store,
      createdAt: store.createdAt?.toISOString(),
      visitValue: store.visitValue ? parseFloat(store.visitValue) : null
    });
  } catch (error) {
    console.error("❌ Erro ao buscar loja:", error);
    res.status(500).json({ error: "Erro ao buscar loja" });
  }
});

// 🔥 Criar nova loja
router.post("/", async (req, res) => {
  console.log("📦 Recebendo criação de loja:", req.body);

  const { 
    name, networkId, street, number, neighborhood, complement,
    city, state, zipCode, phone, channel, storeCode, visitValue 
  } = req.body;

  if (!name || !city || !state || !channel) {
    console.log("❌ Erro: Campos obrigatórios faltando");
    res.status(400).json({ error: "Nome, cidade, estado e canal são obrigatórios" });
    return;
  }

  try {
    const [store] = await db
      .insert(storesTable)
      .values({
        name,
        networkId: networkId || null,
        street: street || null,
        number: number || null,
        neighborhood: neighborhood || null,
        complement: complement || null,
        city,
        state,
        zipCode: zipCode || null,
        phone: phone || null,
        channel,
        storeCode: storeCode || null,
        visitValue: visitValue ? String(visitValue) : null,
      })
      .returning();

    console.log("✅ Loja criada:", store);

    const [fullStore] = await db
      .select({
        id: storesTable.id,
        name: storesTable.name,
        networkId: storesTable.networkId,
        networkName: networksTable.name,
        street: storesTable.street,
        number: storesTable.number,
        neighborhood: storesTable.neighborhood,
        complement: storesTable.complement,
        city: storesTable.city,
        state: storesTable.state,
        zipCode: storesTable.zipCode,
        phone: storesTable.phone,
        channel: storesTable.channel,
        storeCode: storesTable.storeCode,
        visitValue: storesTable.visitValue,
        createdAt: storesTable.createdAt,
      })
      .from(storesTable)
      .leftJoin(networksTable, eq(storesTable.networkId, networksTable.id))
      .where(eq(storesTable.id, store.id));

    res.status(201).json({
      ...fullStore,
      createdAt: fullStore.createdAt?.toISOString(),
      visitValue: fullStore.visitValue ? parseFloat(fullStore.visitValue) : null
    });
  } catch (error: any) {
    console.error("❌ Erro ao criar loja:", error);
    if (error.message?.includes("unique constraint")) {
      res.status(400).json({ error: "Já existe uma loja com este código nesta rede" });
    } else {
      res.status(500).json({ error: "Erro ao criar loja" });
    }
  }
});

// 🔥 Atualizar loja
router.put("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "ID inválido" });
    return;
  }

  console.log(`📦 Atualizando loja ${id}:`, req.body);

  const { 
    name, networkId, street, number, neighborhood, complement,
    city, state, zipCode, phone, channel, storeCode, visitValue 
  } = req.body;

  try {
    const [updated] = await db
      .update(storesTable)
      .set({
        name,
        networkId: networkId || null,
        street: street || null,
        number: number || null,
        neighborhood: neighborhood || null,
        complement: complement || null,
        city,
        state,
        zipCode: zipCode || null,
        phone: phone || null,
        channel,
        storeCode: storeCode || null,
        visitValue: visitValue ? String(visitValue) : null,
        updatedAt: new Date(),
      })
      .where(eq(storesTable.id, id))
      .returning();

    if (!updated) {
      console.log(`❌ Loja ${id} não encontrada`);
      res.status(404).json({ error: "Loja não encontrada" });
      return;
    }

    console.log(`✅ Loja ${id} atualizada:`, updated);

    const [fullStore] = await db
      .select({
        id: storesTable.id,
        name: storesTable.name,
        networkId: storesTable.networkId,
        networkName: networksTable.name,
        street: storesTable.street,
        number: storesTable.number,
        neighborhood: storesTable.neighborhood,
        complement: storesTable.complement,
        city: storesTable.city,
        state: storesTable.state,
        zipCode: storesTable.zipCode,
        phone: storesTable.phone,
        channel: storesTable.channel,
        storeCode: storesTable.storeCode,
        visitValue: storesTable.visitValue,
        createdAt: storesTable.createdAt,
      })
      .from(storesTable)
      .leftJoin(networksTable, eq(storesTable.networkId, networksTable.id))
      .where(eq(storesTable.id, id));

    res.json({
      ...fullStore,
      createdAt: fullStore.createdAt?.toISOString(),
      visitValue: fullStore.visitValue ? parseFloat(fullStore.visitValue) : null
    });
  } catch (error: any) {
    console.error(`❌ Erro ao atualizar loja ${id}:`, error);
    if (error.message?.includes("unique constraint")) {
      res.status(400).json({ error: "Já existe uma loja com este código nesta rede" });
    } else {
      res.status(500).json({ error: "Erro ao atualizar loja" });
    }
  }
});

// 🔥 Excluir loja
router.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "ID inválido" });
    return;
  }

  console.log(`🗑️ Excluindo loja ${id}`);

  try {
    const [deleted] = await db
      .delete(storesTable)
      .where(eq(storesTable.id, id))
      .returning();

    if (!deleted) {
      console.log(`❌ Loja ${id} não encontrada`);
      res.status(404).json({ error: "Loja não encontrada" });
      return;
    }

    console.log(`✅ Loja ${id} excluída`);
    res.status(204).end();
  } catch (error) {
    console.error(`❌ Erro ao excluir loja ${id}:`, error);
    res.status(500).json({ error: "Erro ao excluir loja" });
  }
});

export default router;