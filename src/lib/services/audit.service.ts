import 'server-only';

import { getPool } from '@/lib/db';
import { getRequestContext } from '@/lib/security/request-context';

type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'APPROVE' | 'REJECT' | 'EXPORT';

export interface AuditEvent {
  tabla: string;
  accion: AuditAction;
  registroId?: string | number | null;
  descripcion: string;
  before?: unknown;
  after?: unknown;
  request?: Request;
}

const serializePayload = (value: unknown): string | null => {
  if (value === undefined) {
    return null;
  }

  try {
    return JSON.stringify(value);
  } catch {
    return null;
  }
};

const mapAuditAction = (action: AuditAction): 'INSERT' | 'UPDATE' | 'DELETE' => {
  const normalized = action.toUpperCase();

  if (normalized === 'CREATE') {
    return 'INSERT';
  }

  if (normalized === 'DELETE') {
    return 'DELETE';
  }

  return 'UPDATE';
};

const toNumericRegistroId = (registroId: string | number | null | undefined): number => {
  const numericValue = Number(registroId);
  return Number.isFinite(numericValue) ? numericValue : 0;
};

export const registerAuditEvent = async (event: AuditEvent): Promise<void> => {
  const context = event.request
    ? getRequestContext(event.request)
    : { ip: null, userAgent: null, userId: null, userRole: null };

  try {
    await getPool().query(
      `INSERT INTO auditoria (
        tabla_afectada,
        id_registro,
        tipo_operacion,
        usuario_id,
        nombre_usuario,
        valores_anteriores,
        valores_nuevos,
        razon_cambio,
        direccion_ip,
        user_agent
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        event.tabla,
        toNumericRegistroId(event.registroId),
        mapAuditAction(event.accion),
        context.userId ? Number(context.userId) : null,
        context.userId,
        serializePayload(event.before),
        serializePayload(event.after),
        event.descripcion,
        context.ip,
        context.userAgent,
      ]
    );
  } catch (error) {
    console.info('[audit]', {
      tabla: event.tabla,
      accion: event.accion,
      registroId: event.registroId ?? null,
      descripcion: event.descripcion,
      contexto: context,
      before: event.before ?? null,
      after: event.after ?? null,
      error: (error as Error)?.message ?? String(error),
    });
  }
};