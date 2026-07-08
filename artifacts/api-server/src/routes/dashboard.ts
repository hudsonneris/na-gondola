import { Router } from "express";
import { eq, sql, and, desc } from "drizzle-orm";
import { db, storesTable, productsTable, visitsTable, visitItemsTable } from "@workspace/db";

const router = Router();

router.get("/summary", async (req, res) => {
  const [[totalStoresRow], [totalProductsRow], [totalVisitsRow]] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(storesTable),
    db.select({ count: sql<number>`count(*)::int` }).from(productsTable),
    db.select({ count: sql<number>`count(*)::int` }).from(visitsTable),
  ]);

  // Out-of-stock: count distinct (storeId, productId) pairs from the latest visit per store
  const outOfStockRow = await db.execute(sql`
    WITH latest_visits AS (
      SELECT DISTINCT ON (store_id) id, store_id
      FROM visits
      ORDER BY store_id, visited_at DESC
    )
    SELECT count(*)::int as count
    FROM visit_items vi
    INNER JOIN latest_visits lv ON vi.visit_id = lv.id
    WHERE vi.in_stock = false
  `);

  // Poor shelf: count distinct (storeId, productId) pairs where shelf is bad
  const poorShelfRow = await db.execute(sql`
    WITH latest_visits AS (
      SELECT DISTINCT ON (store_id) id, store_id
      FROM visits
      ORDER BY store_id, visited_at DESC
    )
    SELECT count(*)::int as count
    FROM visit_items vi
    INNER JOIN latest_visits lv ON vi.visit_id = lv.id
    WHERE vi.shelf_condition = 'bad'
  `);

  const visitsThisWeekRow = await db.execute(sql`
    SELECT count(*)::int as count
    FROM visits
    WHERE visited_at >= date_trunc('week', now())
  `);

  res.json({
    totalStores: totalStoresRow.count,
    totalProducts: totalProductsRow.count,
    totalVisits: totalVisitsRow.count,
    outOfStockCount: (outOfStockRow.rows[0] as any).count,
    poorShelfCount: (poorShelfRow.rows[0] as any).count,
    visitsThisWeek: (visitsThisWeekRow.rows[0] as any).count,
  });
});

router.get("/out-of-stock", async (req, res) => {
  const rows = await db.execute(sql`
    WITH latest_visits AS (
      SELECT DISTINCT ON (store_id) id, store_id, visited_at
      FROM visits
      ORDER BY store_id, visited_at DESC
    )
    SELECT
      s.id as "storeId",
      s.name as "storeName",
      s.city as "storeCity",
      s.channel as "storeChannel",
      p.id as "productId",
      p.name as "productName",
      p.category as "productCategory",
      lv.id as "visitId",
      lv.visited_at as "visitedAt"
    FROM visit_items vi
    INNER JOIN latest_visits lv ON vi.visit_id = lv.id
    INNER JOIN stores s ON lv.store_id = s.id
    INNER JOIN products p ON vi.product_id = p.id
    WHERE vi.in_stock = false
    ORDER BY lv.visited_at DESC, s.name
  `);

  res.json(rows.rows.map((r: any) => ({
    ...r,
    visitedAt: new Date(r.visitedAt).toISOString(),
  })));
});

router.get("/poor-shelf", async (req, res) => {
  const rows = await db.execute(sql`
    WITH latest_visits AS (
      SELECT DISTINCT ON (store_id) id, store_id, visited_at
      FROM visits
      ORDER BY store_id, visited_at DESC
    )
    SELECT
      s.id as "storeId",
      s.name as "storeName",
      s.city as "storeCity",
      s.channel as "storeChannel",
      p.id as "productId",
      p.name as "productName",
      vi.shelf_condition as "shelfCondition",
      lv.id as "visitId",
      lv.visited_at as "visitedAt"
    FROM visit_items vi
    INNER JOIN latest_visits lv ON vi.visit_id = lv.id
    INNER JOIN stores s ON lv.store_id = s.id
    INNER JOIN products p ON vi.product_id = p.id
    WHERE vi.shelf_condition = 'bad'
    ORDER BY lv.visited_at DESC, s.name
  `);

  res.json(rows.rows.map((r: any) => ({
    ...r,
    visitedAt: new Date(r.visitedAt).toISOString(),
  })));
});

router.get("/recent-visits", async (req, res) => {
  const rows = await db.execute(sql`
    SELECT
      v.id,
      v.store_id as "storeId",
      s.name as "storeName",
      s.city as "storeCity",
      s.channel as "storeChannel",
      v.visited_at as "visitedAt",
      v.notes,
      COUNT(vi.id)::int as "itemCount",
      COUNT(CASE WHEN vi.in_stock = false THEN 1 END)::int as "outOfStockCount",
      COUNT(CASE WHEN vi.shelf_condition = 'bad' THEN 1 END)::int as "poorShelfCount"
    FROM visits v
    INNER JOIN stores s ON v.store_id = s.id
    LEFT JOIN visit_items vi ON vi.visit_id = v.id
    GROUP BY v.id, s.name, s.city, s.channel
    ORDER BY v.visited_at DESC
    LIMIT 20
  `);

  res.json(rows.rows.map((r: any) => ({
    ...r,
    visitedAt: new Date(r.visitedAt).toISOString(),
  })));
});

export default router;
