'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import FAQAccordion from '@/components/FAQAccordion';
import Footer from '@/components/Footer';
import { siteConfig } from '@/data/siteConfig';

export default function HowItWorksPage() {
  const [openStep1, setOpenStep1] = useState(false);
  const [openStep2, setOpenStep2] = useState(false);
  const [openStep3, setOpenStep3] = useState(false);

  return (
    <div className="body-home-page">
      <Navbar variant="green" />

      {/* Hero Section */}
      <section className="section-hero" style={{ position: 'relative' }}>
        <img
          src="https://cdn.prod.website-files.com/635273ea37c256ef2835d522/6552372e1ab0c62b6f61a164_work-together.svg"
          loading="lazy"
          alt=""
          className="image-29 top-left"
        />
        <img
          src="https://cdn.prod.website-files.com/635273ea37c256ef2835d522/6407480019507306040fb325_eco%20funds.svg"
          loading="lazy"
          alt=""
          className="hiw_sticker_bottom-left"
        />
        <img
          src="https://cdn.prod.website-files.com/635273ea37c256ef2835d522/6527ca0fc14a039c9c8a6db6_work%20together.svg"
          loading="lazy"
          alt=""
          className="hiw_sticker_bottom-right"
        />
        <img
          src="https://cdn.prod.website-files.com/635273ea37c256ef2835d522/6552372d8825ecb49ccdda6b_priority-planet.svg"
          loading="lazy"
          alt=""
          className="hiw_sticker_bottom-right2"
        />

        <div className="w-layout-blockcontainer container-30 w-container">
          <div className="w-layout-blockcontainer container-29 w-container">
            <h1 className="heading-h2-white-centered" style={{ opacity: 1, transform: 'none' }}>
              How the agents
            </h1>
            <h1 className="heading-h2-green-centered" style={{ opacity: 1, transform: 'none' }}>
              work together
            </h1>
          </div>
          <div
            className="w-layout-blockcontainer hero_text-wrapper w-container"
            style={{ opacity: 1 }}
          >
            <p className="paragraph-white-centered">
              Seven agents, one pipeline. A story goes in, and a post comes out on your website and
              LinkedIn, checked for quality before anything goes live.
            </p>
            <Link href={siteConfig.demoHref} className="button-primary w-button">
              Book a demo
            </Link>
          </div>
        </div>
      </section>

      {/* How it Works Steps */}
      <section className="section-hiw">
        <div className="m-timeline-wrapper">
          <div className="m-section-large">
            <div className="m-container-regular">
              {/* Step 01 */}
              <div className="step">
                <div className="scroll-animation-wrapper">
                  <div className="step-number_hiw">
                    <div className="number">01</div>
                  </div>
                  <div className="timeline-line">
                    <div className="m-timeline-line"></div>
                  </div>
                </div>
                <div className="hiw_block-1">
                  <div className="hiv-wrapper">
                    <div className="div-block-34">
                      <h3 className="heading-h4 white hiv">FIND AND RESEARCH</h3>
                      <p className="paragraph-white-left">
                        The news finder scans the sources you approve, puts each story in a category
                        and ranks it by relevance. Then the research agent looks for the angle your
                        readers haven&#39;t heard yet and gathers the sources behind it.
                      </p>
                    </div>

                    <div
                      className="faq-block-copy hiw"
                      onClick={() => setOpenStep1(!openStep1)}
                      style={{ cursor: 'pointer', marginTop: '16px' }}
                    >
                      <div className="faq-question-wrapper hiw">
                        <h5 className="faq-title hiw">more about news sources</h5>
                        <div className="accordian-icon-wrapper hiw">
                          <div className="horizontal-line hiw"></div>
                          <div
                            className="vertical-line hiw"
                            style={{
                              transform: openStep1 ? 'scale(0)' : 'scale(1)',
                              transition: 'transform 0.2s ease',
                            }}
                          ></div>
                        </div>
                      </div>
                      <div
                        style={{
                          maxHeight: openStep1 ? '300px' : '0px',
                          overflow: 'hidden',
                          transition: 'max-height 0.3s ease',
                        }}
                      >
                        <p className="faq-paragraph hiw first" style={{ height: 'auto', paddingTop: '10px' }}>
                          You pick the sources and the categories to pull for. The news finder
                          combines RSS feeds with a search API, drops duplicate stories and scores
                          the rest, so it only keeps what&#39;s worth writing about. Until your list
                          is ready, it starts with major business and technology outlets.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="hiw-animation-wrapper first" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <img
                      src="https://cdn.prod.website-files.com/635273ea37c256ef2835d522/654a36b6f78e92b5209148af_Kikin_Illustrations_Scene_01_RGB%202.svg"
                      alt="Step 1 graphic"
                      style={{ maxHeight: '200px', objectFit: 'contain' }}
                    />
                  </div>
                </div>
              </div>

              {/* Step 02 */}
              <div className="step">
                <div className="scroll-animation-wrapper">
                  <div className="step-number_hiw">
                    <div className="number">02</div>
                  </div>
                  <div className="timeline-line">
                    <div className="m-timeline-line"></div>
                  </div>
                </div>
                <div className="hiw_block-2 animated-block">
                  <div className="hiv-wrapper">
                    <div className="div-block-34">
                      <h3 className="heading-h4 white hiv">WRITE AND CHECK</h3>
                      <p className="paragraph-white-left">
                        The writer drafts in your persona, using a fixed paragraph framework for each
                        category. The value check then asks whether the post adds value to an
                        executive. If not, the draft goes back for a rewrite, at most twice.
                      </p>
                    </div>

                    <div
                      className="faq-block-copy hiw"
                      onClick={() => setOpenStep2(!openStep2)}
                      style={{ cursor: 'pointer', marginTop: '16px' }}
                    >
                      <div className="faq-question-wrapper hiw">
                        <h5 className="faq-title hiw">How does each category get its own voice?</h5>
                        <div className="accordian-icon-wrapper hiw">
                          <div className="horizontal-line hiw"></div>
                          <div
                            className="vertical-line hiw"
                            style={{
                              transform: openStep2 ? 'scale(0)' : 'scale(1)',
                              transition: 'transform 0.2s ease',
                            }}
                          ></div>
                        </div>
                      </div>
                      <div
                        style={{
                          maxHeight: openStep2 ? '300px' : '0px',
                          overflow: 'hidden',
                          transition: 'max-height 0.3s ease',
                        }}
                      >
                        <p className="faq-paragraph hiw second" style={{ height: 'auto', paddingTop: '10px' }}>
                          Brief, Thinking, Playbook, Decisions and Deep Dive each have their own
                          template and paragraph structure. The writer also learns from your best
                          existing posts in each category, so new posts sound like you and not like
                          generic AI.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="hiw-animation-wrapper second" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <img
                      src="https://cdn.prod.website-files.com/635273ea37c256ef2835d522/65363617f2f8b421dacfacc5_Illustration.svg"
                      alt="Step 2 graphic"
                      style={{ maxHeight: '200px', objectFit: 'contain' }}
                    />
                  </div>
                </div>
              </div>

              {/* Step 03 */}
              <div className="step">
                <div className="scroll-animation-wrapper">
                  <div className="step-number_hiw">
                    <div className="number">03</div>
                  </div>
                  <div className="timeline-line">
                    <div className="m-timeline-line"></div>
                  </div>
                </div>
                <div className="hiw_block-3 animated-block">
                  <div className="hiv-wrapper">
                    <div className="div-block-34">
                      <h3 className="heading-h4 white hiv">FORMAT, SCHEDULE AND PUBLISH</h3>
                      <p className="paragraph-white-left">
                        The SEO agent checks competitor content and keywords, writes the title,
                        meta description and slug, formats the post and adds internal links. The
                        scheduler picks the best time slot, and the publisher posts to your website
                        and LinkedIn.
                      </p>
                    </div>

                    <Link href="/#calculator" className="button-secondary w-button" style={{ marginTop: '12px', display: 'inline-block' }}>
                      build your pipeline
                    </Link>

                    <div
                      className="faq-block-copy hiw"
                      onClick={() => setOpenStep3(!openStep3)}
                      style={{ cursor: 'pointer', marginTop: '16px' }}
                    >
                      <div className="faq-question-wrapper hiw">
                        <h5 className="faq-title hiw">What about LinkedIn?</h5>
                        <div className="accordian-icon-wrapper hiw">
                          <div className="horizontal-line hiw"></div>
                          <div
                            className="vertical-line hiw"
                            style={{
                              transform: openStep3 ? 'scale(0)' : 'scale(1)',
                              transition: 'transform 0.2s ease',
                            }}
                          ></div>
                        </div>
                      </div>
                      <div
                        style={{
                          maxHeight: openStep3 ? '300px' : '0px',
                          overflow: 'hidden',
                          transition: 'max-height 0.3s ease',
                        }}
                      >
                        <p className="faq-paragraph hiw" style={{ height: 'auto', paddingTop: '10px' }}>
                          The publisher rewrites each post for LinkedIn and sends it at the right
                          time. Personal profiles connect through LinkedIn&#39;s official API.
                          Company pages need LinkedIn&#39;s approval first, and until then you get a
                          post-ready version to publish in one click. You can see every scheduled
                          post in the{' '}
                          <Link href="/dashboard" className="text-links hiw">
                            agent dashboard
                          </Link>
                          .
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="hiw-animation-wrapper third" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <img
                      src="https://cdn.prod.website-files.com/635273ea37c256ef2835d522/65366ae62f51f2c63edd236f_Scene-illustration-2.cropped.svg"
                      alt="Step 3 graphic"
                      style={{ maxHeight: '200px', objectFit: 'contain' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <FAQAccordion />

      {/* Footer */}
      <Footer />
    </div>
  );
}
