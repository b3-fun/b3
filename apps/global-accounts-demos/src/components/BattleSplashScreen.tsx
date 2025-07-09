import styled from "styled-components";
import { motion } from "framer-motion";
import { B3 } from "../B3";
import { useModalStore, useTokensFromAddress } from "@b3dotfun/sdk/global-account/react";
import { useState, useEffect } from "react";

const SplashContainer = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url("/images/nft_battle_2.png") no-repeat center center/cover;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.1);
    // backdrop-filter: blur(3px);
    z-index: 1;
  }
`;

const Title = styled(motion.h1)`
  font-size: clamp(8rem, 12vw, 12rem);
  text-align: center;
  margin: 0;
  line-height: 0.9;
  position: relative;
  z-index: 2;
  font-family: "Audiowide", sans-serif;

  .battle {
    display: block;
    background: linear-gradient(45deg, #ff4444, #ff8844);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    filter: drop-shadow(0 0 20px rgba(255, 68, 68, 0.5));
  }

  .weapons {
    display: block;
    background: linear-gradient(45deg, #c1e3d8, #bce3d7);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    filter: drop-shadow(0 0 20px rgba(68, 255, 68, 0.5));
    text-shadow: 10px 10px #4aa4b9;
  }
`;

const Subtitle = styled(motion.div)`
  font-size: clamp(1.5rem, 3vw, 2rem);
  color: rgba(255, 255, 255, 0.9);
  text-align: center;
  margin: 2rem 0;
  max-width: 600px;
  position: relative;
  z-index: 2;
  font-family: "Barrio", system-ui;
`;

const LoadingText = styled(motion.div)`
  font-size: 2rem;
  color: #ff8844;
  text-align: center;
  margin: 2rem 0;
  z-index: 2;
`;

const LoadingContainer = styled(motion.div)`
  position: relative;
  z-index: 2;
  text-align: center;
`;

const LoadingRing = styled(motion.div)`
  display: inline-block;
  width: 160px;
  height: 160px;
  border: 4px solid transparent;
  border-radius: 50%;
  border-top-color: #ff4444;
  border-right-color: #ff8844;
  border-bottom-color: #44ff44;
  margin-bottom: 2rem;
`;

const WarningContainer = styled(motion.div)`
  position: relative;
  width: 100%;
  max-width: 800px;
  padding: 3rem;
  z-index: 2;
  transform: rotate(-5deg);

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: repeating-linear-gradient(45deg, #ff0000, #ff0000 20px, #990000 20px, #990000 40px);
    opacity: 0.8;
    z-index: -1;
    transform: skew(-15deg);
    box-shadow: 0 0 30px rgba(255, 0, 0, 0.5);
  }
`;

const WarningText = styled(motion.h2)`
  font-size: 5rem;
  color: white;
  text-shadow:
    3px 3px 0 #000,
    -3px -3px 0 #000,
    3px -3px 0 #000,
    -3px 3px 0 #000;
  margin: 0;
  text-align: center;
  font-family: "Rubik Pixels", system-ui;
`;

const CTAButton = styled(motion.a)`
  display: inline-block;
  font-size: 2rem;
  padding: 20px 40px;
  background: linear-gradient(45deg, #7bbda9, #4b7a8c);
  border: none;
  border-radius: 15px;
  color: white !important;
  cursor: pointer;
  text-decoration: none !important;
  font-weight: bold;
  box-shadow: 0 0 20px rgba(68, 255, 68, 0.5);
  margin-top: 3rem;
  transform: rotate(5deg);
  position: relative;
  z-index: 10;

  &:hover {
    text-decoration: none !important;
    color: white !important;
  }

  &:visited {
    color: white !important;
  }
`;

interface BattleSplashScreenProps {
  onStart: () => void;
}

export function BattleSplashScreen({ onStart }: BattleSplashScreenProps) {
  const store = useModalStore();
  const ecoSystemAccount = { address: store.ecoSystemAccountAddress };
  const [showLoading, setShowLoading] = useState(true);

  const { data: tokensResponse, isLoading: isLoadingTokens } = useTokensFromAddress({
    ownerAddress: ecoSystemAccount.address,
    chain: 8333,
    limit: 50,
  });

  const hasWeapons = tokensResponse?.data && tokensResponse.data.length > 0;

  useEffect(() => {
    if (!isLoadingTokens) {
      const timer = setTimeout(() => {
        setShowLoading(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isLoadingTokens]);

  const isLoading = isLoadingTokens || showLoading;

  return (
    <SplashContainer initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <Title>
        {/* <motion.span
          className="battle"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          BATTLE
        </motion.span> */}
        {!tokensResponse?.data && (
          <motion.span
            className="weapons"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            PICK YOOR WEAPON
          </motion.span>
        )}
      </Title>

      <div style={{ background: "rgb(38 146 187 / 59%)", marginBottom: 20, borderRadius: 50 }}>
        {!tokensResponse?.data && (
          <Subtitle initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
            Choose your weapon and battle for glory! 🗡️⚔️
          </Subtitle>
        )}
      </div>

      {!ecoSystemAccount.address ? (
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.8 }} style={{ zIndex: 2 }}>
          <B3 sessionKeyAddress={ecoSystemAccount.address || "0x0000000000000000000000000000000000000000"} />
        </motion.div>
      ) : isLoading ? (
        <LoadingContainer>
          <LoadingRing
            animate={{
              rotate: 360,
              scale: [1, 1.1, 1],
            }}
            transition={{
              rotate: {
                duration: 2,
                repeat: Infinity,
                ease: "linear",
              },
              scale: {
                duration: 1,
                repeat: Infinity,
                repeatType: "reverse",
              },
            }}
          />
          <LoadingText
            initial={{ opacity: 0 }}
            animate={{
              opacity: [0.5, 1, 0.5],
              scale: [1, 1.05, 1],
            }}
            transition={{
              repeat: Infinity,
              duration: 2,
              ease: "easeInOut",
            }}
          >
            Searching for weapons in your arsenal...
          </LoadingText>
        </LoadingContainer>
      ) : !hasWeapons ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: "center" }}>
          <WarningContainer initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", bounce: 0.5 }}>
            <WarningText
              animate={{
                x: [0, -10, 10, -10, 0],
                rotate: [-5, 5, -5, 5, -5],
              }}
              transition={{
                duration: 0.5,
                repeat: Infinity,
                repeatDelay: 3,
              }}
            >
              NO WEAPONS FOUND!
            </WarningText>
          </WarningContainer>

          <CTAButton
            href="https://memorynft.pages.dev/"
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{
              scale: 1.1,
              boxShadow: "0 0 30px rgba(68, 255, 68, 0.8)",
            }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              console.log("Redirecting to Memory NFT game...");
            }}
          >
            🎮 Get Your First Weapon! 🎮
          </CTAButton>
        </motion.div>
      ) : (
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onStart}
          style={{
            fontSize: "2rem",
            padding: "20px 40px",
            background: "linear-gradient(45deg, #ff4444, #ff8844)",
            border: "none",
            borderRadius: "15px",
            color: "white",
            cursor: "pointer",
            zIndex: 2,
            fontWeight: "bold",
          }}
        >
          Start Battle
        </motion.button>
      )}
    </SplashContainer>
  );
}
