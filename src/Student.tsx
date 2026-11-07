import React, { useState } from 'react';
import { Student, Question, ExamResult } from './types';
import { Ship, ChevronRight, ChevronLeft, CheckCircle, XCircle, AlertCircle, LogOut } from 'lucide-react';

interface StudentFlowProps {
  student: Student;
  questions: Question[];
  onComplete: (result: ExamResult) => void;
  onLogout: () => void;
}

type Step = 'welcome' | 'instructions' | 'exam' | 'summary' | 'review';

export function StudentFlow({ student, questions, onComplete, onLogout }: StudentFlowProps) {
  const [step, setStep] = useState<Step>('welcome');
  const [shuffledQuestions, setShuffledQuestions] = useState<Question[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [finalResult, setFinalResult] = useState<ExamResult | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [examStartTime, setExamStartTime] = useState<string>('');

  // Helper for shuffling
  const shuffleArray = <T,>(array: T[]): T[] => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  const startExam = () => {
    // Shuffle the order of questions
    const shuffledQs = shuffleArray(questions).map(q => {
      // Also shuffle the options within each question
      const optionsWithIndices = q.options.map((opt, idx) => ({ opt, originalIdx: idx }));
      const shuffledOptionsWithIndices = shuffleArray(optionsWithIndices);
      
      const newOptions = shuffledOptionsWithIndices.map(o => o.opt);
      const newCorrectIndex = shuffledOptionsWithIndices.findIndex(o => o.originalIdx === q.correctIndex);
      
      return {
        ...q,
        options: newOptions,
        correctIndex: newCorrectIndex
      };
    });
    
    setShuffledQuestions(shuffledQs);
    setExamStartTime(new Date().toISOString());
    setStep('exam');
  };

  const answeredCount = Object.keys(answers).length;
  const totalQuestions = shuffledQuestions.length > 0 ? shuffledQuestions.length : questions.length;

  const handleAnswer = (questionId: string, optionIndex: number) => {
    setAnswers(prev => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleNext = () => {
    if (currentQIndex < totalQuestions - 1) {
      setCurrentQIndex(prev => prev + 1);
    } else {
      setStep('summary');
    }
  };

  const handlePrev = () => {
    if (currentQIndex > 0) {
      setCurrentQIndex(prev => prev - 1);
    }
  };

  const handleSubmitExam = () => {
    let score = 0;
    shuffledQuestions.forEach(q => {
      if (answers[q.id] === q.correctIndex) {
        score++;
      }
    });

    const result: ExamResult = {
      id: `res_${Date.now()}_${student.id}_${Math.random().toString(36).slice(2, 8)}`,
      studentId: student.id,
      studentName: student.name,
      score,
      total: totalQuestions,
      date: new Date().toISOString(),
      startTime: examStartTime || new Date().toISOString(),
      answers
    };

    setFinalResult(result);
    onComplete(result);
    setStep('review');
  };

  // --- Views ---

  if (step === 'welcome') {
    return (
      <Layout studentName={student.name} onLogout={onLogout}>
        <div className="max-w-2xl mx-auto mt-20 bg-white rounded-2xl shadow-xl border border-slate-100 p-10 text-center">
          <div className="w-20 h-20 bg-blue-100 text-blue-900 rounded-full flex items-center justify-center mx-auto mb-6">
            <Ship size={40} />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Welcome, {student.name}</h1>
          <p className="text-slate-600 mb-8">BS Marine Transportation Competency Assessment</p>
          
          <div className="bg-slate-50 p-6 rounded-xl text-left mb-8 border border-slate-200">
            <h3 className="font-semibold text-slate-800 mb-2">Assessment Details:</h3>
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex items-center gap-2"><CheckCircle size={16} className="text-green-600"/> 50 Multiple Choice Questions per category (Simulated: {totalQuestions})</li>
              <li className="flex items-center gap-2"><CheckCircle size={16} className="text-green-600"/> Monitor your progress as you go</li>
              <li className="flex items-center gap-2"><CheckCircle size={16} className="text-green-600"/> Review results immediately after completion</li>
            </ul>
          </div>

          <button 
            onClick={() => setStep('instructions')}
            className="bg-blue-900 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-800 transition-colors flex items-center justify-center gap-2 w-full sm:w-auto mx-auto"
          >
            Proceed to Instructions <ChevronRight size={20} />
          </button>
        </div>
      </Layout>
    );
  }

  if (step === 'instructions') {
    return (
      <Layout studentName={student.name} onLogout={onLogout}>
        <div className="max-w-3xl mx-auto mt-10 bg-white rounded-2xl shadow-xl border border-slate-100 p-10">
          <h2 className="text-2xl font-bold text-slate-800 mb-6 border-b pb-4">Examination Instructions</h2>
          
          <div className="space-y-6 text-slate-700 leading-relaxed">
            <p>Please read the following instructions carefully before beginning the assessment:</p>
            
            <ol className="list-decimal pl-5 space-y-4">
              <li><strong>Format:</strong> The exam consists of multiple-choice questions. Select the single best answer for each question.</li>
              <li><strong>Randomization:</strong> Both questions and answer options are automatically shuffled for each student to ensure exam integrity.</li>
              <li><strong>Navigation:</strong> Use the "Previous" and "Next" buttons to navigate between questions. You may change your answers at any time before final submission.</li>
              <li><strong>Progress:</strong> A progress bar at the bottom will indicate how many questions you have answered.</li>
              <li><strong>Submission:</strong> Once you reach the final question, you will be prompted to submit your exam. <strong>This action is final.</strong></li>
              <li><strong>Integrity:</strong> Ensure you are in a quiet environment. Do not use unauthorized materials during this competency assessment.</li>
            </ol>

            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-8">
              <div className="flex items-start gap-3">
                <AlertCircle className="text-yellow-600 mt-0.5" size={20} />
                <p className="text-sm text-yellow-800">
                  By clicking "Begin Assessment", you agree to abide by the academic integrity policies of the institution.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-10 flex justify-between items-center border-t pt-6">
            <button onClick={() => setStep('welcome')} className="text-slate-500 hover:text-slate-800 font-medium px-4 py-2">
              Back
            </button>
            <button 
              onClick={startExam}
              className="bg-blue-900 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-800 transition-colors"
            >
              Begin Assessment
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  if (step === 'exam') {
    const currentQ = shuffledQuestions[currentQIndex];
    const isLastQuestion = currentQIndex === totalQuestions - 1;

    if (!currentQ) return <div className="flex h-screen items-center justify-center bg-slate-100">Loading Exam...</div>;

    return (
      <Layout studentName={student.name} onLogout={onLogout}>
        <div className="max-w-4xl mx-auto mt-8 flex flex-col h-[calc(100vh-140px)]">
          
          {/* Question Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 flex-1 flex flex-col overflow-hidden">
            <div className="bg-slate-50 px-8 py-4 border-b border-slate-200 flex justify-between items-center">
              <span className="text-sm font-bold text-blue-900 uppercase tracking-wider">{currentQ.category}</span>
              <span className="text-sm font-medium text-slate-500">Question {currentQIndex + 1} of {totalQuestions}</span>
            </div>
            
            <div className="p-8 flex-1 overflow-y-auto">
              <h2 className="text-2xl font-medium text-slate-800 mb-8 leading-snug">
                {currentQ.text}
              </h2>
              
              <div className="space-y-3">
                {currentQ.options.map((option, idx) => {
                  const isSelected = answers[currentQ.id] === idx;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleAnswer(currentQ.id, idx)}
                      className={`w-full text-left p-5 rounded-xl border-2 transition-all flex items-center gap-4 ${
                        isSelected 
                          ? 'border-blue-600 bg-blue-50' 
                          : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        isSelected ? 'border-blue-600' : 'border-slate-300'
                      }`}>
                        {isSelected && <div className="w-3 h-3 bg-blue-600 rounded-full" />}
                      </div>
                      <span className={`text-lg ${isSelected ? 'text-blue-900 font-medium' : 'text-slate-700'}`}>
                        {option}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer Controls */}
          <div className="mt-6 bg-white rounded-xl shadow-md border border-slate-200 p-4 flex items-center justify-between">
            <button 
              onClick={handlePrev}
              disabled={currentQIndex === 0}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                currentQIndex === 0 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <ChevronLeft size={20} /> Previous
            </button>

            <div className="flex-1 px-8">
              <div className="flex justify-between text-xs font-medium text-slate-500 mb-2">
                <span>Progress</span>
                <span>{answeredCount} / {totalQuestions} Answered</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                  style={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
                ></div>
              </div>
            </div>

            <button 
              onClick={handleNext}
              className="flex items-center gap-2 bg-blue-900 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-800 transition-colors"
            >
              {isLastQuestion ? 'Review & Submit' : 'Next'} <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  if (step === 'summary') {
    const unanswered = totalQuestions - answeredCount;
    
    return (
      <Layout studentName={student.name} onLogout={onLogout}>
        <div className="max-w-2xl mx-auto mt-20 bg-white rounded-2xl shadow-xl border border-slate-100 p-10 text-center">
          <h2 className="text-3xl font-bold text-slate-800 mb-6">Ready to Submit?</h2>
          
          <div className="bg-slate-50 rounded-xl p-8 mb-8 border border-slate-200">
            <div className="grid grid-cols-2 gap-8">
              <div>
                <p className="text-slate-500 text-sm font-medium uppercase tracking-wider mb-1">Answered</p>
                <p className="text-4xl font-bold text-blue-600">{answeredCount}</p>
              </div>
              <div>
                <p className="text-slate-500 text-sm font-medium uppercase tracking-wider mb-1">Unanswered</p>
                <p className={`text-4xl font-bold ${unanswered > 0 ? 'text-red-500' : 'text-green-500'}`}>
                  {unanswered}
                </p>
              </div>
            </div>
          </div>

          {unanswered > 0 && (
            <p className="text-red-600 mb-8 font-medium">
              You have {unanswered} unanswered question(s). Are you sure you want to submit?
            </p>
          )}

          <div className="flex justify-center gap-4">
            <button 
              onClick={() => setStep('exam')}
              className="px-6 py-3 rounded-lg font-medium text-slate-600 border border-slate-300 hover:bg-slate-50 transition-colors"
            >
              Return to Exam
            </button>
            <button 
              onClick={handleSubmitExam}
              className="bg-blue-900 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-800 transition-colors"
            >
              Submit Assessment
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  if (step === 'review' && finalResult) {
    const percentage = Math.round((finalResult.score / finalResult.total) * 100);
    const passed = percentage >= 75; // Assuming 75% passing grade

    // ── Group questions per subject (category) ──────────────────────────────
    const subjectGroups = Object.values(
      shuffledQuestions.reduce((acc, q) => {
        const key = q.category || 'Uncategorized';
        if (!acc[key]) acc[key] = { category: key, items: [] as Question[] };
        acc[key].items.push(q);
        return acc;
      }, {} as Record<string, { category: string; items: Question[] }>)
    )
      .map(g => {
        const correct = g.items.filter(q => finalResult.answers[q.id] === q.correctIndex).length;
        const total = g.items.length;
        const pct = total ? Math.round((correct / total) * 100) : 0;
        return { ...g, correct, total, pct, strong: pct >= 75 };
      })
      .sort((a, b) => a.category.localeCompare(b.category));

    const bySubjectScore = [...subjectGroups].sort((a, b) => b.pct - a.pct);
    const strongest = bySubjectScore[0];
    const weakest = bySubjectScore[bySubjectScore.length - 1];

    return (
      <Layout studentName={student.name} onLogout={onLogout}>
        <div className="max-w-4xl mx-auto mt-8 pb-12">
          
          {/* Score Header */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-10 text-center mb-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Assessment Complete</h2>
            <p className="text-slate-500 mb-8">Here is your performance summary.</p>
            
            <div className="flex justify-center items-center gap-16">
              {/* Left: final score and status */}
              <div className="text-left">
                <div className="mb-4">
                  <p className="text-sm text-slate-500 uppercase tracking-wider font-medium">Final Score</p>
                  <p className="text-3xl font-bold text-slate-800">{finalResult.score} <span className="text-xl text-slate-400 font-normal">/ {finalResult.total}</span></p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 uppercase tracking-wider font-medium">Status</p>
                  <p className={`text-xl font-bold ${passed ? 'text-green-600' : 'text-red-600'}`}>
                    {passed ? 'PASSED' : 'FAILED'}
                  </p>
                </div>
              </div>
              {/* Divider */}
              <div className="hidden sm:block w-px self-stretch bg-slate-200"></div>

              {/* Right: percentage rating */}
              <div className="text-center">
                <p className="text-sm text-slate-500 uppercase tracking-wider font-medium mb-1">Rating</p>
                <span className={`text-7xl font-bold ${passed ? 'text-green-600' : 'text-red-600'}`}>{percentage}%</span>
              </div>

            </div>
          </div>

          {/* Performance per Subject */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden mb-8">
            <div className="bg-slate-50 px-8 py-5 border-b border-slate-200">
              <h3 className="font-bold text-slate-800 text-lg">Performance per Subject</h3>
              <p className="text-sm text-slate-500 mt-1">See your strengths and the subjects you need to review (passing: 75%).</p>
            </div>

            {subjectGroups.length > 1 && (
              <div className="grid sm:grid-cols-2 gap-4 px-8 pt-6">
                <div className="rounded-xl border border-green-200 bg-green-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-green-700">Strongest Subject</p>
                  <p className="font-semibold text-green-900 mt-1">{strongest.category}</p>
                  <p className="text-sm text-green-700">{strongest.correct} / {strongest.total} correct ({strongest.pct}%)</p>
                </div>
                <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-red-700">Needs Most Improvement</p>
                  <p className="font-semibold text-red-900 mt-1">{weakest.category}</p>
                  <p className="text-sm text-red-700">{weakest.correct} / {weakest.total} correct ({weakest.pct}%)</p>
                </div>
              </div>
            )}

            <div className="p-8 space-y-5">
              {subjectGroups.map(g => (
                <div key={g.category}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-semibold text-slate-800">{g.category}</span>
                    <span className="flex items-center gap-3">
                      <span className="text-sm text-slate-500">{g.correct} / {g.total}</span>
                      <span className={`text-sm font-bold ${g.strong ? 'text-green-600' : 'text-red-600'}`}>{g.pct}%</span>
                      <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${g.strong ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {g.strong ? 'Strength' : 'Needs Review'}
                      </span>
                    </span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${g.strong ? 'bg-green-500' : 'bg-red-500'}`}
                      style={{ width: `${g.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Detailed Review */}
          {!showSummary ? (
            <div className="text-center mb-8">
              <button 
                onClick={() => setShowSummary(true)}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-md"
              >
                View Summary of Items
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden mb-8">
              <div className="bg-slate-50 px-8 py-5 border-b border-slate-200 flex justify-between items-center">
                <h3 className="font-bold text-slate-800 text-lg">Detailed Results</h3>
                <button 
                  onClick={() => setShowSummary(false)}
                  className="text-sm font-medium text-slate-500 hover:text-slate-800"
                >
                  Hide Summary
                </button>
              </div>
              
              <div>
                {subjectGroups.map(group => (
                  <div key={group.category}>
                    {/* Subject header */}
                    <div className="px-8 py-3 bg-blue-950 text-white flex items-center justify-between">
                      <h4 className="font-bold uppercase tracking-wider text-sm">{group.category}</h4>
                      <span className="text-sm text-blue-200">{group.correct} / {group.total} correct &middot; {group.pct}%</span>
                    </div>
                    <div className="divide-y divide-slate-100">
                {group.items.map((q, idx) => {
                  const studentAnswer = finalResult.answers[q.id];
                  const isCorrect = studentAnswer === q.correctIndex;
                  const isUnanswered = studentAnswer === undefined;

                  return (
                    <div key={q.id} className="p-8">
                      <div className="flex gap-4">
                        <div className="mt-1">
                          {isCorrect ? (
                            <CheckCircle className="text-green-500" size={24} />
                          ) : (
                            <XCircle className="text-red-500" size={24} />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-slate-800 mb-4">
                            <span className="text-slate-400 mr-2">{idx + 1}.</span>
                            {q.text}
                          </p>
                          
                          <div className="space-y-2">
                            {q.options.map((opt, optIdx) => {
                              const isStudentChoice = studentAnswer === optIdx;
                              const isActualCorrect = q.correctIndex === optIdx;
                              
                              let bgClass = "bg-slate-50 border-slate-200 text-slate-600";
                              if (isActualCorrect) {
                                bgClass = "bg-green-50 border-green-200 text-green-800 font-medium";
                              } else if (isStudentChoice && !isCorrect) {
                                bgClass = "bg-red-50 border-red-200 text-red-800";
                              }

                              return (
                                <div key={optIdx} className={`p-3 rounded-lg border ${bgClass} flex items-center justify-between`}>
                                  <span>{opt}</span>
                                  {isStudentChoice && <span className="text-xs font-bold uppercase tracking-wider opacity-70">Your Answer</span>}
                                  {!isStudentChoice && isActualCorrect && <span className="text-xs font-bold uppercase tracking-wider opacity-70">Correct Answer</span>}
                                </div>
                              );
                            })}
                          </div>
                          {isUnanswered && (
                            <p className="mt-3 text-sm font-medium text-red-500">You did not answer this question.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="mt-8 text-center">
             <button 
              onClick={onLogout}
              className="bg-slate-800 text-white px-8 py-3 rounded-lg font-semibold hover:bg-slate-700 transition-colors"
            >
              Finish & Logout
            </button>
          </div>

        </div>
      </Layout>
    );
  }

  return null;
}

// --- Helper Layout Component ---
function Layout({ children, studentName, onLogout }: { children: React.ReactNode, studentName: string, onLogout: () => void }) {
  return (
    <div className="min-h-screen bg-slate-100 font-sans flex flex-col">
      <header className="bg-blue-950 text-white px-8 py-4 flex justify-between items-center shadow-md z-10">
        <div className="flex items-center gap-3">
          <Ship size={24} className="text-blue-300" />
          <h1 className="text-lg font-bold tracking-wide">ESTI Maritime Assessment System</h1>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-sm">
            <span className="text-blue-300 mr-2">Examinee:</span>
            <span className="font-medium">{studentName}</span>
          </div>
          <button onClick={onLogout} className="text-blue-300 hover:text-white transition-colors flex items-center gap-2 text-sm font-medium bg-blue-900/50 px-3 py-1.5 rounded-md">
            <LogOut size={16} /> Logout
          </button>
        </div>
      </header>
      <main className="flex-1 overflow-auto p-6">
        {children}
      </main>
    </div>
  );
}