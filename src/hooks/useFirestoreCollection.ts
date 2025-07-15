// ===============================
// File: src/hooks/useFirestoreCollection.ts
// ===============================

import { useState, useEffect } from "react";
import {
  collection,
  onSnapshot,
  query,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "@/utils/firebase";

export function useFirestoreCollection<T>(collectionName: string) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, collectionName));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const data: any[] = [];
      querySnapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() });
      });
      setItems(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [collectionName]);

  const addItem = async (item: Omit<T, "id">) => {
    await addDoc(collection(db, collectionName), item);
  };

  const updateItem = async (id: string, item: Partial<T>) => {
    const ref = doc(db, collectionName, id);
    await updateDoc(ref, item);
  };

  const deleteItem = async (id: string) => {
    const ref = doc(db, collectionName, id);
    await deleteDoc(ref);
  };

  return {
    items,
    loading,
    addItem,
    updateItem,
    deleteItem,
  };
}
