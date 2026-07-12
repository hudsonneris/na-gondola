import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, scheduledVisitsTable, storesTable, networksTable } from "@workspace/db";

const router = Router();

// 🔥 Buscar todas as visitas agendadas
router.get("/", async (req, res) => {
  try {
    const scheduledVisits = await db
      .select({
        id: scheduledVisitsTable.id,
        storeId: scheduledVisitsTable.storeId,
        storeName: storesTable.name,
        storeCity: storesTable.city,
        storeState: storesTable.state,
        storeChannel: storesTable.channel,
        networkId: scheduledVisitsTable.networkId,
        networkName: networksTable.name,
        daysOfWeek: scheduledVisitsTable.daysOfWeek,
        startTime: scheduledVisitsTable.startTime,
        endTime: scheduledVisitsTable.endTime,
        notes: scheduledVisitsTable.notes,
        isActive: scheduledVisitsTable.isActive,
        createdAt: scheduledVisitsTable.createdAt,
        updatedAt: scheduledVisitsTable.updatedAt,
      })
      .from(scheduledVisitsTable)
      .innerJoin(storesTable, eq(scheduledVisitsTable.storeId, storesTable.id))
      .leftJoin(networksTable, eq(scheduledVisitsTable.networkId, networksTable.id))
      .orderBy(scheduledVisitsTable.startTime);

    res.json(scheduledVisits);
  } catch (error) {
    console.error("❌ Erro ao buscar tarefas:", error);
    res.status(500).json({ error: "Erro ao buscar tarefas" });
  }
});

// 🔥 Criar nova visita agendada
router.post("/", async (req, res) => {
  console.log("📦 Recebendo criação de tarefa:", req.body);

  const { storeId, networkId, daysOfWeek, startTime, endTime, notes, isActive } = req.body;

  if (!storeId || !daysOfWeek || daysOfWeek.length === 0) {
    res.status(400).json({ error: "Loja e dias da semana são obrigatórios" });
    return;
  }

  try {
    const [scheduled] = await db
      .insert(scheduledVisitsTable)
      .values({
        storeId,
        networkId: networkId || null,
        daysOfWeek,
        startTime: startTime || null,
        endTime: endTime || null,
        notes: notes || null,
        isActive: isActive !== undefined ? isActive : true,
      })
      .returning();

    console.log("✅ Tarefa criada:", scheduled);
    res.status(201).json(scheduled);
  } catch (error) {
    console.error("❌ Erro ao criar tarefa:", error);
    res.status(500).json({ error: "Erro ao criar tarefa" });
  }
});

// 🔥 Buscar tarefas por dia
router.get("/day/:day", async (req, res) => {
  const day = Number(req.params.day);
  if (isNaN(day) || day < 0 || day > 6) {
    res.status(400).json({ error: "Dia inválido" });
    return;
  }

  try {
    const scheduledVisits = await db
      .select({
        id: scheduledVisitsTable.id,
        storeId: scheduledVisitsTable.storeId,
        storeName: storesTable.name,
        storeCity: storesTable.city,
        storeState: storesTable.state,
        storeChannel: storesTable.channel,
        daysOfWeek: scheduledVisitsTable.daysOfWeek,
        startTime: scheduledVisitsTable.startTime,
        endTime: scheduledVisitsTable.endTime,
        notes: scheduledVisitsTable.notes,
        isActive: scheduledVisitsTable.isActive,
      })
      .from(scheduledVisitsTable)
      .innerJoin(storesTable, eq(scheduledVisitsTable.storeId, storesTable.id))
      .where(eq(scheduledVisitsTable.isActive, true))
      .orderBy(scheduledVisitsTable.startTime);

    // Filtrar por dia da semana
    const filtered = scheduledVisits.filter(v => v.daysOfWeek.includes(day));
    res.json(filtered);
  } catch (error) {
    console.error("❌ Erro ao buscar tarefas por dia:", error);
    res.status(500).json({ error: "Erro ao buscar tarefas" });
  }
});

// 🔥 Atualizar tarefa
router.put("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "ID inválido" });
    return;
  }

  console.log(`📦 Atualizando tarefa ${id}:`, req.body);

  const { storeId, networkId, daysOfWeek, startTime, endTime, notes, isActive } = req.body;

  try {
    const [updated] = await db
      .update(scheduledVisitsTable)
      .set({
        storeId,
        networkId: networkId || null,
        daysOfWeek,
        startTime: startTime || null,
        endTime: endTime || null,
        notes: notes || null,
        isActive: isActive !== undefined ? isActive : true,
        updatedAt: new Date(),
      })
      .where(eq(scheduledVisitsTable.id, id))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "Tarefa não encontrada" });
      return;
    }

    console.log(`✅ Tarefa ${id} atualizada:`, updated);
    res.json(updated);
  } catch (error) {
    console.error(`❌ Erro ao atualizar tarefa ${id}:`, error);
    res.status(500).json({ error: "Erro ao atualizar tarefa" });
  }
});

// 🔥 Excluir tarefa
router.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "ID inválido" });
    return;
  }

  console.log(`🗑️ Excluindo tarefa ${id}`);

  try {
    const [deleted] = await db
      .delete(scheduledVisitsTable)
      .where(eq(scheduledVisitsTable.id, id))
      .returning();

    if (!deleted) {
      res.status(404).json({ error: "Tarefa não encontrada" });
      return;
    }

    console.log(`✅ Tarefa ${id} excluída`);
    res.status(204).end();
  } catch (error) {
    console.error(`❌ Erro ao excluir tarefa ${id}:`, error);
    res.status(500).json({ error: "Erro ao excluir tarefa" });
  }
});

export default router;