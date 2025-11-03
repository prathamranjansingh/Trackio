import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Image from "next/image";

export function Header() {
  return (
    <header className="relative top-0 left-0 z-10 w-full py-5">
      <div
        className="container mx-auto flex max-w-[90%] items-center justify-between px-4 sm:px-2" // <-- 1. Fix: justify-between
      >
        <Link href="/" className="flex items-center">
          <Image
            src="/icon.jpeg"
            alt="CodeTracker Logo"
            width={55}
            height={55}
            priority
          />
          <div className="font-mono font-bold text-2xl text-orange-600 pl-3">
            CodeTrackr
          </div>
        </Link>

        <Link
          href="/signup"
          className="
            flex items-center space-x-2 
            rounded-full 
            bg-white 
            py-3 px-6  // <-- 3. Size increase (padding)
            text-base font-medium text-gray-900 // <-- 3. Size increase (text)
            shadow-lg shadow-gray-400/10 
            transition-all duration-300 
            hover:shadow-xl hover:shadow-gray-400/20
          "
        >
          <span>Sign Up</span>
          <ArrowRight className="h-5 w-5" /> {/* <-- 3. Size increase (icon) */}
        </Link>
      </div>
    </header>
  );
}
