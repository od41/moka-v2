"use client";

import { DynamicGrid } from "@/components/DynamicGrid";
import React, { useEffect, useState } from "react";

import { PageTemplate } from "./page-template";
import { Spinner } from "@/components/Spinner";
import { Book } from "@/app/library/page";
import { firestore, PUBLISHED_BOOKS_COLLECTION } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { toast } from "sonner";

export const StorePage = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoadingBooks, setIsLoadingBooks] = useState(true);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const booksRef = collection(firestore, PUBLISHED_BOOKS_COLLECTION);
        const booksSnapshot = await getDocs(booksRef);
        const booksData = booksSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt.toMillis(),
          media: doc.data().coverImageUrl,
          title: doc.data().title,
          description: doc.data().description,
          metadata_id: doc.id,
          bookUrl: doc.data().bookUrl,
          isOwned: true,
          attributes: doc.data().attributes || [],
        })) as Book[];
        console.log("booksData", booksData);
        setBooks(booksData);
      } catch (error) {
        console.error("Error fetching books:", error);
        toast.error("Failed to load books");
      } finally {
        setIsLoadingBooks(false);
      }
    };

    fetchBooks();
  }, []);

  if (isLoadingBooks) {
    return <Spinner />;
  }

  if (!isLoadingBooks && books.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <p className="text-xl text-gray-400">
          No books have been published yet
        </p>
      </div>
    );
  }

  return (
    <>
      <PageTemplate
        title="Moka Store"
        data={books}
        blockedNfts={[]}
        isLoading={isLoadingBooks}
      />
    </>
  );
};
