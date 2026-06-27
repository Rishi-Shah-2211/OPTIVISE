"use client";

import { motion } from "framer-motion";
import { motion as motionTokens } from "@/lib/ui/system";

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: motionTokens.fast, ease: motionTokens.easing }}
      style={{ height: "100%", minHeight: 0, display: "flex", flexDirection: "column" }}
    >
      {children}
    </motion.div>
  );
}
