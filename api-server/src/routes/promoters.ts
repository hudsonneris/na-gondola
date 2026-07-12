  import { Router } from "express";
  import { eq } from "drizzle-orm";
  import { db, promotersTable, promoterClientsTable, promoterNetworksTable } from "@workspace/db";

  const router = Router();

  // 🔥 Buscar todos os promotores
  router.get("/", async (req, res) => {
    try {
      const promoters = await db
        .select()
        .from(promotersTable)
        .orderBy(promotersTable.name);

      const promotersWithRelations = await Promise.all(
        promoters.map(async (promoter) => {
          const clients = await db
            .select({ clientId: promoterClientsTable.clientId })
            .from(promoterClientsTable)
            .where(eq(promoterClientsTable.promoterId, promoter.id));

          const networks = await db
            .select({ networkId: promoterNetworksTable.networkId })
            .from(promoterNetworksTable)
            .where(eq(promoterNetworksTable.promoterId, promoter.id));

          return {
            ...promoter,
            clientIds: clients.map(c => c.clientId),
            networkIds: networks.map(n => n.networkId),
          };
        })
      );

      res.json(promotersWithRelations);
    } catch (error) {
      console.error("❌ Erro ao buscar promotores:", error);
      res.status(500).json({ error: "Erro ao buscar promotores" });
    }
  });

  // 🔥 Buscar promotor por ID
  router.get("/:id", async (req, res) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: "ID inválido" });
      return;
    }

    try {
      const [promoter] = await db
        .select()
        .from(promotersTable)
        .where(eq(promotersTable.id, id));

      if (!promoter) {
        res.status(404).json({ error: "Promotor não encontrado" });
        return;
      }

      const clients = await db
        .select({ clientId: promoterClientsTable.clientId })
        .from(promoterClientsTable)
        .where(eq(promoterClientsTable.promoterId, id));

      const networks = await db
        .select({ networkId: promoterNetworksTable.networkId })
        .from(promoterNetworksTable)
        .where(eq(promoterNetworksTable.promoterId, id));

      res.json({
        ...promoter,
        clientIds: clients.map(c => c.clientId),
        networkIds: networks.map(n => n.networkId),
      });
    } catch (error) {
      console.error("❌ Erro ao buscar promotor:", error);
      res.status(500).json({ error: "Erro ao buscar promotor" });
    }
  });

  // 🔥 Criar promotor
  router.post("/", async (req, res) => {
    console.log("📦 Recebendo criação de promotor:", req.body);

    const { name, phone, email, isActive, clientIds, networkIds } = req.body;

    if (!name) {
      res.status(400).json({ error: "Nome é obrigatório" });
      return;
    }

    try {
      const [promoter] = await db
        .insert(promotersTable)
        .values({
          name,
          phone: phone || null,
          email: email || null,
          isActive: isActive !== undefined ? isActive : "true",
        })
        .returning();

      if (clientIds && clientIds.length > 0) {
        await db.insert(promoterClientsTable).values(
          clientIds.map((clientId: number) => ({
            promoterId: promoter.id,
            clientId: clientId,
          }))
        );
      }

      if (networkIds && networkIds.length > 0) {
        await db.insert(promoterNetworksTable).values(
          networkIds.map((networkId: number) => ({
            promoterId: promoter.id,
            networkId: networkId,
          }))
        );
      }

      console.log("✅ Promotor criado:", promoter);
      res.status(201).json({ ...promoter, clientIds, networkIds });
    } catch (error) {
      console.error("❌ Erro ao criar promotor:", error);
      res.status(500).json({ error: "Erro ao criar promotor" });
    }
  });

  // 🔥 Atualizar promotor
  router.put("/:id", async (req, res) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: "ID inválido" });
      return;
    }

    console.log(`📦 Atualizando promotor ${id}:`, req.body);

    const { name, phone, email, isActive, clientIds, networkIds } = req.body;

    try {
      const [updated] = await db
        .update(promotersTable)
        .set({
          name,
          phone: phone || null,
          email: email || null,
          isActive: isActive !== undefined ? isActive : "true",
          updatedAt: new Date(),
        })
        .where(eq(promotersTable.id, id))
        .returning();

      if (!updated) {
        res.status(404).json({ error: "Promotor não encontrado" });
        return;
      }

      if (clientIds !== undefined) {
        await db.delete(promoterClientsTable).where(eq(promoterClientsTable.promoterId, id));
        if (clientIds && clientIds.length > 0) {
          await db.insert(promoterClientsTable).values(
            clientIds.map((clientId: number) => ({
              promoterId: id,
              clientId: clientId,
            }))
          );
        }
      }

      if (networkIds !== undefined) {
        await db.delete(promoterNetworksTable).where(eq(promoterNetworksTable.promoterId, id));
        if (networkIds && networkIds.length > 0) {
          await db.insert(promoterNetworksTable).values(
            networkIds.map((networkId: number) => ({
              promoterId: id,
              networkId: networkId,
            }))
          );
        }
      }

      console.log(`✅ Promotor ${id} atualizado:`, updated);
      res.json({ ...updated, clientIds, networkIds });
    } catch (error) {
      console.error(`❌ Erro ao atualizar promotor ${id}:`, error);
      res.status(500).json({ error: "Erro ao atualizar promotor" });
    }
  });

  // 🔥 Excluir promotor
  router.delete("/:id", async (req, res) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: "ID inválido" });
      return;
    }

    console.log(`🗑️ Excluindo promotor ${id}`);

    try {
      const [deleted] = await db
        .delete(promotersTable)
        .where(eq(promotersTable.id, id))
        .returning();

      if (!deleted) {
        res.status(404).json({ error: "Promotor não encontrado" });
        return;
      }

      console.log(`✅ Promotor ${id} excluído`);
      res.status(204).end();
    } catch (error) {
      console.error(`❌ Erro ao excluir promotor ${id}:`, error);
      res.status(500).json({ error: "Erro ao excluir promotor" });
    }
  });

  export default router;