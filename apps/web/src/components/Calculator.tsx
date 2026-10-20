'use client';

import React, { useState, useId } from 'react';
import Link from 'next/link';
import { siteConfig } from '@/data/siteConfig';

// Share of the work on each post that an agent takes over. The news finder and
// writer are always on; the rest are optional add-ons.
const BASE_SHARE = 0.35;

const optionalAgents = [
  { key: 'RESEARCH', label: 'Research', share: 0.2 },
  { key: 'VALUE_CHECK', label: 'Value check', share: 0.1 },
  { key: 'SEO', label: 'SEO + formatting', share: 0.15 },
  { key: 'LINKEDIN', label: 'LinkedIn publishing', share: 0.1 },
] as const;

type AgentKey = (typeof optionalAgents)[number]['key'];

const WEEKS_PER_MONTH = 4.33;

export default function Calculator() {
  const [postsPerWeek, setPostsPerWeek] = useState(5);
  const [hoursPerPost, setHoursPerPost] = useState(4);
  const [readerLevel, setReaderLevel] = useState(2); // 0: Manager, 1: Director, 2: C-level
  const idPrefix = useId();

  const [selected, setSelected] = useState<Record<AgentKey, boolean>>({
    RESEARCH: true,
    VALUE_CHECK: true,
    SEO: false,
    LINKEDIN: false,
  });

  const toggleAgent = (key: AgentKey) => {
    setSelected((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const share =
    BASE_SHARE +
    optionalAgents.reduce((sum, agent) => sum + (selected[agent.key] ? agent.share : 0), 0);

  const postsPerMonth = Math.round(postsPerWeek * WEEKS_PER_MONTH);
  const hoursSaved = Math.round(postsPerMonth * hoursPerPost * share);
  const daysSaved = (hoursSaved / 8).toFixed(1);
  const linkedinPosts = selected.LINKEDIN ? postsPerMonth : 0;
  const agentCount = 2 + optionalAgents.filter((agent) => selected[agent.key]).length;

  const getReaderLabel = (val: number) => {
    if (val === 0) return 'Managers';
    if (val === 1) return 'Directors & VPs';
    return 'C-level';
  };

  return (
    <section id="calculator" data-w-id="d5118011-cf88-1e6e-4a04-a766269ccefb" className="section-calculator">
      <div className="div-block-20">
        <div className="w-layout-blockcontainer container-17 w-container">
          <h2 className="heading-h2-white-centered-2">Build your pipeline.</h2>
          <p className="paragraph-white-centered">
            Pick the agents you need and see how much time they give back to your team. Pricing is
            per agent: a one-time setup fee, then an annual renewal.
          </p>
        </div>
      </div>

      <div className="w-layout-blockcontainer container-18 w-container" style={{ maxWidth: '980px', margin: '0 auto', padding: '0 20px' }}>
        <div
          className="code-embed w-embed w-iframe"
          style={{
            background: '#122315',
            borderRadius: '24px',
            border: '1px solid rgba(85,221,74,0.15)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '36px',
              fontFamily: 'Graphik, sans-serif',
              color: '#fff',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '32px',
              alignItems: 'start',
            }}
          >
            {/* Left Column: Sliders & Agents */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
              {/* Posts per week */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#c4d7c7' }}>
                    <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" clipRule="evenodd" d="M2.6 19.6V.4h9.506c.059 0 .114.03.146.078a18.759 18.759 0 0 0 5.203 5.203.176.176 0 0 1 .078.146V19.6H2.6Zm3.733-4.802a43.04 43.04 0 0 0 7.467 0v1.532c-.623-.065-1.244-.1-1.867-.122-1.866-.06-3.736-.056-5.6.122V14.8Zm7.467-3.531a43.02 43.02 0 0 1-7.467 0v1.531c1.864-.178 3.734-.181 5.6-.122.623.023 1.244.057 1.867.122v-1.531Z" />
                    </svg>
                    <span style={{ fontSize: '15px', fontWeight: 500 }}>Posts per week</span>
                  </div>
                  <span style={{ fontSize: '18px', fontWeight: 600, color: '#55dd4a' }}>
                    {postsPerWeek} {postsPerWeek === 1 ? 'post' : 'posts'}
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="20"
                  step="1"
                  value={postsPerWeek}
                  onChange={(e) => setPostsPerWeek(Number(e.target.value))}
                  className="calc-slider"
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#7c9480', marginTop: '4px' }}>
                  <span>1 post</span>
                  <span>20 posts</span>
                </div>
              </div>

              {/* Hours per post */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#c4d7c7' }}>
                    <svg width="18" height="18" viewBox="0 0 25 21" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="m23.445 10.772-5.367 5.882-5.113-5.882" />
                      <path d="M12 2a9 9 0 0 0-9 9c0 3.5 2 6.5 5 8" />
                    </svg>
                    <span style={{ fontSize: '15px', fontWeight: 500 }}>Hours your team spends per post</span>
                  </div>
                  <span style={{ fontSize: '18px', fontWeight: 600, color: '#55dd4a' }}>
                    {hoursPerPost} {hoursPerPost === 1 ? 'hour' : 'hours'}
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="8"
                  step="1"
                  value={hoursPerPost}
                  onChange={(e) => setHoursPerPost(Number(e.target.value))}
                  className="calc-slider"
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#7c9480', marginTop: '4px' }}>
                  <span>1 hour</span>
                  <span>8 hours</span>
                </div>
              </div>

              {/* Reader level */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#c4d7c7' }}>
                    <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M2 19.6V10s1.398-.194 2.3-.2c.98-.007 2.5.2 2.5.2v9.6s-1.46.2-2.4.2-2.4-.2-2.4-.2ZM13.2 19.48V4.12s1.399-.31 2.3-.32c.98-.01 2.5.32 2.5.32v15.36s-1.46.32-2.4.32-2.4-.32-2.4-.32ZM7.6 19.6V.6S9 .412 9.9.4c.98-.013 2.5.2 2.5.2v19s-1.46.2-2.4.2-2.4-.2-2.4-.2Z" />
                    </svg>
                    <span style={{ fontSize: '15px', fontWeight: 500 }}>Your readers</span>
                  </div>
                  <span style={{ fontSize: '18px', fontWeight: 600, color: '#55dd4a' }}>
                    {getReaderLabel(readerLevel)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="1"
                  value={readerLevel}
                  onChange={(e) => setReaderLevel(Number(e.target.value))}
                  className="calc-slider"
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#7c9480', marginTop: '4px' }}>
                  <span>Managers</span>
                  <span>Directors &amp; VPs</span>
                  <span>C-level</span>
                </div>
              </div>

              {/* Choose your agents */}
              <div>
                <p style={{ fontSize: '14px', color: '#c4d7c7', marginBottom: '12px', fontWeight: 500 }}>
                  Add agents (news finder and writer are always included)
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                  {optionalAgents.map((agent) => {
                    const inputId = `${idPrefix}-${agent.key}`;
                    const isOn = selected[agent.key];
                    return (
                      <div
                        key={agent.key}
                        onClick={() => toggleAgent(agent.key)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 14px',
                          borderRadius: '10px',
                          background: isOn ? 'rgba(85,221,74,0.12)' : 'rgba(255,255,255,0.04)',
                          border: isOn ? '1px solid #55dd4a' : '1px solid rgba(255,255,255,0.1)',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', margin: 0 }}>
                          <span style={{ fontSize: '12px', fontWeight: 600 }}>{agent.label}</span>
                        </span>
                        <input
                          id={inputId}
                          aria-label={agent.label}
                          type="checkbox"
                          checked={isOn}
                          onChange={() => toggleAgent(agent.key)}
                          onClick={(e) => e.stopPropagation()}
                          style={{ accentColor: '#55dd4a', cursor: 'pointer' }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Column: Results */}
            <div
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(85,221,74,0.2)',
                borderRadius: '20px',
                padding: '28px',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
              }}
            >
              <div>
                <div
                  style={{
                    display: 'inline-block',
                    background: 'rgba(85,221,74,0.15)',
                    color: '#55dd4a',
                    fontSize: '11px',
                    fontWeight: 700,
                    letterSpacing: '1px',
                    textTransform: 'uppercase',
                    padding: '4px 10px',
                    borderRadius: '999px',
                    marginBottom: '8px',
                  }}
                >
                  team hours back each month
                </div>
                <div
                  id="monthly-amount"
                  style={{
                    fontFamily: 'Deacon, sans-serif',
                    fontSize: '38px',
                    fontWeight: 900,
                    color: '#fff',
                    lineHeight: 1.1,
                  }}
                >
                  {hoursSaved} hours
                </div>
              </div>

              <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px' }}>
                <span style={{ color: '#c4d7c7' }}>Posts per month</span>
                <span style={{ fontWeight: 600, color: '#fff' }}>{postsPerMonth}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px' }}>
                <span style={{ color: '#c4d7c7' }}>LinkedIn posts per month</span>
                <span style={{ fontWeight: 600, color: linkedinPosts > 0 ? '#55dd4a' : '#c4d7c7' }}>
                  {linkedinPosts}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px' }}>
                <span style={{ color: '#c4d7c7' }}>Work handled by agents</span>
                <span style={{ fontWeight: 600, color: '#fff' }}>{Math.round(share * 100)}%</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '17px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <span style={{ fontWeight: 600, color: '#fff' }}>Working days saved</span>
                <span style={{ fontWeight: 700, color: '#55dd4a', fontSize: '20px' }}>{daysSaved}</span>
              </div>

              <p style={{ fontSize: '12px', lineHeight: 1.5, color: '#7c9480', margin: 0 }}>
                Estimate only. {agentCount} agents selected, written for{' '}
                {getReaderLabel(readerLevel).toLowerCase()} readers. Your quote is set per agent
                after a setup call.
              </p>

              <Link
                href={siteConfig.demoHref}
                className="button-primary w-button"
                style={{
                  display: 'block',
                  textAlign: 'center',
                  marginTop: '8px',
                  width: '100%',
                  padding: '14px',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: 600,
                }}
              >
                Get your pipeline quote
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
