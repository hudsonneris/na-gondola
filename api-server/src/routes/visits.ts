import { Router } from "express";
import { pool } from "@workspace/db";
import { z } from "zod";

const CreateVisitBody = z.object({
  storeId: z.number(),
  visitedAt: z.string(),
  notes: z.string().nullable().optional(),
  checkIn: z.string().nullable().optional(),
  checkOut: z.string().nullable().optional(),
  status: z.enum(["draft", "pending", "in_progress", "completed"]).optional(),
  photoBefore: z.string().nullable().optional(),
  photoAfter: z.string().nullable().optional(),
  items: z.array(z.object({
    productId: z.number(),
    inStock: z.boolean(),
    price: z.number().nullable().optional(),
    notes: z.string().nullable().optional(),
    supplyStatus: z.array(z.string()).optional(),
  })),
});

const UpdateVisitBody = CreateVisitBody.partial();

const router = Router();

// ============================================================
// 🔥 POST / (criar visita)
// ============================================================
router.post("/", async (req, res) => {
  const parsed = CreateVisitBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }
  const { storeId, visitedAt, notes, items, checkIn, checkOut, status, photoBefore, photoAfter } = parsed.data;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const visitResult = await client.query(
      `INSERT INTO visits (store_id, visited_at, notes, check_in, check_out, status, photo_before, photo_after)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [storeId, visitedAt, notes || null, checkIn || null, checkOut || null, status || 'draft', photoBefore || null, photoAfter || null]
    );

    const visit = visitResult.rows[0];

    if (items && items.length > 0) {
      for (const item of items) {
        await client.query(
          `INSERT INTO visit_items (visit_id, product_id, in_stock, price, notes, supply_status)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [visit.id, item.productId, item.inStock, item.price || null, item.notes || null, item.supplyStatus || []]
        );
      }
    }

    await client.query('COMMIT');

    const fullVisit = await client.query(
      `SELECT v.*, s.name as store_name, s.city as store_city, s.state as store_state, s.channel as store_channel
       FROM visits v
       JOIN stores s ON v.store_id = s.id
       WHERE v.id = $1`,
      [visit.id]
    );

    const itemsResult = await client.query(
      `SELECT vi.*, p.name as product_name, p.category as product_category
       FROM visit_items vi
       JOIN products p ON vi.product_id = p.id
       WHERE vi.visit_id = $1`,
      [visit.id]
    );

    res.status(201).json({
      ...fullVisit.rows[0],
      items: itemsResult.rows.map(item => ({
        ...item,
        price: item.price != null ? parseFloat(item.price) : null,
      })),
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("❌ Erro:", error);
    res.status(500).json({ error: "Erro ao criar visita", details: String(error) });
  } finally {
    client.release();
  }
});

// ============================================================
// 🔥 PUT /:id (atualizar visita) - CORRIGIDO
// ============================================================
router.put("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "ID inválido" });
    return;
  }

  const parsed = UpdateVisitBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }

  const { storeId, visitedAt, notes, items, checkIn, checkOut, status, photoBefore, photoAfter } = parsed.data;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Verificar se a visita existe
    const checkResult = await client.query(`SELECT id FROM visits WHERE id = $1`, [id]);
    if (checkResult.rows.length === 0) {
      res.status(404).json({ error: "Visita não encontrada" });
      return;
    }

    // Atualizar a visita
    await client.query(
      `UPDATE visits 
       SET store_id = $1, visited_at = $2, notes = $3, check_in = $4, check_out = $5, 
           status = $6, photo_before = $7, photo_after = $8
       WHERE id = $9`,
      [storeId, visitedAt, notes || null, checkIn || null, checkOut || null, status || 'draft', photoBefore || null, photoAfter || null, id]
    );

    // Remover itens antigos
    await client.query(`DELETE FROM visit_items WHERE visit_id = $1`, [id]);

    // Inserir novos itens
    if (items && items.length > 0) {
      for (const item of items) {
        await client.query(
          `INSERT INTO visit_items (visit_id, product_id, in_stock, price, notes, supply_status)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [id, item.productId, item.inStock, item.price || null, item.notes || null, item.supplyStatus || []]
        );
      }
    }

    await client.query('COMMIT');

    // Buscar a visita atualizada
    const fullVisit = await client.query(
      `SELECT v.*, s.name as store_name, s.city as store_city, s.state as store_state, s.channel as store_channel
       FROM visits v
       JOIN stores s ON v.store_id = s.id
       WHERE v.id = $1`,
      [id]
    );

    const itemsResult = await client.query(
      `SELECT vi.*, p.name as product_name, p.category as product_category
       FROM visit_items vi
       JOIN products p ON vi.product_id = p.id
       WHERE vi.visit_id = $1`,
      [id]
    );

    res.json({
      ...fullVisit.rows[0],
      items: itemsResult.rows.map(item => ({
        ...item,
        price: item.price != null ? parseFloat(item.price) : null,
      })),
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("❌ Erro ao atualizar visita:", error);
    res.status(500).json({ error: "Erro ao atualizar visita", details: String(error) });
  } finally {
    client.release();
  }
});

// ============================================================
// 🔥 GET / (listar visitas)
// ============================================================
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT v.*, s.name as store_name, s.city as store_city, s.state as store_state
       FROM visits v
       JOIN stores s ON v.store_id = s.id
       ORDER BY v.visited_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error("❌ Erro ao listar visitas:", error);
    res.status(500).json({ error: "Erro ao listar visitas" });
  }
});

// ============================================================
// 🔥 GET /:id (buscar visita por ID)
// ============================================================
router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  
  try {
    const visitResult = await pool.query(
      `SELECT v.*, s.name as store_name, s.city as store_city, s.state as store_state
       FROM visits v
       JOIN stores s ON v.store_id = s.id
       WHERE v.id = $1`,
      [id]
    );
    
    if (visitResult.rows.length === 0) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    
    const itemsResult = await pool.query(
      `SELECT vi.*, p.name as product_name, p.category as product_category
       FROM visit_items vi
       JOIN products p ON vi.product_id = p.id
       WHERE vi.visit_id = $1`,
      [id]
    );
    
    res.json({
      ...visitResult.rows[0],
      items: itemsResult.rows
    });
  } catch (error) {
    console.error("❌ Erro ao buscar visita:", error);
    res.status(500).json({ error: "Erro ao buscar visita" });
  }
});

// ============================================================
// 🔥 DELETE /:id (excluir visita)
// ============================================================
router.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`DELETE FROM visit_items WHERE visit_id = $1`, [id]);
    await client.query(`DELETE FROM visits WHERE id = $1`, [id]);
    await client.query('COMMIT');
    res.status(204).end();
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("❌ Erro ao excluir visita:", error);
    res.status(500).json({ error: "Erro ao excluir visita" });
  } finally {
    client.release();
  }
});

// ============================================================
// 🔥 POST /:id/finish (finalizar visita)
// ============================================================
router.post("/:id/finish", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "ID inválido" });
    return;
  }

  const client = await pool.connect();
  try {
    const checkResult = await client.query(`SELECT id, check_in FROM visits WHERE id = $1`, [id]);
    if (checkResult.rows.length === 0) {
      res.status(404).json({ error: "Visita não encontrada" });
      return;
    }

    const now = new Date();
    const checkIn = checkResult.rows[0].check_in;
    const diffMs = checkIn ? now.getTime() - new Date(checkIn).getTime() : 0;
    const durationMinutes = Math.max(1, Math.round(diffMs / 60000));

    await client.query(
      `UPDATE visits SET status = 'completed', check_out = $1, duration_minutes = $2 WHERE id = $3`,
      [now, durationMinutes, id]
    );

    await client.query('COMMIT');

    const result = await pool.query(
      `SELECT v.*, s.name as store_name, s.city as store_city, s.state as store_state
       FROM visits v
       JOIN stores s ON v.store_id = s.id
       WHERE v.id = $1`,
      [id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("❌ Erro ao finalizar visita:", error);
    res.status(500).json({ error: "Erro ao finalizar visita" });
  } finally {
    client.release();
  }
});

export default router;
