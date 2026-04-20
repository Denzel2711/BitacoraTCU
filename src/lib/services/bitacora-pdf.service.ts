import 'server-only';

import EstudianteModel from '@/lib/db/models/estudiante.model';
import ActividadModel, { type ActividadRow } from '@/lib/db/models/actividad.model';
import EvidenciaModel, { type EvidenciaRow } from '@/lib/db/models/evidencia.model';

interface BitacoraActividad extends ActividadRow {
  evidencias: EvidenciaRow[];
}

interface PdfLine {
  text: string;
  bold?: boolean;
}

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const LEFT_MARGIN = 44;
const TOP_MARGIN = 52;
const BODY_FONT_SIZE = 10;
const HEADER_FONT_SIZE = 14;
const TITLE_FONT_SIZE = 18;
const BODY_LEADING = 13;

const escapePdfText = (text: string): string => text
  .replace(/\\/g, '\\\\')
  .replace(/\(/g, '\\(')
  .replace(/\)/g, '\\)')
  .replace(/\r?\n/g, ' ');

const wrapText = (text: string, maxLength: number): string[] => {
  const words = text.split(/\s+/).filter(Boolean);

  if (!words.length) {
    return [''];
  }

  const lines: string[] = [];
  let currentLine = words[0];

  for (let index = 1; index < words.length; index += 1) {
    const word = words[index];

    if ((currentLine + ' ' + word).length <= maxLength) {
      currentLine += ` ${word}`;
      continue;
    }

    lines.push(currentLine);
    currentLine = word;
  }

  lines.push(currentLine);
  return lines;
};

const chunkLines = (lines: PdfLine[], maxLinesPerPage: number): PdfLine[][] => {
  const pages: PdfLine[][] = [];
  let currentPage: PdfLine[] = [];

  for (const line of lines) {
    currentPage.push(line);

    if (currentPage.length >= maxLinesPerPage) {
      pages.push(currentPage);
      currentPage = [];
    }
  }

  if (currentPage.length) {
    pages.push(currentPage);
  }

  return pages.length ? pages : [[{ text: 'Sin datos para generar la bitacora.' }]];
};

const buildContentStream = (lines: PdfLine[]): string => {
  const commands: string[] = ['BT', `/${'F1'} ${BODY_FONT_SIZE} Tf`, `${BODY_LEADING} TL`, `${LEFT_MARGIN} ${PAGE_HEIGHT - TOP_MARGIN} Td`];
  let currentFont = 'F1';
  let currentSize = BODY_FONT_SIZE;

  for (const line of lines) {
    const nextFont = line.bold ? 'F2' : 'F1';
    const nextSize = line.bold ? HEADER_FONT_SIZE : BODY_FONT_SIZE;

    if (nextFont !== currentFont || nextSize !== currentSize) {
      commands.push(`/${nextFont} ${nextSize} Tf`);
      commands.push(`${nextSize + 2} TL`);
      currentFont = nextFont;
      currentSize = nextSize;
    }

    commands.push(`(${escapePdfText(line.text)}) Tj`);
    commands.push('T*');
  }

  commands.push('ET');
  return commands.join('\n');
};

const buildPdfBuffer = (pagesContent: string[]): Buffer => {
  const totalObjectCount = 4 + pagesContent.length * 2;
  const catalogId = totalObjectCount;
  const pagesId = 3;
  const fontRegularId = 1;
  const fontBoldId = 2;
  const contentIds = pagesContent.map((_, index) => 4 + index * 2);
  const pageIds = pagesContent.map((_, index) => 5 + index * 2);
  const objects = new Array<string>(totalObjectCount).fill('');

  objects[fontRegularId - 1] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';
  objects[fontBoldId - 1] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>';
  objects[pagesId - 1] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`;

  pagesContent.forEach((pageContent, index) => {
    const contentId = contentIds[index];
    const pageId = pageIds[index];

    objects[contentId - 1] = `<< /Length ${Buffer.byteLength(pageContent, 'utf8')} >>\nstream\n${pageContent}\nendstream`;
    objects[pageId - 1] = `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${PAGE_WIDTH.toFixed(2)} ${PAGE_HEIGHT.toFixed(2)}] /Resources << /Font << /F1 ${fontRegularId} 0 R /F2 ${fontBoldId} 0 R >> >> /Contents ${contentId} 0 R >>`;
  });

  objects[catalogId - 1] = `<< /Type /Catalog /Pages ${pagesId} 0 R >>`;

  const chunks: Buffer[] = [];
  const offsets: number[] = [0];
  const header = Buffer.from('%PDF-1.4\n', 'utf8');
  chunks.push(header);

  let currentLength = header.length;

  for (let objectId = 1; objectId <= totalObjectCount; objectId += 1) {
    offsets[objectId] = currentLength;
    const objectBuffer = Buffer.from(`${objectId} 0 obj\n${objects[objectId - 1]}\nendobj\n`, 'utf8');
    chunks.push(objectBuffer);
    currentLength += objectBuffer.length;
  }

  const xrefOffset = currentLength;
  const xrefLines = [
    'xref',
    `0 ${totalObjectCount + 1}`,
    '0000000000 65535 f ',
    ...offsets.slice(1).map((offset) => `${offset.toString().padStart(10, '0')} 00000 n `),
    'trailer',
    `<< /Size ${totalObjectCount + 1} /Root ${catalogId} 0 R >>`,
    'startxref',
    `${xrefOffset}`,
    '%%EOF',
  ];

  chunks.push(Buffer.from(`${xrefLines.join('\n')}\n`, 'utf8'));
  return Buffer.concat(chunks);
};

const buildReportLines = (estudiante: Awaited<ReturnType<typeof EstudianteModel.findByIdentifier>>, actividades: BitacoraActividad[]): PdfLine[] => {
  if (!estudiante) {
    return [{ text: 'Estudiante no encontrado', bold: true }];
  }

  const totalActividades = actividades.length;
  const totalHoras = actividades.reduce((sum, actividad) => sum + Number(actividad.horas_trabajadas || 0), 0);
  const aprobadas = actividades.filter((actividad) => actividad.estado === 'Aprobada').length;
  const pendientes = actividades.filter((actividad) => actividad.estado === 'Pendiente').length;
  const rechazadas = actividades.filter((actividad) => actividad.estado === 'Rechazada').length;

  const lines: PdfLine[] = [
    { text: 'BITACORA INSTITUCIONAL', bold: true },
    { text: 'Trabajo Comunal Universitario', bold: true },
    { text: '' },
    { text: `Estudiante: ${estudiante.nombre} ${estudiante.primer_apellido ?? ''} ${estudiante.segundo_apellido ?? ''}`.trim() },
    { text: `Cedula: ${estudiante.cedula}` },
    { text: `Carrera: ${estudiante.carrera}` },
    { text: `Academico a cargo: ${estudiante.academico_a_cargo}` },
    { text: `Sede: ${estudiante.sede}` },
    { text: `Fecha de generacion: ${new Date().toLocaleString('es-CR')}` },
    { text: '' },
    { text: `Resumen: ${totalActividades} actividades | ${totalHoras.toFixed(2)} horas | ${aprobadas} aprobadas | ${pendientes} pendientes | ${rechazadas} rechazadas`, bold: true },
    { text: '' },
  ];

  actividades.forEach((actividad, index) => {
    lines.push({ text: `Actividad ${index + 1}`, bold: true });
    lines.push({ text: `Fecha: ${actividad.fecha_actividad} | Estado: ${actividad.estado} | Horas: ${Number(actividad.horas_trabajadas).toFixed(2)}` });
    lines.push({ text: `Tipo: ${actividad.tipo_actividad}` });
    lines.push({ text: `Subtipo: ${actividad.subtipo_actividad}` });

    if (actividad.descripcion_actividad) {
      wrapText(`Descripcion: ${actividad.descripcion_actividad}`, 92).forEach((line) => lines.push({ text: line }));
    }

    if (actividad.descripcion_ubicacion) {
      wrapText(`Ubicacion: ${actividad.descripcion_ubicacion}`, 92).forEach((line) => lines.push({ text: line }));
    }

    const evidenciaResumen = actividad.evidencias.length
      ? actividad.evidencias.map((item) => `${item.tipo_evidencia}${item.nombre_archivo ? ` (${item.nombre_archivo})` : ''}`).join(', ')
      : 'Sin evidencias';

    wrapText(`Evidencias: ${evidenciaResumen}`, 92).forEach((line) => lines.push({ text: line }));
    lines.push({ text: '' });
  });

  return lines;
};

export const generateBitacoraPdf = async (estudianteIdentifier: string): Promise<{ fileName: string; buffer: Buffer }> => {
  const estudiante = await EstudianteModel.findByIdentifier(estudianteIdentifier);

  if (!estudiante) {
    throw new Error('Estudiante no encontrado');
  }

  const actividadesBase = await ActividadModel.findByEstudiante(estudiante.id);
  const actividades: BitacoraActividad[] = [];

  for (const actividad of actividadesBase) {
    const evidencias = await EvidenciaModel.findByActividad(actividad.id);
    actividades.push({ ...actividad, evidencias });
  }

  const lines = buildReportLines(estudiante, actividades);
  const pagesContent = chunkLines(lines, 40).map((pageLines) => buildContentStream(pageLines));
  const pdfBuffer = buildPdfBuffer(pagesContent);
  const safeIdentifier = estudiante.cedula.replace(/[^A-Za-z0-9_-]/g, '_');

  return {
    fileName: `bitacora-${safeIdentifier}.pdf`,
    buffer: pdfBuffer,
  };
};