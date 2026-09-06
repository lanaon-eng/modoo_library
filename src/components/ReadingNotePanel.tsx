import { useState, useMemo } from 'react';
import { StickyNote, Plus, X, Trash2, Quote, HelpCircle, Lightbulb, Puzzle } from 'lucide-react';
import type { ReadingNote, NoteType } from '@/types';

type Props = {
  notes: ReadingNote[];
  onAdd: (content: string, noteType: NoteType) => void;
  onDelete: (id: string) => void;
};

const NOTE_TYPES: { id: NoteType; label: string; icon: typeof Quote; color: string; bg: string; border: string }[] = [
  { id: 'quote', label: '인용', icon: Quote, color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
  { id: 'question', label: '질문', icon: HelpCircle, color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
  { id: 'thought', label: '생각', icon: Lightbulb, color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  { id: 'puzzle', label: '의아함', icon: Puzzle, color: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200' },
];

function getTypeMeta(type: NoteType) {
  return NOTE_TYPES.find((t) => t.id === type) ?? NOTE_TYPES[2];
}

function formatDate(ts: number) {
  const d = new Date(ts);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${month}/${day} ${hh}:${mm}`;
}

export function ReadingNotePanel({ notes, onAdd, onDelete }: Props) {
  const [adding, setAdding] = useState(false);
  const [content, setContent] = useState('');
  const [selectedType, setSelectedType] = useState<NoteType>('thought');

  const groupedByDate = useMemo(() => {
    const groups: Record<string, ReadingNote[]> = {};
    for (const note of notes) {
      const d = new Date(note.createdAt);
      const key = `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(note);
    }
    return Object.entries(groups);
  }, [notes]);

  const handleAdd = () => {
    if (!content.trim()) return;
    onAdd(content, selectedType);
    setContent('');
    setSelectedType('thought');
    setAdding(false);
  };

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pb-2 pt-1">
        <div className="flex items-center gap-1.5">
          <StickyNote size={16} className="text-brand-500" />
          <span className="text-[13px] font-bold">읽기 노트</span>
          {notes.length > 0 && (
            <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              {notes.length}
            </span>
          )}
        </div>
        <button
          onClick={() => setAdding(!adding)}
          className="flex items-center gap-0.5 rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-bold text-brand-600 transition-colors hover:bg-brand-100 dark:bg-brand-900/20 dark:text-brand-400"
        >
          {adding ? <X size={13} /> : <Plus size={13} />}
          {adding ? '취소' : '메모 추가'}
        </button>
      </div>

      {/* Add form */}
      {adding && (
        <div className="mx-4 mb-3 animate-slide-up rounded-2xl border border-slate-200 bg-white p-3 shadow-card dark:border-slate-700 dark:bg-slate-900">
          <div className="mb-2 flex flex-wrap gap-1.5">
            {NOTE_TYPES.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => setSelectedType(t.id)}
                  className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold transition-all ${
                    selectedType === t.id
                      ? `${t.bg} ${t.color} border ${t.border}`
                      : 'bg-slate-50 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                  }`}
                >
                  <Icon size={12} />
                  {t.label}
                </button>
              );
            })}
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="의미 있는 문장, 떠오르는 생각, 질문을 적어보세요"
            rows={3}
            maxLength={300}
            autoFocus
            className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-[13px] font-medium outline-none transition-colors focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800 dark:focus:bg-slate-900"
          />
          <div className="mt-2 flex items-center justify-between">
            <span className="text-[10px] text-slate-400">{content.length}/300</span>
            <button
              onClick={handleAdd}
              disabled={!content.trim()}
              className="rounded-lg bg-gradient-to-tr from-brand-600 to-brand-500 px-4 py-1.5 text-[12px] font-bold text-white transition-all hover:from-brand-700 hover:to-brand-600 active:scale-95 disabled:opacity-40"
            >
              저장
            </button>
          </div>
        </div>
      )}

      {/* Notes list grouped by date */}
      <div className="px-4 pb-32">
        {notes.length === 0 && !adding ? (
          <div className="flex flex-col items-center justify-center gap-2 py-10 text-slate-300 dark:text-slate-600">
            <StickyNote size={32} strokeWidth={1.5} />
            <p className="text-[12px] font-medium">책을 읽으며 메모를 남겨보세요</p>
            <p className="text-[11px] text-slate-400">AI가 메모를 바탕으로 더 깊은 질문을 드려요</p>
          </div>
        ) : (
          <div className="space-y-4">
            {groupedByDate.map(([date, dateNotes]) => (
              <div key={date}>
                <p className="mb-1.5 text-[10px] font-bold text-slate-400">{date}</p>
                <div className="space-y-2">
                  {dateNotes.map((note) => {
                    const meta = getTypeMeta(note.noteType);
                    const Icon = meta.icon;
                    return (
                      <div
                        key={note.id}
                        className={`group relative rounded-xl border ${meta.border} ${meta.bg} p-3 transition-shadow hover:shadow-card dark:${meta.border.replace('border-', 'border-')} dark:${meta.bg.replace('bg-', 'bg-')}`}
                      >
                        <div className="flex items-start gap-2">
                          <Icon size={14} className={`mt-0.5 shrink-0 ${meta.color}`} />
                          <p className="flex-1 break-words text-[12.5px] font-medium leading-relaxed text-slate-700 dark:text-slate-200">
                            {note.content}
                          </p>
                          <button
                            onClick={() => onDelete(note.id)}
                            aria-label="메모 삭제"
                            className="shrink-0 text-slate-300 opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100 dark:text-slate-600"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                        <p className="mt-1.5 pl-6 text-[10px] text-slate-400">
                          {meta.label} · {formatDate(note.createdAt)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
