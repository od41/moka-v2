"use client";

import Link from "next/link";
import { serif } from "../layout";
import { useMultichain } from "@/hooks/useMultichain";
import { encodeFunctionData, parseUnits, erc20Abi } from "viem";
import { buildItx, singleTx, rawTx } from "klaster-sdk";
import { baseSepolia } from "viem/chains";
import { useAccount } from "@particle-network/connectkit";

import Image from "next/image";

interface Project {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  fundingTarget: string;
  author: string;
  price: string;
}

const ProjectCard = ({ project }: { project: Project }) => (
  <div className="bg-white/5 rounded-lg p-6 hover:bg-white/10 transition-all">
    <Image
      src={project.coverImage}
      alt={project.title}
      width={300}
      height={200}
      className="w-full h-48 object-cover rounded-lg mb-4"
    />
    <h3 style={serif.style} className="text-xl mb-2">
      {project.title}
    </h3>
    <p className="text-gray-400 text-sm mb-4">{project.description}</p>
    <div className="flex justify-between text-sm mb-4">
      <span>Target: {project.fundingTarget}</span>
      <span>Price: {project.price}</span>
    </div>
    <p className="text-gray-400 text-sm mb-4">By {project.author}</p>
    <Link href={`/invest/${project.id}`}>
      <button className="gradientButton text-primaryBtnText rounded px-6 py-2 w-full">
        View Project
      </button>
    </Link>
  </div>
);

export default function InvestPage() {
  const { address } = useAccount();
  const { executeTransaction, isReady, klaster, customProvider } =
    useMultichain();

  const handleTransaction = async () => {
    if (!isReady) return;

    const amountWei = parseUnits("0.002", 6);
    console.log("start send...", amountWei);
    const sendERC20Op = rawTx({
      gasLimit: BigInt("10000"),
      to: "0x036CbD53842c5426634e7929541eC2318f3dCF7e", // USDC contract address on base sepolia
      data: encodeFunctionData({
        abi: erc20Abi,
        functionName: "transfer",
        args: ["0x0FC28558E05EbF831696352363c1F78B4786C4e5", amountWei],
      }),
    });

    try {
      const tx = buildItx({
        steps: [singleTx(baseSepolia.id, sendERC20Op)],
        feeTx: klaster!.encodePaymentFee(baseSepolia.id, "USDC"),
      });

      const result = await executeTransaction(tx);
      console.log("Transaction result:", result);
    } catch (error) {
      console.error("Transaction failed:", error);
    }
  };

  const demoProjects: Project[] = [
    {
      id: "1",
      title: "Project Alpha",
      description: "A revolutionary DeFi protocol",
      coverImage: "/demo-project.jpg",
      fundingTarget: "100,000 USDC",
      author: "Team Alpha",
      price: "0.002 USDC",
    },
    {
      id: "1",
      title: "Project Alpha",
      description: "A revolutionary DeFi protocol",
      coverImage: "/demo-project.jpg",
      fundingTarget: "100,000 USDC",
      author: "Team Alpha",
      price: "0.002 USDC",
    },
    {
      id: "1",
      title: "Project Alpha",
      description: "A revolutionary DeFi protocol",
      coverImage: "/demo-project.jpg",
      fundingTarget: "100,000 USDC",
      author: "Team Alpha",
      price: "0.002 USDC",
    },
    {
      id: "1",
      title: "Project Alpha",
      description: "A revolutionary DeFi protocol",
      coverImage: "/demo-project.jpg",
      fundingTarget: "100,000 USDC",
      author: "Team Alpha",
      price: "0.002 USDC",
    },
    // Add more demo projects as needed
  ];

  return (
    <>
      <main className="w-screen h-screen flex items-center justify-center px-4">
        <div className="max-w-6xl mx-auto">
          <h2 style={serif.style} className="text-3xl mb-8">
            Projects
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {demoProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
