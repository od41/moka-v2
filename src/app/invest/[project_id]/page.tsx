"use client";
import React, { useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { serif } from "@/app/layout";

interface Project {
  id: string;
  title: string;
  author: {
    name: string;
    avatar: string;
    bio: string;
  };
  coverImage: string;
  synopsis: string;
  chapterPreview: string;
  currentPrice: string;
  fundingTarget: string;
  fundingReceived: string;
}

const ProjectPage = () => {
  const { project_id } = useParams();
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Demo data - replace with actual data fetch
  const project: Project = {
    id: project_id as string,
    title: "The Eternal Echo",
    author: {
      name: "Sarah Mitchell",
      avatar: "/author-avatar.jpg",
      bio: "Award-winning author with 3 bestsellers",
    },
    coverImage: "/book-cover.jpg",
    synopsis: "A gripping tale of mystery and adventure...",
    chapterPreview:
      "Chapter 1: The Beginning\n\nIt was a dark and stormy night...",
    currentPrice: "0.002 USDC",
    fundingTarget: "100,000 USDC",
    fundingReceived: "45,000 USDC",
  };

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
                <span className="font-bold">{project.currentPrice}</span>
              </div>
              <div className="flex justify-between mb-4">
                <span>Target:</span>
                <span className="font-bold">{project.fundingTarget}</span>
              </div>
              <div className="flex justify-between mb-6">
                <span>Received:</span>
                <span className="font-bold">{project.fundingReceived}</span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-700 rounded-full h-2.5 mb-6">
                <div
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-2.5 rounded-full"
                  style={{ width: "45%" }} // Calculate based on actual funding
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button className="gradientButton text-primaryBtnText rounded px-6 py-3 flex-1">
                  Buy Tokens
                </button>
                <button className="border border-gray-600 rounded px-6 py-3 flex-1 hover:bg-white/5">
                  Sell Tokens
                </button>
              </div>
            </div>
            {/* Book cover */}
            <Image
              src={project.coverImage}
              alt={project.title}
              width={350}
              height={500}
              className="w-full rounded-lg shadow-lg"
            />
          </div>

          {/* Right Column - Project Info */}
          <div>
            <h1 style={serif.style} className="text-4xl mb-4">
              {project.title}
            </h1>

            {/* Author Profile */}
            <div className="flex items-center gap-4 mb-6 bg-white/5 rounded-lg p-4">
              <Image
                src={project.author.avatar}
                alt={project.author.name}
                width={60}
                height={60}
                className="rounded-full"
              />
              <div>
                <h3 className="font-bold">{project.author.name}</h3>
                <p className="text-sm text-gray-400">{project.author.bio}</p>
              </div>
            </div>

            {/* Synopsis */}
            <div className="mb-6">
              <h2 className="text-xl mb-3">Synopsis</h2>
              <p className="text-gray-300 leading-relaxed">
                {project.synopsis}
              </p>
            </div>

            {/* Preview Button */}
            <button
              onClick={() => setIsPreviewOpen(true)}
              className="text-blue-400 hover:text-blue-300 mb-6"
            >
              Read Chapter Preview
            </button>
          </div>
        </div>
      </div>

      {/* Chapter Preview Modal */}
      {isPreviewOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-lg p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl">Chapter Preview</h3>
              <button
                onClick={() => setIsPreviewOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="prose prose-invert">
              <pre className="whitespace-pre-wrap">
                {project.chapterPreview}
              </pre>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default ProjectPage;
