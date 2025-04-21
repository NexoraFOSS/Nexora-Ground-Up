import { QueryClient, QueryFunction, QueryCache, MutationCache } from "@tanstack/react-query";
import logger from "./error-logger";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    const errorMessage = `${res.status}: ${text}`;
    const error = new Error(errorMessage);
    
    // Log API errors with contextual information
    logger.error(`API error: ${errorMessage}`, error, {
      status: res.status,
      statusText: res.statusText,
      url: res.url,
    });
    
    throw error;
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  try {
    logger.debug(`API request: ${method} ${url}`, { method, url, data });
    
    const res = await fetch(url, {
      method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    await throwIfResNotOk(res);
    
    logger.debug(`API request successful: ${method} ${url}`, { 
      status: res.status, 
      statusText: res.statusText 
    });
    
    return res;
  } catch (error) {
    if (!(error instanceof Error)) {
      error = new Error(String(error));
    }
    
    logger.error(`API request failed: ${method} ${url}`, error as Error, { 
      method, 
      url, 
      data 
    });
    
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    try {
      const url = queryKey[0] as string;
      logger.debug(`Query request: GET ${url}`, { queryKey });
      
      const res = await fetch(url, {
        credentials: "include",
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        logger.info(`Unauthorized access (401) to ${url} - returning null as configured`, { 
          queryKey,
          status: res.status
        });
        return null;
      }

      await throwIfResNotOk(res);
      const data = await res.json();
      
      logger.debug(`Query successful: GET ${url}`, { 
        status: res.status,
        queryKey
      });
      
      return data;
    } catch (error) {
      if (!(error instanceof Error)) {
        error = new Error(String(error));
      }
      
      logger.error(`Query failed: GET ${queryKey[0]}`, error as Error, { 
        queryKey 
      });
      
      throw error;
    }
  };

// Create error handlers for query and mutation caches
const queryErrorHandler = (error: unknown) => {
  if (error instanceof Error) {
    logger.error('Query cache error', error);
  } else {
    logger.error('Unknown query cache error', new Error(String(error)));
  }
};

const mutationErrorHandler = (error: unknown) => {
  if (error instanceof Error) {
    logger.error('Mutation cache error', error);
  } else {
    logger.error('Unknown mutation cache error', new Error(String(error)));
  }
};

// Create query and mutation caches with error handlers
const queryCache = new QueryCache({
  onError: queryErrorHandler
});

const mutationCache = new MutationCache({
  onError: mutationErrorHandler
});

// Create the query client with the configured caches
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
  queryCache,
  mutationCache
});
