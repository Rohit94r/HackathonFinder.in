import { postIsoDate } from './blogData';

export type NewsCategorySlug = 'ai-models' | 'skills-careers' | 'market-trends' | 'hackathon-world';

export interface NewsCategory {
  slug: NewsCategorySlug;
  name: string;
  description: string;
}

/** The four desks the news hub is organised around. */
export const NEWS_CATEGORIES: NewsCategory[] = [
  {
    slug: 'ai-models',
    name: 'AI & models',
    description: 'How new models and agent tooling change what a student team can build in a weekend.',
  },
  {
    slug: 'skills-careers',
    name: 'Skills & careers',
    description: 'What internships and entry-level roles keep asking for, and how to prove it outside a resume.',
  },
  {
    slug: 'market-trends',
    name: 'Market trends',
    description: 'Where the industry is moving, translated into what it means for your next project.',
  },
  {
    slug: 'hackathon-world',
    name: 'Hackathon world',
    description: 'Formats, tracks, judging and the patterns showing up across the events we track.',
  },
];

export interface NewsPost {
  slug: string;
  title: string;
  /** Standfirst: also the meta description, so keep it under ~160 characters. */
  dek: string;
  category: NewsCategorySlug;
  author: string;
  date: string;
  updated?: string;
  readMinutes: number;
  contentHtml: string;
  keywords?: string[];
  faqs?: { q: string; a: string }[];
  /** Shown in the trending strip on the hub. */
  trending?: boolean;
}

const POSTS: NewsPost[] = [
  {
    slug: 'choosing-an-ai-model',
    title: 'How to choose an AI model for a hackathon build',
    dek: 'Hosted or open-weight, big or small: a practical way to pick a model for a 36-hour build, and the mistakes that eat demo time.',
    category: 'ai-models',
    author: 'HackathonFinder Team',
    date: '6 Nov 2026',
    readMinutes: 6,
    trending: true,
    keywords: ['how to choose an AI model', 'AI models for hackathons', 'hosted vs open weight models', 'LLM for a hackathon project', 'AI hackathon project'],
    faqs: [
      {
        q: 'Which AI model should I use for a hackathon project?',
        a: 'Start from the task, not a leaderboard. If you need the best possible quality and have a key, use a hosted frontier model. If you need data control, offline demos or no per-call cost, use an open-weight model you can run yourself. Whichever you pick, test it on twenty real examples before you build the interface.',
      },
      {
        q: 'Do I need to train or fine-tune a model for a hackathon?',
        a: 'Almost never. Prompting and retrieval get most teams further in a weekend, and they are easier to explain in a demo. Fine-tuning makes sense when you have a narrow, repetitive task and a few hundred clean examples, which is rare at a hackathon.',
      },
      {
        q: 'What if the model is slow or fails during the demo?',
        a: 'Design for failure before you present: cache a good response, keep a recorded backup, set a client-side timeout with a readable fallback message, and never make a live API call the only way to reach the important screen.',
      },
    ],
    contentHtml: `<p>Every hackathon now has a team that spends six hours wiring model keys and two hours building the actual product. Choosing a model is a real decision, but it is a small one compared with choosing what the product does. This is a practical way to make the choice quickly and move on.</p>
<h2>The model is not the product</h2>
<p>Judges are not scoring your model choice. They are scoring whether a user's problem goes away. A modest model applied to a specific, well-understood task beats a frontier model wrapped around a vague chat box, every time. Pick a model that is good enough for your task and cheap enough to iterate on, then spend the remaining hours on the flow around it.</p>
<h2>Judge a model on your own twenty examples</h2>
<p>Leaderboards measure general benchmarks, not your problem. Before you commit, collect about twenty realistic inputs: real documents, messages, screenshots or queries from the domain you are building for. Run them through two candidate models and read the outputs yourself. You will usually find that one model consistently handles the shape of your data better, and that matters more than a few points on a public score.</p>
<h2>The four axes that actually decide it</h2>
<ul>
<li><strong>Quality on your task.</strong> Does the output need to be exact, or merely useful? Extraction and classification are unforgiving; drafting and summarising are not.</li>
<li><strong>Latency.</strong> A demo that waits eight seconds per action feels broken. If your interface needs three calls per screen, latency compounds.</li>
<li><strong>Cost.</strong> Free tiers and credits run out at the worst moment. Know what a full demo run costs and keep a fallback.</li>
<li><strong>Control.</strong> Do you need the data to stay on your machine, the model to work offline, or the output to be reproducible? That pushes you towards open weights.</li>
</ul>
<h2>Hosted models: fastest to a working demo</h2>
<p>A hosted model from a provider is almost always the quickest path. You get strong quality, no hardware and a single API key. The trade-offs are rate limits, network dependence and cost that scales with your demo. Practical rules: keep keys server-side, set a timeout on every call, and cache the response you want to show on stage so a bad connection cannot sink you.</p>
<h2>Open-weight models: control and offline demos</h2>
<p>Open-weight models are downloaded and run by you, either on your laptop or on a rented GPU. They are the right pick when the project must work without internet, when the data cannot leave the room, or when you want to show that the whole system runs locally. Budget real time for setup: downloading weights, matching a runtime to your hardware and getting a reasonable tokens-per-second rate is an afternoon, not ten minutes, on a laptop without a discrete GPU.</p>
<h2>Small local models: the underrated option</h2>
<p>For classification, tagging, simple extraction and short rewrites, a small local model can be fast enough and surprisingly good. It also makes a strong demo: no key, no bill, no dependency on conference Wi-Fi. The honest limit is reasoning depth. If the task needs multi-step reasoning over long documents, a small model will frustrate you.</p>
<h2>Structured output beats beautiful prose</h2>
<p>Most useful hackathon projects need fields, not paragraphs: a date, an amount, a category, a status. Ask for JSON with a fixed schema, validate it, and handle the case where the model returns something malformed. A screen that renders clean structured data looks far more finished than a chat transcript, and it is easier to test.</p>
<h2>Design the failure path first</h2>
<p>Anything that calls a model will fail sometimes. Decide now what the user sees when it does: a retry button, a cached result, a plain fallback message, or a manual override. Teams that show a graceful failure look more experienced than teams that pretend failure does not happen.</p>
<h2>What to say in the pitch</h2>
<p>One sentence on the model is enough: what it does, why you chose it and what you measured. For example: "We use a hosted model for extraction because our evaluation set showed it read handwritten bills better than the smaller local one, and we cache every result so the demo works offline." That answers the technical question and shows judgement at the same time.</p>
<h2>Frequently asked questions</h2>
<h3>Which AI model should I use for a hackathon project?</h3>
<p>Start from the task, not a leaderboard. If you need the best possible quality and have a key, use a hosted frontier model. If you need data control, offline demos or no per-call cost, use an open-weight model you can run yourself. Whichever you pick, test it on twenty real examples before you build the interface.</p>
<h3>Do I need to train or fine-tune a model for a hackathon?</h3>
<p>Almost never. Prompting and retrieval get most teams further in a weekend, and they are easier to explain in a demo. Fine-tuning makes sense when you have a narrow, repetitive task and a few hundred clean examples, which is rare at a hackathon.</p>
<h3>What if the model is slow or fails during the demo?</h3>
<p>Design for failure before you present: cache a good response, keep a recorded backup, set a client-side timeout with a readable fallback message, and never make a live API call the only way to reach the important screen.</p>`,
  },
  {
    slug: 'agentic-ai-explained',
    title: 'Agentic AI, explained for student builders',
    dek: 'What an “agent” actually is, where tool calling helps a project, and how to demo one without a live failure on stage.',
    category: 'ai-models',
    author: 'HackathonFinder Team',
    date: '3 Nov 2026',
    readMinutes: 6,
    trending: true,
    keywords: ['what is agentic AI', 'AI agents explained', 'tool calling', 'agent hackathon project', 'agentic AI project ideas'],
    faqs: [
      {
        q: 'What is an AI agent in simple terms?',
        a: 'A model that can take actions in a loop rather than answer once. It plans a step, calls a tool such as a search, database or calculator, looks at the result and decides what to do next until the task is done or it gives up.',
      },
      {
        q: 'Are agents a good hackathon project?',
        a: 'They can be, if the task is repetitive, multi-step and easy to check. Order tracking, document triage and research summaries work well. Tasks with no clear success condition make a demo that rambles, which judges read as unfinished.',
      },
    ],
    contentHtml: `<p>“Agentic AI” has become the most overloaded phrase in student projects. Sometimes it means a model that can call functions. Sometimes it means a workflow with three prompts and a loop. Sometimes it means a chatbot with a landing page. Here is a working definition and a way to build something that holds up under questioning.</p>
<h2>A model answers. An agent acts.</h2>
<p>A plain model takes input and returns output. An agent adds a loop around that: it looks at the goal, chooses an action, runs it through a tool, reads the result and continues. The tool is the important part, because it is where the agent touches something real: a database, a calendar, a search index, a file system or an API.</p>
<blockquote>If removing the loop leaves a working product, you do not have an agent. You have a model call with extra steps, and that is often the better design.</blockquote>
<h2>The loop, in four parts</h2>
<ol>
<li><strong>Goal and state.</strong> What is the user trying to finish, and what does the agent already know?</li>
<li><strong>Tool choice.</strong> A small, well-described set of actions. More tools make the agent less reliable, not more capable.</li>
<li><strong>Observation.</strong> The result of the action, trimmed to what the model needs. Dumping an entire API response into context wastes tokens and confuses the next step.</li>
<li><strong>Stop condition.</strong> Success, a hard step limit or a timeout. Without one, agents loop, and loops are the worst thing to debug at 3 a.m.</li>
</ol>
<h2>Where tool calling genuinely helps</h2>
<ul>
<li><strong>Multi-step lookups.</strong> Search, then open the most relevant record, then summarise the fields that matter.</li>
<li><strong>Actions with side effects.</strong> Creating a ticket, drafting an email, adding a calendar entry, filling a form.</li>
<li><strong>Messy input, clean output.</strong> Read a document, pull the fields, validate them and write a row to a table.</li>
</ul>
<p>In each case the tool makes the result checkable. That is what makes a demo convincing: the judge can see the record appear, not just read a paragraph claiming it did.</p>
<h2>Where agents make a project worse</h2>
<p>Open-ended research assistants, autonomous “do anything” assistants and multi-agent debates look impressive in a diagram and often produce nothing verifiable. They also fail in ways that are hard to explain to a judge. If the task has no clear success condition, a single well-prompted call with a good interface usually demos better.</p>
<h2>Guardrails you can actually build in a day</h2>
<ol>
<li><strong>Step limit.</strong> Cap the loop at four or five actions and show a clean message when it hits the cap.</li>
<li><strong>Allow-list.</strong> The agent may only call tools you defined. Never let it construct arbitrary URLs or shell commands.</li>
<li><strong>Confirm before side effects.</strong> Anything that sends, pays or deletes asks the user first. Judges notice good judgement.</li>
<li><strong>Log the trace.</strong> Show the steps the agent took in a small panel. It makes the demo legible and helps you debug.</li>
</ol>
<h2>How to demo an agent without a live disaster</h2>
<p>Agents are non-deterministic, which is a terrible property for a stage demo. Record a successful run, keep a deterministic replay for the live walkthrough, and show the trace panel so the audience can see why each step happened. Then explain, in one sentence, what the agent does that a single call could not.</p>
<h2>What judges ask about agents</h2>
<p>Expect three questions: what happens when a tool fails, how you stop runaway loops, and what the agent does that a normal function could not. Prepare a short answer for each. Teams that can explain the stop condition and the failure path sound like they have shipped software before, which is exactly the impression you want.</p>
<h2>Frequently asked questions</h2>
<h3>What is an AI agent in simple terms?</h3>
<p>A model that can take actions in a loop rather than answer once. It plans a step, calls a tool such as a search, database or calculator, looks at the result and decides what to do next until the task is done or it gives up.</p>
<h3>Are agents a good hackathon project?</h3>
<p>They can be, if the task is repetitive, multi-step and easy to check. Order tracking, document triage and research summaries work well. Tasks with no clear success condition make a demo that rambles, which judges read as unfinished.</p>`,
  },
  {
    slug: 'open-weight-vs-hosted-models',
    title: 'Open-weight vs hosted models: which should you ship?',
    dek: 'Setup time, data control, cost at demo scale and the questions judges ask: how to choose where your model actually runs.',
    category: 'ai-models',
    author: 'HackathonFinder Team',
    date: '1 Nov 2026',
    readMinutes: 5,
    keywords: ['open weight models', 'hosted AI models', 'local LLM', 'run a model locally', 'AI deployment choices'],
    contentHtml: `<p>Once you know what your project should do, there is a second decision: does the model run on someone else's servers or on hardware you control? It is a trade-off between speed to build and control over the result, and it is worth ten minutes of thought before you write any code.</p>
<h2>What the choice really is</h2>
<p>A hosted model is an API call: you send input, you get output, you pay per token. An open-weight model is a file you download and run yourself, on a laptop, a lab machine or a rented GPU. Both can be excellent. The difference is who owns the operational problems.</p>
<h2>Pick hosted when speed matters most</h2>
<ul>
<li><strong>You want to build in the first hour.</strong> A key and an HTTP call is the shortest path to a working screen.</li>
<li><strong>Quality on hard tasks is the point.</strong> Hosted frontier models still handle messy reasoning and long documents more reliably than what most laptops can run.</li>
<li><strong>You have credits.</strong> Many providers give student or hackathon credits, which usually covers a weekend comfortably.</li>
</ul>
<p>The costs to plan for are rate limits during a live demo, a network that may not cooperate, and keys that must never end up in client-side code. Keep every call on the server and set a timeout.</p>
<h2>Pick open weights when control matters most</h2>
<ul>
<li><strong>The data cannot leave the machine.</strong> Health, legal and internal documents are common examples, and judges respect the reasoning.</li>
<li><strong>The demo must work offline.</strong> A local model plus a local database is a genuinely impressive demo when the venue Wi-Fi dies.</li>
<li><strong>You want no per-call bill.</strong> After setup, running is free at the margin, which suits a project you plan to keep.</li>
</ul>
<p>Budget for setup: choosing a runtime, downloading weights, matching quantisation to available memory and measuring tokens per second. On a laptop without a discrete GPU, expect modest speed; keep prompts short and the task narrow.</p>
<h2>The hybrid pattern most teams should use</h2>
<p>Use a hosted model for the hard, occasional call and a small local model for the frequent, easy one. For example: a local model tags incoming messages, while a hosted model drafts the reply for the three messages that need one. You get speed where it is cheap and quality where it counts, and the architecture slide becomes genuinely interesting.</p>
<h2>A five-minute decision checklist</h2>
<ol>
<li>Does the task need reasoning over long input? If yes, hosted or a larger open model.</li>
<li>Must it work without internet? If yes, open weights.</li>
<li>Is there sensitive data in the demo? If yes, open weights or a strict data policy.</li>
<li>How many calls will one demo run make? Multiply by your budget.</li>
<li>What is the fallback if the model is unavailable? Write it down before you build.</li>
</ol>
<h2>What judges ask about deployment</h2>
<p>They rarely ask which model you used. They ask what happens when it is wrong, what it costs to run and whether the user's data is safe. A short, honest answer to those three questions is worth more than a benchmark table.</p>
<p>If you are still choosing what to build, our <a href="/blog/hackathon-project-ideas">hackathon project ideas guide</a> pairs well with this one. And once the stack is decided, <a href="/blog/pitch-your-project-in-three-minutes">the pitch</a> should explain the choice in one sentence, not five slides.</p>`,
  },
  {
    slug: 'skills-tech-jobs-ask-for',
    title: 'The skills 2026 tech job listings keep asking for',
    dek: 'Beyond a language or framework: the requirements that repeat across internship listings, and how to prove each one at a hackathon.',
    category: 'skills-careers',
    author: 'HackathonFinder Team',
    date: '29 Oct 2026',
    readMinutes: 6,
    keywords: ['skills for tech jobs', 'internship skills', 'skills employers want 2026', 'entry level developer skills', 'how to get an internship'],
    faqs: [
      {
        q: 'What skills do tech internships look for?',
        a: 'Comfort with one language and its ecosystem, basic data structures, Git and debugging, the ability to read documentation, and clear written communication. AI literacy is increasingly listed too: knowing when a model helps, how to evaluate its output and where it fails.',
      },
      {
        q: 'Can hackathons replace an internship on a resume?',
        a: 'No, but they are strong evidence for the same skills. A finished project with a public repo, a demo and a clear explanation of trade-offs gives an interviewer something concrete to discuss, which is what most students lack.',
      },
    ],
    contentHtml: `<p>Job listings are noisy, but the requirements repeat. Across internship and entry-level engineering listings, the same handful of skills shows up far more often than any particular framework. The useful question is not “which technology is hot” but “which of these can I actually demonstrate”.</p>
<h2>Fundamentals that never leave the list</h2>
<ul>
<li><strong>One language, properly.</strong> Not five at hello-world level. One language where you can read errors, write tests and explain memory or async behaviour when asked.</li>
<li><strong>Basic data structures and complexity.</strong> Enough to choose a map over a nested loop and say why.</li>
<li><strong>Git beyond <em>commit and push</em>.</strong> Branches, resolving a conflict and reading a diff are day-one expectations.</li>
<li><strong>Debugging method.</strong> Reproduce, isolate, read the stack, form a hypothesis, test it. Interviewers can hear this in how you describe a bug.</li>
</ul>
<h2>Shipping something end to end</h2>
<p>The most common gap in student resumes is not knowledge, it is proof of finishing. Internship teams want someone who can take a small feature from idea to deployed, including the boring parts: environment variables, error states, a simple deploy and a README someone else can follow. A hackathon project is the cheapest way to practise exactly that.</p>
<h2>Reading and writing documentation</h2>
<p>Most real work is reading docs and figuring out which version applies. Practise by integrating an unfamiliar API with only its documentation, no tutorial. Then write your own README with the setup steps you wish existed. This is also one of the easiest things for an interviewer to check on your repo.</p>
<h2>Data literacy</h2>
<p>Enough SQL to answer a question, enough statistics to avoid fooling yourself, and enough spreadsheet sense to clean a messy file. In practice: can you take a raw export, find the rows that are wrong and explain what you did about it?</p>
<h2>AI literacy is now a line item</h2>
<p>Listings increasingly mention AI tools, and the useful skill is not prompt trivia. It is knowing when a model helps, how to check its output, how to keep cost and latency sane, and how to keep data safe. Our guide to <a href="/news/choosing-an-ai-model">choosing a model for a build</a> is a good starting point, and a project that uses one responsibly is better evidence than a certificate.</p>
<h2>Communication is the multiplier</h2>
<p>You will explain your work more often than you will write it. Two habits matter: writing a short update that says what changed, what is blocked and what is next; and demoing without narrating your file structure. The <a href="/blog/pitch-your-project-in-three-minutes">three-minute pitch structure</a> is the same skill in a different room.</p>
<h2>How to prove each skill at a hackathon</h2>
<ol>
<li><strong>Pick one event</strong> from <a href="/hackathons">the hackathons list</a> where you can finish something small.</li>
<li><strong>Write the README first</strong> and keep it updated as you build.</li>
<li><strong>Use Git properly</strong>, with real commit messages and a branch per feature.</li>
<li><strong>Add one test</strong> or one validation script. One is enough to show the habit.</li>
<li><strong>Record a two-minute demo</strong> and put it in the README.</li>
<li><strong>Write a short retro</strong> after the event: what you cut, what broke, what you would do next.</li>
</ol>
<p>That package beats a list of technologies on a resume, because it gives an interviewer something to ask about and you something to answer with. Add it to your profile and keep the project link current; <a href="/wins">winning stories</a> show how other students turned a weekend into a resume line.</p>
<h2>Frequently asked questions</h2>
<h3>What skills do tech internships look for?</h3>
<p>Comfort with one language and its ecosystem, basic data structures, Git and debugging, the ability to read documentation, and clear written communication. AI literacy is increasingly listed too: knowing when a model helps, how to evaluate its output and where it fails.</p>
<h3>Can hackathons replace an internship on a resume?</h3>
<p>No, but they are strong evidence for the same skills. A finished project with a public repo, a demo and a clear explanation of trade-offs gives an interviewer something concrete to discuss, which is what most students lack.</p>`,
  },
  {
    slug: 'ai-wrapper-projects',
    title: 'Why thin AI wrappers stopped winning hackathons',
    dek: 'Judges have seen the chat box. What separates an AI product from a prompt with a landing page, and how to show it in a demo.',
    category: 'market-trends',
    author: 'HackathonFinder Team',
    date: '26 Oct 2026',
    readMinutes: 5,
    trending: true,
    keywords: ['AI wrapper', 'AI product vs wrapper', 'AI hackathon project', 'chatbot project', 'AI startup trends'],
    faqs: [
      {
        q: 'What is an AI wrapper?',
        a: 'A product whose only real function is passing user input to a general model with a prompt, then showing the reply. It usually has no own data, no workflow, no evaluation and nothing that improves with use, which is why judges discount it.',
      },
      {
        q: 'Is it bad to build on top of a model?',
        a: 'No. Every AI product builds on a model. The difference is what you add around it: domain data, a specific workflow, checks on the output, and a reason the model alone would not solve the user’s problem.',
      },
    ],
    contentHtml: `<p>Two years of AI hackathons produced a recognisable genre: a landing page, a text box, a generic model reply and a pitch about disruption. Judges have now seen hundreds of them. The result is not that AI projects are unwelcome. It is that the bar for calling something a product moved.</p>
<h2>What makes a wrapper a wrapper</h2>
<ul>
<li><strong>No own data.</strong> Everything the model knows came from pre-training or from what the user typed.</li>
<li><strong>No workflow.</strong> One input, one output, no state, no history, no follow-through.</li>
<li><strong>No evaluation.</strong> Nobody can say how often the output is right.</li>
<li><strong>No failure design.</strong> When the model is wrong, the user has no way to notice or correct it.</li>
</ul>
<p>Any one of these is fixable in a weekend. All four together is why the demo feels thin.</p>
<h2>What judges are actually comparing</h2>
<p>They are not comparing model quality; they assume it is adequate. They are comparing the decisions around it: did the team understand the user, scope the problem, handle the edge cases and measure anything? A wrapper gives them nothing to ask about. A product gives them three questions and a conversation.</p>
<h2>Four ways to add depth without adding weeks</h2>
<h3>1. Bring data the model does not have</h3>
<p>A small, curated dataset from the domain beats a bigger prompt. Twenty real examples of the documents, messages or records you are handling, cleaned and indexed, make the output specific and the demo credible.</p>
<h3>2. Own the workflow, not just the answer</h3>
<p>Show state: a queue that shrinks, a ticket that moves, a draft that waits for approval. Workflow is where trust is built, and it is easy to demo because the screen changes.</p>
<h3>3. Measure something</h3>
<p>Even a hand-labelled set of thirty examples with precision or accuracy is enough. Saying “it got 27 of 30 right and here are the three failures” is more impressive than any claim of accuracy, because it shows you checked.</p>
<h3>4. Design the correction</h3>
<p>Let the user fix a wrong field, flag a bad output or override a decision. Products assume the model will be wrong; wrappers assume it will not.</p>
<h2>Make the depth visible on stage</h2>
<p>The mistake is building depth and then demoing the chat box. Show the part that is yours: the clean data panel, the trace, the evaluation numbers, the approval step. One slide with three real failure cases and what you did about them will land harder than a roadmap slide.</p>
<h2>When a wrapper is the right call</h2>
<p>If your event is three hours long, the goal is learning or the interface is genuinely novel, a simple, well-designed wrapper can still be a good project. Just do not claim it is more than it is. Judges reward honest scope far more than inflated language, and an accurate “this is a prototype of one flow” beats a pitch about a platform you did not build.</p>
<p>For a project shape that avoids these traps, see our <a href="/blog/hackathon-project-ideas">project ideas guide</a>; for the pitch itself, use the <a href="/blog/pitch-your-project-in-three-minutes">three-minute structure</a>.</p>
<h2>Frequently asked questions</h2>
<h3>What is an AI wrapper?</h3>
<p>A product whose only real function is passing user input to a general model with a prompt, then showing the reply. It usually has no own data, no workflow, no evaluation and nothing that improves with use, which is why judges discount it.</p>
<h3>Is it bad to build on top of a model?</h3>
<p>No. Every AI product builds on a model. The difference is what you add around it: domain data, a specific workflow, checks on the output, and a reason the model alone would not solve the user’s problem.</p>`,
  },
  {
    slug: 'hackathon-trends',
    title: 'Hackathon trends to watch in 2026',
    dek: 'AI tooling, sponsor tracks, shorter formats and hybrid judging: the patterns showing up across student hackathons this year.',
    category: 'hackathon-world',
    author: 'HackathonFinder Team',
    date: '23 Oct 2026',
    readMinutes: 6,
    keywords: ['hackathon trends', 'hackathon trends 2026', 'student hackathons', 'hackathon formats', 'hackathon judging'],
    faqs: [
      {
        q: 'What are the biggest hackathon trends right now?',
        a: 'AI-assisted builds are everywhere, sponsor and API tracks carry more of the prize money, more events run an online qualifier before a shorter in-person final, and teams are expected to explain trade-offs and failures rather than only show a happy path.',
      },
      {
        q: 'Are online hackathons still worth joining?',
        a: 'Yes, especially as qualifiers and for students who cannot travel. They reward clear documentation and a recorded demo more than a live stage, so treat the submission as a product artefact rather than an afterthought.',
      },
    ],
    contentHtml: `<p>Hackathons change more slowly than the technology around them, but the format does move. Across the events listed on HackathonFinder, a few patterns keep showing up this year. Treat them as observations from the listings and the winning stories we see, not as rules.</p>
<h2>1. AI is assumed, not the theme</h2>
<p>A couple of years ago an AI track was a novelty. Now most events expect teams to use AI tools somewhere, and fewer events are “AI-only”. The interesting shift is in judging: the question moved from “did you use a model” to “what did you do that the model could not”. Our piece on <a href="/news/ai-wrapper-projects">why thin AI wrappers stopped winning</a> goes deeper on that.</p>
<h2>2. Sponsor and API tracks carry the money</h2>
<p>Total prize pools are increasingly split across sponsored tracks: best use of a platform, a cloud service or a dataset. Practically, that means a team that cannot win overall can still win a track by reading the sponsor’s criteria carefully and building directly against them. Read the track descriptions before you choose an idea, not after.</p>
<h2>3. Qualifiers, then a shorter final</h2>
<p>More events now run an online idea or prototype round before a shorter in-person final. That changes preparation: the first submission is often a deck and a short video rather than working code, and the build time at the venue may be a day or less. Check what each round actually requires, because a strong idea round can carry you even if your build time is tight.</p>
<h2>4. Documentation and demos are part of the score</h2>
<p>Judges increasingly reward a clear README, a recorded demo and an honest list of limitations. This is good news for careful teams: a small project that is easy to verify beats an ambitious one that cannot be explained. Keep the repo tidy and record the demo before the deadline pressure hits.</p>
<h2>5. Teams form earlier and across colleges</h2>
<p>Team-finding now happens weeks before registration closes, and mixed-college teams are common at online events. If you are looking for people, post early with your skills, city and the event you have in mind on the <a href="/teams">Team Finder board</a>. Waiting until the week of the event narrows your options sharply.</p>
<h2>6. Prizes are shifting towards opportunities</h2>
<p>Internship interviews, mentorship and credits now appear alongside cash in many listings. For students, the non-cash prize is often worth more, especially at company-run events where recruiters are watching. Our guide to <a href="/blog/hackathons-with-prizes">what hackathons actually award</a> breaks down the trade-offs.</p>
<h2>7. Hybrid judging is normal</h2>
<p>Many events combine an online submission with a live or recorded pitch, and some use judges who never meet the team. That favours clarity over stage presence: a written summary, a clean demo video and a repo that runs without you. Assume the person judging your work cannot ask you a question.</p>
<h2>What this means for your next event</h2>
<ol>
<li><strong>Read the rounds and the criteria</strong> before choosing an idea. The format is part of the brief.</li>
<li><strong>Pick a track you can win</strong>, not just the biggest overall prize.</li>
<li><strong>Build the demo path first</strong> and record it early.</li>
<li><strong>Write things down</strong>: README, limitations, evaluation, next steps.</li>
<li><strong>Form the team early</strong> and agree on the split and the schedule.</li>
</ol>
<p>Filter <a href="/hackathons">open hackathons</a> by format, theme and deadline to see what is running near you, and use the <a href="/calendar">calendar</a> to avoid clashes with exams.</p>
<h2>Frequently asked questions</h2>
<h3>What are the biggest hackathon trends right now?</h3>
<p>AI-assisted builds are everywhere, sponsor and API tracks carry more of the prize money, more events run an online qualifier before a shorter in-person final, and teams are expected to explain trade-offs and failures rather than only show a happy path.</p>
<h3>Are online hackathons still worth joining?</h3>
<p>Yes, especially as qualifiers and for students who cannot travel. They reward clear documentation and a recorded demo more than a live stage, so treat the submission as a product artefact rather than an afterthought.</p>`,
  },
];

/** Every briefing, newest first. */
export const newsPosts: NewsPost[] = [...POSTS].sort(
  (a, b) => Date.parse(postIsoDate(b.date)) - Date.parse(postIsoDate(a.date))
);

export function newsCategory(slug: string): NewsCategory | undefined {
  return NEWS_CATEGORIES.find((c) => c.slug === slug);
}

export function newsPost(slug: string): NewsPost | undefined {
  return newsPosts.find((p) => p.slug === slug);
}

/** ISO date for sitemaps and structured data. */
export function newsIsoDate(date: string): string {
  return postIsoDate(date);
}
