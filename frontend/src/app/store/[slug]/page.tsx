"use client";
import { useEffect, useState } from "react";
import { useApp } from "@/providers/app";
import BookDetailsTemplate from "@/components/pages/book-details";
import { Spinner } from "@/components/Spinner";
import { useAccount } from "@particle-network/connectkit";
import { useMultichain } from "@/hooks/useMultichain";
import { firestore, PUBLISHED_BOOKS_COLLECTION } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useParams } from "next/navigation";
import { toast } from "sonner";

export default function BookDetails() {
  const [error, setError] = useState(false);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [bookData, setBookData] = useState<any>({});
  const [isPageLoading, setIsPageLoading] = useState(true);
  const { smartWalletAddress } = useMultichain();
  const { slug } = useParams();

  const { address, isConnected } = useAccount();
  const { openModal } = useApp();

  const handleError = () => {
    setError(true);
  };

  const handleCloseBuyModal = () => {
    setShowBuyModal(false);
  };

  const handleBuy = (metadataId: string) => {
    setShowBuyModal(true);
  };

  // Pixel GIF code adapted from https://stackoverflow.com/a/33919020/266535
  const keyStr =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";

  const triplet = (e1: number, e2: number, e3: number) =>
    keyStr.charAt(e1 >> 2) +
    keyStr.charAt(((e1 & 3) << 4) | (e2 >> 4)) +
    keyStr.charAt(((e2 & 15) << 2) | (e3 >> 6)) +
    keyStr.charAt(e3 & 63);

  const rgbDataURL = (r: number, g: number, b: number) =>
    `data:image/gif;base64,R0lGODlhAQABAPAA${
      triplet(0, r, g) + triplet(b, 255, 255)
    }/yH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==`;

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
          price: data.price,
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

  // display a loading UI
  if (isPageLoading) {
    return <Spinner />;
  }

  // exit if the user isn't logged in
  if (!isConnected) {
    openModal("default");
    return <></>;
  }

  return (
    <>
      <BookDetailsTemplate
        bookData={bookData}
        isLoading={isPageLoading}
        params={{ slug: slug as string }}
        isOwned={false}
      />
    </>
  );
}
