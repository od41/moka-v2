"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useApp } from "@/providers/app";
import BookDetailsTemplate from "@/components/pages/book-details";
import { Spinner } from "@/components/Spinner";
import toast from "react-hot-toast";
import { collection, query, where, getDocs } from "firebase/firestore";
import { firestore, PUBLISHED_BOOKS_COLLECTION } from "@/lib/firebase";
import { useAccount } from "@particle-network/connectkit";

export default function BookDetails() {
  const { slug } = useParams();
  const [error, setError] = useState(false);
  const [bookData, setBookData] = useState<any>({});
  const [isPageLoading, setIsPageLoading] = useState(true);
  const { address, isConnected } = useAccount();
  const { push } = useRouter();
  const { openModal } = useApp();

  useEffect(() => {
    const fetchBookData = async () => {
      if (!slug) return;
      setIsPageLoading(true);

      try {
        const bookRef = collection(firestore, PUBLISHED_BOOKS_COLLECTION);
        const bookQuery = query(bookRef, where("__name__", "==", slug));
        const bookSnapshot = await getDocs(bookQuery);

        if (bookSnapshot.empty) {
          setError(true);
          setIsPageLoading(false);
          return;
        }

        const bookDoc = bookSnapshot.docs[0];
        const data = bookDoc.data();

        setBookData({
          id: bookDoc.id,
          createdAt: data.createdAt?.toMillis(),
          media: data.coverImageUrl,
          title: data.title,
          description: data.description,
          metadata_id: bookDoc.id,
          isOwned: true,
          attributes: [
            {
              attribute_type: "type",
              attribute_value: data.type || "book",
            },
          ],
        });

        setIsPageLoading(false);
      } catch (error) {
        console.error("Error fetching book:", error);
        setError(true);
        setIsPageLoading(false);
        toast.error("Failed to load book details");
      }
    };

    fetchBookData();
  }, [slug]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <p className="text-lg text-gray-600">Book not found</p>
      </div>
    );
  }

  // display a loading UI
  if (isPageLoading) {
    return <Spinner />;
  }

  // require user to login logged in
  if (!isConnected) {
    openModal("default");
    return <></>;
  }

  console.log("book & account", bookData, isConnected);

  if (!bookData && isConnected) {
    alert("you don't own this book");
    push(`/`); // send back to home / store
    return <></>;
  }

  return (
    <>
      <BookDetailsTemplate
        bookData={bookData}
        isLoading={isPageLoading}
        params={{ slug: slug as string }}
        isOwned={true}
      />
    </>
  );
}
