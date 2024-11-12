"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useApp } from "@/providers/app";
import BuyModal from "@/components/buy-modal/BuyModal";
import { serif } from "@/app/layout";
import { Spinner } from "../Spinner";
import { PriceInUsd } from "../feed/price-in-usd";
import { useMultichain } from "@/hooks/useMultichain";
import { toast } from "sonner";
import { parseEther } from "viem";
import { useAuthCore } from "@particle-network/authkit";
import { buildItx, encodeBridgingOps, InterchainTransaction, mcUSDC, rawTx, singleTx } from "klaster-sdk";
import { acrossBridgePlugin } from "@/hooks/acrossBridge";
import { baseSepolia } from "viem/chains";
import { arrayUnion } from "firebase/firestore";
import { setDoc } from "firebase/firestore";
import { doc } from "firebase/firestore";
import { firestore } from "@/lib/firebase";

interface BookDetailsTemplateProps {
  bookData: any;
  isLoading: boolean;
  isOwned?: boolean;
  params: { slug: string };
}

export default function BookDetailsTemplate({
  params,
  isOwned = false,
  bookData,
  isLoading,
}: BookDetailsTemplateProps) {
  const [error, setError] = useState(false);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const { openModal } = useApp();
  const { push } = useRouter();
  
  const {smartWalletAddress, mcClient, klaster, getItxStatus, executeTransaction} = useMultichain()
  const {userInfo } = useAuthCore()

  const handleError = () => {
    setError(true);
  };

  const handleCloseBuyModal = () => {
    setShowBuyModal(false);
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleBuy = async () => {
    if (!smartWalletAddress) {
      toast.error("Please connect your wallet first");
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading("Processing purchase...");

    try {
      const price = parseEther(bookData.price.toString());
      const adminFee = (price * BigInt(1)) / BigInt(100); // 1% fee
      const authorPayment = price - adminFee;

      // Get user's email from Particle
      // const userInfo = await particleAuthCore.getUserInfo();
      if (!userInfo?.email) {
        throw new Error("Could not retrieve user email");
      }

      // Check USDC balance
      const usdcBalance = await mcClient.getUnifiedErc20Balance({
        tokenMapping: mcUSDC,
        account: klaster!.account,
      });

      // If insufficient USDC, initiate bridging
      if (usdcBalance.balance < price) {
        toast.loading("Insufficient USDC. Initiating bridge...", {
          id: toastId,
        });

        // Encode bridging operations for USDC
        const bridgingOps = await encodeBridgingOps({
          tokenMapping: mcUSDC,
          account: klaster!.account,
          amount: price,
          bridgePlugin: (data) => acrossBridgePlugin(data),
          client: mcClient,
          destinationChainId: baseSepolia.id,
          unifiedBalance: usdcBalance,
        });

        // Create payment operations
        const authorPaymentOp = rawTx({
          to: bookData.authorAddress as `0x${string}`,
          value: authorPayment,
          gasLimit: BigInt(100000),
        });

        const adminFeeOp = rawTx({
          to: process.env.NEXT_PUBLIC_ADMIN_ADDRESS as `0x${string}`,
          value: adminFee,
          gasLimit: BigInt(100000),
        });

        // Build the interchain transaction (iTx)
        const iTx = buildItx({
          steps: [
            ...bridgingOps.steps,
            singleTx(baseSepolia.id, authorPaymentOp),
            singleTx(baseSepolia.id, adminFeeOp),
          ],
          feeTx: klaster!.encodePaymentFee(baseSepolia.id, "USDC"),
        });

        // Get quote and execute
        // const quote = await getQuote(iTx);
        const receipt = await executeTransaction(iTx);
        const status = await getItxStatus(receipt.itxHash);

        // Check for failed operations
        const failedOp = status.userOps.find(
          (op) => op.executionStatus !== "SUCCESS"
        );
        if (failedOp) {
          throw new Error(
            `Operation failed with status: ${failedOp.executionStatus}`
          );
        }

        // Save purchase to Firestore
        const userRef = doc(firestore, "users", smartWalletAddress as string);
        await setDoc(
          userRef,
          {
            purchasedBooks: arrayUnion({
              bookTitle: bookData.title,
              id: params.slug,
              datePurchased: new Date().toISOString(),
              amountPaid: bookData.price,
            }),
            email: userInfo.email,
          },
          { merge: true }
        );

        toast.success(
          `Purchase successful! <a href='https://explorer.klaster.io/details/${receipt.itxHash}' target='_blank'>View transaction</a>`,
          {
            id: toastId,
            duration: 5000,
          }
        );

        // Redirect to library
        push("/library");
      }
    } catch (error) {
      console.error("Purchase error:", error);
      toast.dismiss(toastId);
      toast.error(
        error instanceof Error ? error.message : "Failed to complete purchase"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRead = () => push(`/library/${params.slug}/read`);

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

  return (
    <main className="mt-[72px] px-4 lg:px-12 mx-auto flex flex-col items-center justify-center space-y-4 md:mb-8">
      <div>
        <div className="grid grid-cols-1 md:grid-cols-[45%_1fr] gap-8 max-w-[920px]">
          <Image
            key={params.slug}
            src={bookData.media}
            alt={`Book ${bookData.title}`}
            className="object-cover h-full w-full col-span-1 rounded"
            width={320}
            height={320}
            quality={70}
            priority={true}
            onError={handleError}
            placeholder="blur"
            blurDataURL={rgbDataURL(237, 181, 6)}
          />

          <div className="col-span-auto md:mt-4">
            <h3
              style={serif.style}
              className="text-xl lg:text-2xl leading-tight mb-2 text-gray-800"
            >
              {bookData.title}{" "}
            </h3>
            <p className="text-md leading-relaxed text-gray-600">
              {bookData.description}
            </p>
            {isOwned ? (
              <>
                <button
                  onClick={handleRead}
                  className="w-full mt-4 bg-[#3F305B] hover:bg-[#614F82] uppercase font-semibold text-sm text-white py-3 rounded-full"
                >
                  Read
                </button>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center ">
                <button
                  onClick={handleBuy}
                  disabled={isSubmitting}
                  className="w-full mt-4 bg-[#3F305B] hover:bg-[#614F82] uppercase font-semibold text-sm text-white py-3 rounded-full disabled:opacity-50"
                >
                  {isSubmitting ? "Processing..." : "Buy"}
                </button>
                <div className="flex gap-1 mt-2 items-center justify-center ">
                  <PriceInUsd price={bookData.price} />
                </div>
              </div>
            )}
          </div>
          <div className="mx-24">
            {!!showBuyModal && (
              <BuyModal
                closeModal={handleCloseBuyModal}
                item={{
                  metadataId: bookData.metadata_id,
                  bookTitle: bookData.title,
                }}
              />
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

