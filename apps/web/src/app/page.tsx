'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Marquee from '@/components/Marquee';
import Calculator from '@/components/Calculator';
import Testimonials from '@/components/Testimonials';
import FAQAccordion from '@/components/FAQAccordion';
import Footer from '@/components/Footer';

export default function HomePage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubmitted(true);
    }
  };

  return (
    <div className="body-home-page">
      {/* Navbar */}
      <Navbar variant="green" />

      {/* Hero Section */}
      <section className="hero-section">
        <div className="div-block-17">
          <div className="div-block-16">
            <div className="w-layout-blockcontainer hero_h1-wrapper w-container">
              <h1 className="hero_h1-white" style={{ opacity: 1, transform: 'none' }}>
                Executive insight
              </h1>
              <h1 className="hero_h1-green" style={{ opacity: 1, transform: 'none' }}>
                on autopilot
              </h1>
            </div>
            <div
              className="w-layout-blockcontainer hero_text-wrapper w-container"
              style={{ opacity: 1 }}
            >
              <p className="paragraph-white-centered">
                HackathonFinder runs a team of AI agents that find the news, research the angle,
                write in your voice, check the value and publish to your website and LinkedIn, on
                schedule.{' '}
              </p>
              <Link href="#demo" className="button-primary w-button">
                Book a demo
              </Link>
            </div>
          </div>
        </div>
        <img
          src="https://cdn.prod.website-files.com/635273ea37c256ef2835d522/654a36b6f78e92b5209148af_Kikin_Illustrations_Scene_01_RGB%202.svg"
          loading="eager"
          alt="Illustration of two people carrying a canoe in a mountainous landscape with pine trees, a river, and logs at sunset"
          className="scene-illustration-1"
        />
        <div className="w-layout-blockcontainer illustration-wrapper-copy w-container">
          <img
            src="https://cdn.prod.website-files.com/635273ea37c256ef2835d522/654a36b6f78e92b5209148af_Kikin_Illustrations_Scene_01_RGB%202.svg"
            loading="eager"
            alt="Illustration of two people carrying a canoe in a mountainous landscape with pine trees, a river, and logs at sunset"
            className="scene-illustration-1-mobile"
          />
        </div>
      </section>

      {/* Agents & Categories Marquee */}
      <Marquee showTitle={false} />

      {/* Benefits Section 1 */}
      <section id="demo" className="section-benefits-1" style={{ position: 'relative' }}>
        <div className="w-layout-blockcontainer container-15 w-container">
          <div className="h2-wrapper">
            <h2 className="heading-h2-black-centered">Built for executives. Not for algorithms.</h2>
          </div>
        </div>
        <div className="w-layout-blockcontainer container-16 w-container">
          <p className="paragraph-black-centered">
            Your readers run Fortune 500 companies, and they have no time for generic content.
            Our agents skip the case studies everyone has already read and find the angles your
            readers haven&#39;t seen. Every draft has to pass one test: does it add value to an
            executive?
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '24px' }}>
            <Link href="/dashboard" className="button-primary w-button">
              See the dashboard
            </Link>
            <Link href="/how-it-works" className="button-secondary-light w-button">
              How it works
            </Link>
          </div>

          <div className="form-learn-more w-form">
            {!submitted ? (
              <form onSubmit={handleSubmit} className="form-3">
                <div className="div-block-43">
                  <div className="div-block-42">
                    <input
                      className="text-field-3 w-input"
                      maxLength={256}
                      name="email"
                      placeholder="Your work email"
                      type="email"
                      id="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                    <input
                      type="submit"
                      className="button-secondary-light form w-button"
                      value="Book a demo"
                    />
                  </div>
                </div>
              </form>
            ) : (
              <div className="success-message-2 w-form-done" style={{ display: 'block' }}>
                <div>Thanks! We&#39;ll be in touch to set up your demo.</div>
              </div>
            )}
          </div>
        </div>

        {/* Floating stickers */}
        <img
          src="https://cdn.prod.website-files.com/635273ea37c256ef2835d522/6527ca0fa1114411609088ef_make%20business%20do%20good.svg"
          loading="lazy"
          alt=""
          className="sticker-ritgh-top"
        />
        <img
          src="https://cdn.prod.website-files.com/635273ea37c256ef2835d522/65437bfd31c9aad0c299a643_put%20planet%20first.svg"
          loading="lazy"
          alt=""
          className="sticker-left-bottom"
        />
        <img
          src="https://cdn.prod.website-files.com/635273ea37c256ef2835d522/6527ca0fc14a039c9c8a6db6_work%20together.svg"
          loading="lazy"
          alt=""
          className="sticker-right-bottom"
        />
        <img
          src="https://cdn.prod.website-files.com/635273ea37c256ef2835d522/6527ca0f2546312f94afb400_borrow%20wisely.svg"
          loading="lazy"
          alt=""
          className="sticker-right-middle"
        />
        <img
          src="https://cdn.prod.website-files.com/635273ea37c256ef2835d522/6527ca0f4fea32f3c89a031d_change%20the%20world.svg"
          loading="lazy"
          alt=""
          className="sticker-left-top"
        />
      </section>

      {/* Benefits Section 2: 4 Benefit Cards */}
      <section className="section-benefits-2">
        {/* Card 01 */}
        <div className="block-1 animated-block">
          <div className="div-block-35">
            <div className="div-block-34">
              <div className="circle-number">
                <div className="number">01</div>
              </div>
              <h4 className="heading-h4">Find what matters.</h4>
            </div>
            <div className="div-block-33">
              <p className="paragraph-black-left">
                The news finder scans the sources you approve, sorts stories by category and ranks
                them by relevance. Only the topics worth writing about reach the writer.
              </p>
            </div>
          </div>
          <div className="animation-wrapper first" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <img
              src="https://cdn.prod.website-files.com/635273ea37c256ef2835d522/654a36b6f78e92b5209148af_Kikin_Illustrations_Scene_01_RGB%202.svg"
              alt="News finder illustration"
              style={{ maxHeight: '180px', objectFit: 'contain' }}
            />
          </div>
        </div>

        {/* Card 02 */}
        <div className="block-2 animated-block">
          <div className="div-block-35">
            <div className="div-block-34">
              <div className="circle-number">
                <div className="number">02</div>
              </div>
              <h4 className="heading-h4">Research that goes deeper.</h4>
            </div>
            <div className="div-block-33">
              <p className="paragraph-black-left">
                No more recycled Microsoft and Google case studies. The research agent looks for
                the angle your readers don&#39;t know yet, like a bootstrapped unicorn they have
                never studied.
              </p>
            </div>
          </div>
          <div className="animation-wrapper second" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <img
              src="https://cdn.prod.website-files.com/635273ea37c256ef2835d522/65363617f2f8b421dacfacc5_Illustration.svg"
              alt="Research illustration"
              style={{ maxHeight: '180px', objectFit: 'contain' }}
            />
          </div>
        </div>

        {/* Card 03 */}
        <div className="block-3 animated-block">
          <div className="div-block-35">
            <div className="div-block-34">
              <div className="circle-number">
                <div className="number">03</div>
              </div>
              <h4 className="heading-h4">YOUR VOICE. IN EVERY CATEGORY.</h4>
            </div>
            <div className="div-block-33">
              <p className="paragraph-black-left">
                The writer uses your persona and a fixed paragraph framework for each category. A
                Decision reads like a Decision and a Playbook reads like a Playbook. No more
                look-alike AI paragraphs.
              </p>
            </div>
          </div>
          <div className="animation-wrapper third" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <img
              src="https://cdn.prod.website-files.com/635273ea37c256ef2835d522/65366ae62f51f2c63edd236f_Scene-illustration-2.cropped.svg"
              alt="Writer illustration"
              style={{ maxHeight: '180px', objectFit: 'contain' }}
            />
          </div>
        </div>

        {/* Card 04 */}
        <div className="block-4 animated-block">
          <div className="div-block-35">
            <div className="div-block-34">
              <div className="circle-number">
                <div className="number">04</div>
              </div>
              <h4 className="heading-h4">PUBLISHED EVERYWHERE. ON TIME.</h4>
            </div>
            <div className="div-block-33">
              <p className="paragraph-black-left">
                SEO, formatting and scheduling are handled for you. Every post goes live on your
                website, and a LinkedIn version goes out at the right time.
              </p>
            </div>
          </div>
          <div className="animation-wrapper forth" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <img
              src="https://cdn.prod.website-files.com/635273ea37c256ef2835d522/6527ca0f4fea32f3c89a031d_change%20the%20world.svg"
              alt="Publishing illustration"
              style={{ maxHeight: '180px', objectFit: 'contain' }}
            />
          </div>
        </div>
      </section>

      {/* Interactive Pipeline Builder */}
      <Calculator />

      {/* Who It's For 1 */}
      <section className="section-who_we_fund-1">
        <div className="div-block-22">
          <div className="div-block-23">
            <h2 className="heading-h2-white-right" style={{ opacity: 1, transform: 'none' }}>
              who it&#39;s
            </h2>
            <h1 className="heading-h2-white-right" style={{ opacity: 1, transform: 'none' }}>
              for
            </h1>
          </div>
          <div className="div-block-25">
            <p className="paragraph-white-left">
              Teams that publish for senior leaders and can&#39;t afford a single generic post.
              Readers that judge a brand by the quality of its thinking.
            </p>
          </div>
        </div>
      </section>

      {/* Who It's For 2: 3 Columns */}
      <section className="section-who_we_fund-2">
        <div className="columns w-row">
          {/* Column 1 */}
          <div className="who-we-fund_column w-col w-col-4 w-col-medium-4">
            <div className="div-block-26">
              <img
                src="https://cdn.prod.website-files.com/635273ea37c256ef2835d522/6526cc210b0e422796833aad_icon-house.svg"
                loading="lazy"
                alt=""
                className="image-17"
              />
              <div className="div-block-27">
                <h6 className="heading-h5" style={{ opacity: 1, transform: 'none' }}>
                  Content platforms{' '}
                </h6>
                <h6 className="heading-h5" style={{ opacity: 1, transform: 'none' }}>
                  for C-level readers
                </h6>
              </div>
            </div>
          </div>

          {/* Column 2 */}
          <div className="who-we-fund_column central w-col w-col-4 w-col-medium-4">
            <div className="div-block-26">
              <img
                src="https://cdn.prod.website-files.com/635273ea37c256ef2835d522/6526cc22529df10ae4f5e974_icon-invoice.svg"
                loading="lazy"
                alt=""
                className="image-17"
              />
              <div className="div-block-27">
                <h6 className="heading-h5" style={{ opacity: 1, transform: 'none' }}>
                  teams that publish
                </h6>
                <h6 className="heading-h5" style={{ opacity: 1, transform: 'none' }}>
                  every week{' '}
                </h6>
                <h6 className="heading-h5" style={{ opacity: 1, transform: 'none' }}>
                  across channels
                </h6>
              </div>
            </div>
          </div>

          {/* Column 3 */}
          <div className="who-we-fund_column-copy w-col w-col-4 w-col-medium-4">
            <div className="div-block-26">
              <img
                src="https://cdn.prod.website-files.com/635273ea37c256ef2835d522/6526cc216a0fbc5be58f8b64_icon-leaf.svg"
                loading="lazy"
                alt=""
                className="image-17"
              />
              <div className="div-block-27">
                <h6 className="heading-h5" style={{ opacity: 1, transform: 'none' }}>
                  enterprises that want
                </h6>
                <h6 className="heading-h5" style={{ opacity: 1, transform: 'none' }}>
                  their own agents
                </h6>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quality Bar Section */}
      <section className="section-esg">
        <div className="div-block-28">
          <h3 className="heading-h3-green-center">EVERY DRAFT FACES</h3>
          <h3 className="heading-h3-green-center">ONE QUESTION.</h3>
          <h3 className="heading-h3-green-center">DOES THIS ADD VALUE</h3>
          <h3 className="heading-h3-green-center">TO AN EXECUTIVE?</h3>
          <h3 className="heading-h3-green-center">IF NOT, IT GETS REWRITTEN.</h3>
        </div>

        {/* Floating Badges */}
        <img
          src="https://cdn.prod.website-files.com/635273ea37c256ef2835d522/6528262a6cc8a59123cfc51f_reduced%20inequalities.svg"
          loading="lazy"
          alt=""
          className="esg-sticker-top"
        />
        <img
          src="https://cdn.prod.website-files.com/635273ea37c256ef2835d522/6528262a92d2cb7d55649568_gender%20equality.svg"
          loading="lazy"
          alt=""
          className="esg-sticker-bottom"
        />
        <img
          src="https://cdn.prod.website-files.com/635273ea37c256ef2835d522/6528262a049496476650d483_climate%20action.svg"
          loading="lazy"
          alt=""
          className="esg-sticker-left-bottom"
        />
        <img
          src="https://cdn.prod.website-files.com/635273ea37c256ef2835d522/6528262a19c99a0901eb7330_industry.svg"
          loading="lazy"
          alt=""
          className="esg-sticker-left-top"
        />
        <img
          src="https://cdn.prod.website-files.com/635273ea37c256ef2835d522/6528262ad0ac4ce82d0ffb93_zero%20hunger.svg"
          loading="lazy"
          alt=""
          className="esg-sticker-top-right"
        />
        <img
          src="https://cdn.prod.website-files.com/635273ea37c256ef2835d522/6528262ab3b79bd59bf00e6d_clean%20water.svg"
          loading="lazy"
          alt=""
          className="esg-sticker-bottom-right"
        />
      </section>

      {/* Content Categories Slider */}
      <Testimonials />

      {/* FAQs Section */}
      <FAQAccordion />

      {/* Footer */}
      <Footer />
    </div>
  );
}
