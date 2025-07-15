// ===============================
// File: src/hooks/useFirestore.ts
// ===============================

import { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  getDocs,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

export function useFirestoreCollection<T>(collectionName: string) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setItems([]);
        setLoading(false);
        return;
      }

      const ref = collection(db, "users", user.uid, collectionName);

      const unsubscribe = onSnapshot(ref, (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as T[];
        setItems(data);
        setLoading(false);
      });

      return unsubscribe;
    });

    return () => {
      unsubscribeAuth();
    };
  }, [collectionName]);

  const addItem = async (item: Omit<T, "id">) => {
    const user = auth.currentUser;
    if (!user) throw new Error("Not authenticated");

    const ref = collection(db, "users", user.uid, collectionName);
    await addDoc(ref, item);
  };

  const updateItem = async (id: string, data: Partial<T>) => {
    const user = auth.currentUser;
    if (!user) throw new Error("Not authenticated");

    const ref = doc(db, "users", user.uid, collectionName, id);
    await updateDoc(ref, data);
  };

  const deleteItem = async (id: string) => {
    const user = auth.currentUser;
    if (!user) throw new Error("Not authenticated");

    const ref = doc(db, "users", user.uid, collectionName, id);
    await deleteDoc(ref);
  };

  return { items, loading, addItem, updateItem, deleteItem };
}
