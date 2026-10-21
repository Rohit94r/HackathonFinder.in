import type { Metadata } from 'next';
import { PageHero } from '@/components/ui';
import { termsHtml } from '@/data/legalData';

export const metadata: Metadata = {
  title: 'Terms of use',
  description: 'The terms for using HackathonFinder.',
};

export default function TermsPage() {
  return (
    <>
      <PageHero title="Terms" accent="of use" stickers={false} />
      <div className="container-page max-w-3xl py-12">
        <div className="prose-hf" dangerouslySetInnerHTML={{ __html: termsHtml }} />
      </div>
    </>
  );
}
