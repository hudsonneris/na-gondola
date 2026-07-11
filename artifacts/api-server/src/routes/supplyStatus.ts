import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, supplyStatusTable } from "@workspace/db";

const router = Router();

// 🔥 Buscar todos os termos
router.get("/", async (req, res) => {
  try {
    const statuses = await db
      .select()
      .from(supplyStatusTable)
      .orderBy(supplyStatusTable.order, supplyStatusTable.name);

    res.json(statuses);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar status" });
  }
});

// 🔥 Buscar termos positivos
router.get("/positive", async (req, res) => {
  try {
    const statuses = await db
      .select()
      .from(supplyStatusTable)
      .where(eq(supplyStatusTable.type, "positive"))
      .where(eq(supplyStatusTable.isActive, true))
      .orderBy(supplyStatusTable.order, supplyStatusTable.name);

    res.json(statuses);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar status positivos" });
  }
});

// 🔥 Buscar termos negativos
router.get("/negative", async (req, res) => {
  try {
    const statuses = await db
      .select()
      .from(supplyStatusTable)
      .where(eq(supplyStatusTable.type, "negative"))
      .where(eq(supplyStatusTable.isActive, true))
      .orderBy(supplyStatusTable.order, supplyStatusTable.name);

    res.json(statuses);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar status negativos" });
  }
});

// 🔥 Criar novo termo
router.post("/", async (req, res) => {
  const { name, type, order, isActive } = req.body;

  if (!name || !type) {
    res.status(400).json({ error: "Nome e tipo são obrigatórios" });
    return;
  }

  try {
    const [status] = await db
      .insert(supplyStatusTable)
      .values({
        name,
        type,
        order: order || 0,
        isActive: isActive !== undefined ? isActive : true,
      })
      .returning();

    res.status(201).json(status);
  } catch (error) {
    res.status(400).json({ error: "Erro ao criar status. Verifique se o nome já existe." });
  }
});

// 🔥 Atualizar termo
router.put("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "ID inválido" });
    return;
  }

  const { name, type, order, isActive } = req.body;

  try {
    const [updated] = await db
      .update(supplyStatusTable)
      .set({
        name: name,
        type: type,
        order: order || 0,
        isActive: isActive !== undefined ? isActive : true,
        updatedAt: new Date(),
      })
      .where(eq(supplyStatusTable.id, id))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "Status não encontrado" });
      return;
    }

    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: "Erro ao atualizar status" });
  }
});

// 🔥 Excluir termo
router.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "ID inválido" });
    return;
  }

  try {
    const [deleted] = await db
      .delete(supplyStatusTable)
      .where(eq(supplyStatusTable.id, id))
      .returning();

    if (!deleted) {
      res.status(404).json({ error: "Status não encontrado" });
      return;
    }

    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: "Erro ao excluir status" });
  }
});

export default router;