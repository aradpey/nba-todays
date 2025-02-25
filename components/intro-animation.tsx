import { motion } from "framer-motion";
import Image from "next/image";

interface IntroProps {
  onAnimationComplete: () => void;
  isLoading: boolean;
  loadingMessage?: string;
}

export function IntroAnimation({
  onAnimationComplete,
  isLoading,
  loadingMessage,
}: IntroProps) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-slate-900"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Background NBA Logo */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          className="relative w-[800px] h-[800px] opacity-20 blur-2xl"
          animate={{
            scale: isLoading ? [1, 1.1, 1] : 1,
            opacity: isLoading ? [0.2, 0.3, 0.2] : 0.2,
          }}
          transition={{
            duration: 2,
            repeat: isLoading ? Infinity : 0,
            ease: "easeInOut",
          }}
        >
          <Image
            src="https://cdn.nba.com/logos/leagues/logo-nba.svg"
            alt="NBA Logo Background"
            fill
            sizes="800px"
            style={{ objectFit: "contain" }}
            priority
          />
        </motion.div>
      </div>

      {isLoading ? (
        <motion.div
          className="z-30 flex flex-col items-center gap-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {/* Clear NBA Logo in Front */}
          <motion.div
            className="relative w-80 h-80 mb-8"
            animate={{
              scale: [1, 1.05, 1],
              opacity: [0.9, 1, 0.9],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <Image
              src="https://cdn.nba.com/logos/leagues/logo-nba.svg"
              alt="NBA Logo"
              fill
              sizes="320px"
              style={{ objectFit: "contain" }}
              priority
            />
          </motion.div>

          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 border-t-4 border-blue-500 border-solid rounded-full animate-spin" />
            <p className="text-slate-300 text-lg">
              {loadingMessage || "Loading statistics..."}
            </p>
          </div>
        </motion.div>
      ) : (
        <>
          {/* Split Panels */}
          <motion.div
            className="absolute inset-0 bg-slate-900 z-20"
            initial={{ y: 0 }}
            animate={{ y: "-100%" }}
            transition={{
              duration: 0.8,
              ease: [0.645, 0.045, 0.355, 1],
              delay: 0.2,
            }}
            onAnimationComplete={onAnimationComplete}
          />
          <motion.div
            className="absolute inset-0 bg-slate-900 z-20"
            initial={{ y: 0 }}
            animate={{ y: "100%" }}
            transition={{
              duration: 0.8,
              ease: [0.645, 0.045, 0.355, 1],
              delay: 0.2,
            }}
          />

          {/* Clear NBA Logo */}
          <div className="z-30 flex flex-col items-center justify-center">
            <motion.div
              className="relative w-96 h-96"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Image
                src="https://cdn.nba.com/logos/leagues/logo-nba.svg"
                alt="NBA Logo"
                fill
                sizes="384px"
                style={{ objectFit: "contain" }}
                priority
              />
            </motion.div>
          </div>
        </>
      )}
    </motion.div>
  );
}
