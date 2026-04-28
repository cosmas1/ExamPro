import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Globe, List, Download, Upload, ChevronRight
} from 'lucide-react';
import { collection, query, onSnapshot, where } from 'firebase/firestore';
import { db } from '../../firebase';
import { Category, SubCategory } from '../../types';
import Swal from 'sweetalert2';
import AdminLayout from '../../components/AdminLayout';

export default function BulkQuestionUpload() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  
  const [formData, setFormData] = useState({
    excelFormat: 'Single Language',
    categoryId: '',
    subCategoryId: '',
    file: null as File | null
  });

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'categories'), (snap) => {
      setCategories(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category)));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!formData.categoryId) {
      setSubCategories([]);
      return;
    }
    const q = query(collection(db, 'subcategories'), where('categoryId', '==', formData.categoryId));
    const unsub = onSnapshot(q, (snap) => {
      setSubCategories(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as SubCategory)));
    });
    return () => unsub();
  }, [formData.categoryId]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFormData({ ...formData, file: e.target.files[0] });
    }
  };

  const handleUploadNow = () => {
    if (!formData.categoryId || !formData.subCategoryId || !formData.file) {
      Swal.fire('Error', 'Please select category, subcategory and a file', 'error');
      return;
    }
    
    Swal.fire({
      title: 'Uploading...',
      text: 'Parsing excel data and adding questions',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    // Mocking the upload logic for now
    setTimeout(() => {
      Swal.fire('Success', 'Questions uploaded successfully', 'success');
      navigate('/admin/questions');
    }, 2000);
  };

  return (
    <AdminLayout activeMenu="Questions" activeSubMenu="Bulk Question Upload">
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-sm shrink-0">
        <div className="flex items-center gap-2">
          <h2 className="text-xl text-slate-700 font-medium">Bulk Question Upload</h2>
          <span className="text-xs text-slate-400 mt-1.5 ml-2">Upload questions via Excel File</span>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-tight">
          <Globe className="w-3 h-3 text-[#3c8dbc]" />
          <span>Home</span>
          <span className="text-slate-300">&gt;</span>
          <span>All questions</span>
          <span className="text-slate-300">&gt;</span>
          <span className="text-slate-400">Bulk Upload</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-white border-t border-slate-200 rounded shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-tight">Bulk upload facility</h3>
              <button className="text-slate-300 hover:text-slate-500"><div className="w-4 h-0.5 bg-current" /></button>
            </div>

            <div className="p-8 grid lg:grid-cols-2 gap-12">
              {/* Upload Form */}
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">Excel Format</label>
                  <select 
                    className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-white focus:border-blue-400 transition-colors"
                    value={formData.excelFormat}
                    onChange={e => setFormData({ ...formData, excelFormat: e.target.value })}
                  >
                    <option>Single Language</option>
                    <option>Dual Language</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">
                     Select Category -- -- -- -- -- <button onClick={() => navigate('/admin/categories')} className="text-[#3c8dbc] hover:underline font-bold text-[10px] ml-2 normal-case">Click to Add new Category</button>
                  </label>
                  <select 
                    className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-white focus:border-blue-400 transition-colors"
                    value={formData.categoryId}
                    onChange={e => setFormData({ ...formData, categoryId: e.target.value, subCategoryId: '' })}
                  >
                    <option value="">Select main category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">
                     Sub Category -- -- -- -- -- <button onClick={() => navigate('/admin/categories')} className="text-[#3c8dbc] hover:underline font-bold text-[10px] ml-2 normal-case">Click to Add new Subcategory</button>
                  </label>
                  <select 
                    className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-white focus:border-blue-400 transition-colors"
                    value={formData.subCategoryId}
                    onChange={e => setFormData({ ...formData, subCategoryId: e.target.value })}
                  >
                    <option value="">Select Sub category</option>
                    {subCategories.map(sub => (
                      <option key={sub.id} value={sub.id}>{sub.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">Upload File</label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="file" 
                      accept=".xlsx, .xls, .csv"
                      className="flex-1 text-xs border border-slate-300 rounded px-3 py-2 bg-white cursor-pointer hover:bg-slate-50 transition-colors"
                      onChange={handleFileUpload}
                    />
                  </div>
                </div>

                <button 
                  onClick={handleUploadNow}
                  className="bg-[#00a65a] hover:bg-[#008d4c] text-white px-8 py-2 rounded text-sm font-bold transition-all shadow-md flex items-center justify-center gap-2 active:transform active:scale-95"
                >
                  <Upload className="w-4 h-4" />
                  UPLOAD NOW
                </button>
              </div>

              {/* Download Sample Section */}
              <div className="space-y-4">
                <button className="w-full bg-[#7029cb] hover:bg-[#5d1faf] text-white p-6 rounded flex items-center justify-between group transition-all shadow-md text-left">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/10 rounded-full group-hover:scale-110 transition-transform">
                      <Download className="w-6 h-6" />
                    </div>
                    <span className="text-sm font-bold tracking-tight">Download Sample Excel File <br/><span className="text-xs font-normal opacity-80">(Single Language)</span></span>
                  </div>
                  <ChevronRight className="w-5 h-5 opacity-50 group-hover:translate-x-1 transition-transform" />
                </button>

                <button className="w-full bg-[#7029cb] hover:bg-[#5d1faf] text-white p-6 rounded flex items-center justify-between group transition-all shadow-md text-left">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/10 rounded-full group-hover:scale-110 transition-transform">
                      <Download className="w-6 h-6" />
                    </div>
                    <span className="text-sm font-bold tracking-tight">Download Sample Excel File <br/><span className="text-xs font-normal opacity-80">(Dual Language)</span></span>
                  </div>
                  <ChevronRight className="w-5 h-5 opacity-50 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </div>

          <div className="bg-[#dd4b39] text-white p-5 rounded font-bold text-sm italic shadow-md border-l-4 border-black/20">
            Please Note! <span className="font-normal not-italic text-xs ml-2 opacity-90">Every detail which you add/edit will be synced to our secure cloud database. Please ensure your excel file follows the format provided in sample downloads.</span>
          </div>

          <footer className="pt-8 border-t border-slate-200 flex justify-between items-center text-[11px] text-slate-500 pb-10">
            <p className="tracking-tight uppercase">Copyright © <span className="font-bold">PaperShala</span>. Developed by <span className="text-[#3c8dbc] font-bold">G Technologies</span>.</p>
            <p className="font-bold">Version <span className="font-normal">6.9.5</span></p>
          </footer>
        </div>
      </div>
    </AdminLayout>
  );
}
