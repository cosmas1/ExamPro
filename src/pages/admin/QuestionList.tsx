import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, deleteDoc, orderBy, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Question, Category, SubCategory } from '../../types';
import AdminLayout from '../../components/AdminLayout';
import { Trash2, Edit2, Search, Filter, HelpCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import Swal from 'sweetalert2';

export default function QuestionList() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [categories, setCategories] = useState<Record<string, string>>({});
  const [subCategories, setSubCategories] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Fetch categories and subcategories for mapping
    const unsubCats = onSnapshot(collection(db, 'categories'), (snap) => {
      const mapping: Record<string, string> = {};
      snap.docs.forEach(d => mapping[d.id] = d.data().name);
      setCategories(mapping);
    });

    const unsubSubs = onSnapshot(collection(db, 'subcategories'), (snap) => {
      const mapping: Record<string, string> = {};
      snap.docs.forEach(d => mapping[d.id] = d.data().name);
      setSubCategories(mapping);
    });

    const q = query(collection(db, 'questions'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setQuestions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Question)));
      setLoading(false);
    }, (error) => {
      console.error("Questions snapshot error:", error);
      setLoading(false);
    });

    return () => {
      unsubCats();
      unsubSubs();
      unsubscribe();
    };
  }, []);

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: 'Delete Question?',
      text: "This will remove the question from the database.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Yes, delete'
    });

    if (result.isConfirmed) {
      await deleteDoc(doc(db, 'questions', id));
      Swal.fire('Deleted!', 'Question removed successfully.', 'success');
    }
  };

  const handleEdit = async (question: any) => {
    const isMCQ = question.type?.toLowerCase().includes('mcq') || question.type === 'Multiple Choice Single Answer';
    
    let optionsHtml = '';
    if (isMCQ && question.options) {
      optionsHtml = `
        <div class="mt-4 space-y-2">
          <label class="block text-xs font-bold uppercase text-slate-500">Options</label>
          ${question.options.map((opt: string, i: number) => `
            <div class="flex gap-2">
              <span class="bg-slate-100 px-2 flex items-center rounded text-xs font-bold">${String.fromCharCode(65 + i)}</span>
              <input id="swal-opt-${i}" type="text" class="flex-1 p-2 border rounded text-sm" value="${opt}">
            </div>
          `).join('')}
          <div class="mt-2">
            <label class="block text-xs font-bold uppercase text-slate-500 mb-1">Correct Answer</label>
            <input id="swal-correct" type="text" class="w-full p-2 border rounded text-sm" value="${question.correctOption || question.correctAnswer || ''}" placeholder="Enter correct text or option letter">
          </div>
        </div>
      `;
    }

    const { value: formValues } = await Swal.fire({
      title: 'Edit Question',
      width: '600px',
      html: `
        <div class="space-y-4 text-left p-2">
          <div>
            <label class="block text-xs font-bold uppercase text-slate-500 mb-1">Question Text</label>
            <textarea id="swal-text" class="w-full p-2 border rounded" rows="3">${question.questionText || question.text}</textarea>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold uppercase text-slate-500 mb-1">Level</label>
              <select id="swal-level" class="w-full p-2 border rounded">
                <option value="Simple" ${question.level === 'Simple' ? 'selected' : ''}>Simple</option>
                <option value="Moderate" ${question.level === 'Moderate' ? 'selected' : ''}>Moderate</option>
                <option value="Hard" ${question.level === 'Hard' ? 'selected' : ''}>Hard</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-bold uppercase text-slate-500 mb-1">Marks</label>
              <input id="swal-marks" type="number" class="w-full p-2 border rounded" value="${question.marks || 1}">
            </div>
          </div>
          ${optionsHtml}
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      preConfirm: () => {
        const result: any = {
          questionText: (document.getElementById('swal-text') as HTMLTextAreaElement).value,
          level: (document.getElementById('swal-level') as HTMLSelectElement).value,
          marks: Number((document.getElementById('swal-marks') as HTMLInputElement).value)
        };
        if (isMCQ) {
          result.options = question.options.map((_: any, i: number) => (document.getElementById(`swal-opt-${i}`) as HTMLInputElement).value);
          result.correctOption = (document.getElementById('swal-correct') as HTMLInputElement).value;
        }
        return result;
      }
    });

    if (formValues) {
      try {
        const updateData: any = {
          questionText: formValues.questionText,
          level: formValues.level,
          marks: formValues.marks
        };
        if (isMCQ) {
          updateData.options = formValues.options;
          updateData.correctOption = formValues.correctOption;
        }

        await updateDoc(doc(db, 'questions', question.id!), updateData);
        Swal.fire('Updated!', 'Question has been updated.', 'success');
      } catch (e) {
        Swal.fire('Error', 'Failed to update question.', 'error');
      }
    }
  };

  const filteredQuestions = questions.filter(q => 
    q.questionText?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout activeMenu="Questions" activeSubMenu="All Questions">
      <div className="bg-[#ecf0f5] px-4 py-3 flex items-center justify-between shrink-0 shadow-sm border-b border-white text-slate-700">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-medium tracking-tight">Question Bank</h2>
          <span className="text-[11px] text-slate-400 mt-2 font-normal">All available questions in the system.</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="bg-white p-4 rounded shadow-sm border-t-2 border-[#3c8dbc] flex items-center justify-between">
            <div className="relative flex-1 max-w-md">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
               <input 
                 type="text"
                 placeholder="Search questions..."
                 className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded text-sm focus:border-[#3c8dbc] outline-none"
                 value={searchTerm}
                 onChange={e => setSearchTerm(e.target.value)}
               />
            </div>
            <div className="flex gap-2">
               <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 rounded text-xs font-bold uppercase tracking-tight hover:bg-slate-200 transition-colors">
                  <Filter className="w-3.5 h-3.5" /> Filter
               </button>
            </div>
          </div>

          <div className="bg-white rounded shadow-sm overflow-hidden overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#f9fafb] border-b border-slate-100 uppercase font-black text-[10px] text-slate-500 tracking-widest">
                <tr>
                  <th className="px-6 py-4">Question Content</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4 text-center">Type</th>
                  <th className="px-6 py-4 text-center">Level</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr><td colSpan={5} className="p-10 text-center animate-pulse text-slate-400">Loading questions...</td></tr>
                ) : filteredQuestions.length === 0 ? (
                  <tr><td colSpan={5} className="p-10 text-center italic text-slate-400">No questions found.</td></tr>
                ) : (
                  filteredQuestions.map((q) => (
                    <tr key={q.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 max-w-md">
                         <div className="flex items-start gap-3">
                            <HelpCircle className="w-4 h-4 text-slate-300 mt-1 shrink-0" />
                            <p className="font-medium text-slate-700 line-clamp-2">{q.questionText}</p>
                         </div>
                      </td>
                      <td className="px-6 py-4">
                         <div className="text-[10px] font-bold">
                            <p className="text-[#3c8dbc] uppercase">{categories[q.categoryId] || 'Unknown'}</p>
                            <p className="text-slate-400 font-medium italic">{subCategories[q.subCategoryId] || 'N/A'}</p>
                         </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                         <span className={cn(
                           "px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tight border",
                           q.type === 'mcq' ? 'bg-blue-50 text-blue-500 border-blue-100' :
                           q.type === 'true_false' ? 'bg-purple-50 text-purple-500 border-purple-100' :
                           q.type === 'short_answer' ? 'bg-orange-50 text-orange-500 border-orange-100' :
                           'bg-slate-100 text-slate-500 border-slate-200'
                         )}>
                            {q.type?.replace('_', ' ') || 'MCQ'}
                         </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                         <span className={cn(
                           "text-[10px] font-black uppercase tracking-widest",
                           q.level === 'Hard' ? 'text-red-500' : q.level === 'Moderate' ? 'text-orange-500' : 'text-green-500'
                         )}>
                            {q.level || 'Simple'}
                         </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-2">
                          <button 
                            onClick={() => handleEdit(q)}
                            className="bg-[#00c0ef] hover:bg-[#00acd6] text-white p-2 rounded shadow-sm transition-all active:scale-95"
                            title="Edit Question"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button 
                            onClick={() => handleDelete(q.id!)}
                            className="bg-[#dd4b39] hover:bg-[#c23321] text-white p-2 rounded shadow-sm transition-all active:scale-95"
                            title="Delete Question"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
