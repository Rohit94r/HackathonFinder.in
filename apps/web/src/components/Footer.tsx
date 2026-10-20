'use client';

import React from 'react';
import Link from 'next/link';
import { siteConfig } from '@/data/siteConfig';

export default function Footer() {
  return (
    <>
      <div className="footer-new">
        <div>
          <div className="w-layout-blockcontainer container-19 w-container">
            <div className="div-block-32">
              <h2 className="heading-h2-white-centered">LET THE AGENTS WRITE.</h2>
              <h2 className="heading-h2-yellow-centered">KEEP THE JUDGEMENT.</h2>
            </div>
            <Link href={siteConfig.demoHref} className="button-secondary w-button">
              book a demo
            </Link>
          </div>
          <div className="illustration2-wrapper">
            <div className="gradient"></div>
            <img
              src="https://cdn.prod.website-files.com/635273ea37c256ef2835d522/65363617f2f8b421dacfacc5_Illustration.svg"
              loading="lazy"
              alt=""
              className="scene-illusrtation-2"
            />
            <img
              src="https://cdn.prod.website-files.com/635273ea37c256ef2835d522/65366ae62f51f2c63edd236f_Scene-illustration-2.cropped.svg"
              loading="lazy"
              alt="Illustration of a deer standing on a cliff overlooking a river and mountains, surrounded by pine trees and tree stumps, with a large yellow moon in the background"
              className="scene-illustration-2-mobile"
            />
          </div>
        </div>

        <div className="links-wrapper">
          <div
            id="w-node-e7c82830-38ab-f485-1ca4-011feb6d1403-eb6d13f4"
            className="footer-email"
          >
            <div style={{ width: '100%', maxWidth: '482px', minHeight: '72px' }}>
              <p style={{ margin: 0, fontSize: '16px', lineHeight: 1.5, color: '#c4d7c7' }}>
                Seven agents. One pipeline. Research, writing, value checks, SEO, scheduling and
                publishing to your website and LinkedIn.
              </p>
            </div>
            <div className="div-block-49">
              <span
                aria-hidden="true"
                className="image-11"
                style={{
                  fontFamily: 'Deacon, sans-serif',
                  fontWeight: 900,
                  fontSize: '28px',
                  lineHeight: 1,
                  color: '#55dd4a',
                }}
              >
                {siteConfig.shortName}
              </span>
              <div className="div-block-4">
                <p className="paragraph-3">Get in touch</p>
                <p className="paragraph-3">
                  <a href={`mailto:${siteConfig.email}`} className="link">
                    {siteConfig.email}
                  </a>
                </p>
              </div>
            </div>
          </div>

          <div
            id="w-node-e7c82830-38ab-f485-1ca4-011feb6d140b-eb6d13f4"
            className="footer-links"
          >
            <p className="paragraph-xs">© 2026 {siteConfig.name}</p>
            <p className="paragraph-xs">Powered by {siteConfig.poweredBy}</p>
            <p className="paragraph-xs">AI agents for executive content</p>
          </div>

          <div
            id="w-node-e7c82830-38ab-f485-1ca4-011feb6d1412-eb6d13f4"
            className="footer-links"
          >
            <div className="footer-links-wrapper">
              <Link href="/how-it-works" className="link-2">
                How it works
              </Link>
              <Link href="/dashboard" className="link-2">
                Dashboard
              </Link>
              <Link href="/news" className="link-2">
                News feed
              </Link>
              <Link href="/#calculator" className="link-2">
                Pricing
              </Link>
              <Link href="/#FAQs" className="link-2">
                FAQs
              </Link>
              <Link href="/customers" className="link-2">
                Customers
              </Link>
              <Link href="/blog" className="link-2">
                Blog
              </Link>
              <Link href="/privacy" className="link-2">
                Privacy policy
              </Link>
              <Link href="/terms-of-service" className="link-2">
                Terms of service
              </Link>
            </div>
            <div className="div-block-9">
              <a
                href={siteConfig.xUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="socials w-button"
              >
                X
              </a>
              <a
                href={siteConfig.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="socials w-button"
              >
                Linkedin
              </a>
            </div>
          </div>
        </div>

        <div className="div-block-48"></div>
        <div className="footer-legal-info">
          <p className="paragraph-xxs">
            {siteConfig.name} is an AI agent system built by {siteConfig.poweredBy}. Its first
            deployment is {siteConfig.firstDeployment}, a content platform for C-level, VP and
            director-level leaders.
          </p>
        </div>
      </div>

      {/* Floating pipeline pill button */}
      <Link href="/#calculator" className="calculator w-inline-block">
        <img
          src="https://cdn.prod.website-files.com/635273ea37c256ef2835d522/6540cd73d555d364c268451d_calculate-icon.svg"
          loading="lazy"
          alt=""
          className="image-23"
        />
        <span className="heading-7" style={{ margin: 0, padding: 0 }}>
          BUILD YOUR PIPELINE
        </span>
        <img
          src="https://cdn.prod.website-files.com/635273ea37c256ef2835d522/6540cdd6b8b0bbcd01cfbe40_chevron%20down.svg"
          loading="lazy"
          alt=""
        />
      </Link>
    </>
  );
}
