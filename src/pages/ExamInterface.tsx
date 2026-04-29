import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, getDocs, collection, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Exam, Question, Submission } from '../types';
import { useAuth } from '../hooks/useAuth';
import { Clock, ChevronLeft, ChevronRight, Send, AlertTriangle, Monitor, LayoutGrid, CheckCircle2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { differenceInSeconds } from 'date-fns';
import Swal from 'sweetalert2';

export default function ExamInterface() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [exitCount, setExitCount] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const initialLoadRef = useRef(false);

  const examRef = useRef(exam);
  const exitCountRef = useRef(exitCount);
  const answersRef = useRef(answers);
  const questionsRef = useRef(questions);

  useEffect(() => {
    examRef.current = exam;
    exitCountRef.current = exitCount;
    answersRef.current = answers;
    questionsRef.current = questions;
  }, [exam, exitCount, answers, questions]);

  useEffect(() => {
    if (!examId || !user || initialLoadRef.current) return;
    initialLoadRef.current = true;
    startOrResumeExam();
    
    // Anti-cheat detection
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        setTabSwitchCount(prev => prev + 1);
        Swal.fire({
          title: 'Warning!',
          text: 'Tab switching is detected and logged for proctoring.',
          icon: 'warning',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000
        });
      }
    };

    const handleFullScreenChange = () => {
      const isNowFS = !!document.fullscreenElement;
      setIsFullScreen(isNowFS);
      const currentExam = examRef.current;
      const currentExitCount = exitCountRef.current;
      
      if (!isNowFS && currentExam) {
        const newCount = currentExitCount + 1;
        setExitCount(newCount);
        if (newCount >= (currentExam.allowedExits || 3)) {
             Swal.fire('Exam Ended', 'You have exceeded the allowed number of exits. Your exam is submitted.', 'error');
             submitExam(answersRef.current, questionsRef.current, currentExam.totalMarks);
        } else {
             Swal.fire('Warning', `You have exited fullscreen. Exit ${newCount} of ${currentExam.allowedExits || 3}. Please re-enter fullscreen immediately.`, 'warning');
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('fullscreenchange', handleFullScreenChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('fullscreenchange', handleFullScreenChange);
    };
  }, [examId, user]);

  // Webcam setup if proctored
  useEffect(() => {
    if (exam?.settings?.proctored === 'Yes') {
      const startWebcam = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          if (videoRef.current) videoRef.current.srcObject = stream;
        } catch (err) {
          console.error("Webcam error:", err);
          Swal.fire('Proctoring Error', 'Webcam is mandatory for this exam.', 'error').then(() => navigate('/papers'));
        }
      };
      
      // Delay slightly to ensure videoRef is available in DOM
      setTimeout(startWebcam, 500);
    }
  }, [exam]);

  const enterFullScreen = () => {
    document.documentElement.requestFullscreen().catch(e => {
      console.error(`Error attempting to enable fullscreen: ${e.message}`);
    });
  };

  const startOrResumeExam = async () => {
    try {
      // 1. Fetch Exam Meta
      const examDoc = await getDoc(doc(db, 'exams', examId!));
      if (!examDoc.exists() || examDoc.data().status !== 'published') {
        navigate('/dashboard');
        return;
      }
      const examData = { id: examDoc.id, ...examDoc.data() } as Exam;
      
      const now = new Date();
      if (examData.startTime && now < new Date(examData.startTime)) {
        Swal.fire('Too Early', `This exam starts at ${examData.startTime}`, 'info');
        navigate('/papers');
        return;
      }
      if (examData.endTime && now > new Date(examData.endTime)) {
        Swal.fire('Exam Closed', `This exam ended at ${examData.endTime}`, 'error');
        navigate('/papers');
        return;
      }

      setExam(examData);

      // 2. Fetch Questions
      const qSnap = await getDocs(collection(db, 'exams', examId!, 'questions'));
      const qs = qSnap.docs.map(d => ({ id: d.id, ...d.data() } as Question)).sort((a,b) => a.order - b.order);
      setQuestions(qs);

      // 3. Check for existing submission
      const subId = `${user!.uid}_${examId}`;
      const subDoc = await getDoc(doc(db, 'submissions', subId));
      
      let currentSub: Submission;

      if (subDoc.exists()) {
        currentSub = { id: subDoc.id, ...subDoc.data() } as Submission;
        if (currentSub.status === 'completed') {
           navigate(`/result/${subId}`);
           return;
        }
        setAnswers(currentSub.answers || {});
      } else {
        // Create new submission
        currentSub = {
          id: subId,
          examId: examId!,
          studentId: user!.uid,
          startTime: new Date().toISOString(),
          answers: {},
          status: 'in-progress',
          totalMarks: examData.totalMarks
        };
        await setDoc(doc(db, 'submissions', subId), currentSub);
      }
      
      setSubmission(currentSub);

      // 4. Setup Timer
      const startTime = new Date(currentSub.startTime);
      const elapsedSeconds = differenceInSeconds(now, startTime);
      const totalSeconds = examData.durationMinutes * 60;
      const remainingSeconds = Math.max(0, totalSeconds - elapsedSeconds);
      
      if (remainingSeconds <= 0) {
        autoSubmit(currentSub.answers, qs, examData.totalMarks);
      } else {
        setTimeLeft(remainingSeconds);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Timer loop
  useEffect(() => {
    if (timeLeft <= 0 || isSubmitting) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          autoSubmit(answers, questions, exam?.totalMarks || 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isSubmitting, answers, questions, exam]);

  const handleSelectAnswer = async (qId: string, value: number | string) => {
    const newAnswers = { ...answers, [qId]: value };
    setAnswers(newAnswers);
    
    // Debounced or simple auto-save
    try {
      if (submission) {
        await updateDoc(doc(db, 'submissions', submission.id), {
          answers: newAnswers
        });
      }
    } catch (e) { console.error("Auto-save failed", e); }
  };

  const autoSubmit = (finalAnswers: Record<string, number | string>, finalQs: Question[], totalMarks: number) => {
    Swal.fire({
      title: 'Time Expired!',
      text: 'Your exam is being automatically submitted.',
      icon: 'info',
      timer: 3000,
      showConfirmButton: false,
      didClose: () => submitExam(finalAnswers, finalQs, totalMarks)
    });
  };

  const submitExam = async (finalAnswers: Record<string, number | string>, finalQs: Question[], totalMarks: number) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      let score = 0;
      finalQs.forEach(q => {
        const userAnswer = finalAnswers[q.id];
        
        switch (q.type) {
          case 'mcq':
          case 'true_false':
            if (userAnswer === q.correctAnswer) {
              score += (Number(q.points) || 1);
            }
            break;
          case 'short_answer':
            // Check if user answer matches any of the possible answers
            const possible = q.possibleAnswers || [];
            if (typeof userAnswer === 'string' && possible.some(p => p.trim().toLowerCase() === userAnswer.trim().toLowerCase())) {
              score += (Number(q.points) || 1);
            }
            break;
          case 'long_answer':
            // Long answers aren't auto-graded usually, but we could add AI grading or just mark as 0/pending
            break;
          default:
            // fallback for old data
            if (userAnswer === q.correctAnswer) {
              score += (Number(q.points) || 1);
            }
        }
      });

      await updateDoc(doc(db, 'submissions', submission!.id), {
        status: 'completed',
        answers: finalAnswers,
        endTime: new Date().toISOString(),
        score,
        totalMarks
      });

      Swal.fire({
        title: 'Exam Submitted!',
        text: `Your score: ${score} / ${totalMarks}`,
        icon: 'success',
        confirmButtonText: 'View Analysis'
      }).then(() => {
        navigate(`/result/${submission!.id}`);
      });
    } catch (error) {
      console.error(error);
      setIsSubmitting(false);
      Swal.fire('Error', 'Submission failed. Please check internet connection.', 'error');
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) return <div className="h-screen flex items-center justify-center font-mono animate-pulse">BOOTING_SECURE_EXAM_ENVIRONMENT...</div>;

  const currentQ = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col bg-slate-50 relative overflow-hidden">
      {/* Fullscreen Overlay */}
      {!isFullScreen && exam?.settings?.proctored === 'Yes' && (
        <div className="fixed inset-0 z-[100] bg-slate-900/95 flex flex-col items-center justify-center p-6 text-center">
           <AlertTriangle className="w-16 h-16 text-yellow-500 mb-6 animate-bounce" />
           <h2 className="text-3xl font-bold text-white mb-2">Fullscreen Mode Required</h2>
           <p className="text-slate-400 mb-8 max-w-md">This is a proctored exam. You must remain in full-screen mode to continue. Any attempt to exit will be logged.</p>
           <button 
            onClick={enterFullScreen}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold text-lg shadow-xl shadow-blue-900/20 transition-all active:scale-95"
           >
             Enter Fullscreen to Start
           </button>
        </div>
      )}

      {/* Header Info */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm relative z-10 font-sans">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold">
                E
             </div>
             <div>
               <h2 className="font-bold text-slate-800 text-sm line-clamp-1">{exam?.title}</h2>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Security Environment Active</p>
             </div>
          </div>
        </div>

        <div className={cn(
          "flex items-center gap-3 px-5 py-2 rounded-lg border transition-all",
          timeLeft < 300 ? "bg-red-50 border-red-200 text-red-600 animate-pulse" : "bg-blue-50 border-blue-200 text-blue-600"
        )}>
          <Clock className="w-5 h-5" />
          <span className="text-xl font-bold font-mono tracking-tight">{formatTime(timeLeft)}</span>
        </div>
      </div>

      <div className="flex-1 flex min-h-0">
        {/* Main Interface */}
        <div className="flex-1 overflow-y-auto p-12 relative">
          {/* Webcam Feed Overlay */}
          {exam?.settings?.proctored === 'Yes' && (
            <div className="fixed bottom-24 right-8 w-48 h-36 bg-black rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20 z-20 group">
               <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover grayscale brightness-110" />
               <div className="absolute top-2 right-2 flex gap-1">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                  <span className="text-[8px] font-bold text-white uppercase tracking-tighter opacity-70">REC</span>
               </div>
               <div className="absolute inset-0 bg-indigo-500/10 mix-blend-overlay pointer-events-none" />
               <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
                  <p className="text-[10px] text-white font-mono opacity-80 truncate">{user?.name}</p>
               </div>
            </div>
          )}

          <div className="max-w-3xl mx-auto">
             {currentQ ? (
               <div className="space-y-12">
                 <div className="flex justify-between items-start">
                   <div className="flex items-center gap-4">
                      <span className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black text-lg">Q{currentIndex + 1}</span>
                      <div className="h-px w-12 bg-slate-200" />
                   </div>
                   <span className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">{currentQ.points} Point(s)</span>
                 </div>

                 <h3 className="text-2xl lg:text-3xl font-medium text-slate-900 leading-relaxed">
                   {currentQ.text}
                 </h3>

                 <div className="grid gap-4">
                    {currentQ.type === 'short_answer' ? (
                      <div className="space-y-4">
                        <input 
                          type="text"
                          className="w-full p-6 rounded-3xl border-2 border-slate-100 bg-white text-lg font-medium outline-none focus:border-indigo-400"
                          placeholder="Type your answer here..."
                          value={answers[currentQ.id] || ''}
                          onChange={(e) => handleSelectAnswer(currentQ.id, e.target.value)}
                        />
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest pl-4">Case insensitive comparison will be used.</p>
                      </div>
                    ) : currentQ.type === 'long_answer' ? (
                      <div className="space-y-4">
                        <textarea 
                          rows={8}
                          className="w-full p-6 rounded-3xl border-2 border-slate-100 bg-white text-lg font-medium outline-none focus:border-indigo-400 resize-none"
                          placeholder="Write your response..."
                          value={answers[currentQ.id] || ''}
                          onChange={(e) => handleSelectAnswer(currentQ.id, e.target.value)}
                        />
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest pl-4">Your response will be saved automatically.</p>
                      </div>
                    ) : (
                      currentQ.options.map((option, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSelectAnswer(currentQ.id, idx)}
                          className={cn(
                            "w-full text-left p-6 rounded-3xl border-2 transition-all flex items-center gap-6 group hover:scale-[1.01] active:scale-[0.98]",
                            answers[currentQ.id] === idx 
                             ? "bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-100" 
                             : "bg-white border-slate-100 text-slate-600 hover:border-indigo-100"
                          )}
                        >
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0",
                            answers[currentQ.id] === idx ? "bg-indigo-500 text-white" : "bg-slate-50 text-slate-500 group-hover:bg-indigo-50"
                          )}>
                            {currentQ.type === 'true_false' ? (idx === 0 ? 'T' : 'F') : String.fromCharCode(65 + idx)}
                          </div>
                          <span className="text-lg font-medium">{option}</span>
                          {answers[currentQ.id] === idx && (
                            <div className="ml-auto">
                               <CheckCircle2 className="w-6 h-6 text-indigo-200 animate-in zoom-in-50" />
                            </div>
                          )}
                        </button>
                      ))
                    )}
                 </div>
               </div>
             ) : (
               <div className="text-center py-20">
                 <p className="text-slate-400 font-mono italic underline">NO_QUESTION_DATA_LOADED</p>
               </div>
             )}
          </div>
        </div>

        {/* Question Palette Sidebar */}
        <div className="w-80 bg-white border-l flex flex-col p-8 hidden lg:flex">
           <h4 className="font-black text-xs tracking-[0.2em] text-slate-400 uppercase mb-6">Question Palette</h4>
           <div className="grid grid-cols-4 gap-3">
             {questions.map((q, idx) => (
               <button
                 key={q.id}
                 onClick={() => setCurrentIndex(idx)}
                 className={cn(
                   "w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold transition-all border-2",
                   currentIndex === idx ? "bg-slate-900 text-white border-slate-900 shadow-lg" :
                   answers[q.id] !== undefined ? "bg-green-50 border-green-200 text-green-600" :
                   "bg-slate-50 border-slate-100 text-slate-400 hover:border-indigo-100 hover:text-indigo-600"
                 )}
               >
                 {idx + 1}
               </button>
             ))}
           </div>

           <div className="mt-auto space-y-4">
              <div className="p-5 bg-slate-50 rounded-3xl space-y-3">
                <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-slate-400">
                   <span>Progress</span>
                   <span>{Math.round((answeredCount / questions.length) * 100)}%</span>
                </div>
                <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-600 transition-all duration-1000" 
                    style={{ width: `${(answeredCount / questions.length) * 100}%` }}
                  />
                </div>
              </div>
              
              <button
                onClick={() => {
                  Swal.fire({
                    title: 'Finish Exam?',
                    text: `You have answered ${answeredCount} of ${questions.length} questions. You won't be able to change your answers!`,
                    icon: 'question',
                    showCancelButton: true,
                    confirmButtonColor: '#4f46e5',
                    confirmButtonText: 'Yes, Submit'
                  }).then((res) => { if (res.isConfirmed) submitExam(answers, questions, exam?.totalMarks || 0); });
                }}
                className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-95"
              >
                <Send className="w-5 h-5" /> Submit Exam
              </button>
           </div>
        </div>
      </div>

      {/* Mobile Footer Navigation */}
      <div className="lg:hidden bg-white border-t p-4 flex gap-4">
        <button 
          disabled={currentIndex === 0}
          onClick={() => setCurrentIndex(i => i - 1)}
          className="flex-1 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <ChevronLeft className="w-5 h-5" /> Prev
        </button>
        {currentIndex === questions.length - 1 ? (
          <button 
            onClick={() => submitExam(answers, questions, exam?.totalMarks || 0)}
            className="flex-1 py-4 bg-indigo-600 text-white font-bold rounded-2xl flex items-center justify-center gap-2"
          >
            Submit <Send className="w-5 h-5" />
          </button>
        ) : (
          <button 
            onClick={() => setCurrentIndex(i => i + 1)}
            className="flex-1 py-4 bg-indigo-600 text-white font-bold rounded-2xl flex items-center justify-center gap-2"
          >
            Next <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Desktop Prev/Next overlay buttons */}
      <div className="hidden lg:block fixed bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-white/10 backdrop-blur-sm p-2 rounded-3xl pointer-events-none">
         <button 
           disabled={currentIndex === 0}
           onClick={() => setCurrentIndex(i => i - 1)}
           className="w-16 h-16 bg-white shadow-2xl border border-slate-100 rounded-2xl flex items-center justify-center text-slate-600 hover:text-indigo-600 transition-all disabled:opacity-50 pointer-events-auto active:scale-90"
         >
           <ChevronLeft className="w-8 h-8" />
         </button>
         <button 
           disabled={currentIndex === questions.length - 1}
           onClick={() => setCurrentIndex(i => i + 1)}
           className="w-16 h-16 bg-white shadow-2xl border border-slate-100 rounded-2xl flex items-center justify-center text-slate-600 hover:text-indigo-600 transition-all disabled:opacity-50 pointer-events-auto active:scale-90"
         >
           <ChevronRight className="w-8 h-8" />
         </button>
      </div>
    </div>
  );
}
