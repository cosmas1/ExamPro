import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, HelpCircle, FileText, Globe, List
} from 'lucide-react';
import { collection, query, onSnapshot, addDoc, serverTimestamp, where } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../hooks/useAuth';
import { Category, SubCategory } from '../../types';
import Swal from 'sweetalert2';
import AdminLayout from '../../components/AdminLayout';

export default function AddQuestion() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    type: 'Multiple Choice Single Answer',
    numOptions: 4,
    categoryId: '',
    subCategoryId: '',
    level: 'Simple',
    questionText: '',
    options: ['', '', '', ''],
    correctOption: 0
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      await addDoc(collection(db, 'questions'), {
        ...formData,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
      });

      Swal.fire('Success', 'Question added successfully', 'success');
      navigate('/admin/questions');
    } catch (error: any) {
      Swal.fire('Error', error.message, 'error');
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData({ ...formData, options: newOptions });
  };

  return (
    <AdminLayout activeMenu="Questions" activeSubMenu="Add new question">
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-sm shrink-0">
        <div className="flex items-center gap-2">
          <h2 className="text-xl text-slate-700">Add new question</h2>
          <span className="text-xs text-slate-400 mt-1.5 ml-2">Please select options carefully</span>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold">
          <Globe className="w-3 h-3" />
          <span>Home</span>
          <span>&gt;</span>
          <span>All Questions</span>
          <span>&gt;</span>
          <span className="text-slate-400">Add new question</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white border-t border-slate-200 rounded shadow-sm">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-medium text-slate-700 uppercase tracking-tight">Add new question</h3>
              <button className="text-slate-300 hover:text-slate-500"><div className="w-4 h-0.5 bg-current" /></button>
            </div>

            <div className="p-6">
              {step === 1 ? (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Select question type</label>
                    <select 
                      className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:border-blue-400 transition-colors bg-white"
                      value={formData.type}
                      onChange={e => setFormData({ ...formData, type: e.target.value })}
                    >
                      <option>Multiple Choice Single Answer</option>
                      <option>True / False</option>
                      <option>Fill in the blank</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Number of Options</label>
                    <input 
                      type="number" 
                      className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:border-blue-400 transition-colors"
                      value={formData.numOptions}
                      onChange={e => {
                        const n = Math.max(1, parseInt(e.target.value) || 0);
                        setFormData({ 
                          ...formData, 
                          numOptions: n,
                          options: Array(n).fill('')
                        });
                      }}
                    />
                  </div>

                  <button 
                    onClick={() => setStep(2)}
                    className="bg-[#3c8dbc] hover:bg-[#367fa9] text-white px-6 py-2 rounded text-sm font-medium tracking-wide transition-colors shadow-sm"
                  >
                    Next
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="bg-slate-50 p-4 rounded border border-slate-200">
                    <p className="text-xs font-bold text-slate-700 flex items-center gap-2">
                      <span>Question Type :</span>
                      <span className="text-blue-600 font-normal">{formData.type}</span>
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6 text-xs uppercase font-bold text-slate-500">
                    <div className="space-y-4">
                      <label className="block text-slate-700">
                        Select Category -- -- -- -- -- 
                        <button type="button" onClick={() => navigate('/admin/categories')} className="text-[#3c8dbc] hover:underline ml-2 normal-case font-medium">Click to Add new Category</button>
                      </label>
                      <select 
                        required
                        className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-white font-normal text-slate-700"
                        value={formData.categoryId}
                        onChange={e => setFormData({ ...formData, categoryId: e.target.value, subCategoryId: '' })}
                      >
                        <option value="">Select Category</option>
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-4">
                      <label className="block text-slate-700">
                        Sub Category -- -- -- -- -- 
                        <button type="button" onClick={() => navigate('/admin/categories')} className="text-[#3c8dbc] hover:underline ml-2 normal-case font-medium">Click to Add new Subcategory</button>
                      </label>
                      <select 
                        required
                        className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-white font-normal text-slate-700"
                        value={formData.subCategoryId}
                        onChange={e => setFormData({ ...formData, subCategoryId: e.target.value })}
                      >
                        <option value="">Select Sub Category</option>
                        {subCategories.map(sub => (
                          <option key={sub.id} value={sub.id}>{sub.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="block text-xs font-bold text-slate-700 uppercase">Select Level</label>
                    <select 
                      className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-white text-slate-700"
                      value={formData.level}
                      onChange={e => setFormData({ ...formData, level: e.target.value })}
                    >
                      <option>Too simple</option>
                      <option>Simple</option>
                      <option>Moderate</option>
                      <option>Hard</option>
                    </select>
                  </div>

                  <div className="space-y-4">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-tight">Question</label>
                    <div className="border border-slate-300 rounded overflow-hidden shadow-sm">
                      <div className="bg-[#f4f4f4] p-1 border-b border-slate-200 flex flex-wrap gap-2">
                         <button type="button" className="p-1 hover:bg-slate-200 rounded transition-colors"><FileText className="w-4 h-4 opacity-70" /></button>
                         <button type="button" className="px-2 font-bold opacity-70 text-sm">H1</button>
                         <button type="button" className="px-2 font-bold opacity-70 italic text-sm">I</button>
                         <button type="button" className="px-2 font-bold opacity-70 underline text-sm">U</button>
                      </div>
                      <textarea 
                        required
                        placeholder="Type question here..."
                        className="w-full h-40 p-4 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white resize-none"
                        value={formData.questionText}
                        onChange={e => setFormData({ ...formData, questionText: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-8">
                    {formData.options.map((option, idx) => (
                      <div key={idx} className="space-y-3">
                        <div className="flex items-center gap-4">
                          <label className="text-xs font-bold text-slate-700 uppercase">Option {idx + 1})</label>
                          <label className="flex items-center gap-2 cursor-pointer group">
                            <input 
                              type="radio" 
                              name="correct" 
                              required
                              checked={formData.correctOption === idx}
                              onChange={() => setFormData({ ...formData, correctOption: idx })}
                              className="w-3.5 h-3.5 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-[11px] text-blue-600 font-bold group-hover:underline">Select Correct Option</span>
                          </label>
                        </div>
                        <div className="border border-slate-300 rounded overflow-hidden shadow-sm">
                          <div className="bg-[#f4f4f4] p-1 border-b border-slate-200">
                             <button type="button" className="p-1 hover:bg-slate-200 rounded"><FileText className="w-4 h-4 opacity-70" /></button>
                          </div>
                          <textarea 
                            required
                            placeholder={`Option ${idx + 1}`}
                            className="w-full h-24 p-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white resize-none"
                            value={option}
                            onChange={e => updateOption(idx, e.target.value)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-3 pt-6 border-t border-slate-100 mt-12 pb-8">
                    <button 
                      type="button"
                      onClick={() => setStep(1)}
                      className="bg-slate-500 hover:bg-slate-600 text-white px-6 py-2 rounded text-sm font-medium transition-colors shadow-sm"
                    >
                      Back
                    </button>
                    <button 
                      type="submit"
                      className="bg-[#3c8dbc] hover:bg-[#367fa9] text-white px-10 py-2 rounded text-sm font-bold shadow-md transition-all active:transform active:scale-95"
                    >
                      Submit Now
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
