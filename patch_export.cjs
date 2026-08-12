const fs = require('fs');
const file = 'src/twin-crm/views/shared/Payments.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "import { DollarSign, Clock, CreditCard, User, Plus, Search, ChevronDown, ExternalLink, Copy, Eye, Edit2, Filter, Activity, AlertCircle } from 'lucide-react'",
  "import { DollarSign, Clock, CreditCard, User, Plus, Search, ChevronDown, ExternalLink, Copy, Eye, Edit2, Filter, Activity, AlertCircle, Download } from 'lucide-react'"
);

const exportFn = `
  const handleExportCSV = () => {
    const headers = ['ID', 'Date', 'Amount', 'Status', 'Type', 'Lead Name', 'Sold Price', 'Expires'];
    const csvContent = [
      headers.join(','),
      ...filteredPurchases.map(p => {
        const leadName = leads.find(l => l.id === p.leadId)?.name || p.leadId;
        return [
          p.id,
          new Date(p.date).toLocaleDateString(),
          p.amount,
          p.paymentStatus || 'Pending',
          p.paymentType || 'Full',
          \`"\${leadName}"\`,
          p.soldPrice || p.amount,
          p.expires || 'NO EXPIRY'
        ].join(',');
      })
    ].join('\\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', \`payments_export_\${new Date().toISOString().split('T')[0]}.csv\`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
`;

const returnTarget = `  return (
    <div className="space-y-6 h-full flex flex-col">`;

content = content.replace(returnTarget, exportFn + '\\n' + returnTarget);

const buttonsTarget = `        <div className="flex-1" />
        <Button onClick={handleOpenCreateModal} className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus size={18} />
          Create Payment
        </Button>`;

const buttonsReplacement = `        <div className="flex-1" />
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleExportCSV} className="flex items-center gap-2 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800">
            <Download size={16} className="text-slate-500" />
            Export CSV
          </Button>
          <Button onClick={handleOpenCreateModal} className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus size={18} />
            Create Payment
          </Button>
        </div>`;

content = content.replace(buttonsTarget, buttonsReplacement);

fs.writeFileSync(file, content, 'utf8');
console.log('Export logic added successfully');
