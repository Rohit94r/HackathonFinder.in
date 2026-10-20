'use client';

import React, { useState } from 'react';
import Link from 'next/link';

type Tab = 'Agents' | 'Publishing' | 'General';

interface FAQItem {
  question: string;
  answer: React.ReactNode;
}

const faqsData: Record<Tab, FAQItem[]> = {
  Agents: [
    {
      question: 'What do the agents actually do?',
      answer:
        'Seven agents work in sequence. The news finder picks up topics by category, research digs for the angle, the writer drafts in your voice, the value check approves or sends it back, SEO and formatting get it ready, the scheduler picks a slot and the publisher posts it to your website and LinkedIn.',
    },
    {
      question: 'Do you fine-tune a model on our content?',
      answer:
        'No. We use leading API models with strong prompts, a fixed template for each category and few-shot examples taken from your best existing posts. That gets you your voice faster, and with better results, than fine-tuning.',
    },
    {
      question: 'How does the value check work?',
      answer:
        'After every draft, the value check asks one question: does this add value to an executive? If the answer is yes, the post moves on. If not, it goes back to the writer with notes. Rewrites are capped at two so a draft never loops forever.',
    },
    {
      question: 'Where do the news topics come from?',
      answer:
        'From sources you approve. The news finder combines RSS feeds with a search API, sorts stories into your categories, removes duplicates and ranks what is left by relevance. It is selective by design and does not fetch everything.',
    },
  ],
  Publishing: [
    {
      question: 'Can it post to LinkedIn automatically?',
      answer:
        'Yes. Posting to a personal profile works through LinkedIn’s official API once you connect your account. Company pages need LinkedIn’s approval first. Until that comes through, the publisher prepares a post-ready version you can publish in one click.',
    },
    {
      question: 'Who decides when posts go live?',
      answer: (
        <>
          The scheduler picks a date and time for each post and adds it to the queue. You can see
          every scheduled post, and change it, in the{' '}
          <Link href="/dashboard" className="link-dark">
            agent dashboard
          </Link>
          .
        </>
      ),
    },
    {
      question: 'How is SEO handled?',
      answer:
        'The SEO agent looks at competitor content and keywords for each topic, writes the title, meta description and slug, and adds internal links to your related posts automatically.',
    },
  ],
  General: [
    {
      question: 'How much does it cost?',
      answer: (
        <>
          Pricing is per agent: a one-time setup fee, then an annual renewal. The final figure
          depends on which agents you need and how they are set up. Use{' '}
          <Link href="/#calculator" className="link-dark">
            the pipeline builder
          </Link>{' '}
          to see what fits, then book a call for a quote.
        </>
      ),
    },
    {
      question: 'Can we run sites for different regions?',
      answer:
        'Multi-region is on the roadmap: one database serving several sites, such as the Middle East, North America and India, each with content picked for that region.',
    },
    {
      question: 'Do you create images or video?',
      answer:
        'Not yet. Today the agents produce written posts for your blog and LinkedIn. Media comes once the writing pipeline is fully proven.',
    },
    {
      question: 'Who is behind HackathonFinder?',
      answer:
        'HackathonFinder is built by LayerFlow. Its first deployment is The Executive Narrative, a content platform for C-level, VP and director-level leaders.',
    },
  ],
};

export default function FAQAccordion() {
  const [activeTab, setActiveTab] = useState<Tab>('Agents');
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({
    'Agents-0': true,
  });

  const toggleItem = (key: string) => {
    setOpenItems((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <section id="FAQs" className="faqs">
      <div className="faq-section">
        <div className="container-23">
          <div className="div-block-41">
            <h2 className="heading-h2-black-left">FaqS</h2>
          </div>
          <div className="faq-tab-wrapper w-tabs">
            {/* Tabs Navigation */}
            <div
              id="w-node-e2448e9c-4db2-f605-7764-03899b905234-2f65cae4"
              className="faq-tabs-menu w-tab-menu"
            >
              <button
                type="button"
                onClick={() => setActiveTab('Agents')}
                className={`faq-tab-link w-inline-block w-tab-link ${
                  activeTab === 'Agents' ? 'w--current' : ''
                }`}
                style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
              >
                <div className="w-embed">
                  <svg
                    width="29"
                    height="29"
                    viewBox="0 0 29 29"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M4.28906 25.3281V2.28809H15.6961C15.7667 2.28809 15.8326 2.32335 15.8717 2.38206C17.5203 4.85492 19.6422 6.97686 22.1151 8.62544C22.1738 8.66458 22.2091 8.73047 22.2091 8.80103V25.3281H4.28906ZM8.76562 19.5663C11.7469 19.826 14.7444 19.826 17.7257 19.5663V21.4045C16.9783 21.3264 16.233 21.285 15.4857 21.2575C13.2457 21.1862 11.0016 21.1908 8.76562 21.4045V19.5663ZM17.7257 15.3281C14.7444 15.5878 11.7469 15.5878 8.76562 15.3281V17.1663C11.0016 16.9526 13.2457 16.948 15.4857 17.0193C16.233 17.0468 16.9783 17.0882 17.7257 17.1663V15.3281Z"
                      fill="currentColor"
                    />
                  </svg>
                </div>
                <div className="text-block-5">Agents</div>
                <img
                  loading="lazy"
                  src="https://cdn.prod.website-files.com/60a72b60d39b330264639b88/60a72c5a96888593e4289673_Chevron%20Right.svg"
                  alt=""
                  className="chevron-black"
                />
                <img
                  loading="lazy"
                  src="https://cdn.prod.website-files.com/60a72b60d39b330264639b88/60a72eac56b0160c15ca29bc_Chevron%20Right%20White.svg"
                  alt=""
                  className="chevron-white"
                />
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('Publishing')}
                className={`faq-tab-link w-inline-block w-tab-link ${
                  activeTab === 'Publishing' ? 'w--current' : ''
                }`}
                style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
              >
                <div className="w-embed">
                  <svg
                    width="28"
                    height="28"
                    viewBox="0 0 28 28"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M19.3223 23.1785L19.3216 23.1792L16.6272 19.9524C14.1038 21.9761 10.2453 21.934 7.8187 19.8494C5.41866 17.9053 4.66758 14.3622 6.10416 11.653C8.19503 7.55872 13.9351 6.93724 16.6787 10.6677C17.4641 11.7251 17.8592 13.0187 17.8246 14.3262H14.957L21.0922 21.3842L27.5334 14.3262H24.8221C24.7367 10.05 22.3347 5.91248 18.6431 3.75489C12.3518 -0.0302098 3.993 2.53379 1.02926 9.27326C-1.25523 14.2685 0.373423 20.5411 4.82216 23.7313C9.05983 26.9509 15.3756 26.7231 19.3216 23.1792L19.3223 23.1801V23.1785ZM12.9164 3.86855C17.6618 3.58591 22.0575 7.12586 22.9085 11.7854C23.0303 12.4334 23.0756 13.0939 23.0568 13.7529L22.6883 13.7545C22.6446 13.1252 22.5572 12.5037 22.4119 11.8916C21.6812 8.84664 19.5075 6.17646 16.5938 4.98971C15.4382 4.51033 14.1875 4.25736 12.9242 4.24487L12.9164 3.87011V3.86855Z"
                      fill="currentColor"
                    />
                  </svg>
                </div>
                <div className="text-block-4">publishing</div>
                <img
                  loading="lazy"
                  src="https://cdn.prod.website-files.com/60a72b60d39b330264639b88/60a72c5a96888593e4289673_Chevron%20Right.svg"
                  alt=""
                  className="chevron-black"
                />
                <img
                  loading="lazy"
                  src="https://cdn.prod.website-files.com/60a72b60d39b330264639b88/60a72eac56b0160c15ca29bc_Chevron%20Right%20White.svg"
                  alt=""
                  className="chevron-white"
                />
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('General')}
                className={`faq-tab-link w-inline-block w-tab-link ${
                  activeTab === 'General' ? 'w--current' : ''
                }`}
                style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
              >
                <div className="w-embed">
                  <svg
                    width="28"
                    height="28"
                    viewBox="0 0 28 28"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M12 24C18.6274 24 24 18.6274 24 12C24 5.37258 18.6274 0 12 0C5.37258 0 0 5.37258 0 12C0 18.6274 5.37258 24 12 24ZM11.0885 18C11.0885 17.4966 11.4966 17.0885 12 17.0885H12.014C12.5174 17.0885 12.9255 17.4966 12.9255 18C12.9255 18.5034 12.5174 18.9115 12.014 18.9115H12C11.4966 18.9115 11.0885 18.5034 11.0885 18ZM16.5122 9.85106C16.5122 12.8186 14.3952 15.2242 11.7838 15.2242C11.5698 15.2242 11.3591 15.208 11.1526 15.1767V13.4257C11.3565 13.4786 11.568 13.5065 11.7849 13.5065C13.4467 13.5065 14.7939 11.8707 14.7939 9.85275C14.7939 7.83486 13.4467 6.19902 11.7849 6.19902C10.5626 6.19902 9.51051 7.08404 9.03953 8.35516L7.74324 7.05887C8.5732 5.51126 10.0723 4.47793 11.7838 4.47793C14.3952 4.47793 16.5122 6.88356 16.5122 9.85106Z"
                      fill="currentColor"
                    />
                  </svg>
                </div>
                <div className="text-block-6">general</div>
                <img
                  loading="lazy"
                  src="https://cdn.prod.website-files.com/60a72b60d39b330264639b88/60a72c5a96888593e4289673_Chevron%20Right.svg"
                  alt=""
                  className="chevron-black"
                />
                <img
                  loading="lazy"
                  src="https://cdn.prod.website-files.com/60a72b60d39b330264639b88/60a72eac56b0160c15ca29bc_Chevron%20Right%20White.svg"
                  alt=""
                  className="chevron-white"
                />
              </button>
            </div>

            {/* Tabs Content */}
            <div className="faq-tabs-content w-tab-content">
              <div className="faq-tab-pane w-tab-pane w--tab-active" style={{ display: 'block' }}>
                <div className="w-layout-grid faq-grid">
                  {faqsData[activeTab].map((item, idx) => {
                    const itemKey = `${activeTab}-${idx}`;
                    const isOpen = !!openItems[itemKey];

                    return (
                      <div key={idx} className="faq-block">
                        <div
                          className="faq-question-wrapper"
                          onClick={() => toggleItem(itemKey)}
                          style={{ cursor: 'pointer' }}
                        >
                          <h5 className="faq-title">{item.question}</h5>
                          <div className="accordian-icon-wrapper">
                            <div className="horizontal-line"></div>
                            <div
                              className="vertical-line"
                              style={{
                                transform: isOpen ? 'scale(0)' : 'scale(1)',
                                transition: 'transform 0.2s ease',
                              }}
                            ></div>
                          </div>
                        </div>
                        <div
                          style={{
                            maxHeight: isOpen ? '500px' : '0px',
                            overflow: 'hidden',
                            transition: 'max-height 0.3s ease, opacity 0.3s ease',
                            opacity: isOpen ? 1 : 0,
                          }}
                        >
                          <p className="faq-paragraph" style={{ height: 'auto', paddingTop: '10px' }}>
                            {item.answer}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
