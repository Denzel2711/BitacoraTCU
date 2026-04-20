import { getPool } from '@/lib/db';
import { ok, serverError } from '@/lib/http';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tabla = searchParams.get('tabla');
    const limit = Number(searchParams.get('limit') || 100);

    let query = 'SELECT * FROM auditoria WHERE 1=1';
    const params: unknown[] = [];

    if (tabla) {
      query += ' AND tabla_afectada = ?';
      params.push(tabla);
    }

    query += ' ORDER BY creado_en DESC LIMIT ?';
    params.push(Number.isFinite(limit) && limit > 0 ? limit : 100);

    const [rows] = await getPool().query(query, params);
    return ok(rows, { total: Array.isArray(rows) ? rows.length : 0, tabla: tabla ?? null });
  } catch (error) {
    return serverError(error);
  }
}