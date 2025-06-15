"use client";
import { Card } from "@/components/ui/card";
import Image from "next/image";
import { CircleChevronRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <>
      <div className="flex flex-col items-center h-screen w-screen p-4">
        {/* SPONSOR BADGES - TOP OF PAGE */}
        <div className="w-full max-w-4xl flex flex-col sm:flex-row justify-center items-center gap-4 mb-8 pt-4">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            {/* Novita AI Badge */}
            <a 
              href="https://novita.ai" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all duration-300 transform hover:scale-105"
            >
              <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-bold text-sm">N</span>
              </div>
              <span className="font-semibold text-sm">Powered by Novita AI</span>
            </a>
            
            {/* Trae AI IDE Badge */}
            <a 
              href="https://www.trae.ai" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-teal-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all duration-300 transform hover:scale-105"
            >
              <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                <span className="text-green-600 font-bold text-sm">T</span>
              </div>
              <span className="font-semibold text-sm">Built with Trae AI IDE</span>
            </a>
          </div>
        </div>

        {/* TITLE FOR LANDING PAGE */}
        <div className="flex flex-col items-center gap-16 py-16">
          <h1 className="flex flex-col text-6xl font-bold gap-4">
            <span className="bg-orange-200 px-2 py-1 rounded-md">
              Read Better
            </span>
            <span className="bg-green-200 px-2 py-1 rounded-md">
              Live Brighter
            </span>
            <span className="bg-yellow-200 px-2 py-1 rounded-md">
              For Dyslexia
            </span>
          </h1>
          <h2 className="text-2xl font-regular">
            AI-Powered Tool for Dyslexia-Friendly Reading
          </h2>
        </div>
        
        {/* START BUTTON */}
        <div className="">
          <Card className="w-80 flex flex-col items-center py-4 px-4 text-[#020402]">
            <Image
              className="rounded-lg"
              src="/card.png"
              width={300}
              height={200}
              alt=""
            ></Image>
            <div className="flex flex-row items-center px-2 h-full w-full border-t pt-4">
              <div className="px-2 text-sm ">
                {" "}
                Convert text into dyslexia-friendly font
              </div>
              <div>
                <Button asChild>
                  <Link href="/upload">Go</Link>
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}