export interface CustomerStory {
  slug: string;
  href: string;
  title: string;
  image: string;
  heroImage: string;
  description: string;
  tag: string;
  contentHtml: string;
}

export const customersData: CustomerStory[] = [
  {
    slug: 'the-executive-narrative',
    href: '/customers/the-executive-narrative',
    title: 'The Executive Narrative: executive-grade content, written by agents.',
    image:
      'https://cdn.prod.website-files.com/635273ea37c256ef2835d522/65366ae62f51f2c63edd236f_Scene-illustration-2.cropped.svg',
    heroImage:
      'https://cdn.prod.website-files.com/635273ea37c256ef2835d522/65366ae62f51f2c63edd236f_Scene-illustration-2.cropped.svg',
    description:
      'How a content platform for Fortune 500 leaders is using HackathonFinder to research, write, check and publish across five content categories.',
    tag: 'First deployment',
    contentHtml:
      '<p>The Executive Narrative (TEN) publishes for C-level executives, VPs and directors at Fortune 500 companies. Its promise to readers is simple: save them time and give them insight they won’t find elsewhere.</p>' +
      '<h2>The challenge</h2>' +
      '<p>TEN already had a library of around 168 posts across six categories: Brief, Thinking, Room, Playbook, Decisions and Deep Dive. Growing that library meant either more writers or more AI, and off-the-shelf AI kept producing the same two problems:</p>' +
      '<ul role="list"><li><strong>Generic examples.</strong> The same Microsoft and Google case studies every executive has already read.</li><li><strong>Look-alike writing.</strong> Every paragraph shaped the same way, whatever the category.</li></ul>' +
      '<h2>The setup</h2>' +
      '<p>TEN is the first deployment of the full HackathonFinder pipeline:</p>' +
      '<ul role="list"><li>A <strong>news finder</strong> pulling topics by category from sources TEN approves.</li><li>A <strong>research agent</strong> tasked with non-obvious angles, such as a bootstrapped unicorn a US reader has never studied.</li><li>A <strong>writer</strong> using the founder’s personal persona and a fixed paragraph framework for each category.</li><li>A <strong>value check</strong> asking whether every draft adds value to an executive, with up to two rewrites.</li><li><strong>SEO, formatting, scheduling and publishing</strong> to the website and LinkedIn.</li></ul>' +
      '<h2>Your existing posts are the training data</h2>' +
      '<p>Rather than fine-tuning a model, the writer learns from TEN’s best existing posts in each category. The archive TEN had already built became the most valuable input in the system.</p>' +
      '<h2>What comes next</h2>' +
      '<p>Room, TEN’s scenario and interview category, stays manual for now. Next on the roadmap are an admin panel and multi-region sites: one database serving the Middle East, North America and India, each with content picked for that region.</p>',
  },
];
