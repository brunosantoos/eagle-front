import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  defaultSiteContent,
  loadStoredSiteContent,
  mergeSiteContent,
  SITE_CONTENT_STORAGE_KEY,
  type SiteContent,
} from '../lib/siteContent';
import { trpc } from '../lib/trpc';

type SiteContentContextValue = {
  content: SiteContent;
  setContent: (updater: (prev: SiteContent) => SiteContent) => void;
  resetContent: () => void;
};

const SiteContentContext = createContext<SiteContentContextValue | null>(null);

export function SiteContentProvider({ children }: { children: ReactNode }) {
  const [content, setContentState] = useState<SiteContent>(() =>
    loadStoredSiteContent(),
  );

  const contentRef = useRef(content);
  contentRef.current = content;

  const { data: dbData } = trpc.siteContent.get.useQuery(undefined, {
    retry: false,
    staleTime: Infinity,
  });

  useEffect(() => {
    if (!dbData) return;
    const merged = mergeSiteContent(defaultSiteContent, dbData);
    setContentState(merged);
    try {
      localStorage.setItem(SITE_CONTENT_STORAGE_KEY, JSON.stringify(merged));
    } catch {
      /* ignore */
    }
  }, [dbData]);

  const updateMutation = trpc.siteContent.update.useMutation();
  const resetMutation = trpc.siteContent.reset.useMutation();

  const setContent = useCallback(
    (updater: (prev: SiteContent) => SiteContent) => {
      const next = updater(contentRef.current);
      setContentState(next);
      try {
        localStorage.setItem(SITE_CONTENT_STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* ignore quota */
      }
      updateMutation.mutate({ data: next });
    },
    [updateMutation],
  );

  const resetContent = useCallback(() => {
    setContentState(defaultSiteContent);
    try {
      localStorage.removeItem(SITE_CONTENT_STORAGE_KEY);
    } catch {
      /* ignore */
    }
    resetMutation.mutate();
  }, [resetMutation]);

  const value = useMemo(
    () => ({ content, setContent, resetContent }),
    [content, setContent, resetContent],
  );

  return (
    <SiteContentContext.Provider value={value}>
      {children}
    </SiteContentContext.Provider>
  );
}

export function useSiteContent() {
  const ctx = useContext(SiteContentContext);
  if (!ctx) {
    throw new Error('useSiteContent must be used within SiteContentProvider');
  }
  return ctx;
}
