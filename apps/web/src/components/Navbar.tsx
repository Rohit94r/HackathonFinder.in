'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { siteConfig } from '@/data/siteConfig';

interface NavbarProps {
  variant?: 'green' | 'off-white' | 'blue';
}

const dropdownItems = [
  {
    href: '/how-it-works',
    icon: '→',
    title: 'THE PIPELINE',
    description: 'See how the seven agents work together',
  },
  {
    href: '/dashboard',
    icon: '◎',
    title: 'AGENT DASHBOARD',
    description: 'Watch every agent run, step by step',
  },
  {
    href: '/news',
    icon: '≡',
    title: 'NEWS FEED',
    description: 'Topics the news finder picked up today',
  },
];

const mobileLinks = [
  { href: '/how-it-works', label: 'How it Works' },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/news', label: 'News Feed' },
  { href: '/#calculator', label: 'Pricing' },
  { href: '/#FAQs', label: 'FAQs' },
  { href: '/customers', label: 'Customers' },
  { href: '/blog', label: 'Blog' },
];

function Wordmark({ light }: { light: boolean }) {
  return (
    <span
      style={{
        fontFamily: 'Deacon, sans-serif',
        fontWeight: 900,
        fontSize: '22px',
        letterSpacing: '0.5px',
        lineHeight: 1,
        color: light ? '#ffffff' : '#122315',
        whiteSpace: 'nowrap',
      }}
    >
      {siteConfig.name}
    </span>
  );
}

export default function Navbar({ variant = 'green' }: NavbarProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isGreen = variant === 'green';
  const isOffWhite = variant === 'off-white';

  return (
    <section className={`navbar ${variant}`}>
      <div
        data-animation="default"
        data-collapse="medium"
        data-duration="400"
        data-easing="ease"
        role="banner"
        className={`navbar-container ${isOffWhite ? 'off-white' : ''} ${variant === 'blue' ? 'blue' : ''} w-nav`}
      >
        <div className="container-desktop">
          <div className="navbar-desktop-wrapper">
            <div className="w-layout-blockcontainer container-21 w-container"></div>
            <Link href="/" className="navbar-brand w-nav-brand" aria-label={`${siteConfig.name} home`}>
              <Wordmark light={isGreen} />
            </Link>

            <nav role="navigation" className="nav-menu-wrapper w-nav-menu">
              <ul role="list" className={`nav-menu ${variant} w-list-unstyled`}>
                <li
                  className={`nav-item ${dropdownOpen ? 'hiw-dropdown-open' : ''}`}
                  onMouseEnter={() => setDropdownOpen(true)}
                  onMouseLeave={() => setDropdownOpen(false)}
                >
                  <div
                    className="hiw-header-dropdown w-dropdown"
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                  >
                    <div
                      className={`nav-link ${
                        isGreen ? 'hiw-toggle-light' : 'green hiw-toggle-green'
                      } w-dropdown-toggle`}
                      aria-expanded={dropdownOpen}
                    >
                      <div style={{ cursor: 'pointer' }}>How it Works ▾</div>
                    </div>
                    <nav
                      className="hiw-header-dropdown-list w-dropdown-list"
                      style={{
                        display: dropdownOpen ? 'block' : 'none',
                        opacity: dropdownOpen ? 1 : 0,
                        visibility: dropdownOpen ? 'visible' : 'hidden',
                      }}
                    >
                      <div>
                        <div role="menu" aria-label="How it Works" className="hiw-mega-panel">
                          {dropdownItems.map((item) => (
                            <Link
                              key={item.href}
                              href={item.href}
                              role="menuitem"
                              className="hiw-mega-option"
                              onClick={() => setDropdownOpen(false)}
                            >
                              <span aria-hidden="true" className="hiw-mega-icon">
                                {item.icon}
                              </span>
                              <span className="hiw-mega-copy">
                                <span className="hiw-mega-title">{item.title}</span>
                                <span className="hiw-mega-description">{item.description}</span>
                              </span>
                              <span aria-hidden="true" className="hiw-mega-arrow">
                                →
                              </span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    </nav>
                  </div>
                </li>

                <li className="nav-item">
                  <Link href="/#calculator" className={`nav-link ${!isGreen ? 'green' : ''}`}>
                    Pricing
                  </Link>
                </li>
                <li className="nav-item">
                  <Link href="/#FAQs" className={`nav-link ${!isGreen ? 'green' : ''}`}>
                    faqs
                  </Link>
                </li>
                <li className="nav-item">
                  <Link href="/customers" className={`nav-link ${!isGreen ? 'green' : ''}`}>
                    Customers
                  </Link>
                </li>
                <li className="nav-item">
                  <Link href="/blog" className={`nav-link ${!isGreen ? 'green' : ''}`}>
                    Blog
                  </Link>
                </li>
                <li className="nav-item-mobile-only">
                  <Link href="/dashboard" className={`nav-link ${!isGreen ? 'green' : ''}`}>
                    Dashboard
                  </Link>
                </li>
                <li className="nav-item-mobile-only">
                  <Link href={siteConfig.demoHref} className={`nav-link ${!isGreen ? 'green' : ''}`}>
                    Book a demo
                  </Link>
                </li>
              </ul>
            </nav>

            <div className="div-block-39">
              <Link
                href="/dashboard"
                className={`${
                  isGreen
                    ? 'button-secondary'
                    : isOffWhite
                    ? 'button-secondary-light'
                    : 'button-secondary-light dark'
                } small w-button`}
              >
                Dashboard
              </Link>
              <Link
                href={siteConfig.demoHref}
                className={`button-primary small ${variant === 'blue' ? 'dark' : ''} w-button`}
              >
                Book a demo
              </Link>
            </div>
          </div>
        </div>

        {/* Mobile Navbar */}
        <div className="container-mobile">
          <div className="navbar-wrapper">
            <div className="w-layout-blockcontainer container-21-mobile w-container">
              <Link href="/" aria-label={`${siteConfig.name} home`} className="w-inline-block">
                <Wordmark light={isGreen} />
              </Link>
            </div>
            <div
              className="menu-button-2 w-nav-button"
              aria-label="menu"
              role="button"
              tabIndex={0}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{ cursor: 'pointer' }}
            >
              <div className={`div-block-38 ${variant === 'blue' ? 'dark' : ''}`}>
                <img
                  src="https://cdn.prod.website-files.com/635273ea37c256ef2835d522/653a3007eeafa91f0eff6085_menu-icon.svg"
                  loading="lazy"
                  alt="Menu icon"
                />
              </div>
            </div>
          </div>
          {mobileMenuOpen && (
            <div
              className={`w-nav-overlay ${mobileMenuOpen ? 'mobile-nav-open' : ''}`}
              style={{
                display: 'block',
                width: '100%',
                background: isGreen ? '#122315' : '#f5f4ef',
                padding: '20px',
                borderBottom: '1px solid rgba(0,0,0,0.1)',
              }}
            >
              <ul className="w-list-unstyled" style={{ margin: 0, padding: 0 }}>
                {mobileLinks.map((link) => (
                  <li key={link.href} style={{ padding: '12px 0' }}>
                    <Link
                      href={link.href}
                      className={`nav-link ${!isGreen ? 'green' : ''}`}
                      onClick={() => setMobileMenuOpen(false)}
                      style={{ fontSize: '18px', fontWeight: 500 }}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
                <li style={{ padding: '16px 0', display: 'flex', gap: '10px' }}>
                  <Link
                    href="/dashboard"
                    className="button-secondary small w-button"
                    style={{ flex: 1, textAlign: 'center' }}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <Link
                    href={siteConfig.demoHref}
                    className="button-primary small w-button"
                    style={{ flex: 1, textAlign: 'center' }}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Book a demo
                  </Link>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
