'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/cn';

export interface TerminalRun {
  command: string;
  /** "111 hackathons open" */
  summary: string;
  rows: { title: string; where: string; when: string }[];
}

const reduced = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function Chrome({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2 border-b border-white/10 px-3.5 py-2.5">
      <span className="flex gap-1.5" aria-hidden="true">
        <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
      </span>
      <span className="ml-1 font-mono text-[11px] text-white/45">{title}</span>
    </div>
  );
}

const pad = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s.padEnd(n, ' '));

/** A terminal that types a search and prints real results, then the next search, forever. */
export function HeroTerminal({ runs, className }: { runs: TerminalRun[]; className?: string }) {
  const [run, setRun] = useState(0);
  const [typed, setTyped] = useState(0);
  const [printed, setPrinted] = useState(0);
  const current = runs[run % runs.length];

  useEffect(() => {
    if (!current) return;
    if (reduced()) {
      setTyped(current.command.length);
      setPrinted(current.rows.length + 1);
      return;
    }
    let t: ReturnType<typeof setTimeout>;
    if (typed < current.command.length) t = setTimeout(() => setTyped((n) => n + 1), 45 + Math.random() * 50);
    else if (printed < current.rows.length + 1) t = setTimeout(() => setPrinted((n) => n + 1), printed === 0 ? 450 : 220);
    else
      t = setTimeout(() => {
        setRun((r) => r + 1);
        setTyped(0);
        setPrinted(0);
      }, 4200);
    return () => clearTimeout(t);
  }, [current, typed, printed]);

  if (!current) return null;
  const typing = typed < current.command.length;

  return (
    <div className={cn('overflow-hidden rounded-xl border border-white/10 bg-[#0d0e15]/85 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.9)] backdrop-blur-md', className)} aria-hidden="true">
      <Chrome title="zsh — hackathonfinder" />
      <div className="h-[178px] px-4 py-3 font-mono text-[12px] leading-[1.7] text-white/80">
        <p>
          <span className="text-[#4ade80]">➜</span> <span className="text-[#7dd3fc]">~</span> {current.command.slice(0, typed)}
          {(typing || printed === current.rows.length + 1) && <span className="ml-px inline-block h-[13px] w-[7px] translate-y-[2px] animate-pulse bg-white/80" />}
        </p>
        {printed > 0 && (
          <p className="text-[#4ade80]">
            ✓ <span className="text-white/85">{current.summary}</span>
          </p>
        )}
        {current.rows.slice(0, Math.max(0, printed - 1)).map((r) => (
          <p key={r.title} className="whitespace-pre text-white/60">
            <span className="text-[#a5a3ff]">→</span> <span className="text-white/90">{pad(r.title, 22)}</span> {pad(r.where, 10)}{' '}
            <span className="text-[#fcd34d]">{r.when}</span>
          </p>
        ))}
      </div>
    </div>
  );
}

// A tiny snippet about what the site does, as syntax-highlighted tokens: [text, colour class].
const CODE: [string, string][][] = [
  [['// find your squad for this weekend', 'text-white/35']],
  [['const ', 'text-[#c4b5fd]'], ['event', 'text-white/90'], [' = ', 'text-white/50'], ['await ', 'text-[#c4b5fd]'], ['hackathons', 'text-white/90'], ['.', 'text-white/50'], ['next', 'text-[#7dd3fc]'], ['({ ', 'text-white/50'], ['city', 'text-white/90'], [': ', 'text-white/50'], ["'pune'", 'text-[#86efac]'], [' })', 'text-white/50']],
  [['const ', 'text-[#c4b5fd]'], ['team', 'text-white/90'], [' = ', 'text-white/50'], ['await ', 'text-[#c4b5fd]'], ['teamFinder', 'text-white/90'], ['.', 'text-white/50'], ['match', 'text-[#7dd3fc]'], ['({', 'text-white/50']],
  [['  need', 'text-white/90'], [': [', 'text-white/50'], ["'frontend'", 'text-[#86efac]'], [', ', 'text-white/50'], ["'ml'", 'text-[#86efac]'], ['],', 'text-white/50']],
  [['})', 'text-white/50']],
  [['await ', 'text-[#c4b5fd]'], ['team', 'text-white/90'], ['.', 'text-white/50'], ['build', 'text-[#7dd3fc]'], ['(', 'text-white/50'], ['event', 'text-white/90'], [')', 'text-white/50'], ['  // ship it', 'text-white/35']],
];
const CODE_LENGTH = CODE.reduce((n, line) => n + line.reduce((m, [t]) => m + t.length, 0) + 1, 0);

/** A code editor typing the snippet above, pausing, and starting over. */
export function HeroEditor({ className }: { className?: string }) {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (reduced()) {
      setShown(CODE_LENGTH);
      return;
    }
    const done = shown >= CODE_LENGTH;
    const t = setTimeout(() => setShown(done ? 0 : shown + 1), done ? 3800 : 28 + Math.random() * 40);
    return () => clearTimeout(t);
  }, [shown]);

  let left = shown;
  return (
    <div className={cn('overflow-hidden rounded-xl border border-white/10 bg-[#0d0e15]/85 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.9)] backdrop-blur-md', className)} aria-hidden="true">
      <Chrome title="team.ts" />
      <div className="h-[178px] py-3 font-mono text-[12px] leading-[1.7]">
        {CODE.map((line, i) => {
          if (left <= 0) return null;
          const cursorHere = left <= line.reduce((m, [t]) => m + t.length, 0) + 1;
          const parts = line.map(([text, cls], j) => {
            const take = Math.max(0, Math.min(text.length, left));
            left -= take;
            return take ? (
              <span key={j} className={cls}>
                {text.slice(0, take)}
              </span>
            ) : null;
          });
          left -= 1;
          return (
            <p key={i} className="flex whitespace-pre pr-4">
              <span className="w-8 shrink-0 select-none pr-3 text-right text-white/20">{i + 1}</span>
              <span>
                {parts}
                {cursorHere && <span className="ml-px inline-block h-[13px] w-[2px] translate-y-[2px] animate-pulse bg-[#a5a3ff]" />}
              </span>
            </p>
          );
        })}
      </div>
    </div>
  );
}
