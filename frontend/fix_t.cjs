const fs = require('fs');

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/^(const [A-Za-z0-9_]+: React\.FC.*=> \{)\s*$/gm, `$1\n  const { t } = useTranslation();`);
  content = content.replace(/^(export const [A-Za-z0-9_]+: React\.FC.*=> \{)\s*$/gm, `$1\n  const { t } = useTranslation();`);
  fs.writeFileSync(filePath, content);
}

['src/features/payroll/ITDeclarationsPage.tsx', 'src/features/payroll/PayrollCompliancePage.tsx', 'src/features/payroll/PayrollDashboardPage.tsx'].forEach(fixFile);
