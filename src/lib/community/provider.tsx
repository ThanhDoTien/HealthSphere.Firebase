"use client";

import { createContext, useContext, ReactNode } from "react";

// The Community feature has been removed. This provider is now a shell
// to prevent breaking existing imports, but it no longer provides any data.

const CommunityContext = createContext<{
  forumPosts: any[];
  forumPostsLoading: boolean;
}>({
  forumPosts: [],
  forumPostsLoading: false,
});

export function useCommunity() {
  return useContext(CommunityContext);
}

export function CommunityProvider({ children }: { children: ReactNode }) {
  const value = {
    forumPosts: [],
    forumPostsLoading: false,
  };

  // The provider no longer fetches data but returns a default empty state.
  return (
    <CommunityContext.Provider value={value}>
      {children}
    </CommunityContext.Provider>
  );
}
