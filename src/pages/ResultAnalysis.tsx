import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, getDocs, collection } from 'firebase/firestore';
import { db } from '../firebase';
import { Exam, Question, Submission } from '../types';
import { useAuth } from '../hooks/useAuth';
import { CheckCircle2, XCircle, HelpCircle, Trophy, Clock, ArrowLeft, BarChart3, ChevronDown, ChevronUp, Download, Printer } from 'lucide-react';
import { cn } from '../lib/utils';
import { format, differenceInMinutes } from 'date-fns';

export default function ResultAnalysis() {
  const { submissionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedQs, setExpandedQs] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (submissionId && user) {
      loadData();
    }
  }, [submissionId, user]);

  const loadData = async () => {
    try {
      const subDoc = await getDoc(doc(db, 'submissions', submissionId!));
      if (!subDoc.exists()) { navigate('/dashboard'); return; }
      
      const subData = { id: subDoc.id, ...subDoc.data() } as Submission;
      if (subData.studentId !== user?.uid && user?.role !== 'admin') {
         navigate('/dashboard');
         return;
      }
      setSubmission(subData);

      const examDoc = await getDoc(doc(db, 'exams', subData.examId));
      setExam({ id: examDoc.id, ...examDoc.data() } as Exam);

      const qSnap = await getDocs(collection(db, 'exams', subData.examId, 'questions'));
      const qs = qSnap.docs.map(d => ({ id: d.id, ...d.data() } as Question)).sort((a,b) => a.order - b.order);
      setQuestions(qs);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedQs(prev => ({ ...prev, [id]: !prev[id] }));
  };

  if (loading) return <div className="h-screen flex items-center justify-center font-mono animate-pulse">GENERATING_PERFORMANCE_REPORT...</div>;

  if (!submission || !exam) return null;

  const score = submission.score || 0;
  const total = submission.totalMarks || 0;
  const percentage = Math.round((score / total) * 100);
  
  const correctCount = questions.filter(q => submission.answers[q.id] === q.correctAnswer).length;
  const wrongCount = Object.keys(submission.answers).length - correctCount;
  const unattempted = questions.length - Object.keys(submission.answers).length;

  const durationStr = submission.endTime 
    ? `${differenceInMinutes(new Date(submission.endTime), new Date(submission.startTime))} min`
    : 'N/A';

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <Link to="/dashboard" className="inline-flex items-center gap-2 text-slate-500 hover:text-blue-600 font-bold text-xs mb-8 transition-colors uppercase tracking-widest">
        <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
      </Link>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden mb-8">
        <div className="bg-slate-800 px-8 py-12 text-white relative overflow-hidden">
          <div className="relative z-10">
            <h1 className="text-3xl font-bold mb-2 leading-tight">{exam.title}</h1>
            <p className="text-slate-400 text-sm font-medium">Verified Transcript • {submission.endTime ? format(new Date(submission.endTime), 'PPPp') : 'N/A'}</p>
          </div>
          <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-10 pointer-events-none">
            <Trophy className="w-48 h-48" />
          </div>
        </div>

        <div className="p-8">
          <div className="grid md:grid-cols-3 gap-8 mb-10">
            <div className="p-6 bg-slate-50 border border-slate-100 rounded-xl text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Aggregated Score</p>
              <div className="flex items-end justify-center gap-1">
                <span className="text-4xl font-bold text-slate-800">{score}</span>
                <span className="text-slate-400 font-medium mb-1">/ {total}</span>
              </div>
            </div>
            <div className="p-6 bg-slate-50 border border-slate-100 rounded-xl text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Performance Ratio</p>
              <div className="text-4xl font-bold text-blue-600">{percentage}%</div>
            </div>
            <div className="p-6 bg-slate-50 border border-slate-100 rounded-xl text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Result Status</p>
              <div className={cn(
                "text-2xl font-bold mt-2",
                percentage >= 70 ? "text-green-600" : percentage >= 40 ? "text-amber-600" : "text-red-600"
              )}>
                {percentage >= 70 ? "EXCELLENT" : percentage >= 40 ? "QUALIFIED" : "UNSUCCESSFUL"}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-10">
            <div className="text-center">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Accurate</p>
              <p className="text-sm font-bold text-green-600 leading-none">{correctCount}</p>
            </div>
            <div className="text-center">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Mismatch</p>
              <p className="text-sm font-bold text-red-500 leading-none">{wrongCount}</p>
            </div>
            <div className="text-center">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Unattempted</p>
              <p className="text-sm font-bold text-slate-300 leading-none">{unattempted}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-6">
          Response Analysis
        </h2>

        {questions.map((q, idx) => {
          const studentAns = submission.answers[q.id];
          const isCorrect = studentAns === q.correctAnswer;
          const isUnattempted = studentAns === undefined;
          const isExpanded = expandedQs[q.id];

          return (
            <div 
              key={q.id}
              className={cn(
                "bg-white border rounded-lg transition-all overflow-hidden",
                isExpanded ? "border-blue-200 shadow-md ring-4 ring-blue-50" : "border-slate-200 hover:border-blue-200 shadow-sm"
              )}
            >
              <button 
                onClick={() => toggleExpand(q.id)}
                className="w-full text-left p-6 flex items-start gap-4 group"
              >
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                  isUnattempted ? "bg-slate-100 text-slate-400" :
                  isCorrect ? "bg-green-100 text-green-700" :
                  "bg-red-100 text-red-700"
                )}>
                  {isUnattempted ? <Clock className="w-5 h-5" /> : isCorrect ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                </div>

                <div className="flex-1">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Question {idx + 1}</span>
                    <span className={cn(
                      "text-[10px] font-bold uppercase tracking-widest",
                      isUnattempted ? "text-slate-400" : isCorrect ? "text-green-700" : "text-red-700"
                    )}>
                      {isUnattempted ? "No Response" : isCorrect ? "Accurate" : "Mismatch"}
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-slate-800 leading-tight">
                    {q.text}
                  </h4>
                </div>

                <div className="shrink-0 pt-1">
                  {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-300" /> : <ChevronDown className="w-5 h-5 text-slate-300" />}
                </div>
              </button>

              {isExpanded && (
                <div className="px-6 pb-6 pt-2 space-y-6">
                  <div className="h-px bg-slate-100" />
                  
                  <div className="grid md:grid-cols-2 gap-3">
                    {q.options.map((opt, oIdx) => {
                      const isCorrectOpt = oIdx === q.correctAnswer;
                      const isStudentOpt = oIdx === studentAns;
                      
                      return (
                        <div 
                          key={oIdx}
                          className={cn(
                            "p-3 rounded-lg border-2 flex items-center gap-3 transition-all",
                            isCorrectOpt ? "bg-green-50 border-green-500" :
                            isStudentOpt && !isCorrect ? "bg-red-50 border-red-500" :
                            "bg-white border-slate-50"
                          )}
                        >
                          <div className={cn(
                            "w-7 h-7 rounded flex items-center justify-center font-bold text-[10px] shrink-0",
                            isCorrectOpt ? "bg-green-500 text-white" :
                            isStudentOpt && !isCorrect ? "bg-red-500 text-white" :
                            "bg-slate-100 text-slate-400"
                          )}>
                            {String.fromCharCode(65 + oIdx)}
                          </div>
                          <span className={cn(
                            "text-sm font-medium",
                            isCorrectOpt ? "text-green-900" : isStudentOpt ? "text-red-900" : "text-slate-500"
                          )}>{opt}</span>
                        </div>
                      );
                    })}
                  </div>

                  {q.explanation && (
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                       <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Contextual Explanation</h5>
                       <p className="text-slate-600 leading-relaxed text-xs">{q.explanation}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex justify-center gap-4 mt-12 pb-12">
         <button className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all text-sm">
            <Download className="w-4 h-4" /> Export Results
         </button>
         <button 
           onClick={() => window.print()}
           className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-sm text-sm"
         >
            <Printer className="w-4 h-4" /> Print Transcript
         </button>
      </div>
    </div>
  );
}
