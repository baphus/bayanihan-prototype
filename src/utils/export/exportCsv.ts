export type ExportColumn<T> = {
  header: string
  accessor: (row: T) => string | number | boolean | null | undefined
}

function escapeCsvValue(value: string): string {
  return `"${value.replaceAll('"', '""')}"`
}

export function exportToCsv<T>(rows: T[], columns: ExportColumn<T>[], fileName: string): void {
  const header = columns.map((column) => escapeCsvValue(column.header)).join(',')
  const body = rows.map((row) => {
    return columns
      .map((column) => {
        const rawValue = column.accessor(row)
        const normalizedValue = rawValue === null || rawValue === undefined ? '' : String(rawValue)
        return escapeCsvValue(normalizedValue)
      })
      .join(',')
  })

  const csv = [header, ...body].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
}
