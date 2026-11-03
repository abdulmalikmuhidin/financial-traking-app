import { Transaction, Category, Budget, User } from '../types';

export function exportTransactionsToCSV(transactions: Transaction[], categories: Category[]): void {
  if (transactions.length === 0) {
    throw new Error('No transactions to export');
  }

  const headers = [
    'Date',
    'Type',
    'Description',
    'Merchant',
    'Category',
    'Amount',
    'Currency',
    'Payment Method',
    'Notes',
  ];

  const rows = transactions.map((t) => {
    const cat = categories.find((c) => c.id === t.categoryId)?.name || 'Uncategorized';
    return [
      `"${t.date}"`,
      `"${t.type}"`,
      `"${(t.description || '').replace(/"/g, '""')}"`,
      `"${(t.merchant || '').replace(/"/g, '""')}"`,
      `"${cat}"`,
      t.amount.toFixed(2),
      `"${t.currency}"`,
      `"${t.paymentMethod}"`,
      `"${(t.notes || '').replace(/"/g, '""')}"`,
    ].join(',');
  });

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `fintrack_transactions_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportBackupJSON(data: {
  user: User | null;
  currency: string;
  categories: Category[];
  budgets: Budget[];
  transactions: Transaction[];
}): void {
  const backup = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    ...data,
  };

  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backup, null, 2));
  const dlAnchor = document.createElement('a');
  dlAnchor.setAttribute('href', dataStr);
  dlAnchor.setAttribute('download', `fintrack_backup_${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(dlAnchor);
  dlAnchor.click();
  document.body.removeChild(dlAnchor);
}

export function parseBackupJSON(jsonString: string): {
  transactions: Transaction[];
  categories?: Category[];
  budgets?: Budget[];
  currency?: string;
} {
  const parsed = JSON.parse(jsonString);
  if (!parsed.transactions || !Array.isArray(parsed.transactions)) {
    throw new Error('Invalid backup file structure: transactions array missing');
  }
  return parsed;
}

