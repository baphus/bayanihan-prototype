import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { ExportColumn } from './exportCsv'

type ExportPdfOptions = {
  title?: string
  orientation?: 'portrait' | 'landscape'
}

export function exportToPdf<T>(
  rows: T[],
  columns: ExportColumn<T>[],
  fileName: string,
  options: ExportPdfOptions = {},
): void {
  const doc = new jsPDF({ orientation: options.orientation ?? 'landscape' })
  const title = options.title?.trim()

  if (title) {
    doc.setFontSize(14)
    doc.text(title, 14, 14)
  }

  autoTable(doc, {
    startY: title ? 20 : 14,
    head: [columns.map((column) => column.header)],
    body: rows.map((row) =>
      columns.map((column) => {
        const rawValue = column.accessor(row)
        return rawValue === null || rawValue === undefined ? '' : String(rawValue)
      }),
    ),
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [11, 83, 132],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
  })

  doc.save(fileName)
}
