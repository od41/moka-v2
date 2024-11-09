"use client";

import Link from "next/link";
import { serif } from "../layout";
import { useMultichain } from "@/hooks/useMultichain";
import { encodeFunctionData, parseUnits, erc20Abi } from "viem";
import { buildItx, singleTx, rawTx } from "klaster-sdk";
import { baseSepolia } from "viem/chains";
import { useAccount } from "@particle-network/connectkit";

import Image from "next/image";
import { collection, getDocs } from "firebase/firestore";
import { firestore, BOOK_PROJECTS_COLLECTION } from "@/lib/firebase";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export interface BookProject {
  id: string;
  title: string;
  description: string;
  coverImageUrl: string;
  fundingTarget: string;
  author: string;
  authorEmail: string;
  authorAddress: string;
  projectAddress: string;
  price: string;
  previewUrl: string;
}

const ProjectCard = ({ project }: { project: BookProject }) => (
  <div className="bg-white/5 rounded-lg p-6 hover:bg-white/10 transition-all">
    <Image
      src={project.coverImageUrl}
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
    <Link href={`/terminal/${project.id}`}>
      <button className="gradientButton text-primaryBtnText rounded px-6 py-2 w-full">
        View Project
      </button>
    </Link>
  </div>
);

export default function InvestPage() {
  const { address } = useAccount();
  const { executeTransaction, isReady, klaster } = useMultichain();

  const [projects, setProjects] = useState<BookProject[]>([]);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const projectsRef = collection(firestore, BOOK_PROJECTS_COLLECTION);
        const querySnapshot = await getDocs(projectsRef);

        const fetchedProjects = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as BookProject[];

        setProjects(fetchedProjects);
      } catch (error) {
        console.error("Error fetching projects:", error);
        toast.error("Failed to load projects");
      }
    };

    fetchProjects();
  }, []);

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

  return (
    <>
      <main className="w-screen h-screen flex items-center justify-center px-4">
        <div className="max-w-6xl mx-auto">
          <h2 style={serif.style} className="text-3xl mb-8">
            Projects
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => {
              console.log(project.coverImageUrl);
              return <ProjectCard key={project.id} project={project} />;
            })}
          </div>
        </div>
      </main>
    </>
  );
}
