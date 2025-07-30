"use client";

import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { motion } from "motion/react";
import React, { useCallback, useEffect, useMemo, useState } from "react";

interface AnimatedLottieProps {
  src: string;
  autoplay?: boolean;
  loop?: boolean;
  delay?: number;
  animateBounce?: boolean;
  className?: string;
  style?: React.CSSProperties;
  reverse?: boolean;
}

export const AnimatedLottie: React.FC<AnimatedLottieProps> = React.memo(
  ({ src, autoplay = false, loop = false, delay = 0, animateBounce = true, className, style, reverse = false }) => {
    const [dotLottie, setDotLottie] = useState<any>(null);
    const [isHovered, setIsHovered] = useState(false);

    const onComplete = useCallback(() => {
      if (!isHovered && dotLottie) {
        try {
          dotLottie.pause();
        } catch (error) {
          console.error("Failed to pause animation:", error);
        }
      }
    }, [isHovered, dotLottie]);

    useEffect(() => {
      if (dotLottie) {
        dotLottie.addEventListener("complete", onComplete);
        return () => {
          dotLottie.removeEventListener("complete", onComplete);
        };
      }
    }, [dotLottie, onComplete]);

    const dotLottieRefCallback = useCallback(
      (instance: any) => {
        setDotLottie(instance);
        if (autoplay && instance) {
          setTimeout(
            () => {
              try {
                instance.play();
              } catch (error) {
                console.error("Failed to play animation:", error);
              }
            },
            delay ? delay * 1000 : 0,
          );
        }
      },
      [autoplay, delay],
    );

    const handleMouseEnter = useCallback(() => {
      setIsHovered(true);
      try {
        dotLottie?.play();
      } catch (error) {
        console.error("Failed to play animation:", error);
      }
    }, [dotLottie]);

    const handleMouseLeave = useCallback(() => {
      setIsHovered(false);
    }, []);

    const animateProps = useMemo(
      () => ({
        scale: animateBounce ? [1, 0.95, 1.05, 1] : 1,
      }),
      [animateBounce],
    );

    return (
      <motion.div
        whileHover={{ scale: 1.05 }}
        initial={{ scale: 1 }}
        animate={animateProps}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className={className}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <DotLottieReact
          src={src}
          dotLottieRefCallback={dotLottieRefCallback}
          style={style}
          autoplay={autoplay}
          loop={loop}
          mode={reverse ? "reverse" : "forward"}
        />
      </motion.div>
    );
  },
);

AnimatedLottie.displayName = "AnimatedLottie";
