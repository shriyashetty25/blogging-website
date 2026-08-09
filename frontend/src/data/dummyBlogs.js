// Temporary fake blog data for Phase 2.
// Later phases will replace this with real API data from FastAPI.

export const dummyBlogs = [
  {
    id: 1,
    title: 'How to Improve Cricket Batting',
    slug: 'how-to-improve-cricket-batting',
    excerpt: 'Simple drills and habits that help you bat with more confidence.',
    content:
      'Cricket batting improves with regular practice, good footwork, and watching the ball closely. Start with soft-ball drills, then move to net sessions. Focus on balance before power.',
    category: 'Sports',
    subcategory: 'Cricket',
    publishedAt: '2026-08-01',
    image:
      'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 2,
    title: 'Study Tips for Better Focus',
    slug: 'study-tips-for-better-focus',
    excerpt: 'Practical ways to stay focused during long study sessions.',
    content:
      'Use short study blocks, remove phone distractions, and review notes the same day. A clear plan for each session makes it easier to start and finish your work.',
    category: 'Study',
    subcategory: 'Study Tips',
    publishedAt: '2026-08-03',
    image:
      'https://images.unsplash.com/photo-1456513080080-362dbaed4f4e?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 3,
    title: 'Managing Stress During Busy Weeks',
    slug: 'managing-stress-during-busy-weeks',
    excerpt: 'Small routines that help you stay calm when work piles up.',
    content:
      'Break tasks into smaller steps, sleep on a schedule, and take short walks between work blocks. Stress often shrinks when your day has a clear next action.',
    category: 'Mental Wellness',
    subcategory: 'Stress Management',
    publishedAt: '2026-08-05',
    image:
      'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 4,
    title: 'Why Anime Storytelling Feels Powerful',
    slug: 'why-anime-storytelling-feels-powerful',
    excerpt: 'A short look at character arcs and emotional pacing in anime.',
    content:
      'Many anime stories invest time in character growth before big moments. That setup makes victories and losses feel earned. Strong themes and visual style also help the story stick.',
    category: 'Entertainment',
    subcategory: 'Anime',
    publishedAt: '2026-08-07',
    image:
      'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1200&q=80',
  },
]

export function getBlogBySlug(slug) {
  return dummyBlogs.find((blog) => blog.slug === slug)
}
