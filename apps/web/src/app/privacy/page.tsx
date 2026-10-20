import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { privacyPolicyHtml } from '@/data/legalData';

export const metadata = {
  title: 'Privacy Policy - HackathonFinder',
  description: 'How HackathonFinder collects, uses and protects your data.',
};

export default function PrivacyPage() {
  return (
    <div className="body-home-page" style={{ background: '#f5f4ef' }}>
      <Navbar variant="off-white" />

      <main style={{ maxWidth: '980px', margin: '0 auto', padding: '60px 24px 100px' }}>
        <div
          className="rich-text-block w-richtext"
          dangerouslySetInnerHTML={{ __html: privacyPolicyHtml }}
        />
      </main>

      <Footer />
    </div>
  );
}
