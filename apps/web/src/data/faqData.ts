export interface FaqItem {
  q: string;
  a: string;
}

export const studentFaqs: FaqItem[] = [
  {
    q: 'What is HackathonFinder?',
    a: 'A free website that finds hackathons from Unstop, Devfolio, Devpost, Instagram, LinkedIn, Google, college websites and more, and shows them in one place. You search once instead of checking ten sites.',
  },
  {
    q: 'Do I register on HackathonFinder?',
    a: 'No. We don’t host events or take registrations. Every listing has a “Register on official site” button that takes you to the organizer’s page.',
  },
  {
    q: 'Is it free?',
    a: 'Yes. HackathonFinder is free for students, always.',
  },
  {
    q: 'How do I find hackathons I can actually join?',
    a: 'Use the filters on the Explore page: city or online, deadline, team size, who can join (students, women-only, professionals), theme, fee and prize. Or type what you want in plain words, like “free AI hackathon in Pune for students”.',
  },
  {
    q: 'How do I keep track of hackathons?',
    a: 'Tap the bookmark on any hackathon to save it to My hackathons. There you can mark each one as registered, submitted or done. Deadline reminders by email are coming soon.',
  },
  {
    q: 'How do you know the details are correct?',
    a: 'Complete discoveries publish automatically, so a listing may not have been checked by a person. Each one shows its source and last-checked time; confirm the event on the organizer’s page and report anything suspicious so our admins can review or remove it.',
  },
  {
    q: 'I don’t have a team. Can I still join?',
    a: 'Yes. Filter for “Solo allowed”, or post on the Team Finder to meet students with the skills your idea needs.',
  },
  {
    q: 'I found a hackathon that isn’t listed. What do I do?',
    a: 'Submit it on the “Submit a hackathon” page. It takes two minutes, and our team reviews every submission.',
  },
];

export const organizerFaqs: FaqItem[] = [
  {
    q: 'Does it cost anything to list my hackathon?',
    a: 'No. Listing is free. Paid options like featured placement are optional.',
  },
  {
    q: 'You already listed my event. How do I update it?',
    a: 'Use “Submit a hackathon” with the same event name and your organizer email, and mention that you are the organizer. We’ll verify you, update the listing and add a verified badge.',
  },
  {
    q: 'Do students register on HackathonFinder?',
    a: 'No. We send students straight to your official registration page, so you keep full control of applications.',
  },
  {
    q: 'Can I remove a listing?',
    a: 'Yes. Email us from your organizer address and we’ll remove it.',
  },
];
