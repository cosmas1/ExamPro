import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Globe, List, Download, Upload, ChevronRight, FileText
} from 'lucide-react';
import { collection, query, onSnapshot, where, getDocs, doc, updateDoc, arrayUnion, addDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Category, SubCategory, Paper } from '../../types';
import Swal from 'sweetalert2';
import AdminLayout from '../../components/AdminLayout';

export default function BulkQuestionUpload() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [papers, setPapers] = useState<Paper[]>([]);
  
  const [formData, setFormData] = useState({
    categoryId: '',
    subCategoryId: '',
    paperId: '', // Optional: Link directly to paper
    file: null as File | null
  });

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'categories'), (snap) => {
      setCategories(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category)));
    });
    
    const unsubPapers = onSnapshot(collection(db, 'exams'), (snap) => {
      setPapers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Paper)));
    });

    return () => {
      unsub();
      unsubPapers();
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFormData({ ...formData, file: e.target.files[0] });
    }
  };

  const handleUploadNow = async () => {
    if (!formData.categoryId || !formData.subCategoryId || !formData.file) {
      Swal.fire('Error', 'Please select category, subcategory and a file', 'error');
      return;
    }
    
    try {
      const { read, utils } = await import('xlsx');
      
      Swal.fire({
        title: 'Uploading...',
        text: 'Parsing excel data and adding questions',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      const data = await formData.file.arrayBuffer();
      const workbook = read(data);
      const { auth } = await import('../../firebase');
      
      let totalUploaded = 0;

      for (const sheetName of workbook.SheetNames) {
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = utils.sheet_to_json(worksheet) as any[];
        const name = sheetName.toLowerCase();

        for (const row of jsonData) {
          let questionType: string = 'mcq';
          const questionText = row['Question Details'] || row.Question || row.text || row.questionText;
          if (!questionText) continue;

          const level = row['Question Level'] || row.Question || row.Level || 'Simple';
          
          let options: string[] = [];
          let correctAnswer: any = null;
          let possibleAnswers: string[] = [];

          if (name.includes('mcq')) {
            questionType = 'mcq';
            const optA = row['Option A'] || row.A;
            const optB = row['Option B'] || row.B;
            const optC = row['Option C'] || row.C;
            const optD = row['Option D'] || row.D;
            options = [optA, optB, optC, optD].filter(o => o !== undefined).map(String);
            
            const correctVal = row['Correct Option'];
            // If it's the exact text
            const idx = options.findIndex(o => o === String(correctVal));
            if (idx !== -1) {
              correctAnswer = idx;
            } else {
              // try to parse as A, B, C, D or 1, 2, 3, 4
              const s = String(correctVal).toUpperCase();
              if (s === 'A' || s === '1') correctAnswer = 0;
              else if (s === 'B' || s === '2') correctAnswer = 1;
              else if (s === 'C' || s === '3') correctAnswer = 2;
              else if (s === 'D' || s === '4') correctAnswer = 3;
              else correctAnswer = 0;
            }
          } else if (name.includes('true') || name.includes('false')) {
            questionType = 'true_false';
            options = ['True', 'False'];
            const val = (row['TRUE /FALSE'] || row.Answer || '').toString().toUpperCase();
            correctAnswer = (val === 'T' || val === 'TRUE') ? 0 : 1;
          } else if (name.includes('short')) {
            questionType = 'short_answer';
            const possible = (row['Possible Answer 1'] || row.Answer || '').toString();
            possibleAnswers = possible.split(',').map((s: string) => s.trim());
            correctAnswer = possibleAnswers[0] || '';
          } else if (name.includes('long')) {
            questionType = 'long_answer';
            correctAnswer = ''; 
          }

          const qRef = await addDoc(collection(db, 'questions'), {
            questionText: String(questionText),
            options,
            correctAnswer,
            possibleAnswers,
            categoryId: formData.categoryId,
            subCategoryId: formData.subCategoryId,
            type: questionType,
            level,
            createdBy: auth.currentUser?.uid,
            createdAt: serverTimestamp()
          });

          totalUploaded++;

          // If linked to a paper, add it there too
          if (formData.paperId) {
            const paperRef = doc(db, 'exams', formData.paperId);
            await updateDoc(paperRef, {
              questionIds: arrayUnion(qRef.id)
            });
            
            await setDoc(doc(db, 'exams', formData.paperId, 'questions', qRef.id), {
              id: qRef.id,
              text: String(questionText),
              options,
              correctAnswer,
              possibleAnswers,
              type: questionType,
              points: 1,
              order: Date.now() + totalUploaded
            });
          }
        }
      }

      Swal.fire('Success', `${totalUploaded} questions uploaded successfully from ${workbook.SheetNames.length} sheets`, 'success');
      navigate('/admin/questions');
    } catch (error: any) {
      console.error(error);
      Swal.fire('Error', error.message || 'Failed to parse excel file', 'error');
    }
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
                  <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">
                    Link Directly to Paper (Optional)
                  </label>
                  <select 
                    className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-white focus:border-blue-400 transition-colors"
                    value={formData.paperId}
                    onChange={e => setFormData({ ...formData, paperId: e.target.value })}
                  >
                    <option value="">No Paper Association (Question Bank Only)</option>
                    {papers.map(p => (
                      <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
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
                    <span className="text-sm font-bold tracking-tight">Download Sample Excel File</span>
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
