'use client';

import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api/client';
import {
  Calendar,
  Plus,
  Trash2,
  Edit3,
  Clock,
  BookOpen,
  Users,
  Search,
  Filter,
  RefreshCw,
  Save,
  X,
  ChevronDown,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────

interface ClassItem  { id: string; name: string; code: string; numericOrder: number; sections: SectionItem[] }
interface SectionItem { id: string; name: string; }
interface SubjectItem { id: string; name: string; code: string; }
interface TeacherItem { id: string; firstName: string; lastName: string; employeeId: string; }
interface RoutineItem {
  id: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  roomNumber: string | null;
  class: { id: string; name: string };
  section: { id: string; name: string };
  subject: { id: string; name: string; code: string };
  teacher: { id: string; firstName: string; lastName: string };
}

const DAYS = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
const DAY_LABELS: Record<string, string> = {
  SUNDAY: 'রবিবার', MONDAY: 'সোমবার', TUESDAY: 'মঙ্গলবার',
  WEDNESDAY: 'বুধবার', THURSDAY: 'বৃহস্পতিবার', FRIDAY: 'শুক্রবার', SATURDAY: 'শনিবার',
};
const DAY_COLORS: Record<string, string> = {
  SUNDAY: 'bg-rose-500/10 text-rose-600 border-rose-200',
  MONDAY: 'bg-blue-500/10 text-blue-600 border-blue-200',
  TUESDAY: 'bg-violet-500/10 text-violet-600 border-violet-200',
  WEDNESDAY: 'bg-emerald-500/10 text-emerald-600 border-emerald-200',
  THURSDAY: 'bg-amber-500/10 text-amber-600 border-amber-200',
  FRIDAY: 'bg-red-500/10 text-red-600 border-red-200',
  SATURDAY: 'bg-slate-500/10 text-slate-600 border-slate-200',
};

// ─── Modal ────────────────────────────────────────────────────────────────

function RoutineModal({
  open, onClose, onSave, editing,
  classes, subjects, teachers,
}: {
  open: boolean; onClose: () => void; onSave: (data: any) => void; editing: RoutineItem | null;
  classes: ClassItem[]; subjects: SubjectItem[]; teachers: TeacherItem[];
}) {
  const [form, setForm] = useState({
    classId: '', sectionId: '', subjectId: '', teacherId: '',
    dayOfWeek: 'MONDAY', startTime: '08:00', endTime: '08:45', roomNumber: '',
  });
  const [saving, setSaving] = useState(false);

  const selectedClass = classes.find(c => c.id === form.classId);

  useEffect(() => {
    if (editing) {
      setForm({
        classId: editing.class.id, sectionId: editing.section.id,
        subjectId: editing.subject.id, teacherId: editing.teacher.id,
        dayOfWeek: editing.dayOfWeek, startTime: editing.startTime,
        endTime: editing.endTime, roomNumber: editing.roomNumber || '',
      });
    } else {
      setForm({ classId: '', sectionId: '', subjectId: '', teacherId: '', dayOfWeek: 'MONDAY', startTime: '08:00', endTime: '08:45', roomNumber: '' });
    }
  }, [editing, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try { await onSave(form); } finally { setSaving(false); }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border p-5">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-base font-bold">{editing ? 'রুটিন সম্পাদনা' : 'নতুন রুটিন যোগ'}</h2>
              <p className="text-xs text-muted-foreground">ক্লাস রুটিন এন্ট্রি</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-muted transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {/* Class */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">শ্রেণী</label>
              <select
                required value={form.classId}
                onChange={e => setForm(f => ({ ...f, classId: e.target.value, sectionId: '' }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">-- শ্রেণী বেছে নিন --</option>
                {classes.sort((a,b) => a.numericOrder - b.numericOrder).map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            {/* Section */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">সেকশন</label>
              <select
                required value={form.sectionId}
                onChange={e => setForm(f => ({ ...f, sectionId: e.target.value }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                disabled={!form.classId}
              >
                <option value="">-- সেকশন --</option>
                {(selectedClass?.sections || []).map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Subject */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">বিষয়</label>
            <select
              required value={form.subjectId}
              onChange={e => setForm(f => ({ ...f, subjectId: e.target.value }))}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">-- বিষয় বেছে নিন --</option>
              {subjects.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
              ))}
            </select>
          </div>

          {/* Teacher */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">শিক্ষক</label>
            <select
              required value={form.teacherId}
              onChange={e => setForm(f => ({ ...f, teacherId: e.target.value }))}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">-- শিক্ষক বেছে নিন --</option>
              {teachers.map(t => (
                <option key={t.id} value={t.id}>{t.firstName} {t.lastName} ({t.employeeId})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {/* Day */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">দিন</label>
              <select
                required value={form.dayOfWeek}
                onChange={e => setForm(f => ({ ...f, dayOfWeek: e.target.value }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {DAYS.map(d => <option key={d} value={d}>{DAY_LABELS[d]}</option>)}
              </select>
            </div>
            {/* Start */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">শুরু</label>
              <input
                type="time" required value={form.startTime}
                onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            {/* End */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">শেষ</label>
              <input
                type="time" required value={form.endTime}
                onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          {/* Room */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">রুম নম্বর (ঐচ্ছিক)</label>
            <input
              type="text" value={form.roomNumber} placeholder="যেমন: 101, Science Lab"
              onChange={e => setForm(f => ({ ...f, roomNumber: e.target.value }))}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 rounded-xl border border-border py-2.5 text-xs font-semibold text-muted-foreground hover:bg-muted transition-colors">
              বাতিল
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-60">
              <Save className="h-3.5 w-3.5" />
              {saving ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────

export default function AdminRoutinePage() {
  const [routines, setRoutines] = useState<RoutineItem[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [filterClass, setFilterClass] = useState('');
  const [filterSection, setFilterSection] = useState('');
  const [filterDay, setFilterDay] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<RoutineItem | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Active academic year (from a simple state or localStorage)
  const [academicYearId, setAcademicYearId] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [classRes, subRes, teacherRes, yearRes, routineRes] = await Promise.all([
        apiClient.get('/academics/classes?includeSubjects=false&includeSections=true'),
        apiClient.get('/academics/subjects'),
        apiClient.get('/teachers'),
        apiClient.get('/academics/academic-years/current'),
        apiClient.get('/academics/routines').catch(() => ({ data: { data: [] } })),
      ]);

      setClasses(classRes.data?.data || classRes.data || []);
      setSubjects(subRes.data?.data || subRes.data || []);
      setTeachers(teacherRes.data?.data?.teachers || teacherRes.data?.data || teacherRes.data || []);
      const yearData = yearRes.data?.data || yearRes.data;
      if (yearData?.id) setAcademicYearId(yearData.id);
      setRoutines(routineRes.data?.data || routineRes.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'ডেটা লোড করতে সমস্যা হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (formData: any) => {
    try {
      const payload = { ...formData, academicYearId };
      if (editing) {
        await apiClient.put(`/academics/routines/${editing.id}`, payload);
      } else {
        await apiClient.post('/academics/routines', payload);
      }
      setModalOpen(false);
      setEditing(null);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'সংরক্ষণ করতে সমস্যা হয়েছে');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('এই রুটিন এন্ট্রি মুছে ফেলতে চান?')) return;
    try {
      await apiClient.delete(`/academics/routines/${id}`);
      loadData();
    } catch (err: any) {
      alert('মুছতে সমস্যা হয়েছে: ' + (err.response?.data?.message || err.message));
    }
  };

  // ── Filtering ─────────────────────────────────────────────────────────────
  const filteredClass = classes.find(c => c.id === filterClass);
  const filtered = routines.filter(r => {
    if (filterClass && r.class.id !== filterClass) return false;
    if (filterSection && r.section.id !== filterSection) return false;
    if (filterDay && r.dayOfWeek !== filterDay) return false;
    return true;
  });

  // Group by day
  const groupedByDay = DAYS.reduce((acc, day) => {
    acc[day] = filtered.filter(r => r.dayOfWeek === day);
    return acc;
  }, {} as Record<string, RoutineItem[]>);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">ক্লাস রুটিন</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            সাপ্তাহিক ক্লাস সময়সূচী পরিচালনা করুন
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadData}
            className="flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted transition-colors">
            <RefreshCw className="h-3.5 w-3.5" />
            রিফ্রেশ
          </button>
          <button
            onClick={() => { setEditing(null); setModalOpen(true); }}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm">
            <Plus className="h-4 w-4" />
            নতুন রুটিন যোগ
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-4">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <select value={filterClass}
          onChange={e => { setFilterClass(e.target.value); setFilterSection(''); }}
          className="rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/30">
          <option value="">সব শ্রেণী</option>
          {classes.sort((a,b) => a.numericOrder - b.numericOrder).map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select value={filterSection} onChange={e => setFilterSection(e.target.value)}
          disabled={!filterClass}
          className="rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50">
          <option value="">সব সেকশন</option>
          {(filteredClass?.sections || []).map(s => (
            <option key={s.id} value={s.id}>সেকশন {s.name}</option>
          ))}
        </select>
        <select value={filterDay} onChange={e => setFilterDay(e.target.value)}
          className="rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/30">
          <option value="">সব দিন</option>
          {DAYS.map(d => <option key={d} value={d}>{DAY_LABELS[d]}</option>)}
        </select>
        {(filterClass || filterSection || filterDay) && (
          <button onClick={() => { setFilterClass(''); setFilterSection(''); setFilterDay(''); }}
            className="flex items-center gap-1.5 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive hover:bg-destructive/20 transition-colors">
            <X className="h-3 w-3" /> ফিল্টার মুছুন
          </button>
        )}
        <span className="ml-auto text-xs text-muted-foreground">
          মোট {filtered.length}টি এন্ট্রি
        </span>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          ⚠️ {error}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">রুটিন লোড হচ্ছে...</p>
          </div>
        </div>
      ) : (
        <>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border py-20 text-center">
              <Calendar className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <p className="text-base font-semibold text-muted-foreground">কোনো রুটিন পাওয়া যায়নি</p>
              <p className="text-sm text-muted-foreground/70 mt-1">নতুন রুটিন যোগ করতে উপরের বাটনে ক্লিক করুন</p>
              <button onClick={() => { setEditing(null); setModalOpen(true); }}
                className="mt-4 flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
                <Plus className="h-4 w-4" /> প্রথম রুটিন যোগ করুন
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {DAYS.map(day => {
                const dayRoutines = groupedByDay[day];
                if (dayRoutines.length === 0 && filterDay && filterDay !== day) return null;
                if (dayRoutines.length === 0 && !filterDay) return null;

                return (
                  <div key={day} className="rounded-2xl border border-border bg-card overflow-hidden">
                    {/* Day Header */}
                    <div className={`flex items-center gap-3 px-5 py-3 border-b border-border ${DAY_COLORS[day]}`}>
                      <Calendar className="h-4 w-4" />
                      <span className="text-sm font-bold">{DAY_LABELS[day]}</span>
                      <span className="ml-auto text-xs font-semibold opacity-70">{dayRoutines.length}টি পিরিয়ড</span>
                    </div>
                    {/* Routine Rows */}
                    <div className="divide-y divide-border">
                      {dayRoutines
                        .sort((a, b) => a.startTime.localeCompare(b.startTime))
                        .map(r => (
                          <div key={r.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/30 transition-colors group">
                            {/* Time */}
                            <div className="flex items-center gap-1.5 w-28 shrink-0">
                              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="text-xs font-mono font-semibold">{r.startTime}–{r.endTime}</span>
                            </div>
                            {/* Subject */}
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                <BookOpen className="h-3.5 w-3.5 text-primary" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold truncate">{r.subject.name}</p>
                                <p className="text-[10px] text-muted-foreground">{r.subject.code}</p>
                              </div>
                            </div>
                            {/* Class & Section */}
                            <div className="hidden sm:flex items-center gap-2 w-32 shrink-0">
                              <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-semibold">{r.class.name}</span>
                              <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-semibold">সেকশন {r.section.name}</span>
                            </div>
                            {/* Teacher */}
                            <div className="hidden md:flex items-center gap-1.5 w-36 shrink-0">
                              <Users className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                              <span className="text-xs text-muted-foreground truncate">{r.teacher.firstName} {r.teacher.lastName}</span>
                            </div>
                            {/* Room */}
                            {r.roomNumber && (
                              <span className="hidden lg:block text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-md shrink-0">
                                🏫 {r.roomNumber}
                              </span>
                            )}
                            {/* Actions */}
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                              <button onClick={() => { setEditing(r); setModalOpen(true); }}
                                className="rounded-lg p-1.5 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors">
                                <Edit3 className="h-3.5 w-3.5" />
                              </button>
                              <button onClick={() => handleDelete(r.id)}
                                className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors">
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Modal */}
      <RoutineModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        onSave={handleSave}
        editing={editing}
        classes={classes}
        subjects={subjects}
        teachers={teachers}
      />
    </div>
  );
}
