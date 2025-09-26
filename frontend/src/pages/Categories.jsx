import { useEffect, useState } from 'react';
import { categoryAPI, insightsAPI } from '../services/api';
import { Plus, Edit3, Trash2, Tag, Search } from 'lucide-react';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', type: 'expense' });
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [typeFilter, setTypeFilter] = useState(''); // '', 'income', 'expense'
  const [search, setSearch] = useState('');
  const [categoryTotals, setCategoryTotals] = useState({});

  const load = async () => {
    try {
      setLoading(true);
      const paramsType = typeFilter || null;
      const res = await categoryAPI.getCategories(paramsType, search.trim() || null);
      console.log('Load categories response:', res);
      if (res.success) setCategories(res.data.categories || []);
      else console.warn('Failed to load categories:', res.message);
      try {
        const ins = await insightsAPI.getSpending(6);
        if (ins.success) {
          const map = {}; (ins.data.categories||[]).forEach(c=>{ map[c.name]=c.total; });
          setCategoryTotals(map);
        }
      } catch {}
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
    <div className="h-full p-4 space-y-6 overflow-y-auto bg-gray-100 dark:bg-gray-100">
      <div className="mb-6">
        <h1 className="text-3xl sm:text-4xl font-black text-black mb-3 uppercase tracking-wider">Categories</h1>
        <p className="text-black font-bold text-lg">Create and manage your income and expense categories.</p>
      </div>

      {/* Compact toolbar: search, type, and quick add */}
      <div className="brutal-card p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-black font-bold" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="SEARCH BY NAME"
              className="w-full pl-10 pr-3 py-2 brutal-input font-bold uppercase tracking-wide focus-ring text-sm"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 brutal-input font-bold uppercase tracking-wide text-sm"
          >
            <option value="">All</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
          <div className="flex flex-wrap gap-2 w-full">
            <input
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="ADD CATEGORY"
              className="flex-1 min-w-0 px-3 py-2 brutal-input font-bold uppercase tracking-wide focus-ring text-sm"
            />
            <select
              value={form.type}
              onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
              className="px-3 py-2 brutal-input font-bold uppercase tracking-wide shrink-0 w-[120px] text-sm"
            >
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
            <button
              type="button"
              disabled={submitting}
              onClick={handleSubmit}
              className="px-3 py-2 bg-orange-500 text-black font-black uppercase tracking-wide brutal-button brutal-shadow-hover animate-brutal-bounce disabled:opacity-50 shrink-0"
              title={editingId ? 'Update' : 'Add'}
            >
              {editingId ? <Edit3 size={14} /> : <Plus size={14} />}
            </button>
          </div>
        </div>
      </div>

      {/* List with horizontal cards and pie */}
      <div className="brutal-card p-4">
        {/* Pie */}
        {Object.keys(categoryTotals).length > 0 && (
          <div className="mb-6">
            <div className="text-lg font-black text-black mb-3 uppercase tracking-wide">Expense Distribution</div>
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <div className="w-32 h-32 sm:w-48 sm:h-48 brutal-border brutal-shadow flex-shrink-0" style={{
                background: (()=>{ const entries = Object.entries(categoryTotals); const total = entries.reduce((a,[_n,v])=>a+v,0)||1; let acc=0; return `conic-gradient(${entries.map(([n,v],i)=>{ const start=Math.round((acc/total)*360); acc+=v; const end=Math.round((acc/total)*360); return `hsl(${(i*57)%360} 70% 50%) ${start}deg ${end}deg`; }).join(', ')})`; })()
              }}></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                {Object.entries(categoryTotals).map(([name,total],i)=> (
                  <div key={name} className="px-3 py-2 brutal-card bg-orange-50 dark:bg-orange-100 flex items-center justify-between">
                    <span className="inline-flex items-center gap-2 min-w-0"><span className="inline-block w-3 h-3 brutal-border" style={{ backgroundColor:`hsl(${(i*57)%360} 70% 50%)` }}></span><span className="text-black font-black text-xs truncate uppercase tracking-wide">{name}</span></span>
                    <span className="text-black text-xs font-black whitespace-nowrap">₹{Math.round(total).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="p-6 text-black font-black text-lg uppercase tracking-wide">Loading categories...</div>
        ) : categories.length === 0 ? (
          <div className="p-6 text-black font-bold text-base">No categories yet. Add your first one above.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((cat, i) => (
              <div key={cat._id} className="p-4 brutal-card bg-orange-50 dark:bg-orange-100">
                <div className="flex items-start gap-3 mb-3">
                  <div className={`w-10 h-10 brutal-border brutal-shadow flex items-center justify-center flex-shrink-0 ${cat.type === 'income' ? 'bg-green-500 text-black' : 'bg-red-500 text-black'}`}>
                    <Tag size={16} className="font-bold" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-black text-black text-sm uppercase tracking-wide truncate">{cat.name}</div>
                    <div className="text-xs text-black font-bold">₹{Math.round(categoryTotals[cat.name]||0).toLocaleString()}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className={`px-3 py-2 brutal-button brutal-shadow-hover animate-brutal-bounce flex-1 ${cat.isDefault ? 'cursor-not-allowed opacity-50 bg-gray-400 text-black' : 'bg-orange-500 text-black'}`}
                    onClick={() => !cat.isDefault && handleEdit(cat)}
                    title={cat.isDefault ? 'Default categories cannot be edited' : 'Edit'}
                    disabled={!!cat.isDefault}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <Edit3 size={14} />
                      <span className="text-xs font-bold">Edit</span>
                    </div>
                  </button>
                  <button
                    className="px-3 py-2 bg-red-500 text-black font-black brutal-button brutal-shadow-hover animate-brutal-bounce flex-1"
                    onClick={() => handleDelete(cat._id)}
                    title={cat.isDefault ? 'Hide default category' : 'Delete'}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <Trash2 size={14} />
                      <span className="text-xs font-bold">Delete</span>
                    </div>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Categories;


