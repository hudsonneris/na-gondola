import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, categoriesTable } from "@workspace/db";

const router = Router();

// 🔥 Buscar todas as categorias
router.get("/", async (req, res) => {
  try {
    const categories = await db
      .select()
      .from(categoriesTable)
      .orderBy(categoriesTable.name);

    res.json(categories);
  } catch (error) {
    console.error("❌ Erro ao buscar categorias:", error);
    res.status(500).json({ error: "Erro ao buscar categorias" });
  }
});

// 🔥 Buscar categoria por ID
router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "ID inválido" });
    return;
  }

  try {
    const [category] = await db
      .select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, id));

    if (!category) {
      res.status(404).json({ error: "Categoria não encontrada" });
      return;
    }

    res.json(category);
  } catch (error) {
    console.error("❌ Erro ao buscar categoria:", error);
    res.status(500).json({ error: "Erro ao buscar categoria" });
  }
});

// 🔥 Criar nova categoria
router.post("/", async (req, res) => {
  console.log("📦 Recebendo criação de categoria:", req.body);

  const { name, description } = req.body;

  if (!name) {
    res.status(400).json({ error: "Nome é obrigatório" });
    return;
  }

  try {
    const [category] = await db
      .insert(categoriesTable)
      .values({
        name,
        description: description || null,
      })
      .returning();

    console.log("✅ Categoria criada:", category);
    res.status(201).json(category);
  } catch (error) {
    console.error("❌ Erro ao criar categoria:", error);
    res.status(500).json({ error: "Erro ao criar categoria" });
  }
});

// 🔥 Atualizar categoria
router.put("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "ID inválido" });
    return;
  }

  console.log(`📦 Atualizando categoria ${id}:`, req.body);

  const { name, description } = req.body;

  try {
    const [updated] = await db
      .update(categoriesTable)
      .set({
        name: name,
        description: description || null,
        updatedAt: new Date(),
      })
      .where(eq(categoriesTable.id, id))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "Categoria não encontrada" });
      return;
    }

    console.log(`✅ Categoria ${id} atualizada:`, updated);
    res.json(updated);
  } catch (error) {
    console.error(`❌ Erro ao atualizar categoria ${id}:`, error);
    res.status(500).json({ error: "Erro ao atualizar categoria" });
  }
});

// 🔥 Excluir categoria
router.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "ID inválido" });
    return;
  }

  console.log(`🗑️ Excluindo categoria ${id}`);

  try {
    const [deleted] = await db
      .delete(categoriesTable)
      .where(eq(categoriesTable.id, id))
      .returning();

    if (!deleted) {
      res.status(404).json({ error: "Categoria não encontrada" });
      return;
    }

    console.log(`✅ Categoria ${id} excluída`);
    res.status(204).end();
  } catch (error) {
    console.error(`❌ Erro ao excluir categoria ${id}:`, error);
    res.status(500).json({ error: "Erro ao excluir categoria" });
  }
});

export default router;