"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  createPublicClient,
  http,
  encodeFunctionData,
  type PublicClient,
} from "viem";
import { useWallets, useAccount } from "@particle-network/connectkit";
import { baseSepolia } from "viem/chains";
import { decodeEventLog } from "viem/utils";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { addDoc, collection, serverTimestamp, doc } from "firebase/firestore";
import {
  firestore,
  storage,
  BOOK_PROJECTS_COLLECTION,
  TEMP_COLLECTION,
} from "@/lib/firebase";
import { useMultichain } from "@/hooks/useMultichain";
import { rawTx, buildItx, singleTx } from "klaster-sdk";

import { abi as FACTORY_ABI } from "@/types/FundProjectTokenFactory.abi";

const FACTORY_CONTRACT_ADDRESS = process.env
  .NEXT_PUBLIC_FACTORY_CONTRACT_ADDRESS! as `0x${string}`;

function ProjectCreateForm() {
  const router = useRouter();
  const { address } = useAccount();
  const [primaryWallet] = useWallets();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    getQuote,
    smartWalletAddress,
    klaster,
    executeTransaction,
    getItxStatus,
    waitForReceipt,
  } = useMultichain();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    fundingTarget: "",
    author: "",
    authorEmail: "",
    authorAddress: "",
    projectAddress: "",
    price: "",
    coverImage: null as File | null,
    previewBook: null as File | null,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const toastLoadingId = toast.loading("Creating fund token...");

    try {
      if (!address) {
        toast.error("Please connect your wallet first");
        setIsSubmitting(false);
        toast.dismiss(toastLoadingId);
        return;
      }

      const BASE_SEPOLIA_RPC_URL =
        process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL!;

      // Use Viem for regular wallet transaction
      const publicClient = createPublicClient({
        chain: baseSepolia,
        transport: http(BASE_SEPOLIA_RPC_URL),
      });

      // Upload files to Firebase Storage
      let coverImageUrl = "";
      let previewUrl = "";

      toast.dismiss(toastLoadingId);
      const toastUploadingId = toast.loading("uploading data");
      if (formData.coverImage) {
        try {
          const docRef = doc(collection(firestore, TEMP_COLLECTION));
          const fileId =
            docRef.id +
            "." +
            formData.coverImage.name.split(".").pop()?.toLowerCase();
          const coverImageRef = ref(storage, `covers/${fileId}`);
          await uploadBytes(coverImageRef, formData.coverImage);
          coverImageUrl = await getDownloadURL(coverImageRef);
        } catch (error) {
          console.error("Error uploading cover image:", error);
          toast.error("Failed to upload cover image");
          throw error;
        }
      }

      // Similar error handling for preview book upload
      if (formData.previewBook) {
        try {
          const docRef = doc(collection(firestore, TEMP_COLLECTION));
          const fileId =
            docRef.id +
            "." +
            formData.previewBook.name.split(".").pop()?.toLowerCase();
          const previewRef = ref(storage, `previews/${fileId}`);
          await uploadBytes(previewRef, formData.previewBook);
          previewUrl = await getDownloadURL(previewRef);
        } catch (error) {
          console.error("Error uploading preview book:", error);
          toast.error("Failed to upload preview book");
          throw error;
        }
      }

      let newTokenAddress: `0x${string}`;
      toast.dismiss(toastUploadingId);

      // Handle transaction based on wallet type
      if (smartWalletAddress) {
        // Use Klaster for smart wallet transaction
        const createTokenTx = rawTx({
          to: FACTORY_CONTRACT_ADDRESS,
          data: encodeFunctionData({
            abi: FACTORY_ABI,
            functionName: "createToken",
            args: [smartWalletAddress],
          }),
          gasLimit: BigInt("1000000"),
        });

        const iTx = buildItx({
          steps: [singleTx(baseSepolia.id, createTokenTx)],
          feeTx: klaster!.encodePaymentFee(baseSepolia.id, "USDC"),
        });

        const quote = await getQuote(iTx);
        console.log("quote", quote);

        const receipt = await executeTransaction(iTx);
        const status = await getItxStatus(receipt.itxHash);
        console.log("Transaction status:", status);

        // The status response contains the userOps array with execution details
        const finalUserOpHash =
          status.userOps[status.userOps.length - 1].userOpHash;

        toast.dismiss(toastUploadingId);
        const toastReceiptId = toast.loading("waiting for receipt...");

        const txReceipt = await waitForReceipt(
          publicClient as PublicClient,
          finalUserOpHash
        );

        const tokenCreatedLog = txReceipt.logs.find((log: any) => {
          try {
            const decodedLog = decodeEventLog({
              abi: FACTORY_ABI,
              data: log.data,
              topics: log.topics,
            });
            return decodedLog.eventName === "TokenCreated";
          } catch {
            return false;
          }
        });

        if (!tokenCreatedLog) {
          toast.error("Something went wrong");
          toast.dismiss(toastReceiptId);
          throw new Error(
            "Failed to find TokenCreated event in transaction logs"
          );
        }

        const decodedEvent = decodeEventLog({
          abi: FACTORY_ABI,
          data: tokenCreatedLog.data,
          topics: tokenCreatedLog.topics,
        });

        // @ts-ignore
        newTokenAddress = decodedEvent.args.tokenAddress;
      } else {
        const walletClient = await primaryWallet.getWalletClient();

        const txHash = await walletClient.sendTransaction({
          account: address as `0x${string}`,
          chain: baseSepolia,
          to: FACTORY_CONTRACT_ADDRESS,
          data: encodeFunctionData({
            abi: FACTORY_ABI,
            functionName: "createToken",
            args: [address],
          }),
          gasLimit: BigInt("100000"),
        });

        const txReceipt = await publicClient.waitForTransactionReceipt({
          hash: txHash,
        });

        const tokenCreatedLog = txReceipt.logs.find((log) => {
          try {
            const decodedLog = decodeEventLog({
              abi: FACTORY_ABI,
              data: log.data,
              topics: log.topics,
            });
            return decodedLog.eventName === "TokenCreated";
          } catch {
            return false;
          }
        });

        if (!tokenCreatedLog) {
          toast.error("Something went wrong");
          throw new Error(
            "Failed to find TokenCreated event in transaction logs"
          );
        }

        const decodedEvent = decodeEventLog({
          abi: FACTORY_ABI,
          data: tokenCreatedLog.data,
          topics: tokenCreatedLog.topics,
        });

        // @ts-ignore
        newTokenAddress = decodedEvent.args.tokenAddress;
      }

      console.log("coverImageUrl", coverImageUrl);
      console.log("previewUrl", previewUrl);

      // Save project data to Firestore
      const formDataWithoutFiles = {
        title: formData.title,
        description: formData.description,
        fundingTarget: formData.fundingTarget,
        author: formData.author,
        authorEmail: formData.authorEmail,
        authorAddress: smartWalletAddress,
        projectAddress: newTokenAddress,
        price: formData.price,
        // Explicitly omitting coverImage and previewBook which contain File objects
      };

      const docRef = await addDoc(
        collection(firestore, BOOK_PROJECTS_COLLECTION),
        {
          ...formDataWithoutFiles,
          coverImageUrl,
          previewUrl,
          createdAt: serverTimestamp(),
        }
      );

      toast.success("Project created successfully!");
      router.push(`/terminal/${docRef.id}`); // Redirect to project details page
    } catch (error) {
      console.error("Contract error details:", error);
      if (error instanceof Error) {
        toast.error(`Contract error: ${error.message}`);
      } else {
        toast.error("Unknown contract error occurred");
      }
      throw error;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Input
          placeholder="Project Title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />
      </div>
      <div>
        <Textarea
          placeholder="Project Description"
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          required
          rows={4}
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Cover Image</label>
        <Input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              setFormData({ ...formData, coverImage: file });
            }
          }}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Funding Target (USDC)
        </label>
        <Input
          type="number"
          min="0"
          max="1000"
          step="0.01"
          placeholder="Enter funding target (max 1000 USDC)"
          value={formData.fundingTarget}
          onChange={(e) =>
            setFormData({ ...formData, fundingTarget: e.target.value })
          }
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Author Name</label>
        <Input
          placeholder="Author Name"
          value={formData.author}
          onChange={(e) => setFormData({ ...formData, author: e.target.value })}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Author Email</label>
        <Input
          type="email"
          placeholder="author@example.com"
          value={formData.authorEmail}
          onChange={(e) =>
            setFormData({ ...formData, authorEmail: e.target.value })
          }
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Book File</label>
        <Input
          type="file"
          accept=".pdf,.epub"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              setFormData({ ...formData, previewBook: file });
            }
          }}
          required
        />
        <p className="text-sm text-gray-500 mt-1">
          Accepted formats: PDF, EPUB
        </p>
      </div>
      <Button
        type="submit"
        disabled={isSubmitting || !address || !smartWalletAddress}
        className="w-full"
      >
        {isSubmitting ? "Creating..." : "Create Project"}
      </Button>
    </form>
  );
}

export { ProjectCreateForm };
