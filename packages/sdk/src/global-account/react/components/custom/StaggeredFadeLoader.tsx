import { motion } from "framer-motion";

export function StaggeredFadeLoader({ className = "bg-white/50", size = 4 }: { className?: string; size?: number }) {
  const circleVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  };

  const sizeClass =
    {
      1: "h-1 w-1",
      2: "h-2 w-2",
      3: "h-3 w-3",
      4: "h-4 w-4",
      5: "h-5 w-5"
    }?.[size] || "h-4 w-4";

  return (
    <div className={`flex items-center justify-center ${size <= 2 ? "space-x-1" : "space-x-2"}`}>
      {[...Array(3)].map((_, index) => (
        <motion.div
          key={index}
          className={`${sizeClass} rounded-full ${className}`}
          variants={circleVariants}
          initial="hidden"
          animate="visible"
          transition={{
            duration: 0.9,
            delay: index * 0.2,
            repeat: Infinity,
            repeatType: "reverse"
          }}
        ></motion.div>
      ))}
    </div>
  );
}
