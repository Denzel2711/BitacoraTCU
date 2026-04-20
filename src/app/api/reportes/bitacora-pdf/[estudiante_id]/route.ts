import { fail, serverError } from '@/lib/http';
import { generateBitacoraPdf } from '@/lib/services/bitacora-pdf.service';
import { registerAuditEvent } from '@/lib/services/audit.service';
import { assertSameOrigin } from '@/lib/security/request-context';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: Promise<{ estudiante_id: string }> }) {
  try {
    const csrfError = assertSameOrigin(request);
    if (csrfError) {
      return fail(csrfError, 403);
    }

    const { estudiante_id } = await params;
    const { buffer, fileName } = await generateBitacoraPdf(estudiante_id);

    await registerAuditEvent({
      tabla: 'reportes',
      accion: 'EXPORT',
      registroId: estudiante_id,
      descripcion: 'Exportacion PDF de bitacora institucional',
      after: { estudiante_id },
      request,
    });

    return new Response(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    return serverError(error);
  }
}