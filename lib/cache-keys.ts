
export const CACHE_KEYS = {
  ideas: {
    all: ['ideas'] as const,
    list: (filters?: any) => [...CACHE_KEYS.ideas.all, 'list', filters] as const,
    detail: (id: string) => [...CACHE_KEYS.ideas.all, 'detail', id] as const,
    topVoted: () => [...CACHE_KEYS.ideas.all, 'top-voted'] as const,
    recent: () => [...CACHE_KEYS.ideas.all, 'recent'] as const,
  },
  projects: {
    all: ['projects'] as const,
    list: () => [...CACHE_KEYS.projects.all, 'list'] as const,
    detail: (id: string) => [...CACHE_KEYS.projects.all, 'detail', id] as const,
  },
  profiles: {
    all: ['profiles'] as const,
    current: () => [...CACHE_KEYS.profiles.all, 'current'] as const,
    byId: (id: string) => [...CACHE_KEYS.profiles.all, 'detail', id] as const,
  },
  interactions: {
    votes: (ideaId: string) => ['votes', ideaId] as const,
    interested: (ideaId: string) => ['interested', ideaId] as const,
    improvements: (ideaId: string) => ['improvements', ideaId] as const,
    transactions: (ideaId: string) => ['transactions', ideaId] as const,
  },
  notifications: {
    all: ['notifications'] as const,
    unread: (userId: string) => [...CACHE_KEYS.notifications.all, 'unread', userId] as const,
  },
  favorites: {
     all: ['favorites'] as const,
     byUser: (userId: string) => [...CACHE_KEYS.favorites.all, userId] as const
  },
  feedback: {
    all: ['feedbacks'] as const,
    list: (filters?: any) => [...CACHE_KEYS.feedback.all, 'list', filters] as const,
    detail: (id: string) => [...CACHE_KEYS.feedback.all, 'detail', id] as const,
    comments: (id: string) => [...CACHE_KEYS.feedback.all, 'comments', id] as const,
  },
  nps: {
    status: (userId: string) => ['nps', 'status', userId] as const,
  }
};
