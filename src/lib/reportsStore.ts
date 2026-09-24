import fs from 'fs';
import path from 'path';

export interface StoredReport {
  id: string;
  parent_node_id: string;
  report_data: string;
  created_at: string;
}

const reportsPath = path.join(process.cwd(), 'data', 'reports.json');

function readReports(): StoredReport[] {
  try {
    if (!fs.existsSync(reportsPath)) return [];
    const contents = fs.readFileSync(reportsPath, 'utf8');
    const reports = JSON.parse(contents);
    return Array.isArray(reports) ? reports : [];
  } catch (error) {
    console.error('Error reading reports:', error);
    return [];
  }
}

function writeReports(reports: StoredReport[]) {
  const dataDirectory = path.dirname(reportsPath);
  fs.mkdirSync(dataDirectory, { recursive: true });
  const temporaryPath = `${reportsPath}.tmp`;
  fs.writeFileSync(temporaryPath, JSON.stringify(reports, null, 2), 'utf8');
  fs.renameSync(temporaryPath, reportsPath);
}

export function listReports(parentId?: string) {
  return readReports()
    .filter(report => !parentId || report.parent_node_id === parentId)
    .sort((first, second) => second.created_at.localeCompare(first.created_at))
    .slice(0, parentId ? undefined : 50);
}

export function saveReport(id: string, parentNodeId: string, reportData: unknown) {
  const report: StoredReport = {
    id,
    parent_node_id: parentNodeId,
    report_data: JSON.stringify(reportData),
    created_at: new Date().toISOString(),
  };
  writeReports([report, ...readReports()]);
  return report;
}