import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';
import { PageHero } from '@/components/ui';
import { termsHtml } from '@/data/legalData';

export const metadata: Metadata = pageMetadata({
  title: 'Terms of use',
  description: 'The rules for using HackathonFinder: listings and accuracy, your account, what you post, Team Finder, event submissions and organizers.',
  path: '/terms',
});

export default function TermsPage() {
  return (
    <>
      <PageHero title="Terms" accent="of use" />
      <div className="container-page max-w-3xl py-12">
        <div className="prose-hf" dangerouslySetInnerHTML={{ __html: termsHtml }} />
      </div>
    </>
  );
}
