import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, networksTable } from "@workspace/db";

const router = Router();

// 🔥 Buscar todas as redes
router.get("/", async (req, res) => {
  try {
    const networks = await db
      .select()
      .from(networksTable)
      .orderBy(networksTable.name);

    res.json(networks);
  } catch (error) {
    console.error("❌ Erro ao buscar redes:", error);
    res.status(500).json({ error: "Erro ao buscar redes" });
  }
});

// 🔥 Buscar rede por ID
router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "ID inválido" });
    return;
  }

  try {
    const [network] = await db
      .select()
      .from(networksTable)
      .where(eq(networksTable.id, id));

    if (!network) {
      res.status(404).json({ error: "Rede não encontrada" });
      return;
    }

    res.json(network);
  } catch (error) {
    console.error("❌ Erro ao buscar rede:", error);
    res.status(500).json({ error: "Erro ao buscar rede" });
  }
});

// 🔥 Criar nova rede
router.post("/", async (req, res) => {
  console.log("📦 Recebendo criação de rede:", req.body);

  const { name, code, description } = req.body;

  if (!name) {
    res.status(400).json({ error: "Nome é obrigatório" });
    return;
  }

  try {
    const [network] = await db
      .insert(networksTable)
      .values({
        name,
        code: code || null,
        description: description || null,
      })
      .returning();

    console.log("✅ Rede criada:", network);
    res.status(201).json(network);
  } catch (error) {
    console.error("❌ Erro ao criar rede:", error);
    res.status(500).json({ error: "Erro ao criar rede" });
  }
});

// 🔥 Atualizar rede
router.put("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "ID inválido" });
    return;
  }

  console.log(`📦 Atualizando rede ${id}:`, req.body);

  const { name, code, description } = req.body;

  try {
    const [updated] = await db
      .update(networksTable)
      .set({
        name: name,
        code: code || null,
        description: description || null,
        updatedAt: new Date(),
      })
      .where(eq(networksTable.id, id))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "Rede não encontrada" });
      return;
    }

    console.log(`✅ Rede ${id} atualizada:`, updated);
    res.json(updated);
  } catch (error) {
    console.error(`❌ Erro ao atualizar rede ${id}:`, error);
    res.status(500).json({ error: "Erro ao atualizar rede" });
  }
});

// 🔥 Excluir rede
router.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "ID inválido" });
    return;
  }

  console.log(`🗑️ Excluindo rede ${id}`);

  try {
    const [deleted] = await db
      .delete(networksTable)
      .where(eq(networksTable.id, id))
      .returning();

    if (!deleted) {
      res.status(404).json({ error: "Rede não encontrada" });
      return;
    }

    console.log(`✅ Rede ${id} excluída`);
    res.status(204).end();
  } catch (error) {
    console.error(`❌ Erro ao excluir rede ${id}:`, error);
    res.status(500).json({ error: "Erro ao excluir rede" });
  }
});

export default router;