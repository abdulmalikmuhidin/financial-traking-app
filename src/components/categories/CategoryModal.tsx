import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Category, TransactionType } from '../../types';
import { useFinance } from '../../context/FinanceContext';
import { AVAILABLE_ICONS, renderCategoryIcon } from '../../utils/categoryIcons';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryToEdit?: Category | null;
}

const PRESET_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#14B8A6', // Teal
  '#F97316', // Orange
  '#6366F1', // Indigo
  '#64748B', // Slate
];

export const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  onClose,
  categoryToEdit,
}) => {
  const { addCategory, updateCategory } = useFinance();

  const [name, setName] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [icon, setIcon] = useState('Tag');
  const [color, setColor] = useState('#3B82F6');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (categoryToEdit) {
      setName(categoryToEdit.name);
      setType(categoryToEdit.type);
      setIcon(categoryToEdit.icon);
      setColor(categoryToEdit.color);
      setError(null);
    } else {
      setName('');
      setType('expense');
      setIcon('Tag');
      setColor('#3B82F6');
      setError(null);
    }
  }, [categoryToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a category name.');
      return;
    }

    if (categoryToEdit) {
      updateCategory(categoryToEdit.id, {
        name: name.trim(),
        type,
        icon,
        color,
      });
    } else {
      addCategory({
        name: name.trim(),
        type,
        icon,
        color,
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
      <div 
        className="w-full max-w-md bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-900">
            {categoryToEdit ? 'Edit Category' : 'Create New Category'}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
            {error && (
              <div className="p-3 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
                {error}
              </div>
            )}

            {/* Type selector */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Category Type
              </label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-lg">
                <button
                  type="button"
                  onClick={() => setType('expense')}
                  className={`py-1.5 text-xs font-semibold rounded-md transition-colors ${
                    type === 'expense'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Expense Category
                </button>
                <button
                  type="button"
                  onClick={() => setType('income')}
                  className={`py-1.5 text-xs font-semibold rounded-md transition-colors ${
                    type === 'income'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Income Category
                </button>
              </div>
            </div>

            {/* Name input */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Category Title
              </label>
              <input
                type="text"
                placeholder="e.g. Subscriptions, Pet Care, Bonuses"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-hidden focus:border-slate-900 focus:ring-1 focus:ring-slate-900 text-slate-900"
              />
            </div>

            {/* Icon picker */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Select Icon
              </label>
              <div className="grid grid-cols-6 gap-2 p-2 border border-slate-200 rounded-lg max-h-36 overflow-y-auto">
                {AVAILABLE_ICONS.map((iconName) => {
                  const isSelected = icon === iconName;
                  return (
                    <button
                      key={iconName}
                      type="button"
                      onClick={() => setIcon(iconName)}
                      className={`p-2 rounded-md flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'bg-slate-900 text-white'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                      title={iconName}
                    >
                      {renderCategoryIcon(iconName, 'w-4 h-4')}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Color Swatches */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Category Color Accent
              </label>
              <div className="flex flex-wrap gap-2 pt-1">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-7 h-7 rounded-full transition-transform ${
                      color === c ? 'scale-110 ring-2 ring-slate-900 ring-offset-2' : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: c }}
                    aria-label={`Color ${c}`}
                  />
                ))}
              </div>
            </div>

            {/* Preview Box */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shadow-xs"
                style={{ backgroundColor: `${color}15`, color }}
              >
                {renderCategoryIcon(icon, 'w-5 h-5')}
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-900 block">
                  {name || 'Category Preview'}
                </span>
                <span className="text-[11px] text-slate-500 capitalize">
                  {type} classification
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors"
            >
              {categoryToEdit ? 'Save Changes' : 'Create Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
