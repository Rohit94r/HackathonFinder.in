import type { Metadata } from 'next';
import { PageHero } from '@/components/ui';
import { privacyHtml } from '@/data/legalData';

export const metadata: Metadata = {
  title: 'Privacy policy',
  description: 'What HackathonFinder collects, why, and the choices you have.',
};

export default function PrivacyPage() {
  return (
    <>
      <PageHero title="Privacy" accent="policy" stickers={false} />
      <div className="container-page max-w-3xl py-12">
        <div className="prose-hf" dangerouslySetInnerHTML={{ __html: privacyHtml }} />
      </div>
    </>
  );
}
