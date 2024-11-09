"use client";
import { useState, useEffect } from "react";
import { EpubReader } from "@/components/pages/epub-reader";
import { useAccount } from "@particle-network/connectkit";
import { Spinner } from "@/components/Spinner";
import { collection, query, where, getDocs } from "firebase/firestore";
import { firestore, PUBLISHED_BOOKS_COLLECTION } from "@/lib/firebase";
import { useMultichain } from "@/hooks/useMultichain";
import { Book } from "@/app/library/page";

export default function BookReader({ params }: { params: { slug: string } }) {
  const [error, setError] = useState(false);
  const [bookData, setBookData] = useState<Book | null>(null);
  const { isConnected } = useAccount();
  const { smartWalletAddress } = useMultichain();

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const refetchBook = async () => {
      if (!params.slug) return;
      setIsLoading(true);

      try {
        const bookRef = collection(firestore, PUBLISHED_BOOKS_COLLECTION);
        const bookQuery = query(bookRef, where("__name__", "==", params.slug));
        const bookSnapshot = await getDocs(bookQuery);

        console.log(
          "bookSnapshot",
          bookSnapshot,
          bookSnapshot.empty,
          params.slug
        );

        if (bookSnapshot.empty) {
          setError(true);
          setIsLoading(false);
          return;
        }

        const bookDoc = bookSnapshot.docs[0];
        const bookData = bookDoc.data();

        console.log("bookData", bookData);

        setBookData({
          id: bookData.id,
          createdAt: bookData.createdAt?.toMillis(),
          media: bookData.coverImageUrl,
          title: bookData.title,
          description: bookData.description,
          metadata_id: bookData.id,
          bookUrl: bookData.bookUrl,
          isOwned: true,
          attributes: [
            {
              attribute_type: "type",
              attribute_value: bookData.type || "book",
            },
          ],
        });
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching book:", error);
        setError(true);
        setIsLoading(false);
      }
    };
    refetchBook();
  }, [params.slug]);

  if (isLoading) {
    return <Spinner />;
  }

  return (
    <>
      {bookData ? (
        <EpubReader url={bookData.bookUrl} title={bookData.title} />
      ) : (
        <h3>Book not found</h3>
      )}
    </>
  );
}
