import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, clientsTable, clientNetworksTable, networksTable } from "@workspace/db";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const clients = await db
      .select({
        id: clientsTable.id,
        name: clientsTable.name,
        code: clientsTable.code,
        cnpj: clientsTable.cnpj,
        phone: clientsTable.phone,
        email: clientsTable.email,
        street: clientsTable.street,
        number: clientsTable.number,
        neighborhood: clientsTable.neighborhood,
        complement: clientsTable.complement,
        city: clientsTable.city,
        state: clientsTable.state,
        zipCode: clientsTable.zipCode,
        notes: clientsTable.notes,
        isActive: clientsTable.isActive,
        createdAt: clientsTable.createdAt,
      })
      .from(clientsTable)
      .orderBy(clientsTable.name);

    const clientsWithRelations = await Promise.all(
      clients.map(async (client) => {
        const networks = await db
          .select({
            networkId: networksTable.id,
            networkName: networksTable.name,
          })
          .from(clientNetworksTable)
          .innerJoin(networksTable, eq(clientNetworksTable.networkId, networksTable.id))
          .where(eq(clientNetworksTable.clientId, client.id));

        return {
          ...client,
          networkIds: networks.map(n => n.networkId),
          networks: networks.map(n => n.networkName),
        };
      })
    );

    res.json(clientsWithRelations);
  } catch (error) {
    console.error("❌ Erro ao buscar clientes:", error);
    res.status(500).json({ error: "Erro ao buscar clientes" });
  }
});

router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "ID inválido" });
    return;
  }

  try {
    const [client] = await db
      .select({
        id: clientsTable.id,
        name: clientsTable.name,
        code: clientsTable.code,
        cnpj: clientsTable.cnpj,
        phone: clientsTable.phone,
        email: clientsTable.email,
        street: clientsTable.street,
        number: clientsTable.number,
        neighborhood: clientsTable.neighborhood,
        complement: clientsTable.complement,
        city: clientsTable.city,
        state: clientsTable.state,
        zipCode: clientsTable.zipCode,
        notes: clientsTable.notes,
        isActive: clientsTable.isActive,
        createdAt: clientsTable.createdAt,
      })
      .from(clientsTable)
      .where(eq(clientsTable.id, id));

    if (!client) {
      res.status(404).json({ error: "Cliente não encontrado" });
      return;
    }

    const networks = await db
      .select({ networkId: clientNetworksTable.networkId })
      .from(clientNetworksTable)
      .where(eq(clientNetworksTable.clientId, id));

    res.json({
      ...client,
      networkIds: networks.map(n => n.networkId),
    });
  } catch (error) {
    console.error("❌ Erro ao buscar cliente:", error);
    res.status(500).json({ error: "Erro ao buscar cliente" });
  }
});

router.post("/", async (req, res) => {
  console.log("📦 Recebendo criação de cliente:", req.body);

  const { 
    name, code, cnpj, phone, email, 
    street, number, neighborhood, complement, city, state, zipCode,
    notes, isActive, networkIds 
  } = req.body;

  if (!name) {
    res.status(400).json({ error: "Nome é obrigatório" });
    return;
  }

  try {
    const [client] = await db
      .insert(clientsTable)
      .values({
        name,
        code: code || null,
        cnpj: cnpj || null,
        phone: phone || null,
        email: email || null,
        street: street || null,
        number: number || null,
        neighborhood: neighborhood || null,
        complement: complement || null,
        city: city || null,
        state: state || null,
        zipCode: zipCode || null,
        notes: notes || null,
        isActive: isActive !== undefined ? isActive : "true",
      })
      .returning();

    if (networkIds && networkIds.length > 0) {
      await db.insert(clientNetworksTable).values(
        networkIds.map((networkId: number) => ({
          clientId: client.id,
          networkId: networkId,
        }))
      );
    }

    console.log("✅ Cliente criado:", client);
    res.status(201).json({ ...client, networkIds });
  } catch (error) {
    console.error("❌ Erro ao criar cliente:", error);
    res.status(500).json({ error: "Erro ao criar cliente" });
  }
});

router.put("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "ID inválido" });
    return;
  }

  console.log(`📦 Atualizando cliente ${id}:`, req.body);

  const { 
    name, code, cnpj, phone, email, 
    street, number, neighborhood, complement, city, state, zipCode,
    notes, isActive, networkIds 
  } = req.body;

  try {
    const [updated] = await db
      .update(clientsTable)
      .set({
        name,
        code: code || null,
        cnpj: cnpj || null,
        phone: phone || null,
        email: email || null,
        street: street || null,
        number: number || null,
        neighborhood: neighborhood || null,
        complement: complement || null,
        city: city || null,
        state: state || null,
        zipCode: zipCode || null,
        notes: notes || null,
        isActive: isActive !== undefined ? isActive : "true",
        updatedAt: new Date(),
      })
      .where(eq(clientsTable.id, id))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "Cliente não encontrado" });
      return;
    }

    if (networkIds !== undefined) {
      await db.delete(clientNetworksTable).where(eq(clientNetworksTable.clientId, id));
      if (networkIds && networkIds.length > 0) {
        await db.insert(clientNetworksTable).values(
          networkIds.map((networkId: number) => ({
            clientId: id,
            networkId: networkId,
          }))
        );
      }
    }

    console.log(`✅ Cliente ${id} atualizado:`, updated);
    res.json({ ...updated, networkIds });
  } catch (error) {
    console.error(`❌ Erro ao atualizar cliente ${id}:`, error);
    res.status(500).json({ error: "Erro ao atualizar cliente" });
  }
});

router.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "ID inválido" });
    return;
  }

  console.log(`🗑️ Excluindo cliente ${id}`);

  try {
    const [deleted] = await db
      .delete(clientsTable)
      .where(eq(clientsTable.id, id))
      .returning();

    if (!deleted) {
      res.status(404).json({ error: "Cliente não encontrado" });
      return;
    }

    console.log(`✅ Cliente ${id} excluído`);
    res.status(204).end();
  } catch (error) {
    console.error(`❌ Erro ao excluir cliente ${id}:`, error);
    res.status(500).json({ error: "Erro ao excluir cliente" });
  }
});

export default router;