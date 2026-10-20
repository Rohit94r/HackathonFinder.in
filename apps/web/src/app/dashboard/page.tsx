'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  agents,
  categoryName,
  sampleNews,
  sampleQueue,
  type QueueStatus,
} from '@hackathonfinder/shared';

type AgentStatus = 'Idle' | 'Running' | 'Done';

interface LogLine {
  time: string;
  agent: string;
  message: string;
}

// What each agent reports during the demo run.
const demoMessages: Record<string, string[]> = {
  finder: ['Scanned 6 sources, found 24 stories', 'Kept 8 after dedupe and relevance scoring'],
  research: ['Picked "Build or buy" (Decisions, relevance 92)', 'Collected 6 sources and 2 non-obvious angles'],
  writer: ['Drafted Decisions post in persona voice (820 words)'],
  'value-check': ['Rewrite 1 requested: opening is too generic', 'Passed on second draft: adds value to an executive'],
  seo: ['Title, meta description and slug written', 'Added 3 internal links to related posts'],
  scheduler: ['Scheduled website post for Thu 22 Oct, 09:00', 'Scheduled LinkedIn post for Thu 22 Oct, 13:00'],
  publisher: ['Website post queued', 'LinkedIn version ready to post'],
};

const STEP_MS = 900;

const queueStyles: Record<QueueStatus, { bg: string; color: string }> = {
  Published: { bg: 'rgba(85,221,74,0.15)', color: '#2f7a28' },
  Scheduled: { bg: 'rgba(18,35,21,0.08)', color: '#122315' },
  'In review': { bg: 'rgba(255,214,0,0.2)', color: '#7a6400' },
};

function idleStatuses(): Record<string, AgentStatus> {
  return Object.fromEntries(agents.map((a) => [a.id, 'Idle' as AgentStatus]));
}

function timestamp() {
  return new Date().toLocaleTimeString('en-GB', { hour12: false });
}

export default function DashboardPage() {
  const [statuses, setStatuses] = useState<Record<string, AgentStatus>>(idleStatuses);
  const [log, setLog] = useState<LogLine[]>([]);
  const [running, setRunning] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    return () => timers.current.forEach(clearTimeout);
  }, []);

  const runPipeline = () => {
    if (running) return;
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setStatuses(idleStatuses());
    setLog([]);
    setRunning(true);

    let delay = 0;
    agents.forEach((agent) => {
      timers.current.push(
        setTimeout(() => setStatuses((prev) => ({ ...prev, [agent.id]: 'Running' })), delay)
      );
      for (const message of demoMessages[agent.id] ?? []) {
        delay += STEP_MS;
        timers.current.push(
          setTimeout(
            () => setLog((prev) => [...prev, { time: timestamp(), agent: agent.name, message }]),
            delay
          )
        );
      }
      timers.current.push(
        setTimeout(() => setStatuses((prev) => ({ ...prev, [agent.id]: 'Done' })), delay)
      );
    });
    timers.current.push(setTimeout(() => setRunning(false), delay));
  };

  const doneCount = Object.values(statuses).filter((s) => s === 'Done').length;
  const stats = [
    { label: 'Topics found today', value: sampleNews.length },
    {
      label: 'Sent to writer',
      value: sampleNews.filter((n) => n.status === 'Sent to writer').length,
    },
    { label: 'Scheduled posts', value: sampleQueue.filter((q) => q.status === 'Scheduled').length },
    { label: 'Published this week', value: sampleQueue.filter((q) => q.status === 'Published').length },
  ];

  const cardStyle: React.CSSProperties = {
    background: '#fff',
    borderRadius: '20px',
    border: '1px solid rgba(0,0,0,0.06)',
    boxShadow: '0 6px 20px rgba(0,0,0,0.03)',
  };

  return (
    <div className="body-home-page" style={{ background: '#f5f4ef' }}>
      <Navbar variant="off-white" />

      <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '60px 24px 30px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1
            className="heading-h2-black-centered"
            style={{ fontSize: 'clamp(44px, 6vw, 76px)', lineHeight: 1, marginBottom: '8px' }}
          >
            Agent
          </h1>
          <h1
            className="heading-h2-green-centered"
            style={{
              fontSize: 'clamp(44px, 6vw, 76px)',
              lineHeight: 1,
              marginBottom: '24px',
              color: '#39523c',
            }}
          >
            Dashboard
          </h1>
          <p
            className="paragraph-black-centered"
            style={{ fontSize: '18px', maxWidth: '660px', margin: '0 auto 24px', color: '#555' }}
          >
            Every agent, every run, every scheduled post in one place. Press run to watch a story go
            from the news feed to a published post.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={runPipeline}
              disabled={running}
              className="button-primary w-button"
              style={{ cursor: running ? 'wait' : 'pointer', opacity: running ? 0.7 : 1, border: 'none' }}
            >
              {running ? `Running… ${doneCount}/${agents.length}` : 'Run pipeline (demo)'}
            </button>
            <Link href="/news" className="button-secondary-light w-button">
              Open news feed
            </Link>
          </div>
        </div>

        <div
          style={{
            maxWidth: '760px',
            margin: '0 auto 40px',
            padding: '12px 18px',
            borderRadius: '12px',
            background: 'rgba(85,221,74,0.1)',
            border: '1px solid rgba(85,221,74,0.35)',
            fontSize: '14px',
            color: '#39523c',
            textAlign: 'center',
          }}
        >
          Demo mode with sample data. Connect your sources and channels to see live runs.
        </div>

        {/* Stats */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginBottom: '32px',
          }}
        >
          {stats.map((stat) => (
            <div key={stat.label} style={{ ...cardStyle, padding: '22px 24px' }}>
              <div
                style={{
                  fontFamily: 'Deacon, sans-serif',
                  fontWeight: 900,
                  fontSize: '36px',
                  lineHeight: 1,
                  color: '#122315',
                  marginBottom: '8px',
                }}
              >
                {stat.value}
              </div>
              <div style={{ fontSize: '14px', color: '#666' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Agents + Log */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: '24px',
            marginBottom: '32px',
            alignItems: 'start',
          }}
        >
          {/* Agent cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {agents.map((agent, i) => {
              const status = statuses[agent.id];
              const dotColor =
                status === 'Done' ? '#55dd4a' : status === 'Running' ? '#ffd600' : '#c4d7c7';
              return (
                <div
                  key={agent.id}
                  style={{
                    ...cardStyle,
                    padding: '18px 20px',
                    display: 'grid',
                    gridTemplateColumns: 'auto minmax(0, 1fr) auto',
                    gap: '16px',
                    alignItems: 'center',
                    borderColor: status === 'Running' ? '#55dd4a' : 'rgba(0,0,0,0.06)',
                    transition: 'border-color 0.2s ease',
                  }}
                >
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: '#122315',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '13px',
                      fontWeight: 700,
                    }}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, color: '#122315', fontSize: '16px' }}>
                      {agent.name}
                    </div>
                    <div style={{ fontSize: '13px', color: '#666', lineHeight: 1.5 }}>{agent.role}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, color: '#122315', whiteSpace: 'nowrap' }}>
                    <span
                      aria-hidden="true"
                      style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        background: dotColor,
                        boxShadow: status === 'Running' ? '0 0 0 4px rgba(255,214,0,0.25)' : 'none',
                      }}
                    />
                    {status}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Run log */}
          <div
            style={{
              background: '#122315',
              borderRadius: '20px',
              padding: '24px',
              color: '#fff',
              minHeight: '420px',
              position: 'sticky',
              top: '24px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
              }}
            >
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                  color: '#55dd4a',
                }}
              >
                Run log
              </span>
              <span style={{ fontSize: '12px', color: '#7c9480' }}>
                {log.length} {log.length === 1 ? 'event' : 'events'}
              </span>
            </div>
            {log.length === 0 ? (
              <p style={{ color: '#7c9480', fontSize: '14px', margin: 0 }}>
                No runs yet. Press “Run pipeline (demo)” to start.
              </p>
            ) : (
              <ol
                aria-live="polite"
                style={{
                  listStyle: 'none',
                  margin: 0,
                  padding: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
                  fontSize: '13px',
                  lineHeight: 1.5,
                }}
              >
                {log.map((line, i) => (
                  <li key={i} style={{ display: 'grid', gridTemplateColumns: 'auto minmax(0, 1fr)', gap: '12px' }}>
                    <span style={{ color: '#7c9480' }}>{line.time}</span>
                    <span>
                      <span style={{ color: '#55dd4a' }}>{line.agent}</span>{' '}
                      <span style={{ color: '#c4d7c7' }}>{line.message}</span>
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>

        {/* Publishing queue */}
        <div style={{ ...cardStyle, padding: '28px', marginBottom: '80px', overflowX: 'auto' }}>
          <h2
            style={{
              fontFamily: 'Graphik, sans-serif',
              fontSize: '22px',
              fontWeight: 600,
              color: '#122315',
              margin: '0 0 20px',
            }}
          >
            Publishing queue
          </h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', minWidth: '640px' }}>
            <thead>
              <tr style={{ textAlign: 'left', color: '#777' }}>
                <th style={{ padding: '10px 12px', fontWeight: 600 }}>Post</th>
                <th style={{ padding: '10px 12px', fontWeight: 600 }}>Category</th>
                <th style={{ padding: '10px 12px', fontWeight: 600 }}>Channel</th>
                <th style={{ padding: '10px 12px', fontWeight: 600 }}>Scheduled for</th>
                <th style={{ padding: '10px 12px', fontWeight: 600 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {sampleQueue.map((item) => {
                const badge = queueStyles[item.status];
                return (
                  <tr key={item.id} style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                    <td style={{ padding: '14px 12px', color: '#122315', fontWeight: 500 }}>{item.title}</td>
                    <td style={{ padding: '14px 12px', color: '#555' }}>{categoryName(item.category)}</td>
                    <td style={{ padding: '14px 12px', color: '#555' }}>{item.channel}</td>
                    <td style={{ padding: '14px 12px', color: '#555', whiteSpace: 'nowrap' }}>{item.scheduledFor}</td>
                    <td style={{ padding: '14px 12px' }}>
                      <span
                        style={{
                          padding: '4px 10px',
                          borderRadius: '999px',
                          background: badge.bg,
                          color: badge.color,
                          fontWeight: 600,
                          fontSize: '12px',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {item.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <Footer />
    </div>
  );
}
