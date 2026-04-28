import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc, updateDoc, collection, getDocs, addDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import { Exam, Question, ExamStatus } from '../types';
import { useAuth } from '../hooks/useAuth';
import { ChevronLeft, Plus, Save, Trash2, CheckCircle2, AlertCircle, List, Settings, Info, Clock, LayoutGrid } from 'lucide-react';
import { cn } from '../lib/utils';
import Swal from 'sweetalert2';
import AdminLayout from '../components/AdminLayout';

export default function ExamEditor() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'settings' | 'questions'>('settings');
  const [exam, setExam] = useState<Partial<Exam>>({
    title: '',
    description: '',
    durationMinutes: 60,
    status: 'draft',
    totalMarks: 0,
    totalQuestions: 0,
    startTime: '',
    endTime: ''
  });
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (examId && user) {
      loadExam();
    } else {
      setLoading(false);
    }
  }, [examId, user]);

  const loadExam = async () => {
    try {
      const examDoc = await getDoc(doc(db, 'exams', examId!));
      if (examDoc.exists()) {
        const data = examDoc.data() as Exam;
        // Relax check: teachers and admins can edit
        if (user?.role !== 'admin' && user?.role !== 'teacher' && data.createdBy !== user?.uid) {
          navigate('/admin');
          return;
        }
        setExam({
          ...data,
          startTime: data.startTime || '',
          endTime: data.endTime || ''
        });
        
        // Load questions
        const qSnap = await getDocs(collection(db, 'exams', examId!, 'questions'));
        const qs = qSnap.docs.map(d => ({ id: d.id, ...d.data() } as Question));
        setQuestions(qs.sort((a, b) => (a.order || 0) - (b.order || 0)));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveExam = async () => {
    if (!exam.title) return Swal.fire('Error', 'Title is required', 'error');
    setIsSaving(true);
    
    try {
      const data = {
        ...exam,
        createdBy: exam.createdBy || user?.uid,
        createdAt: exam.createdAt || new Date().toISOString(),
        totalQuestions: questions.length,
        totalMarks: questions.reduce((sum, q) => sum + (Number(q.points) || 1), 0),
        startTime: exam.startTime,
        endTime: exam.endTime
      };

      if (examId) {
        await updateDoc(doc(db, 'exams', examId), data);
      } else {
        const newRef = doc(collection(db, 'exams'));
        await setDoc(newRef, data);
        navigate(`/admin/exam/${newRef.id}`);
      }
      Swal.fire('Success', 'Exam metadata saved', 'success');
    } catch (error) {
      Swal.fire('Error', 'Failed to save exam', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const addQuestion = () => {
    const newQ: Question = {
      id: Math.random().toString(36).substring(7),
      examId: examId || '',
      type: 'mcq',
      text: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      possibleAnswers: [],
      explanation: '',
      order: questions.length,
      points: 1
    };
    setQuestions([...questions, newQ]);
    setCurrentQuestionIndex(questions.length);
  };

  const updateQuestion = (index: number, updates: Partial<Question>) => {
    const newQs = [...questions];
    newQs[index] = { ...newQs[index], ...updates };
    setQuestions(newQs);
  };

  const deleteQuestion = (index: number) => {
    const newQs = questions.filter((_, i) => i !== index);
    setQuestions(newQs);
    if (currentQuestionIndex >= newQs.length) {
      setCurrentQuestionIndex(Math.max(0, newQs.length - 1));
    }
  };

  const saveQuestions = async () => {
    if (!examId) return;
    setIsSaving(true);
    try {
      const batch = writeBatch(db);
      
      // THIS IS A SIMPLIFIED UPDATE: In a real app, delete old ones or use meaningful IDs
      // For this demo, we'll clear and rewrite (not ideal for large sets but works for MVP)
      const qSnap = await getDocs(collection(db, 'exams', examId, 'questions'));
      qSnap.docs.forEach(d => batch.delete(d.ref));
      
      questions.forEach((q, idx) => {
        const qRef = doc(collection(db, 'exams', examId, 'questions'));
        const { id, ...data } = q;
        batch.set(qRef, { ...data, order: idx });
      });
      
      // Update totals in exam doc
      batch.update(doc(db, 'exams', examId), {
        totalQuestions: questions.length,
        totalMarks: questions.reduce((sum, q) => sum + (Number(q.points) || 1), 0)
      });

      await batch.commit();
      Swal.fire('Success', 'All questions saved', 'success');
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'Failed to save questions', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const [isBankOpen, setIsBankOpen] = useState(false);
  const [bankQuestions, setBankQuestions] = useState<Question[]>([]);
  const [selectedBankIds, setSelectedBankIds] = useState<Set<string>>(new Set());
  const [bankSearch, setBankSearch] = useState('');

  const openQuestionBank = async () => {
    setIsBankOpen(true);
    try {
      const qSnap = await getDocs(collection(db, 'questions'));
      setBankQuestions(qSnap.docs.map(d => ({ id: d.id, ...d.data() } as any)));
    } catch (e) {
      console.error(e);
    }
  };

  const addSelectedFromBank = () => {
    const toAdd = bankQuestions.filter(q => selectedBankIds.has(q.id));
    const newQs = [...questions];
    
    toAdd.forEach(bq => {
      const newQ: Question = {
        id: Math.random().toString(36).substring(7),
        examId: examId || '',
        order: newQs.length + 1,
        text: (bq as any).questionText || bq.text,
        type: bq.type || 'MCQ',
        options: bq.options || [],
        correctAnswer: (bq as any).correctOption || bq.correctAnswer || '',
        marks: bq.marks || 1
      };
      newQs.push(newQ);
    });
    
    setQuestions(newQs);
    setIsBankOpen(false);
    setSelectedBankIds(new Set());
    Swal.fire('Success', `${toAdd.length} questions added from bank`, 'success');
  };

  if (loading) return <div className="p-10 text-center font-mono text-sm">INITIALIZING_EDITOR...</div>;

  const currentQ = questions[currentQuestionIndex];

  return (
    <AdminLayout activeMenu="Papers">
      <div className="h-[calc(100vh-64px)] flex flex-col pt-0 bg-white">
        <div className="max-w-7xl mx-auto w-full px-4 py-4 flex items-center justify-between border-b border-slate-100">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/admin')} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{exam.title || "Untitled Exam"}</h1>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-widest">{exam.status}</p>
          </div>
        </div>
        
        <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button 
            onClick={() => setActiveTab('settings')}
            className={cn("px-4 py-1.5 rounded text-xs font-bold transition-all flex items-center gap-2", activeTab === 'settings' ? "bg-white shadow-sm text-blue-600" : "text-slate-500")}
          >
            <Settings className="w-3.5 h-3.5" /> Workspace Config
          </button>
          <button 
            onClick={() => { if (!examId) return Swal.fire('Wait', 'Save settings first', 'info'); setActiveTab('questions'); }}
            className={cn("px-4 py-1.5 rounded text-xs font-bold transition-all flex items-center gap-2", activeTab === 'questions' ? "bg-white shadow-sm text-blue-600" : "text-slate-500")}
          >
            <List className="w-3.5 h-3.5" /> Question Bank ({questions.length})
          </button>
        </div>

        <button 
          onClick={activeTab === 'settings' ? handleSaveExam : saveQuestions}
          disabled={isSaving}
          className="bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-blue-700 transition-all disabled:opacity-50 shadow-sm"
        >
          {isSaving ? "Synchronizing..." : <><Save className="w-4 h-4" /> Save Changes</>}
        </button>
      </div>

      <div className="flex-1 min-h-0 bg-white border-t border-slate-100 flex overflow-hidden">
        {activeTab === 'settings' ? (
          <div className="flex-1 overflow-y-auto p-10 max-w-4xl mx-auto space-y-8">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-black text-slate-700 uppercase tracking-widest mb-2">Exam Title</label>
                <input 
                  type="text" 
                  value={exam.title}
                  onChange={e => setExam({...exam, title: e.target.value})}
                  className="w-full text-3xl font-bold border-0 border-b-2 border-slate-100 focus:border-indigo-600 focus:ring-0 placeholder:text-slate-200 transition-all py-2"
                  placeholder="Enter exam title..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-black text-slate-700 uppercase tracking-widest mb-2">Description</label>
                <textarea 
                  rows={4}
                  value={exam.description}
                  onChange={e => setExam({...exam, description: e.target.value})}
                  className="w-full bg-slate-50 rounded-2xl border-slate-100 focus:border-indigo-600 p-4 text-slate-700"
                  placeholder="Describe what this exam is about..."
                />
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div>
                  <label className="block text-sm font-black text-slate-700 uppercase tracking-widest mb-2">Duration (Minutes)</label>
                  <div className="relative">
                    <input 
                      type="number"
                      value={exam.durationMinutes}
                      onChange={e => setExam({...exam, durationMinutes: Number(e.target.value)})}
                      className="w-full bg-slate-50 rounded-2xl border-slate-100 focus:border-indigo-600 p-4 font-bold"
                    />
                    <Clock className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-black text-slate-700 uppercase tracking-widest mb-2">Status</label>
                  <select 
                    value={exam.status}
                    onChange={e => setExam({...exam, status: e.target.value as ExamStatus})}
                    className="w-full bg-slate-50 rounded-2xl border-slate-100 focus:border-indigo-600 p-4 font-bold"
                  >
                    <option value="draft">Draft (Private)</option>
                    <option value="published">Published (Go Live)</option>
                    <option value="closed">Closed (Archive)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div>
                  <label className="block text-sm font-black text-slate-700 uppercase tracking-widest mb-2">Start Time</label>
                  <input 
                    type="datetime-local" 
                    value={exam.startTime}
                    onChange={e => setExam({...exam, startTime: e.target.value})}
                    className="w-full bg-slate-50 rounded-2xl border-slate-100 focus:border-indigo-600 p-4 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-sm font-black text-slate-700 uppercase tracking-widest mb-2">End Time</label>
                  <input 
                    type="datetime-local" 
                    value={exam.endTime}
                    onChange={e => setExam({...exam, endTime: e.target.value})}
                    className="w-full bg-slate-50 rounded-2xl border-slate-100 focus:border-indigo-600 p-4 font-bold"
                  />
                </div>
              </div>

              <div className="p-6 bg-indigo-50 rounded-3xl flex gap-4">
                <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 shrink-0">
                  <Info className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-indigo-900">Publishing Guidelines</h4>
                  <p className="text-sm text-indigo-700/70 mt-1">Once published, students will be able to find and take the exam. Ensure all questions are finalized first.</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Sidebar with questions list */}
            <div className="w-80 border-r border-slate-100 flex flex-col bg-slate-50/30">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white">
                <span className="font-bold uppercase text-xs tracking-widest text-slate-500">Navigation</span>
                <div className="flex gap-2">
                  <button 
                    onClick={openQuestionBank}
                    className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-all"
                    title="Import from Question Bank"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={addQuestion}
                    className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-all"
                    title="Add New Question"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {questions.map((q, idx) => (
                  <button
                    key={q.id}
                    onClick={() => setCurrentQuestionIndex(idx)}
                    className={cn(
                      "w-full text-left p-4 rounded-2xl transition-all flex items-center gap-3 group",
                      currentQuestionIndex === idx ? "bg-white shadow-md ring-1 ring-slate-100 border-l-4 border-l-indigo-600" : "hover:bg-white/60"
                    )}
                  >
                    <span className={cn("w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black", currentQuestionIndex === idx ? "bg-indigo-600 text-white" : "bg-slate-200 text-slate-500")}>
                      {idx + 1}
                    </span>
                    <span className="flex-1 truncate text-sm font-medium text-slate-700">
                      {q.text || "Empty Question"}
                    </span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); deleteQuestion(idx); }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-red-500 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </button>
                ))}
                
                <button 
                  onClick={addQuestion}
                  className="w-full p-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 hover:border-indigo-300 hover:text-indigo-600 transition-all flex items-center justify-center gap-2 font-bold text-sm"
                >
                  <Plus className="w-4 h-4" /> Add Question
                </button>
              </div>
            </div>

            {/* Main Question Editor */}
            <div className="flex-1 overflow-y-auto p-10">
              {currentQ ? (
                <div className="max-w-3xl mx-auto space-y-8">
                  <div className="flex justify-between items-center">
                    <span className="px-2 py-1 bg-slate-800 text-white rounded text-[10px] font-bold uppercase tracking-wider">Question {currentQuestionIndex + 1}</span>
                    <div className="flex items-center gap-4">
                       <select 
                         value={currentQ.type || 'mcq'}
                         onChange={e => {
                           const type = e.target.value;
                           let options = currentQ.options;
                           if (type === 'true_false') options = ['True', 'False'];
                           else if (type === 'mcq' && options.length < 2) options = ['', '', '', ''];
                           updateQuestion(currentQuestionIndex, { type, options });
                         }}
                         className="bg-slate-50 border border-slate-200 rounded p-1.5 text-xs font-bold"
                       >
                         <option value="mcq">MCQ</option>
                         <option value="true_false">True / False</option>
                         <option value="short_answer">Short Answer</option>
                         <option value="long_answer">Long Answer</option>
                       </select>
                       <label className="flex items-center gap-2 cursor-pointer">
                         <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Weightage:</span>
                         <input 
                           type="number" 
                           value={currentQ.points}
                           onChange={e => updateQuestion(currentQuestionIndex, { points: Number(e.target.value) })}
                           className="w-14 bg-slate-50 border border-slate-200 rounded p-1.5 text-xs font-bold text-center"
                         />
                       </label>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="block text-sm font-black text-slate-700 uppercase tracking-widest">Question Text</label>
                    <textarea 
                      rows={4}
                      value={currentQ.text}
                      onChange={e => updateQuestion(currentQuestionIndex, { text: e.target.value })}
                      className="w-full text-xl font-medium border-2 border-slate-100 focus:border-indigo-600 rounded-3xl p-6 transition-all placeholder:text-slate-200"
                      placeholder="Start typing your question here..."
                    />
                  </div>

                  {currentQ.type === 'short_answer' ? (
                    <div className="space-y-4">
                      <label className="block text-sm font-black text-slate-700 uppercase tracking-widest">Correct Answer(s)</label>
                      <input 
                        type="text"
                        value={(currentQ.possibleAnswers || []).join(', ')}
                        onChange={e => updateQuestion(currentQuestionIndex, { possibleAnswers: e.target.value.split(',').map(s => s.trim()) })}
                        className="w-full bg-white border-2 border-slate-100 rounded-2xl p-4 focus:border-indigo-600"
                        placeholder="Comma separated acceptable answers..."
                      />
                    </div>
                  ) : currentQ.type === 'long_answer' ? (
                    <div className="p-6 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 text-center text-slate-400 font-medium">
                      Essay / Long Answer question. No auto-grading.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <label className="block text-sm font-black text-slate-700 uppercase tracking-widest">Answer Options</label>
                      <div className="grid gap-3">
                        {currentQ.options.map((opt, oIdx) => (
                          <div key={oIdx} className="flex gap-3 items-center group">
                            <button 
                              onClick={() => updateQuestion(currentQuestionIndex, { correctAnswer: oIdx })}
                              className={cn(
                                "w-12 h-12 rounded-2xl flex items-center justify-center transition-all border-2",
                                currentQ.correctAnswer === oIdx 
                                  ? "bg-green-500 border-green-500 text-white shadow-lg shadow-green-100" 
                                  : "bg-white border-slate-100 text-slate-400 hover:border-indigo-100"
                              )}
                            >
                              {currentQ.correctAnswer === oIdx ? <CheckCircle2 className="w-6 h-6" /> : String.fromCharCode(65 + oIdx)}
                            </button>
                            <input 
                              type="text" 
                              value={opt}
                              readOnly={currentQ.type === 'true_false'}
                              onChange={e => {
                                const newOpts = [...currentQ.options];
                                newOpts[oIdx] = e.target.value;
                                updateQuestion(currentQuestionIndex, { options: newOpts });
                              }}
                              className={cn(
                                "flex-1 bg-white border-2 rounded-2xl p-4 transition-all",
                                currentQ.correctAnswer === oIdx ? "border-green-500 ring-4 ring-green-50" : "border-slate-100 focus:border-indigo-600"
                              )}
                              placeholder={`Option ${String.fromCharCode(65 + oIdx)}`}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-4 pt-6">
                    <label className="block text-sm font-black text-slate-700 uppercase tracking-widest">Explanation (Optional)</label>
                    <textarea 
                      rows={3}
                      value={currentQ.explanation}
                      onChange={e => updateQuestion(currentQuestionIndex, { explanation: e.target.value })}
                      className="w-full bg-slate-50 border-slate-100 rounded-3xl p-6 text-slate-600"
                      placeholder="Provide reasoning for the correct answer..."
                    />
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-300">
                   <div className="text-center">
                     <Plus className="w-12 h-12 mx-auto mb-4" />
                     <p className="font-bold uppercase tracking-widest text-xs">Add your first question to begin</p>
                   </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
      
      {/* Question Bank Modal */}
      {isBankOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsBankOpen(false)} />
          <div className="relative bg-white w-full max-w-4xl max-h-[80vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Question Bank</h2>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-widest mt-0.5">Select questions to add to this paper</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <LayoutGrid className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Search keywords..." 
                    className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    value={bankSearch}
                    onChange={(e) => setBankSearch(e.target.value)}
                  />
                </div>
                <button onClick={() => setIsBankOpen(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400">&times;</button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {bankQuestions
                .filter(q => {
                  const text = (q as any).questionText || (q as any).text || '';
                  return text.toLowerCase().includes(bankSearch.toLowerCase());
                })
                .map(q => (
                  <label 
                    key={q.id} 
                    className={cn(
                      "flex items-start gap-4 p-4 rounded-2xl border-2 transition-all cursor-pointer group",
                      selectedBankIds.has(q.id) ? "border-indigo-600 bg-indigo-50/30" : "border-slate-50 hover:bg-slate-50"
                    )}
                  >
                    <input 
                      type="checkbox" 
                      className="mt-1 w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      checked={selectedBankIds.has(q.id)}
                      onChange={() => {
                        const next = new Set(selectedBankIds);
                        if (next.has(q.id)) next.delete(q.id);
                        else next.add(q.id);
                        setSelectedBankIds(next);
                      }}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-black uppercase bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">{(q as any).type || 'MCQ'}</span>
                        <span className="text-[10px] font-bold text-slate-400 italic">ID: {q.id}</span>
                      </div>
                      <p className="text-sm font-medium text-slate-700 leading-relaxed">
                        {(q as any).questionText || q.text}
                      </p>
                    </div>
                  </label>
                ))}
            </div>

            <div className="p-6 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{selectedBankIds.size} Selected</span>
              <div className="flex gap-3">
                <button 
                  onClick={() => setIsBankOpen(false)}
                  className="px-6 py-2 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-100 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={addSelectedFromBank}
                  disabled={selectedBankIds.size === 0}
                  className="px-8 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all disabled:opacity-50"
                >
                  Add Selected to Paper
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
