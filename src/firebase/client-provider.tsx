"use client";

import { FirebaseProvider } from "./provider";
import { auth, firestore } from ".";

export default function FirebaseClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <FirebaseProvider>{children}</FirebaseProvider>;
}
