import React, { useState, useEffect } from 'react';
import { 
  Globe, Plus, Edit2, Trash2, List, Check, X, Layers
} from 'lucide-react';
import { collection, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc, updateDoc, query, where } from 'firebase/firestore';
import { db } from '../../firebase';
import { Category, SubCategory } from '../../types';
import Swal from 'sweetalert2';
import AdminLayout from '../../components/AdminLayout';
import { cn } from '../../lib/utils';

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [newCatName, setNewCatName] = useState('');
  const [newSub, setNewSub] = useState({ categoryId: '', name: '', isFree: true, price: 0 });
  const [activeTab, setActiveTab] = useState<'categories' | 'subcategories'>('categories');

  useEffect(() => {
    const unsubCat = onSnapshot(collection(db, 'categories'), (snap) => {
      setCategories(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category)));
    });
    const unsubSub = onSnapshot(collection(db, 'subcategories'), (snap) => {
      setSubCategories(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as SubCategory)));
    });
    return () => { unsubCat(); unsubSub(); };
  }, []);

  const addCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      await addDoc(collection(db, 'categories'), {
        name: newCatName,
        status: 'Active',
        createdAt: serverTimestamp()
      });
      setNewCatName('');
      Swal.fire('Success', 'Category added', 'success');
    } catch (error: any) {
      Swal.fire('Error', error.message, 'error');
    }
  };

  const addSubCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSub.categoryId || !newSub.name.trim()) return;
    try {
      await addDoc(collection(db, 'subcategories'), {
        ...newSub,
        status: 'Active',
        createdAt: serverTimestamp()
      });
      setNewSub({ categoryId: '', name: '', isFree: true, price: 0 });
      Swal.fire('Success', 'Subcategory added', 'success');
    } catch (error: any) {
      Swal.fire('Error', error.message, 'error');
    }
  };

  const deleteCategory = async (id: string) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "All subcategories will be affected",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33'
    });

    if (result.isConfirmed) {
      await deleteDoc(doc(db, 'categories', id));
      Swal.fire('Deleted!', 'Category has been deleted.', 'success');
    }
  };

  return (
    <AdminLayout activeMenu="Categories">
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-sm shrink-0">
        <div className="flex items-center gap-2">
          <h2 className="text-xl text-slate-700 font-medium">Manage Categories</h2>
          <span className="text-xs text-slate-400 mt-1.5 ml-2">Add, Edit or Delete categories and subcategories</span>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-tight">
          <Globe className="w-3 h-3 text-[#3c8dbc]" />
          <span>Home</span>
          <span className="text-slate-300">&gt;</span>
          <span className="text-slate-400">Categories</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex gap-4 border-b border-slate-200 mb-6">
            <button 
              onClick={() => setActiveTab('categories')}
              className={cn("px-4 py-2 text-sm font-bold tracking-tight transition-colors border-b-2", activeTab === 'categories' ? "border-[#3c8dbc] text-[#3c8dbc]" : "border-transparent text-slate-500")}
            >
              CATEGORIES
            </button>
            <button 
              onClick={() => setActiveTab('subcategories')}
              className={cn("px-4 py-2 text-sm font-bold tracking-tight transition-colors border-b-2", activeTab === 'subcategories' ? "border-[#3c8dbc] text-[#3c8dbc]" : "border-transparent text-slate-500")}
            >
              SUB CATEGORIES
            </button>
          </div>

          {activeTab === 'categories' ? (
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Add Category Form */}
              <div className="bg-white border-t-2 border-[#3c8dbc] rounded shadow-sm">
                <div className="p-3 border-b border-slate-100 font-bold text-xs text-slate-700 uppercase tracking-wide">Add New Category</div>
                <form onSubmit={addCategory} className="p-4 space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Category Name</label>
                    <input 
                      type="text" 
                      className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:border-blue-400 outline-none"
                      value={newCatName}
                      onChange={e => setNewCatName(e.target.value)}
                      placeholder="e.g. Science"
                    />
                  </div>
                  <button type="submit" className="w-full bg-[#3c8dbc] text-white py-2 rounded text-sm font-bold uppercase tracking-wider hover:bg-[#367fa9] transition-colors">
                    Add Category
                  </button>
                </form>
              </div>

              {/* Categories Table */}
              <div className="lg:col-span-2 bg-white border-t-2 border-[#00c0ef] rounded shadow-sm overflow-hidden">
                <div className="p-3 border-b border-slate-100 font-bold text-xs text-slate-700 uppercase tracking-wide">Category List</div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 border-b border-slate-100 uppercase text-[10px] text-slate-500">
                      <tr>
                        <th className="p-3 font-bold">Category Name</th>
                        <th className="p-3 font-bold">Status</th>
                        <th className="p-3 font-bold text-right uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-slate-600">
                      {categories.map(cat => (
                        <tr key={cat.id} className="hover:bg-slate-50">
                          <td className="p-4 font-medium">{cat.name}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 bg-[#00a65a] text-white text-[10px] font-bold rounded uppercase">Active</span>
                          </td>
                          <td className="p-3">
                            <div className="flex justify-end gap-1">
                               <button className="p-1.5 bg-[#00c0ef] text-white rounded hover:opacity-80 transition-opacity"><Edit2 className="w-3 h-3" /></button>
                               <button onClick={() => deleteCategory(cat.id)} className="p-1.5 bg-[#dd4b39] text-white rounded hover:opacity-80 transition-opacity"><Trash2 className="w-3 h-3" /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-6">
               {/* Add Sub Category Form */}
               <div className="bg-white border-t-2 border-[#3c8dbc] rounded shadow-sm">
                <div className="p-3 border-b border-slate-100 font-bold text-xs text-slate-700 uppercase tracking-wide">Add New Sub Category</div>
                <form onSubmit={addSubCategory} className="p-4 space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Select Category</label>
                    <select 
                      required
                      className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-white"
                      value={newSub.categoryId}
                      onChange={e => setNewSub({ ...newSub, categoryId: e.target.value })}
                    >
                      <option value="">Choose...</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Sub Category Name</label>
                    <input 
                      required
                      type="text" 
                      className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:border-blue-400 outline-none"
                      value={newSub.name}
                      onChange={e => setNewSub({ ...newSub, name: e.target.value })}
                    />
                  </div>
                  <div className="flex items-center gap-4 py-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={newSub.isFree} onChange={e => setNewSub({ ...newSub, isFree: e.target.checked })} className="w-4 h-4 rounded border-slate-300 text-[#3c8dbc]" />
                      <span className="text-xs font-bold text-slate-600">Is Free?</span>
                    </label>
                  </div>
                  {!newSub.isFree && (
                    <div className="space-y-1.5 animate-in slide-in-from-top-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Price</label>
                      <input 
                        type="number" 
                        className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:border-blue-400 outline-none"
                        value={newSub.price}
                        onChange={e => setNewSub({ ...newSub, price: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  )}
                  <button type="submit" className="w-full bg-[#3c8dbc] text-white py-2 rounded text-sm font-bold uppercase tracking-wider hover:bg-[#367fa9] transition-colors">
                    Add Sub Category
                  </button>
                </form>
              </div>

               {/* SubCategory Table */}
              <div className="lg:col-span-2 bg-white border-t-2 border-[#f39c12] rounded shadow-sm overflow-hidden">
                <div className="p-3 border-b border-slate-100 font-bold text-xs text-slate-700 uppercase tracking-wide">Sub Category List</div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 border-b border-slate-100 uppercase text-[10px] text-slate-500">
                      <tr>
                        <th className="p-3 font-bold">Category</th>
                        <th className="p-3 font-bold">Sub Category Name</th>
                        <th className="p-3 font-bold text-center">Is Free</th>
                        <th className="p-3 font-bold">Status</th>
                        <th className="p-3 font-bold text-right tracking-widest uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-slate-600">
                      {subCategories.map(sub => {
                        const cat = categories.find(c => c.id === sub.categoryId);
                        return (
                          <tr key={sub.id} className="hover:bg-slate-50">
                            <td className="p-4 text-slate-400 italic">{cat?.name}</td>
                            <td className="p-4 font-medium">{sub.name}</td>
                            <td className="p-3 text-center">
                              {sub.isFree ? (
                                <span className="px-2 py-0.5 bg-[#3c8dbc] text-white text-[9px] font-bold rounded uppercase">Free</span>
                              ) : (
                                <span className="px-2 py-0.5 bg-slate-200 text-slate-600 text-[9px] font-bold rounded uppercase">Paid (${sub.price})</span>
                              )}
                            </td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 bg-[#00a65a] text-white text-[9px] font-bold rounded uppercase">Active</span>
                            </td>
                            <td className="p-3">
                              <div className="flex justify-end gap-1">
                                 <button className="p-1.5 bg-[#00c0ef] text-white rounded hover:opacity-80 transition-opacity"><Edit2 className="w-3 h-3" /></button>
                                 <button onClick={async () => {
                                   if ((await Swal.fire({ title: 'Delete?', showCancelButton: true })).isConfirmed) {
                                     await deleteDoc(doc(db, 'subcategories', sub.id));
                                   }
                                 }} className="p-1.5 bg-[#dd4b39] text-white rounded hover:opacity-80 transition-opacity"><Trash2 className="w-3 h-3" /></button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
