"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export function AnimatedIcon() {
  return (
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
  );
}
