import { Router } from "express";
import { db } from "@workspace/db";
import { and, eq, gte, lte, desc, sql } from "drizzle-orm";

const router = Router();

// 📊 GET /api/reports - Relatórios de visitas
router.get("/", async (req, res) => {
  try {
    const { 
      networkId, 
      clientId, 
      storeId, 
      startDate, 
      endDate, 
      photoType,
      status 
    } = req.query;

    // 🔥 Query SQL direta (mais confiável)
    const query = sql`
      SELECT 
        v.id,
        v.store_id,
        s.name as store_name,
        s.city as store_city,
        s.state as store_state,
        v.visited_at,
        v.check_in,
        v.check_out,
        v.duration_minutes,
        v.status,
        v.photo_before,
        v.photo_after,
        v.notes,
        v.created_at,
        COUNT(DISTINCT vi.id) as items_count,
        COUNT(CASE WHEN vi.in_stock = false THEN 1 END) as out_of_stock_count
      FROM visits v
      LEFT JOIN stores s ON v.store_id = s.id
      LEFT JOIN visit_items vi ON v.id = vi.visit_id
      WHERE 1=1
      ${startDate ? sql`AND v.visited_at >= ${new Date(startDate as string)}` : sql``}
      ${endDate ? sql`AND v.visited_at <= ${new Date(endDate as string)}` : sql``}
      ${status ? sql`AND v.status = ${status}` : sql``}
      ${storeId ? sql`AND v.store_id = ${parseInt(storeId as string)}` : sql``}
      GROUP BY v.id, s.name, s.city, s.state
      ORDER BY v.visited_at DESC
    `;

    const results = await db.execute(query);

    // 🔥 Formatar resposta
    const formattedResults = results.rows.map((row: any) => ({
      id: row.id,
      storeId: row.store_id,
      storeName: row.store_name,
      storeCity: row.store_city,
      storeState: row.store_state,
      visitedAt: row.visited_at,
      checkIn: row.check_in,
      checkOut: row.check_out,
      durationMinutes: row.duration_minutes,
      status: row.status,
      photoBefore: row.photo_before,
      photoAfter: row.photo_after,
      notes: row.notes,
      createdAt: row.created_at,
      itemsCount: Number(row.items_count) || 0,
      outOfStockCount: Number(row.out_of_stock_count) || 0,
    }));

    res.json(formattedResults);
  } catch (error) {
    console.error("Erro ao gerar relatório:", error);
    res.status(500).json({ error: "Erro ao gerar relatório" });
  }
});

// 📊 GET /api/reports/summary - Resumo de métricas
router.get("/summary", async (req, res) => {
  try {
    const { startDate, endDate, storeId } = req.query;

    const query = sql`
      SELECT 
        COUNT(DISTINCT v.id) as total_visits,
        COUNT(CASE WHEN v.status = 'completed' THEN 1 END) as completed_visits,
        COUNT(CASE WHEN v.status = 'draft' THEN 1 END) as draft_visits,
        COUNT(vi.id) as total_items,
        COUNT(CASE WHEN vi.in_stock = false THEN 1 END) as out_of_stock_items,
        AVG(v.duration_minutes) as avg_duration
      FROM visits v
      LEFT JOIN visit_items vi ON v.id = vi.visit_id
      WHERE 1=1
      ${startDate ? sql`AND v.visited_at >= ${new Date(startDate as string)}` : sql``}
      ${endDate ? sql`AND v.visited_at <= ${new Date(endDate as string)}` : sql``}
      ${storeId ? sql`AND v.store_id = ${parseInt(storeId as string)}` : sql``}
    `;

    const result = await db.execute(query);
    const row = result.rows[0] as any;

    res.json({
      total_visits: Number(row?.total_visits) || 0,
      completed_visits: Number(row?.completed_visits) || 0,
      draft_visits: Number(row?.draft_visits) || 0,
      total_items: Number(row?.total_items) || 0,
      out_of_stock_items: Number(row?.out_of_stock_items) || 0,
      avg_duration: Number(row?.avg_duration) || 0,
    });
  } catch (error) {
    console.error("Erro ao gerar resumo:", error);
    res.status(500).json({ error: "Erro ao gerar resumo" });
  }
});

export default router;
