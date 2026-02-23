"use client";

import { useFirebase } from "../provider";

export const useUser = () => {
  const { user, userProfile, loading } = useFirebase();
  return { user, userProfile, loading };
};
