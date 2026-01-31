"use client";

import { createContext, useContext, ReactNode } from "react";
import {
  collection,
  query,
  orderBy,
  limit,
} from "firebase/firestore";
import { useFirebase, useCollection, useMemoFirebase } from "@/firebase";

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

  const forumPostsRef = useMemoFirebase(
    () => (db ? collection(db, "forum_posts") : null),
    [db]
  );
  const forumPostsQuery = useMemoFirebase(
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
