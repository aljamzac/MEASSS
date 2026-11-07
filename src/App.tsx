import React, { useState, useEffect } from 'react';
import { Login } from './Login';
import { AdminDashboard } from './Admin';
import { StudentFlow } from './Student';
import { Student, Question, ExamResult, ClassGroup, Role, AdminUser } from './types';

export default function App() {
  const [students, setStudents] = useState<Student[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [results, setResults] = useState<ExamResult[]>([]);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  const [currentUser, setCurrentUser] = useState<Student | AdminUser | null>(null);
  const [userRole, setUserRole] = useState<Role | null>(null);
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        const [studentsRes, questionsRes, classesRes, resultsRes, adminsRes] = await Promise.all([
          fetch('/api/students'),
          fetch('/api/questions'),
          fetch('/api/classes'),
          fetch('/api/results'),
          fetch('/api/admins')
        ]);

        const [studentsData, questionsData, classesData, resultsData, adminsData] = await Promise.all([
          studentsRes.json(),
          questionsRes.json(),
          classesRes.json(),
          resultsRes.json(),
          adminsRes.json()
        ]);

        setStudents(studentsData);
        setQuestions(questionsData);
        setClasses(classesData);
        setResults(resultsData);
        setAdmins(adminsData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleLogin = (id: string) => {
    setLoginError('');
    
    // Check if it's an admin first (using username)
    const admin = admins.find(a => a.username.toLowerCase() === id.toLowerCase());
    if (admin) {
      setCurrentUser(admin);
      setUserRole('admin');
      return;
    }

    // Check if it's a student (using student_id)
    const student = students.find(s => s.id === id);
    if (student) {
      if (!student.canTakeExam) {
        setLoginError('You do not have permission to take the exam. Please contact the administrator.');
        return;
      }
      const alreadyTaken = results.some(r => r.studentId === student.id);
      if (alreadyTaken) {
        setLoginError('You have already completed this exam. Retakes are not allowed. Please contact the administrator if you believe this is an error.');
        return;
      }
      setCurrentUser(student);
      setUserRole('student');
    } else {
      setLoginError('Invalid ID or Username. Please try again.');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setUserRole(null);
  };

  const handleExamComplete = async (result: ExamResult) => {
    setResults(prev => [...prev, result]);
    try {
      await fetch('/api/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result)
      });
    } catch (error) {
      console.error('Error saving result:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-100">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-950 border-t-transparent mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading Maritime Assessment System...</p>
        </div>
      </div>
    );
  }

  if (!currentUser || !userRole) {
    return <Login onLogin={handleLogin} error={loginError} />;
  }

  if (userRole === 'admin') {
    return (
      <AdminDashboard 
        students={students} 
        setStudents={setStudents}
        questions={questions}
        setQuestions={setQuestions}
        results={results}
        setResults={setResults}
        classes={classes}
        setClasses={setClasses}
        admins={admins}
        setAdmins={setAdmins}
        onLogout={handleLogout}
        currentUser={currentUser as AdminUser}
      />
    );
  }

  if (userRole === 'student') {
    return (
      <StudentFlow 
        student={currentUser as Student} 
        questions={questions} 
        onComplete={handleExamComplete}
        onLogout={handleLogout}
      />
    );
  }

  return null;
}