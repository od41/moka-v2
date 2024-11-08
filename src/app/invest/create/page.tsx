"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useAccount } from "@particle-network/connectkit";
import { toast } from "sonner";
import { createPublicClient, http, encodeFunctionData } from "viem";
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
import { exec } from "child_process";

const FACTORY_CONTRACT_ADDRESS = process.env
  .NEXT_PUBLIC_FACTORY_CONTRACT_ADDRESS! as `0x${string}`;

function ProjectCreateForm() {
  const router = useRouter();
  const { address } = useAccount();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { walletClient, smartWalletAddress, klaster, executeTransaction } =
    useMultichain();
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

  console.log("smartwalletaddress", smartWalletAddress);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      try {
        if (!smartWalletAddress || !address) {
          toast.error("Please connect your wallet first");
          return;
        }

        // Upload files to Firebase Storage
        let coverImageUrl = "";
        let previewUrl = "";

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

        // Initialize Viem clients
        const publicClient = createPublicClient({
          chain: baseSepolia,
          transport: http(),
        });

        // Create the raw transaction for token creation
        const createTokenTx = rawTx({
          to: FACTORY_CONTRACT_ADDRESS,
          data: encodeFunctionData({
            abi: FACTORY_ABI,
            functionName: "createToken",
            args: [address],
          }),
          gasLimit: BigInt("1000000"), // Adjust as needed
        });

        // Build the interchain transaction
        const iTx = buildItx({
          steps: [singleTx(baseSepolia.id, createTokenTx)],
          feeTx: klaster?.encodePaymentFee(baseSepolia.id, "USDC"),
        });

        console.log("itx", iTx);

        // // Get quote for execution
        // const quote = await klaster?.getQuote(iTx);

        // // Sign the quote hash
        // const signature = await walletClient.signMessage({
        //   message: { raw: quote.itxHash },
        //   account: address as `0x${string}`,
        // });
        const receipt = await executeTransaction(iTx);
        // Execute the transaction
        // const result = await klaster.execute(quote, signature);

        // Wait for receipt and decode events
        // const receipt = await publicClient.waitForTransactionReceipt({
        //   // hash: result.hash,
        // });

        const tokenCreatedEvent = receipt.logs.find((log: any) => {
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

        if (!tokenCreatedEvent) {
          throw new Error(
            "Failed to find TokenCreated event in transaction logs"
          );
        }

        const decodedEvent = decodeEventLog({
          abi: FACTORY_ABI,
          data: tokenCreatedEvent.data,
          topics: tokenCreatedEvent.topics,
        });

        // @ts-ignore
        const newTokenAddress = decodedEvent.args!.tokenAddress as string;

        // Save project data to Firestore
        await addDoc(collection(firestore, BOOK_PROJECTS_COLLECTION), {
          ...formData,
          contractAddress: newTokenAddress,
          coverImageUrl,
          previewUrl,
          createdAt: serverTimestamp(),
          authorWallet: address,
        });

        toast.success("Project created successfully!");
      } catch (error) {
        console.error("Contract error details:", error);
        if (error instanceof Error) {
          toast.error(`Contract error: ${error.message}`);
        } else {
          toast.error("Unknown contract error occurred");
        }
        throw error;
      }

      router.push("/invest"); // Redirect to projects list
    } catch (error) {
      setIsSubmitting(false);
      console.error("Error creating project:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create project"
      );
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

export default function ProjectCreatePage() {
  return (
    <div className="container mx-auto py-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Create New Project</CardTitle>
          </CardHeader>
          <CardContent>
            <ProjectCreateForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
