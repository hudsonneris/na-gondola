// 🔥 No router.post("/:id/checkout"), substitua por:
router.post("/:id/checkout", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "ID inválido" });
    return;
  }

  const now = new Date().toISOString();

  const client = await pool.connect();
  try {
    const checkResult = await client.query(`SELECT id, check_in FROM visits WHERE id = $1`, [id]);
    if (checkResult.rows.length === 0) {
      res.status(404).json({ error: "Visita não encontrada" });
      return;
    }

    const checkIn = checkResult.rows[0].check_in;
    const diffMs = checkIn ? new Date(now).getTime() - new Date(checkIn).getTime() : 0;
    const durationMinutes = Math.max(1, Math.round(diffMs / 60000));

    await client.query(
      `UPDATE visits SET check_out = $1, duration_minutes = $2 WHERE id = $3`,
      [now, durationMinutes, id]
    );

    await client.query('COMMIT');

    const result = await client.query(
      `SELECT v.*, s.name as store_name, s.city as store_city, s.state as store_state
       FROM visits v
       JOIN stores s ON v.store_id = s.id
       WHERE v.id = $1`,
      [id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("❌ Erro ao fazer checkout:", error);
    res.status(500).json({ error: "Erro ao fazer checkout" });
  } finally {
    client.release();
  }
});
