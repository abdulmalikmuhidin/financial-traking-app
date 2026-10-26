/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Plus, Tag, Edit2, Trash2, X, Check } from 'lucide-react';
import { Category } from '@/types';
import { useFinance } from '@/context/FinanceContext';
import { useLanguage } from '@/context/LanguageContext';
import { renderCategoryIcon, AVAILABLE_CATEGORY_ICONS } from '@/utils/categoryIcons';

const COLOR_OPTIONS = [
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#6366F1', // Indigo
  '#EC4899', // Pink
  '#8B5CF6', // Purple
  '#14B8A6', // Teal
  '#0EA5E9', // Sky
  '#F97316', // Orange
  '#059669', // Forest
  '#EF4444', // Red
  '#64748B', // Slate
];

export const CategoriesView: React.FC = () => {
  const { categories, addCategory, updateCategory, deleteCategory, requestConfirmation } = useFinance();
  const { t } = useLanguage();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);

  const [name, setName] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [icon, setIcon] = useState('Tag');
  const [color, setColor] = useState('#3B82F6');
  const [error, setError] = useState<string | null>(null);

  const expenseCategories = categories.filter((c) => c.type === 'expense');
  const incomeCategories = categories.filter((c) => c.type === 'income');

  const handleOpenModal = (cat?: Category) => {
    if (cat) {
      setEditingCat(cat);
      setName(cat.name);
      setType(cat.type);
      setIcon(cat.icon);
      setColor(cat.color);
    } else {
      setEditingCat(null);
      setName('');
      setType('expense');
      setIcon('Tag');
      setColor('#3B82F6');
    }
    setError(null);
    setModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please provide a category name.');
      return;
    }

    if (editingCat) {
      await updateCategory(editingCat.id, {
        name: name.trim(),
        type,
        icon,
        color,
      });
    } else {
      await addCategory({
        name: name.trim(),
        type,
        icon,
        color,
      });
    }

    setModalOpen(false);
  };

  const handleDelete = (cat: Category) => {
    requestConfirmation({
      title: t('cat.deleteTitle', 'Delete Category'),
      message: `${t('cat.deleteConfirm', 'Are you sure you want to delete this category?')} ("${cat.name}")`,
      isDestructive: true,
      onConfirm: () => deleteCategory(cat.id),
    });
  };

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            {t('cat.title', 'Categories & Tax Tags')}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {t('cat.subtitle', 'Organize financial activities to unlock clear budgeting and automated reports.')}
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>{t('cat.newCategory', 'New Category')}</span>
        </button>
      </div>

      {/* Expense Categories Grid */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <span>{t('cat.expenseCategories', 'Expense Categories')}</span>
          <span className="text-xs font-normal text-slate-500 font-mono">
            ({expenseCategories.length})
          </span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {expenseCategories.map((c) => (
            <div
              key={c.id}
              className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-between hover:border-slate-300 transition-all"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${c.color}15`, color: c.color }}
                >
                  {renderCategoryIcon(c.icon, 'w-4 h-4')}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-900 truncate">
                    {c.name}
                  </p>
                  <span className="text-[10px] text-slate-400">
                    {c.isDefault ? t('cat.default', 'Default') : t('cat.custom', 'Custom')}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleOpenModal(c)}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100 transition-colors"
                  title={t('common.edit', 'Edit')}
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                {!c.isDefault && (
                  <button
                    onClick={() => handleDelete(c)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors"
                    title={t('common.delete', 'Delete')}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Income Categories Grid */}
      <div className="space-y-3 pt-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <span>{t('cat.incomeCategories', 'Income Categories')}</span>
          <span className="text-xs font-normal text-slate-500 font-mono">
            ({incomeCategories.length})
          </span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {incomeCategories.map((c) => (
            <div
              key={c.id}
              className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-between hover:border-slate-300 transition-all"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${c.color}15`, color: c.color }}
                >
                  {renderCategoryIcon(c.icon, 'w-4 h-4')}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-900 truncate">
                    {c.name}
                  </p>
                  <span className="text-[10px] text-slate-400">
                    {c.isDefault ? t('cat.default', 'Default') : t('cat.custom', 'Custom')}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleOpenModal(c)}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100 transition-colors"
                  title={t('common.edit', 'Edit')}
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                {!c.isDefault && (
                  <button
                    onClick={() => handleDelete(c)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors"
                    title={t('common.delete', 'Delete')}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal: Add / Edit Category */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900">
                {editingCat ? t('cat.modalTitleEdit', 'Edit Category') : t('cat.modalTitleNew', 'Create New Category')}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4">
              {error && (
                <div className="p-3 text-xs font-medium text-rose-600 bg-rose-50 border border-rose-200 rounded-lg">
                  {error}
                </div>
              )}

              {/* Type Switcher */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-lg">
                <button
                  type="button"
                  onClick={() => setType('expense')}
                  className={`py-1.5 text-xs font-semibold rounded-md transition-colors ${
                    type === 'expense'
                      ? 'bg-white text-rose-600 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {t('tx.typeExpense', 'Expense')}
                </button>
                <button
                  type="button"
                  onClick={() => setType('income')}
                  className={`py-1.5 text-xs font-semibold rounded-md transition-colors ${
                    type === 'income'
                      ? 'bg-white text-emerald-600 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {t('tx.typeIncome', 'Income')}
                </button>
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  {t('cat.nameLabel', 'Category Name')} *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('cat.namePlaceholder', 'e.g. Subscriptions or Consulting')}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:border-slate-900"
                />
              </div>

              {/* Icon Selection */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  {t('cat.iconLabel', 'Select Icon')}
                </label>
                <div className="grid grid-cols-7 gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200 max-h-32 overflow-y-auto">
                  {AVAILABLE_CATEGORY_ICONS.map((iconName) => (
                    <button
                      type="button"
                      key={iconName}
                      onClick={() => setIcon(iconName)}
                      className={`p-2 rounded-lg flex items-center justify-center transition-all ${
                        icon === iconName
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'text-slate-600 hover:bg-slate-200'
                      }`}
                      title={iconName}
                    >
                      {renderCategoryIcon(iconName, 'w-4 h-4')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Selection */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  {t('cat.colorLabel', 'Badge Color')}
                </label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      type="button"
                      key={c}
                      onClick={() => setColor(c)}
                      className="w-6 h-6 rounded-full transition-transform flex items-center justify-center"
                      style={{ backgroundColor: c }}
                    >
                      {color === c && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  {t('common.cancel', 'Cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors"
                >
                  {t('common.save', 'Save Category')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export const CategoriesPage = CategoriesView;
