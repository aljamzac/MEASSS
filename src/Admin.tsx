import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Student, Question, ExamResult, ClassGroup, AdminUser } from './types';
import { 
  Users, 
  FileQuestion, 
  BarChart, 
  LogOut, 
  CheckCircle, 
  XCircle, 
  BookOpen, 
  Plus, 
  Trash2, 
  Edit, 
  X, 
  Printer, 
  ShieldCheck,
  Search
} from 'lucide-react';

interface AdminProps {
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  questions: Question[];
  setQuestions: React.Dispatch<React.SetStateAction<Question[]>>;
  results: ExamResult[];
  setResults?: React.Dispatch<React.SetStateAction<ExamResult[]>>;
  classes: ClassGroup[];
  setClasses: React.Dispatch<React.SetStateAction<ClassGroup[]>>;
  admins: AdminUser[];
  setAdmins: React.Dispatch<React.SetStateAction<AdminUser[]>>;
  onLogout: () => void;
  currentUser: AdminUser;
}

type Tab = 'students' | 'questions' | 'results' | 'classes' | 'admins';

export function AdminDashboard({ 
  students, setStudents, 
  questions, setQuestions, 
  results, setResults,
  classes, setClasses, 
  admins, setAdmins,
  onLogout,
  currentUser
}: AdminProps) {
  const [activeTab, setActiveTab] = useState<Tab>('students');

  return (
    <div className="flex h-screen w-screen bg-slate-100 overflow-hidden font-sans">
      {/* Sidebar */}
      <div className="w-64 bg-blue-950 text-white flex flex-col shadow-xl z-10 no-print">
        <div className="p-6 border-b border-blue-900">
          <h2 className="text-xl font-bold tracking-tight">Admin Portal</h2>
          <p className="text-blue-300 text-xs mt-1">ESTI Maritime Assessment System</p>
        </div>
        
        <nav className="flex-1 py-4">
          <NavItem icon={<Users size={20} />} label="Student Management" active={activeTab === 'students'} onClick={() => setActiveTab('students')} />
          <NavItem icon={<FileQuestion size={20} />} label="Questionnaire" active={activeTab === 'questions'} onClick={() => setActiveTab('questions')} />
          <NavItem icon={<BarChart size={20} />} label="Exam Results" active={activeTab === 'results'} onClick={() => setActiveTab('results')} />
          <NavItem icon={<BookOpen size={20} />} label="Class Lists" active={activeTab === 'classes'} onClick={() => setActiveTab('classes')} />
          <NavItem icon={<ShieldCheck size={20} />} label="System Administrators" active={activeTab === 'admins'} onClick={() => setActiveTab('admins')} />
        </nav>

        <div className="p-4 border-t border-blue-900">
          <button onClick={onLogout} className="flex w-full items-center gap-3 px-4 py-2 text-blue-200 hover:text-white hover:bg-blue-900 rounded-lg transition-colors">
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm px-8 py-5 flex justify-between items-center z-0 no-print">
          <h1 className="text-2xl font-semibold text-slate-800 capitalize">
            {activeTab.replace(/([A-Z])/g, ' $1').trim()}
          </h1>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
              {currentUser.name.charAt(0)}
            </div>
            <span className="text-sm font-medium text-slate-600">{currentUser.name}</span>
          </div>
        </header>
        
        <main className="flex-1 overflow-auto p-8">
          {activeTab === 'students' && <StudentsTab students={students} setStudents={setStudents} setResults={setResults} classes={classes} />}
          {activeTab === 'questions' && <QuestionsTab questions={questions} setQuestions={setQuestions} />}
          {activeTab === 'results' && <ResultsTab results={results} students={students} classes={classes} />}
          {activeTab === 'classes' && <ClassesTab classes={classes} setClasses={setClasses} />}
          {activeTab === 'admins' && <AdminsTab admins={admins} setAdmins={setAdmins} />}
        </main>
      </div>
    </div>
  );
}

function AdminsTab({ admins, setAdmins }: { admins: AdminUser[], setAdmins: any }) {
  const [showModal, setShowModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null);
  const [adminForm, setAdminForm] = useState({ id: '', name: '', username: '' });
  const [searchTerm, setSearchTerm] = useState('');

  const handleOpenAdd = () => {
    setEditingAdmin(null);
    setAdminForm({ id: `adm_${Date.now()}`, name: '', username: '' });
    setShowModal(true);
  };

  const handleOpenEdit = (a: AdminUser) => {
    setEditingAdmin(a);
    setAdminForm({ ...a });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    setAdmins(admins.filter(a => a.id !== id));
    setShowDeleteConfirm(null);
    try {
      await fetch(`/api/admins/${id}`, { method: 'DELETE' });
    } catch (error) {
      console.error('Error deleting admin:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAdmin) {
      setAdmins(admins.map(a => a.id === editingAdmin.id ? { ...adminForm } : a));
      try {
        await fetch(`/api/admins/${editingAdmin.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(adminForm)
        });
      } catch (error) {
        console.error('Error updating admin:', error);
      }
    } else {
      setAdmins([...admins, adminForm]);
      try {
        await fetch('/api/admins', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(adminForm)
        });
      } catch (error) {
        console.error('Error adding admin:', error);
      }
    }
    setShowModal(false);
  };

  const filteredAdmins = admins.filter(a => 
    a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center gap-4 no-print">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search administrators..." 
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 bg-white"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          onClick={handleOpenAdd}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus size={18} /> Register Admin
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 font-medium uppercase tracking-wider">Name</th>
              <th className="px-6 py-4 font-medium uppercase tracking-wider">Username</th>
              <th className="px-6 py-4 font-medium uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredAdmins.map(admin => (
              <tr key={admin.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold">
                      {admin.name.charAt(0)}
                    </div>
                    <span className="font-medium text-slate-800">{admin.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-slate-600 font-mono">{admin.username}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => handleOpenEdit(admin)} className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors"><Edit size={16} /></button>
                    {admins.length > 1 && (
                      <button onClick={() => setShowDeleteConfirm(admin.id)} className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"><Trash2 size={16} /></button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Unregister Admin</h3>
            <p className="text-slate-600 mb-6">Are you sure you want to remove this administrator? This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowDeleteConfirm(null)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
              <button onClick={() => handleDelete(showDeleteConfirm)} className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors">Remove</button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-slate-800 mb-6">{editingAdmin ? 'Edit Administrator' : 'Register New Admin'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <input 
                  type="text" 
                  required
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:border-blue-500" 
                  value={adminForm.name} 
                  onChange={e => setAdminForm({...adminForm, name: e.target.value})} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Username (Login ID)</label>
                <input 
                  type="text" 
                  required
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:border-blue-500 font-mono" 
                  value={adminForm.username} 
                  onChange={e => setAdminForm({...adminForm, username: e.target.value.toLowerCase()})} 
                />
              </div>

              <div className="flex justify-end gap-3 mt-8">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">Save Details</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 px-6 py-3 text-sm font-medium transition-colors ${
        active ? 'bg-blue-900 text-white border-r-4 border-blue-400' : 'text-blue-200 hover:bg-blue-900/50 hover:text-white'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

// --- Tabs Implementation ---

function StudentsTab({ students, setStudents, setResults, classes }: { students: Student[], setStudents: any, setResults?: React.Dispatch<React.SetStateAction<ExamResult[]>>, classes: ClassGroup[] }) {
  const [showModal, setShowModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [studentForm, setStudentForm] = useState({ id: '', name: '', classId: '', canTakeExam: true });
  const [searchTerm, setSearchTerm] = useState('');

  const handleOpenAdd = () => {
    setEditingStudent(null);
    setStudentForm({ id: '', name: '', classId: '', canTakeExam: true });
    setShowModal(true);
  };

  const handleOpenEdit = (s: Student) => {
    setEditingStudent(s);
    setStudentForm({ ...s });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    setStudents(students.filter(s => s.id !== id));
    setShowDeleteConfirm(null);
    try {
      await fetch(`/api/students/${id}`, { method: 'DELETE' });
    } catch (error) {
      console.error('Error deleting student:', error);
    }
  };

  const togglePermission = async (id: string) => {
    const student = students.find(s => s.id === id);
    if (!student) return;
    const newPermission = !student.canTakeExam;
    
    setStudents(students.map(s => s.id === id ? { ...s, canTakeExam: newPermission } : s));
    
    try {
      await fetch(`/api/students/${id}/permission`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ canTakeExam: newPermission })
      });
    } catch (error) {
      console.error('Error updating permission:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newId = studentForm.id.trim();
    const newName = studentForm.name.trim();
    if (!newId || !newName) return;

    const payload = { ...studentForm, id: newId, name: newName };

    // Never allow two students to share the same ID
    const duplicate = students.some(s => s.id === newId && s.id !== editingStudent?.id);
    if (duplicate) {
      alert(`Student ID "${newId}" is already registered to another student.`);
      return;
    }

    if (editingStudent) {
      const oldId = editingStudent.id;
      try {
        // Save to the database first, so the screen never shows a change that failed to save
        const res = await fetch(`/api/students/${encodeURIComponent(oldId)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          alert(err.error || 'Failed to update the student. Please try again.');
          return;
        }
      } catch (error) {
        console.error('Error updating student:', error);
        alert('Could not reach the server. The student was not updated.');
        return;
      }

      setStudents(students.map(s => s.id === oldId ? { ...s, ...payload } : s));
      // Keep the exam results in sync with the new ID / name
      setResults?.(prev => prev.map(r => r.studentId === oldId ? { ...r, studentId: newId, studentName: newName } : r));
    } else {
      try {
        const res = await fetch('/api/students', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          alert(err.error || 'Failed to add the student. Please try again.');
          return;
        }
      } catch (error) {
        console.error('Error adding student:', error);
        alert('Could not reach the server. The student was not added.');
        return;
      }
      setStudents([...students, payload]);
    }

    setShowModal(false);
    setStudentForm({ id: '', name: '', classId: '', canTakeExam: true });
  };

  // Alphabetize by name within each class section, and order sections by class name
  const classNameOf = (classId: string) => classes.find(c => c.id === classId)?.name || 'Unassigned';

  const filteredStudents = students.filter(s => {
    const term = searchTerm.toLowerCase();
    return (
      s.name.toLowerCase().includes(term) ||
      s.id.toLowerCase().includes(term) ||
      classNameOf(s.classId).toLowerCase().includes(term)
    );
  });

  const sortedStudents = [...filteredStudents].sort((a, b) => {
    const classCompare = classNameOf(a.classId).localeCompare(classNameOf(b.classId), undefined, { numeric: true, sensitivity: 'base' });
    if (classCompare !== 0) return classCompare;
    return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative">
      <div className="p-6 border-b border-slate-200 flex flex-wrap justify-between items-center gap-4 bg-slate-50">
        <h3 className="font-semibold text-slate-800">Registered Examinees</h3>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search by name, ID, or class..."
              className="w-64 pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 bg-white text-sm"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <button onClick={handleOpenAdd} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors whitespace-nowrap">
            <Plus size={16} /> Add Student
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 font-medium">Student ID</th>
              <th className="px-6 py-4 font-medium">Name</th>
              <th className="px-6 py-4 font-medium">Class</th>
              <th className="px-6 py-4 font-medium">Exam Permission</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedStudents.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-slate-400">
                  No students match your search.
                </td>
              </tr>
            )}
            {sortedStudents.map(student => (
              <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-mono text-slate-600">{student.id}</td>
                <td className="px-6 py-4 font-medium text-slate-800">{student.name}</td>
                <td className="px-6 py-4 text-slate-600">
                  {classes.find(c => c.id === student.classId)?.name || 'Unassigned'}
                </td>
                <td className="px-6 py-4">
                  <button 
                    onClick={() => togglePermission(student.id)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                      student.canTakeExam ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {student.canTakeExam ? <CheckCircle size={14} /> : <XCircle size={14} />}
                    {student.canTakeExam ? 'Allowed' : 'Denied'}
                  </button>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => handleOpenEdit(student)} className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors"><Edit size={16} /></button>
                    <button onClick={() => setShowDeleteConfirm(student.id)} className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Confirm Delete</h3>
            <p className="text-slate-600 mb-6">Are you sure you want to delete this student? This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowDeleteConfirm(null)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
              <button onClick={() => handleDelete(showDeleteConfirm)} className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-slate-800">{editingStudent ? 'Edit Student' : 'Add New Student'}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Student ID</label>
                <input required type="text" value={studentForm.id} onChange={e => setStudentForm({...studentForm, id: e.target.value})} className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none" />
                {editingStudent && (
                  <p className="text-xs text-slate-500 mt-1">Changing the ID also updates this student's exam results.</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <input required type="text" value={studentForm.name} onChange={e => setStudentForm({...studentForm, name: e.target.value})} className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Class</label>
                <select value={studentForm.classId} onChange={e => setStudentForm({...studentForm, classId: e.target.value})} className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none">
                  <option value="">Select a class...</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <input type="checkbox" id="canTakeExam" checked={studentForm.canTakeExam} onChange={e => setStudentForm({...studentForm, canTakeExam: e.target.checked})} className="rounded text-blue-600 focus:ring-blue-500" />
                <label htmlFor="canTakeExam" className="text-sm text-slate-700">Allow to take exam immediately</label>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">Save Student</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function QuestionsTab({ questions, setQuestions }: { questions: Question[], setQuestions: any }) {
  const [showModal, setShowModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [questionForm, setQuestionForm] = useState<Partial<Question>>({
    category: '', text: '', options: ['', '', '', ''], correctIndex: 0
  });

  const handleOpenAdd = () => {
    setEditingQuestion(null);
    setQuestionForm({ category: '', text: '', options: ['', '', '', ''], correctIndex: 0 });
    setShowModal(true);
  };

  const handleOpenEdit = (q: Question) => {
    setEditingQuestion(q);
    setQuestionForm({ ...q });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
    setShowDeleteConfirm(null);
    try {
      await fetch(`/api/questions/${id}`, { method: 'DELETE' });
    } catch (error) {
      console.error('Error deleting question:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionForm.text || !questionForm.category || questionForm.options?.some(o => !o)) return;
    
    if (editingQuestion) {
      const updated = { ...editingQuestion, ...questionForm } as Question;
      setQuestions(questions.map(q => q.id === updated.id ? updated : q));
      setShowModal(false);
      try {
        await fetch(`/api/questions/${updated.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updated)
        });
      } catch (error) {
        console.error('Error updating question:', error);
      }
    } else {
      const maxNum = questions.reduce((max, q) => {
        const num = parseInt(q.id.replace('q', ''), 10);
        return isNaN(num) ? max : Math.max(max, num);
      }, 0);
      const question: Question = {
        id: `q${maxNum + 1}`,
        category: questionForm.category!,
        text: questionForm.text!,
        options: questionForm.options!,
        correctIndex: questionForm.correctIndex!
      };
      
      setQuestions([...questions, question]);
      setShowModal(false);
      try {
        await fetch('/api/questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(question)
        });
      } catch (error) {
        console.error('Error adding question:', error);
      }
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative">
      <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
        <h3 className="font-semibold text-slate-800">Question Bank ({questions.length} total)</h3>
        <button onClick={handleOpenAdd} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
          <Plus size={16} /> Add Question
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 font-medium w-24">ID</th>
              <th className="px-6 py-4 font-medium w-32">Category</th>
              <th className="px-6 py-4 font-medium">Question Text</th>
              <th className="px-6 py-4 font-medium text-right w-24">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {questions.map(q => (
              <tr key={q.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 font-mono text-xs text-slate-500">{q.id}</td>
                <td className="px-6 py-4 text-slate-600"><span className="bg-slate-100 px-2 py-1 rounded text-xs">{q.category}</span></td>
                <td className="px-6 py-4 text-slate-800 line-clamp-2">{q.text}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => handleOpenEdit(q)} className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors"><Edit size={16} /></button>
                    <button onClick={() => setShowDeleteConfirm(q.id)} className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Confirm Delete</h3>
            <p className="text-slate-600 mb-6">Are you sure you want to delete this question? This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowDeleteConfirm(null)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
              <button onClick={() => handleDelete(showDeleteConfirm)} className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-slate-800">{editingQuestion ? 'Edit Question' : 'Add New Question'}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                  <input required type="text" placeholder="e.g., Navigation" value={questionForm.category} onChange={e => setQuestionForm({...questionForm, category: e.target.value})} className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Question Text</label>
                <textarea required rows={3} value={questionForm.text} onChange={e => setQuestionForm({...questionForm, text: e.target.value})} className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Options (Select the correct one)</label>
                <div className="space-y-3">
                  {[0, 1, 2, 3].map(index => (
                    <div key={index} className="flex items-center gap-3">
                      <input 
                        type="radio" 
                        name="correctOption" 
                        checked={questionForm.correctIndex === index}
                        onChange={() => setQuestionForm({...questionForm, correctIndex: index})}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                      <input 
                        required 
                        type="text" 
                        placeholder={`Option ${index + 1}`}
                        value={questionForm.options?.[index] || ''} 
                        onChange={e => {
                          const newOpts = [...(questionForm.options || ['', '', '', ''])];
                          newOpts[index] = e.target.value;
                          setQuestionForm({...questionForm, options: newOpts});
                        }} 
                        className={`flex-1 rounded-lg border px-3 py-2 focus:outline-none ${questionForm.correctIndex === index ? 'border-blue-500 bg-blue-50' : 'border-slate-300 focus:border-blue-500'}`} 
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">Save Question</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function ResultsTab({ results, students, classes }: { results: ExamResult[], students: Student[], classes: ClassGroup[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const handlePrint = () => {
    try {
      window.print();
    } catch (e) {
      alert("Please open the application in a new tab to use the print feature.");
    }
  };

  if (results.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
        <BarChart size={48} className="mx-auto text-slate-300 mb-4" />
        <h3 className="text-lg font-medium text-slate-800">No Exam Results Yet</h3>
        <p className="text-slate-500 mt-1">Results will appear here once students complete their assessments.</p>
      </div>
    );
  }

  const formatTime = (iso: string) => {
    if (!iso) return '—';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  };

  const formatDay = (iso: string) => {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return 'Unknown Date';
    return d.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  const dayKey = (iso: string) => {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return 'unknown';
    // Use LOCAL calendar date, not UTC — toISOString() shifts to UTC and can
    // push a late-night/early-morning local timestamp onto a different day
    // than what's actually shown to the user (e.g. 2:36 AM PHT was landing
    // in the previous UTC day, splitting same-day results into two tables).
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Classify students who took the exam on the same day, grouped per section (class) then per date
  const scheduleByClass = classes.map(cls => {
    const classStudents = students.filter(s => s.classId === cls.id);
    const classResults = results.filter(r => classStudents.some(cs => cs.id === r.studentId));

    const dateMap = new Map<string, ExamResult[]>();
    classResults.forEach(r => {
      const key = dayKey(r.startTime || r.date);
      if (!dateMap.has(key)) dateMap.set(key, []);
      dateMap.get(key)!.push(r);
    });

    const dateGroups = Array.from(dateMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key, recs]) => ({
        dateKey: key,
        dateLabel: formatDay(recs[0].startTime || recs[0].date),
        entries: recs.slice().sort((a, b) => {
          const at = new Date(a.startTime || a.date).getTime();
          const bt = new Date(b.startTime || b.date).getTime();
          return at - bt;
        })
      }));

    return { classInfo: cls, dateGroups };
  }).filter(group => group.dateGroups.length > 0);

  const classNameOfStudent = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    return student ? (classes.find(c => c.id === student.classId)?.name || 'Unassigned') : 'Unassigned';
  };

  const filteredResults = results.filter(r => {
    const term = searchTerm.toLowerCase();
    return (
      r.studentName.toLowerCase().includes(term) ||
      r.studentId.toLowerCase().includes(term) ||
      classNameOfStudent(r.studentId).toLowerCase().includes(term)
    );
  });

  const sortedResults = [...filteredResults].sort((a, b) => {
    const classCompare = classNameOfStudent(a.studentId).localeCompare(classNameOfStudent(b.studentId), undefined, { numeric: true, sensitivity: 'base' });
    if (classCompare !== 0) return classCompare;
    return a.studentName.localeCompare(b.studentName, undefined, { sensitivity: 'base' });
  });

  return (
    <div className="space-y-6">
      {/* Printable Area - rendered in a portal directly under <body> so it is NOT
          trapped inside the h-screen / overflow-hidden admin layout. This lets
          Chrome paginate it across as many pages as needed. */}
      {createPortal(
      <div id="print-root" className="hidden print:block bg-white">
        {/* Header - printed once for the whole report */}
        <div className="flex items-center justify-between mb-6 border-b-2 border-slate-900 pb-6">
          <div className="w-24 h-24 flex items-center justify-center">
            <img
              src="/images/marine.jpg"
              alt="ESTI Logo"
              className="max-w-full max-h-full object-contain"
            />
          </div>
          <div className="text-center flex-1">
            <h1 className="text-l font-bold text-slate-800 whitespace-nowrap uppercase">EDUCATIONAL SYSTEMS TECHNOLOGICAL INSTITUTE</h1>
            <p className="text-blue-900 text-sm">Murallon, Boac, Marinduque</p>
            <h2 className="text-lg font-semibold mt-4 text-slate-800 underline uppercase">Student Assessment Results Summary</h2>
          </div>
          <div className="w-24"></div> {/* Spacer for symmetry */}
        </div>

        {scheduleByClass.map((group, gi) => (
          <div
            key={group.classInfo.id}
            className={gi === 0 ? "" : "mt-10"}
          >
            {/* Class & Section field */}
            <div className="border border-slate-900 px-3 py-2 font-semibold text-slate-900" style={{ breakAfter: 'avoid' }}>
              Class &amp; Section: {group.classInfo.name}
            </div>

            {/* One results table per date taken within this section, flowing continuously down the page */}
            {group.dateGroups.map(dg => (
              <div key={dg.dateKey} className="mb-6" style={{ breakInside: 'avoid' }}>
                {/* Date Taken field */}
                <div className="px-1 py-3 font-semibold text-slate-900">
                  Date Taken: <span className="font-normal">{dg.dateLabel}</span>
                </div>

                <table className="w-full border-collapse border border-slate-900 text-sm" style={{ breakInside: 'avoid' }}>
                  <thead>
                    <tr>
                      <th className="border border-slate-900 px-3 py-2 text-left">No.</th>
                      <th className="border border-slate-900 px-3 py-2 text-left">Student Name</th>
                      <th className="border border-slate-900 px-3 py-2 text-left">Student ID</th>
                      <th className="border border-slate-900 px-3 py-2 text-left">Start Time</th>
                      <th className="border border-slate-900 px-3 py-2 text-left">End Time</th>
                      <th className="border border-slate-900 px-3 py-2 text-left">Score</th>
                      <th className="border border-slate-900 px-3 py-2 text-left">Percentage</th>
                      <th className="border border-slate-900 px-3 py-2 text-left">Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dg.entries.map((r, i) => {
                      const percentage = Math.round((r.score / r.total) * 100);
                      const passed = percentage >= 75;
                      return (
                        <tr key={r.id}>
                          <td className="border border-slate-900 px-3 py-2">{i + 1}</td>
                          <td className="border border-slate-900 px-3 py-2">{r.studentName}</td>
                          <td className="border border-slate-900 px-3 py-2 font-mono">{r.studentId}</td>
                          <td className="border border-slate-900 px-3 py-2">{formatTime(r.startTime)}</td>
                          <td className="border border-slate-900 px-3 py-2">{formatTime(r.date)}</td>
                          <td className="border border-slate-900 px-3 py-2">{r.score} / {r.total}</td>
                          <td className="border border-slate-900 px-3 py-2 font-bold">{percentage}%</td>
                          <td className={`border border-slate-900 px-3 py-2 font-bold ${passed ? 'text-green-700' : 'text-red-700'}`}>
                            {passed ? 'PASSED' : 'FAILED'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        ))}

        {/* Signatures - printed once for the whole report, always as a footer */}
        <div className="mt-16 flex justify-between px-4" style={{ breakInside: 'avoid' }}>
          <div className="text-center">
            <p className="font-bold">Prepared by:</p>
            <div className="mt-10 border-t border-slate-900 w-56"></div>
          </div>
          <div className="text-center">
            <p className="font-bold">Approved by:</p>
            <div className="mt-10 border-t border-slate-900 w-56"></div>
          </div>
        </div>
      </div>,
      document.body
      )}

      {/* Screen UI */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 bg-slate-50 flex flex-wrap justify-between items-center gap-4 no-print">
          <div>
            <h3 className="font-semibold text-slate-800">Student Exam Results</h3>
            <p className="text-xs text-slate-500 mt-1">Tip: Open in a new tab for the best printing experience.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Search by name, ID, or class..."
                className="w-64 pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 bg-white text-sm"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <button 
              onClick={handlePrint}
              className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-900 transition-colors shadow-sm whitespace-nowrap"
            >
              <Printer size={16} /> Print Results Report
            </button>
          </div>
        </div>
        <div className="overflow-x-auto no-print">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-medium">No.</th>
                <th className="px-6 py-4 font-medium">Student ID</th>
                <th className="px-6 py-4 font-medium">Student Name</th>
                <th className="px-6 py-4 font-medium">Class Section</th>
                <th className="px-6 py-4 font-medium">Date Taken</th>
                <th className="px-6 py-4 font-medium">Start Time</th>
                <th className="px-6 py-4 font-medium">End Time</th>
                <th className="px-6 py-4 font-medium">Score</th>
                <th className="px-6 py-4 font-medium">Percentage</th>
                <th className="px-6 py-4 font-medium">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedResults.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-6 py-10 text-center text-slate-400">
                    No results match your search.
                  </td>
                </tr>
              )}
              {sortedResults.map((r, i) => {
                const percentage = Math.round((r.score / r.total) * 100);
                const passed = percentage >= 75;
                return (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-slate-500">{i + 1}</td>
                    <td className="px-6 py-4 font-mono text-slate-600">{r.studentId}</td>
                    <td className="px-6 py-4 font-medium text-slate-800">{r.studentName}</td>
                    <td className="px-6 py-4 text-slate-600">{classNameOfStudent(r.studentId)}</td>
                    <td className="px-6 py-4 text-slate-500">{formatDay(r.startTime || r.date)}</td>
                    <td className="px-6 py-4 text-slate-500">{formatTime(r.startTime)}</td>
                    <td className="px-6 py-4 text-slate-500">{formatTime(r.date)}</td>
                    <td className="px-6 py-4 font-bold text-slate-700">{r.score} / {r.total}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-full bg-slate-200 rounded-full h-2 max-w-[100px]">
                          <div 
                            className={`h-2 rounded-full ${percentage >= 75 ? 'bg-green-500' : percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <span className="font-medium text-slate-700">{percentage}%</span>
                      </div>
                    </td>
                    <td className={`px-6 py-4 font-bold ${passed ? 'text-green-700' : 'text-red-700'}`}>
                      {passed ? 'PASSED' : 'FAILED'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ClassesTab({ classes, setClasses }: { classes: ClassGroup[], setClasses: any }) {
  const [showModal, setShowModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [editingClass, setEditingClass] = useState<ClassGroup | null>(null);
  const [classForm, setClassForm] = useState({ id: '', name: '' });

  const handleOpenAdd = () => {
    setEditingClass(null);
    setClassForm({ id: '', name: '' });
    setShowModal(true);
  };

  const handleOpenEdit = (c: ClassGroup) => {
    setEditingClass(c);
    setClassForm({ ...c });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    setClasses(classes.filter(c => c.id !== id));
    setShowDeleteConfirm(null);
    try {
      await fetch(`/api/classes/${id}`, { method: 'DELETE' });
    } catch (error) {
      console.error('Error deleting class:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classForm.id || !classForm.name) return;
    
    if (editingClass) {
      setClasses(classes.map(c => c.id === editingClass.id ? { ...editingClass, ...classForm } : c));
      setShowModal(false);
      try {
        await fetch(`/api/classes/${editingClass.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(classForm)
        });
      } catch (error) {
        console.error('Error updating class:', error);
      }
    } else {
      setClasses([...classes, classForm]);
      setShowModal(false);
      try {
        await fetch('/api/classes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(classForm)
        });
      } catch (error) {
        console.error('Error adding class:', error);
      }
    }
    
    setClassForm({ id: '', name: '' });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden max-w-3xl relative">
      <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
        <h3 className="font-semibold text-slate-800">Class Lists</h3>
        <button onClick={handleOpenAdd} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
          <Plus size={16} /> Add Class
        </button>
      </div>
      <div className="p-6">
        <div className="grid gap-4">
          {classes.map(c => (
            <div key={c.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:border-blue-300 transition-colors">
              <div className="flex items-center gap-4">
                <div className="bg-blue-100 text-blue-700 p-2 rounded-lg">
                  <BookOpen size={20} />
                </div>
                <div>
                  <h4 className="font-medium text-slate-800">{c.name}</h4>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">ID: {c.id}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleOpenEdit(c)} className="p-2 text-slate-400 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 rounded transition-colors"><Edit size={16} /></button>
                <button onClick={() => setShowDeleteConfirm(c.id)} className="p-2 text-slate-400 hover:text-red-600 bg-slate-50 hover:bg-red-50 rounded transition-colors"><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Confirm Delete</h3>
            <p className="text-slate-600 mb-6">Are you sure you want to delete this class? Questions and students linked to this class may be affected.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowDeleteConfirm(null)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
              <button onClick={() => handleDelete(showDeleteConfirm)} className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-slate-800">{editingClass ? 'Edit Class' : 'Add New Class'}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Class ID</label>
                <input required type="text" disabled={!!editingClass} placeholder="e.g., c3" value={classForm.id} onChange={e => setClassForm({...classForm, id: e.target.value})} className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none disabled:bg-slate-100" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Class Name</label>
                <input required type="text" placeholder="e.g., BSMT 3-C" value={classForm.name} onChange={e => setClassForm({...classForm, name: e.target.value})} className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none" />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">Save Class</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}