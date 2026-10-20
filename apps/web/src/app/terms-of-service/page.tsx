import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { termsOfServiceHtml } from '@/data/legalData';

export const metadata = {
  title: 'Terms of Service - HackathonFinder',
  description: 'The terms for using the HackathonFinder website and agent platform.',
};

export default function TermsOfServicePage() {
  return (
    <div className="body-home-page" style={{ background: '#f5f4ef' }}>
      <Navbar variant="off-white" />

      <main style={{ maxWidth: '980px', margin: '0 auto', padding: '60px 24px 100px' }}>
        <div
          className="rich-text-block w-richtext"
          dangerouslySetInnerHTML={{ __html: termsOfServiceHtml }}
        />
      </main>

      <Footer />
    </div>
  );
}
