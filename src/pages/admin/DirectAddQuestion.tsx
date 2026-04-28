import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, HelpCircle, FileText, Globe, List, LayoutGrid
} from 'lucide-react';
import { collection, query, onSnapshot, addDoc, serverTimestamp, where, arrayUnion, doc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../hooks/useAuth';
import { Category, SubCategory, Paper } from '../../types';
import Swal from 'sweetalert2';
import AdminLayout from '../../components/AdminLayout';

export default function DirectAddQuestion() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    paperId: '',
    type: 'Multiple Choice Single Answer',
    language: 'Only Hindi',
    numOptions: 4,
    categoryId: '',
    subCategoryId: '',
    level: 'Simple',
    questionText: '',
    options: ['', '', '', ''],
    correctOption: 0
  });

  const [papers, setPapers] = useState<Paper[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);

  useEffect(() => {
    // Fetch exams
    const unsubExams = onSnapshot(collection(db, 'exams'), (snap) => {
      setPapers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Paper)));
    });
    
    // Fetch categories
    const unsubCats = onSnapshot(collection(db, 'categories'), (snap) => {
      setCategories(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category)));
    });

    return () => {
      unsubExams();
      unsubCats();
    };
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
    if (!user || !formData.paperId) {
      Swal.fire('Error', 'Please select a paper', 'error');
      return;
    }

    try {
      Swal.showLoading();
      // 1. Add the question to questions collection
      const questionRef = await addDoc(collection(db, 'questions'), {
        type: formData.type,
        language: formData.language,
        numOptions: formData.numOptions,
        categoryId: formData.categoryId,
        subCategoryId: formData.subCategoryId,
        level: formData.level,
        questionText: formData.questionText,
        options: formData.options,
        correctOption: formData.correctOption,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
      });

      // 2. Link question to the selected exam
      const examRef = doc(db, 'exams', formData.paperId);
      const currentExam = papers.find(p => p.id === formData.paperId);
      const currentTotal = currentExam?.totalQuestions || 0;

      await updateDoc(examRef, {
        questionIds: arrayUnion(questionRef.id),
        totalQuestions: currentTotal + 1
      });

      // 3. Also add to sub-collection for easier fetching in exam interface
      await setDoc(doc(db, 'exams', formData.paperId, 'questions', questionRef.id), {
        id: questionRef.id,
        text: formData.questionText,
        options: formData.options,
        correctAnswer: formData.correctOption,
        points: 1, // Default points
        order: currentTotal + 1
      });

      Swal.fire('Success', 'Question added and linked to paper successfully', 'success');
      navigate('/admin/papers');
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
    <AdminLayout activeMenu="Questions" activeSubMenu="Direct Question Add in Paper">
      <div className="bg-[#ecf0f5] px-4 py-3 flex items-center justify-between shrink-0 shadow-sm border-b border-white">
        <div className="flex items-center gap-2">
          <h2 className="text-xl text-slate-700 font-medium tracking-tight">Direct Add New Question in Paper</h2>
          <span className="text-[11px] text-slate-400 mt-2 font-normal">Please select options carefully</span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-slate-400 font-normal">
          <LayoutGrid className="w-3.5 h-3.5" />
          <span className="font-bold text-slate-500">Home</span>
          <span className="text-slate-300 mx-1">&gt;</span>
          <span>Direct Add in Paper</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-[#ecf0f5]">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded shadow-sm overflow-hidden border-t-4 border-[#d2d6de]">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-normal text-slate-700">Add new question</h3>
              <div className="flex items-center">
                 <button className="text-slate-300 hover:text-slate-400 p-1"><div className="w-3 h-[2px] bg-slate-300" /></button>
              </div>
            </div>

            <div className="p-8">
              {step === 1 ? (
                <div className="space-y-6">
                  {/* Select Paper */}
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-slate-700">Select Paper Where you want to upload Question</label>
                    <select 
                      className="w-full border border-[#d2d6de] rounded px-3 py-2 text-sm focus:border-blue-400 transition-colors bg-white font-medium text-slate-600 outline-none"
                      value={formData.paperId}
                      onChange={e => setFormData({ ...formData, paperId: e.target.value })}
                    >
                      <option value="">Choose Paper</option>
                      {papers.map(paper => (
                        <option key={paper.id} value={paper.id}>{paper.title}</option>
                      ))}
                    </select>
                  </div>

                  {/* Question Type */}
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-slate-700">Select question type</label>
                    <select 
                      className="w-full border border-[#d2d6de] rounded px-3 py-2 text-sm focus:border-blue-400 transition-colors bg-white font-medium text-slate-600 outline-none"
                      value={formData.type}
                      onChange={e => setFormData({ ...formData, type: e.target.value })}
                    >
                      <option>Multiple Choice Single Answer</option>
                      <option>True / False</option>
                      <option>Fill in the blank</option>
                    </select>
                  </div>

                  {/* Question Language */}
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-slate-700">Select question language</label>
                    <select 
                      className="w-full border border-[#d2d6de] rounded px-3 py-2 text-sm focus:border-blue-400 transition-colors bg-white font-medium text-slate-600 outline-none"
                      value={formData.language}
                      onChange={e => setFormData({ ...formData, language: e.target.value })}
                    >
                      <option>Only Hindi</option>
                      <option>Only English</option>
                      <option>Hindi & English</option>
                    </select>
                  </div>

                  {/* Number of Options */}
                  <div className="space-y-2 pb-6">
                    <label className="block text-sm font-bold text-slate-700">Number of Options</label>
                    <input 
                      type="number" 
                      className="w-full border border-[#d2d6de] rounded px-3 py-2 text-sm focus:border-blue-400 font-medium text-slate-600 outline-none"
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
                    onClick={() => {
                      if (!formData.paperId) {
                        Swal.fire('Warning', 'Please select a paper first', 'warning');
                        return;
                      }
                      setStep(2);
                    }}
                    className="bg-[#3c8dbc] hover:bg-[#367fa9] text-white px-5 py-2 rounded text-sm font-normal shadow-sm transition-all active:scale-95"
                  >
                    Next
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* Summary of selection */}
                  <div className="bg-slate-50 p-4 rounded border border-slate-200 grid grid-cols-2 gap-4">
                    <p className="text-[11px] font-bold text-slate-700">
                      Paper: <span className="text-blue-600 font-bold ml-1">{papers.find(p => p.id === formData.paperId)?.title}</span>
                    </p>
                    <p className="text-[11px] font-bold text-slate-700">
                      Type: <span className="text-blue-600 font-bold ml-1">{formData.type}</span>
                    </p>
                  </div>

                  {/* Category Selection */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="block text-xs font-bold text-slate-700 uppercase">
                        Select Category -- -- -- -- -- 
                        <button type="button" onClick={() => navigate('/admin/categories')} className="text-[#3c8dbc] hover:underline ml-2 normal-case font-bold">Click to Add new Category</button>
                      </label>
                      <select 
                        required
                        className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-white"
                        value={formData.categoryId}
                        onChange={e => setFormData({ ...formData, categoryId: e.target.value, subCategoryId: '' })}
                      >
                        <option value="">Select Category</option>
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-3">
                      <label className="block text-xs font-bold text-slate-700 uppercase">
                        Sub Category -- -- -- -- -- 
                        <button type="button" onClick={() => navigate('/admin/categories')} className="text-[#3c8dbc] hover:underline ml-2 normal-case font-bold">Click to Add new Subcategory</button>
                      </label>
                      <select 
                        required
                        className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-white"
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

                  {/* Level */}
                  <div className="space-y-3">
                    <label className="block text-xs font-bold text-slate-700 uppercase">Select Level</label>
                    <select 
                      className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-white"
                      value={formData.level}
                      onChange={e => setFormData({ ...formData, level: e.target.value })}
                    >
                      <option>Too simple</option>
                      <option>Simple</option>
                      <option>Moderate</option>
                      <option>Hard</option>
                    </select>
                  </div>

                  {/* Question Text */}
                  <div className="space-y-3">
                    <label className="block text-xs font-bold text-slate-700 uppercase">Question</label>
                    <div className="border border-slate-300 rounded overflow-hidden shadow-sm">
                      <div className="bg-[#f4f4f4] p-1 border-b border-slate-200 flex flex-wrap gap-2 uppercase text-[10px] font-bold opacity-60">
                         <button type="button" className="p-1.5 hover:bg-slate-200 rounded"><FileText className="w-3.5 h-3.5" /></button>
                         <button type="button" className="px-2">H1</button>
                         <button type="button" className="px-2 italic">I</button>
                         <button type="button" className="px-2 underline">U</button>
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

                  {/* Options */}
                  <div className="space-y-8">
                    {formData.options.map((option, idx) => (
                      <div key={idx} className="space-y-3">
                        <div className="flex items-center gap-4">
                          <label className="text-[11px] font-bold text-slate-700 uppercase">Options {idx + 1})</label>
                          <label className="flex items-center gap-2 cursor-pointer group">
                            <input 
                              type="radio" 
                              name="correct" 
                              required
                              checked={formData.correctOption === idx}
                              onChange={() => setFormData({ ...formData, correctOption: idx })}
                              className="w-3.5 h-3.5 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-[10px] text-blue-600 font-bold group-hover:underline">Select Correct Option</span>
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

                  <div className="flex gap-4 pt-8 border-t border-slate-100 pb-12">
                    <button 
                      type="button"
                      onClick={() => setStep(1)}
                      className="bg-slate-500 hover:bg-slate-600 text-white px-6 py-2 rounded text-sm font-bold transition-all shadow-md"
                    >
                      Back
                    </button>
                    <button 
                      type="submit"
                      className="bg-[#3c8dbc] hover:bg-[#367fa9] text-white px-10 py-2 rounded text-sm font-bold shadow-md transition-all active:transform active:scale-95 uppercase tracking-wide"
                    >
                      Submit To Paper
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          <footer className="mt-12 mb-10 text-[11px] text-slate-500 flex justify-between border-t border-slate-200 pt-6 uppercase tracking-tight">
             <p>Copyright © <span className="font-bold">PaperShala</span>. Developed by <span className="text-[#3c8dbc] font-bold">G Tech</span>.</p>
             <p className="font-bold">Version <span className="font-normal">1.2.0</span></p>
          </footer>
        </div>
      </div>
    </AdminLayout>
  );
}
