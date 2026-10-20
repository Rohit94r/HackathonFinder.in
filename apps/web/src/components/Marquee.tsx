'use client';

import React from 'react';
import { agents, categories } from '@hackathonfinder/shared';

const items = [...agents.map((a) => a.name), ...categories.map((c) => c.name)];

interface MarqueeProps {
  showTitle?: boolean;
}

export default function Marquee({ showTitle = false }: MarqueeProps) {
  return (
    <section className={showTitle ? 'section-customer-logos-copy' : 'section-customer-logos'}>
      <div className="customer-logos" style={{ overflow: 'hidden' }}>
        {showTitle && (
          <p className="paragraph-black-centered grey">
            Seven agents. Five categories. One pipeline.
          </p>
        )}
        <div
          className="animate-marquee"
          style={{ display: 'flex', alignItems: 'center', gap: '48px', padding: '16px 0' }}
        >
          {items.concat(items).map((label, index) => (
            <span
              key={index}
              style={{
                flexShrink: 0,
                fontFamily: 'Deacon, sans-serif',
                fontWeight: 900,
                fontSize: '22px',
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
                color: '#122315',
                opacity: 0.75,
                whiteSpace: 'nowrap',
              }}
            >
              {label}
              <span aria-hidden="true" style={{ marginLeft: '48px', color: '#55dd4a' }}>
                ●
              </span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
