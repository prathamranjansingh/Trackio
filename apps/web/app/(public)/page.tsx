"use client";
import { getSession } from "@/lib/auth";
import Link from "next/link";
import { Button } from "@trackio/ui";
import { Header } from "@/ui/dashboard/Header";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";

export default async function HomePage() {
  const session = await getSession();

  return (
    <div className="flex flex-col min-h-screen relative">
      <div
        aria-hidden="true"
        // Using your production image path
        className="absolute inset-0 -z-10 bg-[url('/backgroundgradient.avif')] bg-cover bg-center"
      >
        {/* Dark overlay for better text contrast */}
        <div className="absolute inset-0 bg-black/60" />
      </div>

      <Header />

      <main className="flex-1">
        <section className="relative text-white py-24 sm:py-32 lg:py-40 overflow-hidden">
          <motion.div
            className="absolute z-0 top-[10%] right-4 w-[80px] h-[80px] md:w-[120px] md:h-[120px] md:top-[60%] md:right-[10%] lg:right-20 md:-translate-y-1/2"
            animate={{ y: [0, 20, 0], rotate: [0, 15, -5, 0] }}
            transition={{
              duration: 8,
              ease: "easeInOut",
              repeat: Infinity,
              repeatType: "loop",
            }}
          >
            <Image
              src="/icon.jpeg"
              alt="Floating CodeTracker Icon"
              width={120}
              height={120}
              className="opacity-100 w-full h-full object-cover rounded-lg"
            />
          </motion.div>

          <div className="container mx-auto max-w-4xl text-center px-4 relative z-10">
            <h1 className="font-mono text-5xl text-[#ec4e02] sm:text-6xl lg:text-7xl font-extrabold tracking-tight">
              Debug Your Habits
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-gray-200 max-w-3xl mx-auto">
              Auto-track your sessions, see your progress, and compete with your
              crew. Because building habits should feel as satisfying as
              shipping code.
            </p>

            <div className="mt-10">
              <Button
                asChild
                size="lg"
                className="bg-white text-black hover:bg-gray-200 h-12 px-8 text-base font-semibold shadow-lg shadow-gray-100/10 rounded-md"
              >
                <Link href="/signup">
                  Start Tracking Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
