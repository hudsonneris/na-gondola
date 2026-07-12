import { Router } from "express";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";

const router = Router();

// 📊 GET /api/dashboard/summary - Resumo do Dashboard
router.get("/summary", async (req, res) => {
  try {
    const query = sql`
      SELECT 
        (SELECT COUNT(*) FROM stores) as total_stores,
        (SELECT COUNT(*) FROM products) as total_products,
        (SELECT COUNT(*) FROM visits) as total_visits,
        (SELECT COUNT(*) FROM visits WHERE visited_at >= NOW() - INTERVAL '7 days') as visits_this_week,
        (SELECT COUNT(*) FROM visit_items WHERE in_stock = false) as out_of_stock_count,
        (SELECT COUNT(*) FROM visit_items WHERE in_stock = false OR array_length(supply_status, 1) > 0) as occurrence_count
    `;

    const result = await db.execute(query);
    const row = result.rows[0] as any;

    res.json({
      totalStores: Number(row?.total_stores) || 0,
      totalProducts: Number(row?.total_products) || 0,
      totalVisits: Number(row?.total_visits) || 0,
      visitsThisWeek: Number(row?.visits_this_week) || 0,
      outOfStockCount: Number(row?.out_of_stock_count) || 0,
      occurrenceCount: Number(row?.occurrence_count) || 0,
    });
  } catch (error) {
    console.error("Erro ao gerar resumo do dashboard:", error);
    res.status(500).json({ error: "Erro ao gerar resumo do dashboard" });
  }
});

// 📊 GET /api/dashboard/recent-visits - Últimas 5 visitas
router.get("/recent-visits", async (req, res) => {
  try {
    const query = sql`
      SELECT 
        v.id,
        v.store_id,
        s.name as store_name,
        s.city as store_city,
        s.state as store_state,
        v.visited_at,
        v.status,
        v.check_in,
        v.check_out,
        v.duration_minutes,
        v.notes,
        COALESCE(
          json_agg(
            json_build_object(
              'id', vi.id,
              'product_id', vi.product_id,
              'in_stock', vi.in_stock,
              'price', vi.price,
              'notes', vi.notes,
              'supply_status', vi.supply_status
            )
          ) FILTER (WHERE vi.id IS NOT NULL),
          '[]'
        ) as items
      FROM visits v
      LEFT JOIN stores s ON v.store_id = s.id
      LEFT JOIN visit_items vi ON v.id = vi.visit_id
      GROUP BY v.id, s.name, s.city, s.state
      ORDER BY v.visited_at DESC
      LIMIT 5
    `;

    const result = await db.execute(query);
    res.json(result.rows);
  } catch (error) {
    console.error("Erro ao buscar visitas recentes:", error);
    res.status(500).json({ error: "Erro ao buscar visitas recentes" });
  }
});

// 📊 GET /api/dashboard/out-of-stock - Produtos fora de estoque
router.get("/out-of-stock", async (req, res) => {
  try {
    const query = sql`
      SELECT 
        v.id as visit_id,
        v.store_id,
        s.name as store_name,
        s.city as store_city,
        vi.product_id,
        p.name as product_name,
        v.visited_at
      FROM visit_items vi
      LEFT JOIN visits v ON vi.visit_id = v.id
      LEFT JOIN stores s ON v.store_id = s.id
      LEFT JOIN products p ON vi.product_id = p.id
      WHERE vi.in_stock = false
      ORDER BY v.visited_at DESC
      LIMIT 10
    `;

    const result = await db.execute(query);
    res.json(result.rows);
  } catch (error) {
    console.error("Erro ao buscar produtos fora de estoque:", error);
    res.status(500).json({ error: "Erro ao buscar produtos fora de estoque" });
  }
});

export default router;
