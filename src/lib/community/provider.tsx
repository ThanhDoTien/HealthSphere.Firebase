"use client";

import { createContext, useContext, ReactNode, useMemo } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
} from "firebase/firestore";
import { useFirebase, useCollection } from "@/firebase";

export function useCommunity() {
  const context = useContext(CommunityContext);
  if (!context) {
    throw new Error("useCommunity must be used within a CommunityProvider");
  }
  return context;
}

const CommunityContext = createContext<{
  forumPosts: any[] | null;
  forumPostsLoading: boolean;
} | null>(null);

export function CommunityProvider({ children }: { children: ReactNode }) {
  const { firestore: db } = useFirebase();

  const forumPostsRef = useMemo(
    () => (db ? collection(db, "forum_posts") : null),
    [db]
  );
  const forumPostsQuery = useMemo(
    () => (forumPostsRef ? query(forumPostsRef, orderBy("timestamp", "desc"), limit(20)) : null),
    [forumPostsRef]
  );
  const { data: forumPosts, isLoading: forumPostsLoading } = useCollection(forumPostsQuery);

  const value = {
    forumPosts,
    forumPostsLoading,
  };

  return (
    <CommunityContext.Provider value={value}>
      {children}
    </CommunityContext.Provider>
  );
}
