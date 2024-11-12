"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { serif } from "@/app/layout";
import { getDoc, doc } from "firebase/firestore";
import { BOOK_PROJECTS_COLLECTION, firestore } from "@/lib/firebase";
import { BookProject } from "@/app/terminal/page";
import {
  encodeFunctionData,
  formatEther,
  parseEther,
  PublicClient,
} from "viem";
import { toast } from "sonner";
import { useMultichain } from "@/hooks/useMultichain";
import { EpubReader } from "@/components/pages/epub-reader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/Spinner";
import { useAccount } from "@particle-network/connectkit";
import { abi as TOKENS_ABI } from "@/types/FundProjectToken.abi";
import { buildItx, rawTx, singleTx, encodeBridgingOps } from "klaster-sdk";
import { liFiBridgePlugin } from "@/hooks/lifiBridge";
import { baseSepolia } from "viem/chains";

const ProjectPage = () => {
  const { project_id } = useParams();
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [projectData, setProjectData] = useState<BookProject | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showBuyModal, setShowBuyModal] = useState(false);
  const [showSellModal, setShowSellModal] = useState(false);
  const [tokenAmount, setTokenAmount] = useState("");
  const [usdcValue, setUsdcValue] = useState<number>(0);

  const [currentPrice, setCurrentPrice] = useState<string>("0");
  const [fundingReceived, setFundingReceived] = useState<string>("0");
  const [ethToUsdcRate, setEthToUsdcRate] = useState<number>(3319);
  const [userTokenBalance, setUserTokenBalance] = useState<string>("0");
  const {
    publicClient,
    walletClient,
    klaster,
    mcClient,
    mcUSDC,
    getQuote,
    executeTransaction,
    getItxStatus,
    waitForReceipt,
    smartWalletAddress,
  } = useMultichain();
  const { address } = useAccount();

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const projectRef = doc(
          firestore,
          BOOK_PROJECTS_COLLECTION,
          project_id as string
        );
        const projectSnap = await getDoc(projectRef);

        if (projectSnap.exists()) {
          setProjectData(projectSnap.data() as BookProject);
        } else {
          setProjectData(null);
        }
      } catch (error) {
        console.error("Error fetching project:", error);
        setProjectData(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProject();
  }, [project_id]);

  useEffect(() => {
    const fetchTokenData = async () => {
      if (!projectData?.projectAddress || !publicClient) return;

      try {
        // Get current token price
        const price = await publicClient.readContract({
          address: projectData.projectAddress as `0x${string}`,
          abi: [
            {
              name: "getCurrentPrice",
              inputs: [],
              outputs: [{ type: "uint256" }],
              stateMutability: "view",
              type: "function",
            },
          ],
          functionName: "getCurrentPrice",
        });

        if (smartWalletAddress) {
          // Get user token balance
          const userTokenBalance = await publicClient.readContract({
            address: projectData.projectAddress as `0x${string}`,
            abi: TOKENS_ABI,
            functionName: "balanceOf",
            args: [smartWalletAddress as `0x${string}`],
          });
          setUserTokenBalance(formatEther(userTokenBalance as bigint));
        }

        // Get contract ETH balance
        const contractBalance = await publicClient.getBalance({
          address: projectData.projectAddress as `0x${string}`,
        });

        // Convert price from wei to ETH
        const priceInEth = formatEther(price as bigint);
        const priceInUsdc = Number(priceInEth) * ethToUsdcRate;
        setCurrentPrice(`${Number(priceInUsdc).toFixed(2)} USDC`);

        const fundingReceivedInUsdc =
          Number(formatEther(contractBalance)) * ethToUsdcRate;

        setFundingReceived(`${fundingReceivedInUsdc.toFixed(2)} USDC`);
      } catch (error) {
        console.error("Error fetching token data:", error);
        toast.error("Failed to load token data");
      }
    };

    fetchTokenData();
  }, [projectData?.projectAddress, publicClient, smartWalletAddress]);

  const handleBuyTokens = async () => {
    if (!address) {
      toast.error("Please connect your wallet first");
      return;
    }

    setIsSubmitting(true);

    try {
      // Get ETH amount from input
      if (!tokenAmount) {
        toast.error("Please enter an amount");
        setIsSubmitting(false);
        return;
      }

      // Convert ETH amount to Wei
      const weiAmount = parseEther(tokenAmount);

      // Get tokens for ETH estimate
      const tokensEstimate = await publicClient.readContract({
        address: projectData!.projectAddress as `0x${string}`,
        abi: TOKENS_ABI,
        functionName: "getTokensForETH",
        args: [weiAmount],
      });

      // Check wallet balance
      const balance = await publicClient.getBalance({
        address: address as `0x${string}`,
      });

      if (balance < weiAmount) {
        toast.error("Insufficient ETH balance");
        return;
      }

      // Send transaction
      const txHash = await walletClient.sendTransaction({
        account: address as `0x${string}`,
        to: projectData!.projectAddress as `0x${string}`,
        value: weiAmount,
        data: encodeFunctionData({
          abi: TOKENS_ABI,
          functionName: "buyTokens",
        }),
      });

      const toastId = toast.loading("Transaction pending...");

      // Wait for transaction receipt
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: txHash,
      });

      if (receipt.status === "success") {
        toast.dismiss(toastId);
        toast.success(
          `Successfully purchased ${formatEther(
            tokensEstimate as bigint
          )} tokens!`
        );
      } else {
        toast.dismiss(toastId);
        toast.error("Transaction failed");
      }
    } catch (error) {
      console.error("Error buying tokens:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to buy tokens"
      );
    } finally {
      setIsSubmitting(false);
    }
    // Close modal
    setShowBuyModal(false);
  };

  const handleSellTokens = async () => {
    if (!smartWalletAddress) {
      toast.error("Please connect your wallet first");
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading("Processing sell transaction...");

    try {
      if (!tokenAmount) {
        toast.dismiss(toastId);
        toast.error("Please enter an amount");
        return;
      }

      const sellAmount = parseEther(tokenAmount);

      // First encode the bridging operations
      const bridgingOps = await encodeBridgingOps({
        tokenMapping: mcUSDC, // You'll need to define this token mapping for USDC
        account: klaster!.account,
        amount: sellAmount,
        bridgePlugin: liFiBridgePlugin, // You'll need to implement this based on Klaster's bridging plugin interface
        client: mcClient, // Your multichain client instance
        destinationChainId: baseSepolia.id, // Base Sepolia
        unifiedBalance: await mcClient.getUnifiedErc20Balance({
          tokenMapping: mcUSDC,
          account: klaster!.account,
        }),
      });

      // Create the sell operation
      const sellOp = rawTx({
        gasLimit: BigInt(100000),
        to: projectData!.projectAddress as `0x${string}`,
        data: encodeFunctionData({
          abi: TOKENS_ABI,
          functionName: "sellTokens",
          args: [sellAmount],
        }),
      });

      // Build the interchain transaction (iTx)
      const iTx = buildItx({
        steps: [
          singleTx(baseSepolia.id, sellOp), // Sepolia chain ID
          ...bridgingOps.steps,
        ],
        feeTx: klaster!.encodePaymentFee(baseSepolia.id, "USDC"), // Pay fees in USDC on base sepolia
      });

      // Get quote for execution
      const quote = await getQuote(iTx);
      console.log("quote", quote);

      // Execute the transaction
      toast.loading("Executing transaction...", { id: toastId });
      const receipt = await executeTransaction(iTx);
      const status = await getItxStatus(receipt.itxHash);
      console.log("Transaction status:", status);

      // The status response contains the userOps array with execution details
      // Check if any userOps failed
      const failedOp = status.userOps.find(
        (op) => op.executionStatus !== "SUCCESS"
      );
      if (failedOp) {
        throw new Error(
          `UserOp ${failedOp.userOpHash} failed with status: ${failedOp.executionStatus}`
        );
      }

      // Get the final userOp and wait for its receipt
      const finalUserOp = status.userOps[status.userOps.length - 1];
      const txReceipt = await waitForReceipt(
        publicClient as PublicClient,
        finalUserOp.userOpHash
      );

      // Verify the receipt status
      if (!txReceipt || txReceipt.status !== "success") {
        throw new Error("Transaction failed");
      }

      toast.success(
        "Transaction submitted! Check Klaster Explorer for status",
        {
          id: toastId,
          duration: 5000,
        }
      );

      // Provide explorer link
      console.log(`https://explorer.klaster.io/details/${receipt.itxHash}`);
      setShowSellModal(false);
    } catch (error) {
      console.error("Error in sell transaction:", error);
      toast.dismiss(toastId);
      toast.error(
        error instanceof Error ? error.message : "Transaction failed"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <Spinner />;
  }

  if (!projectData) {
    return (
      <div className="w-screen h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl mb-4">Project Not Found</h1>
          <p className="text-gray-400">
            The project you&apos;re looking for doesn&apos;t exist or has been
            removed.
          </p>
          <Link
            href="/terminal"
            className="text-blue-500 hover:text-blue-400 mt-4 inline-block"
          >
            Return to Projects
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="w-screen min-h-screen p-8 mt-20">
      <div className="max-w-6xl mx-auto">
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column - Cover and Stats */}
          <div>
            {/* Funding Stats */}
            <div className="mt-6 bg-white/5 rounded-lg p-6">
              <div className="flex justify-between mb-4">
                <span>Current Price:</span>
                {currentPrice ? (
                  <span className="font-bold">{currentPrice}</span>
                ) : (
                  <span className="font-bold">Loading...</span>
                )}
              </div>
              <div className="flex justify-between mb-4">
                <span>Target:</span>
                <span className="font-bold">{projectData.fundingTarget}</span>
              </div>
              <div className="flex justify-between mb-6">
                <span>Received:</span>
                {fundingReceived ? (
                  <span className="font-bold">{fundingReceived}</span>
                ) : (
                  <span className="font-bold">Loading...</span>
                )}
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-700 rounded-full h-2.5 mb-6">
                <div
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-2.5 rounded-full"
                  style={{
                    width: `${Math.min(
                      Math.floor(
                        (Number(fundingReceived || 0) /
                          Number(projectData.fundingTarget)) *
                          100
                      ),
                      100
                    )}%`,
                  }}
                />
              </div>

              {/* Action Buttons */}
              <div className="w-full flex gap-4">
                <div className="w-full flex gap-4">
                  <Button
                    onClick={() => setShowBuyModal(true)}
                    className="gradientButton text-primaryBtnText rounded px-6 py-3 flex-1"
                  >
                    Buy Tokens
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowSellModal(true)}
                    className="border border-gray-600 rounded px-6 py-3 flex-1 hover:bg-white/5"
                  >
                    Sell Tokens
                  </Button>

                  {showBuyModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <div className="bg-white p-6 rounded-lg w-96">
                        <h3 className="text-xl mb-4">
                          Buy Tokens | {projectData.title}
                        </h3>
                        <label htmlFor="buy-amount" className="text-sm mb-2">
                          Amount in USDC
                        </label>
                        <Input
                          type="number"
                          id="buy-amount"
                          value={usdcValue}
                          onChange={(e) => {
                            setUsdcValue(Number(e.target.value));
                            setTokenAmount(
                              (
                                Number(e.target.value) /
                                Number(currentPrice.split(" ")[0])
                              ).toString()
                            );
                          }}
                          className="w-full p-2 mb-4 rounded"
                          placeholder="Amount in USDC"
                        />
                        <p className="mb-4">
                          Cost: {Number(tokenAmount).toFixed(2)} MOKA
                        </p>
                        <p className="mb-4">
                          MOKA Balance:{" "}
                          {userTokenBalance ? (
                            `${userTokenBalance} MOKA`
                          ) : (
                            <span className="text-sm">Loading balance</span>
                          )}
                        </p>
                        <div className="flex gap-4">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setShowBuyModal(false);
                              setTokenAmount("0");
                              setUsdcValue("0");
                            }}
                            className="flex-1 border border-gray-600 rounded px-4 py-2"
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleBuyTokens}
                            className="flex-1 gradientButton text-primaryBtnText rounded px-4 py-2"
                          >
                            Confirm
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {showSellModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <div className="bg-white p-6 rounded-lg w-96">
                        <h3 className="text-xl mb-4">
                          Sell Tokens | {projectData.title}
                        </h3>
                        <label htmlFor="sell-amount" className="text-sm mb-2">
                          Amount in USDC
                        </label>
                        <Input
                          type="number"
                          id="sell-amount"
                          value={tokenAmount}
                          onChange={(e) => {
                            setTokenAmount(e.target.value);
                            setUsdcValue(
                              Number(e.target.value) *
                                Number(currentPrice.split(" ")[0])
                            );
                          }}
                          className="w-full p-2 mb-4 rounded"
                          placeholder="Amount of tokens"
                        />
                        <p className="mb-4">
                          Value: {usdcValue.toFixed(2)} USDC
                        </p>
                        <p className="mb-4">
                          MOKA Balance:{" "}
                          {userTokenBalance ? (
                            `${userTokenBalance} MOKA`
                          ) : (
                            <span className="text-sm">Loading balance</span>
                          )}
                        </p>
                        <div className="flex gap-4">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setShowSellModal(false);
                              setTokenAmount("0");
                              setUsdcValue("0");
                            }}
                            className="flex-1 border border-gray-600 rounded px-4 py-2"
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleSellTokens}
                            className="flex-1 gradientButton text-primaryBtnText rounded px-4 py-2"
                          >
                            Confirm
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            {/* Book cover */}
            <Image
              src={projectData.coverImageUrl}
              alt={projectData.title}
              width={350}
              height={500}
              className="w-full rounded-lg shadow-lg"
            />
          </div>

          {/* Right Column - Project Info */}
          <div>
            <h1 style={serif.style} className="text-4xl mb-4">
              {projectData.title}
            </h1>

            {/* Author Profile */}
            <div className="flex items-center gap-4 mb-6 bg-white/5 rounded-lg p-4">
              {/* TODO: display an image of the author */}
              {/* <Image
                src={projectData.author.avatar}
                alt={projectData.author.name}
                width={60}
                height={60}
                className="rounded-full"
              /> */}
              <div>
                <h3 className="font-bold">{projectData.author}</h3>
                <h3 className="font-bold">{projectData.authorAddress}</h3>
                <p className="text-sm text-gray-400">
                  {projectData.authorEmail}
                </p>
              </div>
            </div>

            {/* Synopsis */}
            <div className="mb-6">
              <h2 className="text-xl mb-3">Description</h2>
              <p className="text-gray-300 leading-relaxed">
                {projectData.description}
              </p>
            </div>

            {/* Preview Button */}
            <Button
              onClick={() => setIsPreviewOpen(true)}
              variant="outline"
              className=" mb-6"
            >
              Read Chapter Preview
            </Button>
          </div>
        </div>
      </div>

      {/* Chapter Preview Modal */}
      {isPreviewOpen && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"
          onClick={() => setIsPreviewOpen(false)}
        >
          <div
            className="bg-gray-900 rounded-lg p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsPreviewOpen(false)}
              className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-full bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
            >
              ✕
            </button>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl text-white">Chapter Preview</h3>
            </div>
            <div className="prose prose-invert">
              <pre className="whitespace-pre-wrap">
                {projectData.previewUrl ? (
                  <EpubReader
                    url={projectData.previewUrl}
                    title={projectData.title}
                  />
                ) : (
                  <h3>Book preview not found</h3>
                )}
              </pre>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default ProjectPage;
