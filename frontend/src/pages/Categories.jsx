import { useEffect, useState } from 'react';
import { categoryAPI } from '../services/api';
import { Plus, Edit3, Trash2, Tag, Search } from 'lucide-react';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', type: 'expense' });
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [typeFilter, setTypeFilter] = useState(''); // '', 'income', 'expense'
  const [search, setSearch] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      const paramsType = typeFilter || null;
      const res = await categoryAPI.getCategories(paramsType, search.trim() || null);
      console.log('Load categories response:', res);
      if (res.success) setCategories(res.data.categories || []);
      else console.warn('Failed to load categories:', res.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [typeFilter, search]);

  const resetForm = () => {
    setForm({ name: '', type: 'expense' });
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    try {
      setSubmitting(true);
      if (editingId) {
        const res = await categoryAPI.updateCategory(editingId, { name: form.name.trim(), type: form.type });
        console.log('Update category:', res);
        if (!res.success) alert(res.message || 'Update failed');
      } else {
        const res = await categoryAPI.createCategory({ name: form.name.trim(), type: form.type });
        console.log('Create category:', res);
        if (!res.success) alert(res.message || 'Create failed');
      }
      resetForm();
      await load();
    } catch (e) {
      console.error('Create/update category error:', e);
      alert(e.response?.data?.message || e.message || 'Request failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (cat) => {
    setEditingId(cat._id);
    setForm({ name: cat.name, type: cat.type });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this category?')) return;
    try {
      const res = await categoryAPI.deleteCategory(id);
      console.log('Delete category:', res);
      if (!res.success) alert(res.message || 'Delete failed');
    } catch (e) {
      alert(e.response?.data?.message || 'Delete failed');
    }
    await load();
  };

  return (
    <div className="h-full p-6 space-y-6 overflow-y-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Categories</h1>
        <p className="text-gray-600 dark:text-gray-400">Create and manage your income and expense categories.</p>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
          <div className="flex-1 relative">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Search</label>
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="w-full sm:w-56">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </div>
        </div>
      </div>

      {/* Create / Edit */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category name</label>
            <input
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Groceries, Salary"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
            <select
              value={form.type}
              onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </div>
          <div className="self-end">
            <button
              type="button"
              disabled={submitting}
              onClick={handleSubmit}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
            >
              {editingId ? <Edit3 size={16} /> : <Plus size={16} />}
              {editingId ? 'Update' : 'Add'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="ml-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="p-6 text-gray-600 dark:text-gray-400">Loading categories...</div>
        ) : categories.length === 0 ? (
          <div className="p-6 text-gray-600 dark:text-gray-400">No categories yet. Add your first one above.</div>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {categories.map((cat) => (
              <li key={cat._id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-md flex items-center justify-center ${cat.type === 'income' ? 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400'}`}>
                    <Tag size={16} />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white inline-flex items-center gap-2">
                      {cat.name}
                      {cat.isDefault && (
                        <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">Default</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">{cat.type}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className={`px-3 py-2 rounded-lg inline-flex items-center gap-2 ${cat.isDefault ? 'cursor-not-allowed opacity-50 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                    onClick={() => !cat.isDefault && handleEdit(cat)}
                    title={cat.isDefault ? 'Default categories cannot be edited' : 'Edit'}
                    disabled={!!cat.isDefault}
                  >
                    <Edit3 size={16} /> Edit
                  </button>
                  <button
                    className={`px-3 py-2 rounded-lg inline-flex items-center gap-2 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400`}
                    onClick={() => handleDelete(cat._id)}
                    title={cat.isDefault ? 'Hide default category' : 'Delete'}
                  >
                    <Trash2 size={16} /> {cat.isDefault ? 'Hide' : 'Delete'}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Categories;


