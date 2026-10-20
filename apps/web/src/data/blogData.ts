export interface BlogPost {
  slug: string;
  href: string;
  title: string;
  image: string;
  heroImage: string;
  description: string;
  date: string;
  author: string;
  tag: string;
  contentHtml: string;
}

const IMG = 'https://cdn.prod.website-files.com/655caab4568e7b2a2e48a236';

export const blogPostsData: BlogPost[] = [
  {
    slug: 'one-question-every-draft-must-answer',
    href: '/blog/one-question-every-draft-must-answer',
    title: 'One question every draft must answer: does this add value to an executive?',
    image: `${IMG}/6603eb0024f22fa86bb857c0_6-min.jpg`,
    heroImage: `${IMG}/6603eb0024f22fa86bb857c0_6-min.jpg`,
    description:
      'Why our pipeline has a dedicated value-check agent, how it decides, and why rewrites are capped at two.',
    date: 'October 2026',
    author: 'HackathonFinder Team',
    tag: 'Agents',
    contentHtml:
      '<p>Most AI content fails quietly. It is grammatically clean, roughly on topic and completely forgettable. For a reader who runs a Fortune 500 business, forgettable is worse than nothing, because it costs them time.</p>' +
      '<p>So every draft in our pipeline has to pass one test before it moves on: <strong>does this add value to an executive?</strong></p>' +
      '<h2>What the value check looks for</h2>' +
      '<ul role="list"><li><strong>Something new.</strong> An angle, a fact or a connection the reader is unlikely to have seen already.</li><li><strong>Something usable.</strong> A decision it informs, a question it sharpens or a framework it offers.</li><li><strong>No filler.</strong> Paragraphs that restate the headline or pad the word count are flagged.</li></ul>' +
      '<h2>What happens when a draft fails</h2>' +
      '<p>The draft goes back to the writer with specific notes: what was generic, what was missing and where the argument went soft. The writer revises and the value check runs again.</p>' +
      '<p>We cap this at <strong>two rewrites</strong>. A loop with no limit can burn through time and budget while polishing a topic that was never strong enough. If a story still fails after two passes, it is the story that is the problem, not the prose.</p>' +
      '<h2>Why a separate agent?</h2>' +
      '<p>A writer that grades its own work tends to be generous. Splitting writing and judging into two agents, each with its own instructions, gives you an honest second opinion on every single post.</p>',
  },
  {
    slug: 'five-categories-five-frameworks',
    href: '/blog/five-categories-five-frameworks',
    title: 'Five categories, five frameworks: why a Decision shouldn’t read like a Playbook',
    image: `${IMG}/6581ad208791bbe2ab69dbf1_4.jpg`,
    heroImage: `${IMG}/6581ad208791bbe2ab69dbf1_4.jpg`,
    description:
      'Generic AI writing makes every paragraph look the same. Giving each category its own structure fixes that.',
    date: 'October 2026',
    author: 'HackathonFinder Team',
    tag: 'Writing',
    contentHtml:
      '<p>Ask a general-purpose model for ten articles and you will get ten articles with the same shape: a hook, three tidy sections and a conclusion that starts with “In summary”. Readers notice, and executives notice fastest.</p>' +
      '<p>Our writer agent works differently. Each content category has its own template and paragraph framework, set together with the client.</p>' +
      '<h2>The five categories</h2>' +
      '<ul role="list"><li><strong>Brief.</strong> Short and fast. What happened in a deal, investment or merger, and why it matters.</li><li><strong>Thinking.</strong> An essay that takes a familiar leadership assumption and tests it.</li><li><strong>Playbook.</strong> A framework the reader can apply, laid out step by step.</li><li><strong>Decisions.</strong> One hard question, both sides argued, then a clear call.</li><li><strong>Deep Dive.</strong> A company analysis that goes well past the press release.</li></ul>' +
      '<h2>Persona, then structure</h2>' +
      '<p>The framework controls structure. The persona controls voice. Together they mean a Decisions post reads like someone weighing a real choice, and a Playbook reads like someone who has done the work before.</p>' +
      '<p>The result is a library that feels written by one person with a clear point of view, not by a machine with a template.</p>',
  },
  {
    slug: 'skip-the-microsoft-case-study',
    href: '/blog/skip-the-microsoft-case-study',
    title: 'Skip the Microsoft case study: how our research agent finds the non-obvious angle',
    image: `${IMG}/6560c4185100adef7d3b08a5_post-sustainability-min-2.webp`,
    heroImage: `${IMG}/6560c4185100adef7d3b08a5_post-sustainability-min-2.webp`,
    description:
      'Executives have read every Microsoft and Google story. The research agent is built to find the companies and angles they haven’t.',
    date: 'October 2026',
    author: 'HackathonFinder Team',
    tag: 'Research',
    contentHtml:
      '<p>If your article on platform strategy leads with Microsoft, your reader has already stopped reading. They know that story. They may have lived it.</p>' +
      '<p>The research agent is instructed to treat famous examples as a last resort. Its job is to find the case your reader has not studied.</p>' +
      '<h2>What a better angle looks like</h2>' +
      '<p>Take Zoho. It reached unicorn scale without venture funding, which is a sharp contrast to the usual Silicon Valley path. For a US executive, that is a genuinely new data point on how to grow, and it makes the whole argument more interesting.</p>' +
      '<h2>How the agent searches</h2>' +
      '<ul role="list"><li>It starts from the topic the news finder ranked, not from a list of famous companies.</li><li>It looks across regions, especially markets your readers follow less closely.</li><li>It collects the sources behind every claim, so the writer and the value check can verify them.</li></ul>' +
      '<h2>Why it matters</h2>' +
      '<p>Depth is the difference between content an executive skims and content they forward to their team. Research is where that depth comes from, so it gets its own agent.</p>',
  },
  {
    slug: 'why-we-dont-fine-tune',
    href: '/blog/why-we-dont-fine-tune',
    title: 'Why we don’t fine-tune: prompts, examples and templates beat custom models',
    image: `${IMG}/67fe412df4cfcf59ced36517_openart-cbc228439499450b846aaabf4272fd58_raw.png`,
    heroImage: `${IMG}/67fe412df4cfcf59ced36517_openart-cbc228439499450b846aaabf4272fd58_raw.png`,
    description:
      'Fine-tuning sounds like the serious option. For writing in a client’s voice, it is usually slower, costlier and worse.',
    date: 'October 2026',
    author: 'HackathonFinder Team',
    tag: 'Engineering',
    contentHtml:
      '<p>When clients hear “AI that writes in your voice”, many assume we train a custom model on their content. We don’t, and that is deliberate.</p>' +
      '<h2>What we do instead</h2>' +
      '<ul role="list"><li><strong>Strong prompts</strong> that describe the persona, the audience and the quality bar.</li><li><strong>A template per category</strong>, so structure is fixed rather than guessed.</li><li><strong>Few-shot examples</strong> taken from the client’s best existing posts.</li></ul>' +
      '<h2>Why this wins</h2>' +
      '<p><strong>It is faster.</strong> A new client can be writing in their own voice within days, not after weeks of data preparation and training runs.</p>' +
      '<p><strong>It is easier to change.</strong> If the persona or a framework changes, we edit a prompt. We don’t retrain a model.</p>' +
      '<p><strong>It runs anywhere.</strong> The agents call leading API models, so the orchestrator can run on a small server. No GPU cluster needed.</p>' +
      '<p><strong>It gets better results.</strong> Today’s frontier models, given good examples, beat a small fine-tuned model on nuance and reasoning.</p>' +
      '<h2>Your archive is the training data</h2>' +
      '<p>The best few posts in each category become the examples the writer learns from. The content you already published is the most valuable input in the whole system.</p>',
  },
  {
    slug: 'auto-posting-to-linkedin-what-it-takes',
    href: '/blog/auto-posting-to-linkedin-what-it-takes',
    title: 'Auto-posting to LinkedIn: what it really takes',
    image: `${IMG}/65df3ab725c42af67446f79b_effect-min.jpg`,
    heroImage: `${IMG}/65df3ab725c42af67446f79b_effect-min.jpg`,
    description:
      'Personal profiles, company pages, API approval and a fallback that keeps you publishing while you wait.',
    date: 'October 2026',
    author: 'HackathonFinder Team',
    tag: 'Publishing',
    contentHtml:
      '<p>Publishing a post to your website is simple: it is your site. LinkedIn is someone else’s platform, with its own rules about who can post and how.</p>' +
      '<h2>Personal profile or company page?</h2>' +
      '<p>Posting to a <strong>personal profile</strong> works through LinkedIn’s official API once the account owner connects it and grants posting permission. This is the fastest route to automated posting.</p>' +
      '<p>Posting to a <strong>company page</strong> needs LinkedIn to approve the app first. That review can take days, and approval isn’t guaranteed.</p>' +
      '<h2>Our approach: output first, API second</h2>' +
      '<p>The publisher always produces a LinkedIn-ready version of every post, rewritten for the feed rather than pasted from the blog. If the API is connected, it posts at the scheduled time. If not, you get the finished text and publish it in one click.</p>' +
      '<p>Either way the queue, the timing and the content are the same. The connection is the only thing that changes.</p>' +
      '<h2>Why the rewrite matters</h2>' +
      '<p>A blog post and a LinkedIn post are read differently. The LinkedIn version leads with the sharpest insight, keeps paragraphs short and ends with a reason to click through.</p>',
  },
];
