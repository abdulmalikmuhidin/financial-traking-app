import React, { useState, useMemo } from 'react';
import { Plus, Edit2, Trash2, Tags, ArrowDownRight, ArrowUpRight, Lock } from 'lucide-react';
import { Category, TransactionType } from '../../types';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency } from '../../utils/currencies';
import { renderCategoryIcon } from '../../utils/categoryIcons';
import { CategoryModal } from './CategoryModal';

export const CategoriesView: React.FC = () => {
  const { categories, transactions, currency, convertAmount, deleteCategory, requestConfirmation } = useFinance();

  const [activeTab, setActiveTab] = useState<TransactionType>('expense');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null);

  // Compute transaction stats per category
  const categoryStats = useMemo(() => {
    const stats: Record<string, { count: number; total: number }> = {};

    for (const tx of transactions) {
      if (!stats[tx.categoryId]) {
        stats[tx.categoryId] = { count: 0, total: 0 };
      }
      stats[tx.categoryId].count += 1;
      stats[tx.categoryId].total += convertAmount(tx.amount, tx.currency);
    }

    return stats;
  }, [transactions, convertAmount]);

  const displayedCategories = categories.filter((c) => c.type === activeTab);

  const handleEdit = (category: Category) => {
    setCategoryToEdit(category);
    setIsModalOpen(true);
  };

  const handleDelete = (category: Category) => {
    requestConfirmation({
      title: 'Delete Category',
      message: `Are you sure you want to delete "${category.name}"? This action cannot be undone.`,
      confirmLabel: 'Delete Category',
      isDestructive: true,
      onConfirm: () => deleteCategory(category.id),
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Categories & Tax Tags
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Organize financial activities to unlock clear budgeting and automated reports.
          </p>
        </div>

        <button
          onClick={() => {
            setCategoryToEdit(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>New Category</span>
        </button>
      </div>

      {/* Segmented Filter Tabs */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 p-1 bg-slate-200/80 rounded-lg text-xs">
          <button
            onClick={() => setActiveTab('expense')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'expense'
                ? 'bg-white text-slate-900 font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ArrowDownRight className="w-3.5 h-3.5 text-rose-500" />
            <span>Expense Categories ({categories.filter((c) => c.type === 'expense').length})</span>
          </button>

          <button
            onClick={() => setActiveTab('income')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'income'
                ? 'bg-white text-slate-900 font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
            <span>Income Categories ({categories.filter((c) => c.type === 'income').length})</span>
          </button>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayedCategories.map((cat) => {
          const stats = categoryStats[cat.id] || { count: 0, total: 0 };

          return (
            <div
              key={cat.id}
              className="p-4 bg-white rounded-xl border border-slate-200 flex items-center justify-between hover:border-slate-300 transition-all shadow-2xs group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="flex items-center justify-center w-10 h-10 rounded-lg shrink-0"
                  style={{ backgroundColor: `${cat.color}15`, color: cat.color }}
                >
                  {renderCategoryIcon(cat.icon, 'w-5 h-5')}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-semibold text-slate-900 truncate">
                      {cat.name}
                    </h3>
                    {cat.isDefault && (
                      <span className="text-[10px] text-slate-400 font-normal">
                        Default
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5 font-mono tabular-nums">
                    <span>{stats.count} transactions</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-semibold text-slate-800">
                      {formatCurrency(stats.total, currency)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleEdit(cat)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
                  title="Edit category"
                  aria-label="Edit category"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>

                {!cat.isDefault ? (
                  <button
                    onClick={() => handleDelete(cat)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                    title="Delete category"
                    aria-label="Delete category"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <span
                    className="p-1.5 text-slate-300 cursor-not-allowed"
                    title="System default category"
                  >
                    <Lock className="w-3.5 h-3.5" />
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      <CategoryModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setCategoryToEdit(null);
        }}
        categoryToEdit={categoryToEdit}
      />
    </div>
  );
};
