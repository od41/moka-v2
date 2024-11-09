"use client";

import { useState, useEffect } from "react";
import { PageTemplate } from "@/components/pages/page-template";
import { Spinner } from "@/components/Spinner";
import {
  firestore,
  PUBLISHED_BOOKS_COLLECTION,
  USERS_COLLECTION,
} from "@/lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  DocumentReference,
} from "firebase/firestore";
import { useMultichain } from "@/hooks/useMultichain";

export interface Book {
  id: string;
  createdAt: number;
  media: string;
  title: string;
  bookUrl: string;
  description: string;
  metadata_id: string;
  isOwned: boolean;
  attributes: {
    attribute_type: string;
    attribute_value: string;
  }[];
}

export default function Library() {
  const { smartWalletAddress } = useMultichain();
  const [purchasedBooks, setPurchasedBooks] = useState<Book[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(false);

  useEffect(() => {
    const fetchFirestoreBooks = async () => {
      if (!smartWalletAddress) return;
      setIsDataLoading(true);

      try {
        // Get user's purchased book IDs
        const userRef = collection(firestore, USERS_COLLECTION);
        const userQuery = query(
          userRef,
          where("address", "==", smartWalletAddress)
        );
        const userSnapshot = await getDocs(userQuery);

        // Log the resulting data
        console.log(
          "userSnapshot data:",
          userSnapshot.docs.map((doc) => doc.data())
        );
        console.log(
          "userSnapshot IDs:",
          userSnapshot.docs.map((doc) => doc.id)
        );
        console.log("Total results:", userSnapshot.size);

        if (userSnapshot.empty) {
          setIsDataLoading(false);
          return;
        }

        const userData = userSnapshot.docs[0].data();
        const purchasedBookIds = userData.purchasedBooks || [];
        console.log("Purchased book IDs:", purchasedBookIds);

        // Fetch books from firestore using document references
        const booksRef = collection(firestore, PUBLISHED_BOOKS_COLLECTION);
        const booksSnapshot = await getDocs(booksRef);

        // Filter books that match the purchased references
        const purchasedBooks = booksSnapshot.docs.filter((doc) =>
          purchasedBookIds.some((purchasedRef: { id: string }) => {
            console.log("purchasedRef", purchasedRef.id);
            console.log("doc", doc.id);
            return purchasedRef.id === doc.id;
          })
        );

        // Log the books data
        console.log(
          "booksSnapshot data:",
          purchasedBooks.map((doc) => doc.data())
        );
        console.log(
          "booksSnapshot IDs:",
          purchasedBooks.map((doc) => doc.id)
        );
        console.log("Total books found:", purchasedBooks.length);

        if (purchasedBooks.length === 0) {
          setIsDataLoading(false);
          return;
        }

        const books = purchasedBooks.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            createdAt: data.createdAt?.toMillis(),
            media: data.coverImageUrl,
            title: data.title,
            description: data.description,
            metadata_id: doc.id,
            bookUrl: data.bookUrl,
            isOwned: true,
            attributes: doc.data().attributes || [],
          };
        });

        setPurchasedBooks(books);
        setIsDataLoading(false);
      } catch (error) {
        console.error("Error fetching firestore books:", error);
        setIsDataLoading(false);
      }
    };

    fetchFirestoreBooks();
  }, [smartWalletAddress]);

  if (!smartWalletAddress) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <p className="text-lg text-gray-600">
          Please connect your wallet to view your books
        </p>
      </div>
    );
  }

  if (!isDataLoading && (!purchasedBooks || purchasedBooks.length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <p className="text-lg text-gray-600">
          You haven&apos;t purchased any books yet
        </p>
      </div>
    );
  }

  if (isDataLoading) {
    return <Spinner />;
  }

  return (
    <>
      <PageTemplate
        title="My Books"
        data={purchasedBooks}
        isLoading={isDataLoading}
        isOwned={true}
      />
    </>
  );
}
