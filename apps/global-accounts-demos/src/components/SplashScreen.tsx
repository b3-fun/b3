import { motion } from "framer-motion";
import styled from "styled-components";

const SplashContainer = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url("/images/weapons-space-bg.png") no-repeat center center/cover;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
  overflow: hidden;

  /* Overlay for better text contrast */
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.9);
    backdrop-filter: blur(3px);
    z-index: 1;
  }
`;

const Title = styled(motion.h1)`
  font-size: clamp(10rem, 15vw, 15rem);
  font-weight: 900;
  text-align: center;
  margin: 0;
  line-height: 0.9;
  position: relative;
  z-index: 2;
  font-family: "Rubik Pixels", system-ui;
  font-weight: 400;
  font-style: normal;

  @media (max-width: 768px) {
    font-size: clamp(5rem, 15vw, 7rem);
  }

  .memory {
    display: block;
    background: linear-gradient(45deg, #ff4444, #ff8844);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    filter: drop-shadow(0 0 20px rgba(255, 68, 68, 0.5));
  }

  .nft {
    display: block;
    background: linear-gradient(45deg, #44ff44, #00dd00);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    filter: drop-shadow(0 0 20px rgba(68, 255, 68, 0.5));
  }
`;

const Subtitle = styled(motion.div)`
  font-size: clamp(2rem, 4vw, 3rem);
  color: rgba(255, 255, 255, 0.9);
  text-align: center;
  margin: 2rem 0;
  max-width: 600px;
  position: relative;
  z-index: 2;
  font-family: "Barrio", system-ui;
`;

const StartButton = styled(motion.button)`
  font-size: clamp(1.5rem, 5vw, 2.5rem);
  padding: 20px 40px;
  background: linear-gradient(45deg, #ff4444, #ff8844);
  color: white;
  border: none;
  border-radius: 15px;
  cursor: pointer;
  box-shadow: 0 0 30px rgba(255, 68, 68, 0.5);
  font-weight: bold;
  position: relative;
  z-index: 2;

  &:hover {
    background: linear-gradient(45deg, #ff5555, #ff9955);
    transform: scale(1.05);
  }
`;

interface SplashScreenProps {
  onStart: () => void;
}

export function SplashScreen({ onStart }: SplashScreenProps) {
  return (
    <SplashContainer initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <Title>
        <motion.span
          className="memory"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          MEMORY
        </motion.span>
        <motion.span
          className="nft"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          NFT
        </motion.span>
      </Title>

      <Subtitle initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
        Match the weapons to win and claim your NFT! 🎮✨
      </Subtitle>

      <StartButton
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.8, type: "spring" }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onStart}
      >
        Start Game
      </StartButton>
    </SplashContainer>
  );
}
