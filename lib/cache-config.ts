import { QueryClient } from '@tanstack/react-query';

// Estratégias de Cache
export const CACHE_STRATEGIES = {
  // Dados que raramente mudam (ex: configurações, categorias fixas)
  PERMANENT: {
    staleTime: 30 * 60 * 1000, // 30 minutos
    gcTime: 60 * 60 * 1000,    // 1 hora
  },
  // Dados estáveis (ex: listas gerais, perfis públicos)
  STATIC: {
    staleTime: 5 * 60 * 1000,  // 5 minutos
  },
  // Dados frequentes (ex: feed de ideias, comentários)
  DYNAMIC: {
    staleTime: 30 * 1000,      // 30 segundos
  },
  // Dados em tempo real (ex: notificações, status de transação)
  REALTIME: {
    staleTime: 0,              // Sempre "stale", força fetch
  },
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Default: Estratégia Dinâmica
      staleTime: CACHE_STRATEGIES.DYNAMIC.staleTime,
      refetchOnWindowFocus: false, // Evita refetch agressivo
      retry: 1,
    },
    mutations: {
      onError: (error) => {
        console.error('Mutation Error:', error);
      },
    },
  },
});