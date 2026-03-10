interface CsvSection {
  title: string;
  rows: Array<Record<string, unknown>>;
}

const escapeValue = (value: unknown): string => {
  if (value === null || value === undefined) {
    return '';
  }

  const normalized = String(value).replace(/"/g, '""');
  return `"${normalized}"`;
};

export const downloadCsvSections = (filename: string, sections: CsvSection[]) => {
  const csvParts = sections.flatMap((section, index) => {
    const lines: string[] = [];

    if (index > 0) {
      lines.push('');
    }

    lines.push(section.title);

    if (section.rows.length === 0) {
      lines.push('Sem dados');
      return lines;
    }

    const headers = Array.from(
      new Set(section.rows.flatMap((row) => Object.keys(row)))
    );

    lines.push(headers.map(escapeValue).join(','));

    section.rows.forEach((row) => {
      lines.push(headers.map((header) => escapeValue(row[header])).join(','));
    });

    return lines;
  });

  const blob = new Blob([csvParts.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
