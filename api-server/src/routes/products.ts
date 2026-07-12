import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, productsTable, categoriesTable } from "@workspace/db";

const router = Router();

// 🔥 Buscar todos os produtos
router.get("/", async (req, res) => {
  try {
    const products = await db
      .select({
        id: productsTable.id,
        name: productsTable.name,
        category: productsTable.category,
        categoryId: productsTable.categoryId,
        categoryName: categoriesTable.name,
        brand: productsTable.brand,
        sku: productsTable.sku,
        stock: productsTable.stock,
        imageUrl: productsTable.imageUrl,
        createdAt: productsTable.createdAt,
      })
      .from(productsTable)
      .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
      .orderBy(productsTable.name);

    console.log("📦 Produtos encontrados:", products.length);
    res.json(products.map(p => ({
      ...p,
      createdAt: p.createdAt?.toISOString()
    })));
  } catch (error) {
    console.error("❌ Erro ao buscar produtos:", error);
    res.status(500).json({ error: "Erro ao buscar produtos" });
  }
});

// 🔥 Buscar produto por ID
router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "ID inválido" });
    return;
  }

  try {
    const [product] = await db
      .select({
        id: productsTable.id,
        name: productsTable.name,
        category: productsTable.category,
        categoryId: productsTable.categoryId,
        categoryName: categoriesTable.name,
        brand: productsTable.brand,
        sku: productsTable.sku,
        stock: productsTable.stock,
        imageUrl: productsTable.imageUrl,
        createdAt: productsTable.createdAt,
      })
      .from(productsTable)
      .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
      .where(eq(productsTable.id, id));

    if (!product) {
      res.status(404).json({ error: "Produto não encontrado" });
      return;
    }

    res.json({
      ...product,
      createdAt: product.createdAt?.toISOString()
    });
  } catch (error) {
    console.error("❌ Erro ao buscar produto:", error);
    res.status(500).json({ error: "Erro ao buscar produto" });
  }
});

// 🔥 Criar novo produto
router.post("/", async (req, res) => {
  console.log("📦 Recebendo criação de produto:", req.body);

  const { name, category, categoryId, brand, sku, stock, imageUrl } = req.body;

  if (!name || !category) {
    console.log("❌ Erro: Campos obrigatórios faltando");
    res.status(400).json({ error: "Nome e categoria são obrigatórios" });
    return;
  }

  try {
    const [product] = await db
      .insert(productsTable)
      .values({
        name,
        category,
        categoryId: categoryId || null,
        brand: brand || null,
        sku: sku || null,
        stock: stock || 0,
        imageUrl: imageUrl || null,
      })
      .returning();

    console.log("✅ Produto criado:", product);

    const [fullProduct] = await db
      .select({
        id: productsTable.id,
        name: productsTable.name,
        category: productsTable.category,
        categoryId: productsTable.categoryId,
        categoryName: categoriesTable.name,
        brand: productsTable.brand,
        sku: productsTable.sku,
        stock: productsTable.stock,
        imageUrl: productsTable.imageUrl,
        createdAt: productsTable.createdAt,
      })
      .from(productsTable)
      .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
      .where(eq(productsTable.id, product.id));

    res.status(201).json({
      ...fullProduct,
      createdAt: fullProduct.createdAt?.toISOString()
    });
  } catch (error) {
    console.error("❌ Erro ao criar produto:", error);
    res.status(500).json({ error: "Erro ao criar produto" });
  }
});

// 🔥 Atualizar produto
router.put("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "ID inválido" });
    return;
  }

  console.log(`📦 Atualizando produto ${id}:`, req.body);

  const { name, category, categoryId, brand, sku, stock, imageUrl } = req.body;

  try {
    const [updated] = await db
      .update(productsTable)
      .set({
        name,
        category,
        categoryId: categoryId || null,
        brand: brand || null,
        sku: sku || null,
        stock: stock || 0,
        imageUrl: imageUrl || null,
        updatedAt: new Date(),
      })
      .where(eq(productsTable.id, id))
      .returning();

    if (!updated) {
      console.log(`❌ Produto ${id} não encontrado`);
      res.status(404).json({ error: "Produto não encontrado" });
      return;
    }

    console.log(`✅ Produto ${id} atualizado:`, updated);

    const [fullProduct] = await db
      .select({
        id: productsTable.id,
        name: productsTable.name,
        category: productsTable.category,
        categoryId: productsTable.categoryId,
        categoryName: categoriesTable.name,
        brand: productsTable.brand,
        sku: productsTable.sku,
        stock: productsTable.stock,
        imageUrl: productsTable.imageUrl,
        createdAt: productsTable.createdAt,
      })
      .from(productsTable)
      .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
      .where(eq(productsTable.id, id));

    res.json({
      ...fullProduct,
      createdAt: fullProduct.createdAt?.toISOString()
    });
  } catch (error) {
    console.error(`❌ Erro ao atualizar produto ${id}:`, error);
    res.status(500).json({ error: "Erro ao atualizar produto" });
  }
});

// 🔥 Excluir produto
router.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "ID inválido" });
    return;
  }

  console.log(`🗑️ Excluindo produto ${id}`);

  try {
    const [deleted] = await db
      .delete(productsTable)
      .where(eq(productsTable.id, id))
      .returning();

    if (!deleted) {
      console.log(`❌ Produto ${id} não encontrado`);
      res.status(404).json({ error: "Produto não encontrado" });
      return;
    }

    console.log(`✅ Produto ${id} excluído`);
    res.status(204).end();
  } catch (error) {
    console.error(`❌ Erro ao excluir produto ${id}:`, error);
    res.status(500).json({ error: "Erro ao excluir produto" });
  }
});

export default router;