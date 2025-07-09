import { useState } from "react";
import styled from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import { B3 } from "../B3";
import { MintButton } from "@b3dotfun/sdk/global-account/react";
import { b3Chain } from "../b3Chain";
import { Account } from "thirdweb/wallets";
import { useActiveAccount } from "thirdweb/react";
import { SplashScreen } from "./SplashScreen";

const images = [
  "/weapons/0.webp",
  "/weapons/1.webp",
  "/weapons/2.webp",
  "/weapons/3.webp",
  "/weapons/4.webp",
  "/weapons/5.webp",
  "/weapons/6.webp",
  "/weapons/7.webp",
  "/weapons/8.webp",
];

type GameState = "initial" | "countdown" | "showing" | "guessing" | "complete";

const START_DELAY_TIME = 3000; // 3 seconds total
const WORD_DELAY_TIME = START_DELAY_TIME / 3; // Time for each word

const GameContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 15vh);
  grid-template-rows: repeat(3, 15vh);
  gap: 20px;
  margin: 20px 0;
  justify-content: center;
`;

const Card = styled(motion.div)`
  aspect-ratio: 1;
  background: #2a2a2a;
  border-radius: 10px;
  overflow: hidden;
  cursor: pointer;
  width: 15vh;
  height: 15vh;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const CenteredContainer = styled(motion.div)`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 10;
`;

// Add a wrapper to handle the scale animations
const ButtonWrapper = styled(motion.div)`
  position: relative;
  display: inline-block;
`;

const CountdownText = styled(motion.h1)`
  font-size: 5rem;
  text-align: center;
  margin: 0;
  padding: 30px 50px;
  border-radius: 15px;
  text-shadow: 0 0 15px rgba(0, 0, 0, 0.3);
  letter-spacing: 2px;
  font-weight: bold;
  color: white;
`;

const ReadyText = styled(CountdownText)`
  background: linear-gradient(45deg, #ff4444, #ff6b6b);
`;

const SetText = styled(CountdownText)`
  background: linear-gradient(45deg, #ffaa00, #ffd000);
`;

const GoText = styled(CountdownText)`
  background: linear-gradient(45deg, #44ff44, #00dd00);
`;

const StartButton = styled(motion.button)`
  font-size: 3rem;
  padding: 20px 40px;
  background: linear-gradient(45deg, #ff4444, #ff8844);
  color: white;
  border: none;
  border-radius: 15px;
  cursor: pointer;
  box-shadow: 0 0 20px rgba(255, 68, 68, 0.5);
  text-transform: uppercase;
  font-weight: bold;
  white-space: nowrap;

  &:hover {
    background: linear-gradient(45deg, #ff5555, #ff9955);
  }
`;

const CongratsText = styled(CountdownText)`
  background: linear-gradient(45deg, #44ff44, #00dd00); // Success green gradient
  margin-bottom: 2rem;
  font-size: 3rem;
`;

const ClaimButton = styled(StartButton)`
  font-size: 2.5rem; // Keep the slightly smaller size
`;

const RestartButton = styled(motion.button)`
  position: fixed;
  bottom: 20px;
  right: 20px;
  font-size: 1.2rem;
  padding: 12px 24px;
  background: linear-gradient(45deg, #ff4444, #ff8844);
  opacity: 0.8;
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  box-shadow: 0 0 10px rgba(255, 68, 68, 0.3);
  text-transform: uppercase;
  font-weight: bold;

  &:hover {
    opacity: 1;
    background: linear-gradient(45deg, #ff5555, #ff9955);
  }
`;

const Overlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(5px);
  z-index: 100;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const Modal = styled(motion.div)`
  background: #2a2a2a;
  padding: 48px 40px;
  border-radius: 24px;
  text-align: center;
  width: 90%;
  max-width: 540px;
  box-shadow: 0 0 40px rgb(99 33 33 / 30%);
  border: 2px solid rgb(87 83 83 / 50%);
  font-family: "Outfit", system-ui, sans-serif;
`;

const ModalTitle = styled.div`
  font-size: 3.6rem;
  font-weight: 700;
  background: linear-gradient(45deg, #ff4444, #ff8844);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 2.5rem;
  line-height: 1.2;
  letter-spacing: -0.02em;
`;

const ModalSubheading = styled.div`
  font-size: 1.8rem;
  color: rgba(255, 255, 255, 0.95);
  font-weight: 500;
  margin-bottom: 1rem;
  line-height: 1.4;
`;

const ModalDescription = styled.div`
  font-size: 1.4rem;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 3rem;
  line-height: 1.6;
  font-weight: 400;
`;

// Add new styled component for success message
const SuccessMessage = styled(motion.div)`
  color: #44ff44;
  font-size: 2rem;
  margin: 2rem 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
`;

// Add new styled component for the success image
const SuccessImage = styled(motion.div)`
  width: 200px;
  height: 200px;
  margin: 0 auto 2rem;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 0 30px rgba(68, 255, 68, 0.3);
  border: 2px solid rgba(68, 255, 68, 0.5);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

// Add new styled component for the transaction link
const TransactionLink = styled.a`
  display: inline-block;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
  text-decoration: none;
  margin-top: 1rem;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  transition: all 0.2s ease;
  font-family: monospace;

  &:hover {
    color: white;
    background: rgba(255, 255, 255, 0.2);
    transform: translateY(-2px);
  }
`;

export function Game({
  signerAccount,
  sessionKeyAddress,
}: {
  signerAccount: Account;
  sessionKeyAddress: `0x${string}`;
}) {
  const [gameState, setGameState] = useState<GameState>("initial");
  const [targetImage, setTargetImage] = useState<number | null>(null);
  const [showImages, setShowImages] = useState(false);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState(false);
  const ecoSystemAccount = useActiveAccount();
  const [showSplash, setShowSplash] = useState(true);
  const [successHash, setSuccessHash] = useState<string | null>(null);

  console.log("@@ecoSystemAccount", ecoSystemAccount);
  const startGame = async () => {
    setGameState("countdown");
    await new Promise(resolve => setTimeout(resolve, START_DELAY_TIME));
    setShowImages(true);
    setGameState("showing");

    setTimeout(() => {
      setShowImages(false);
      setGameState("guessing");
      setTargetImage(Math.floor(Math.random() * images.length));
    }, 5000);
  };

  const handleCardClick = (index: number) => {
    if (gameState !== "guessing") return;

    if (index === targetImage) {
      setGameState("complete");
    } else {
      // Handle wrong guess
      alert("Try again!");
    }
  };

  const restartGame = () => {
    setGameState("initial");
    setTargetImage(null);
    setShowImages(false);
  };

  const handleClaim = () => {
    setShowClaimModal(true);
  };

  console.log("@@targetImage", targetImage);

  return (
    <GameContainer>
      <AnimatePresence>
        {showSplash ? (
          <SplashScreen onStart={() => setShowSplash(false)} />
        ) : (
          <>
            {gameState === "initial" && (
              <CenteredContainer>
                <ButtonWrapper
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 200 }}
                >
                  <StartButton onClick={startGame}>Start Game</StartButton>
                </ButtonWrapper>
              </CenteredContainer>
            )}

            {gameState === "countdown" && (
              <AnimatePresence>
                <CenteredContainer>
                  <ReadyText
                    key="ready"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1.2, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    Ready
                  </ReadyText>
                  <SetText
                    key="set"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1.2, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ delay: WORD_DELAY_TIME / 1000, duration: 0.5 }}
                  >
                    Set
                  </SetText>
                  <GoText
                    key="go"
                    initial={{ scale: 0, opacity: 0, rotate: -180 }}
                    animate={{ scale: 1.5, opacity: 1, rotate: 0 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{
                      delay: (WORD_DELAY_TIME * 2) / 1000,
                      duration: 0.5,
                      type: "spring",
                      stiffness: 200,
                    }}
                  >
                    GO!
                  </GoText>
                </CenteredContainer>
              </AnimatePresence>
            )}

            <Grid>
              {images.map((image, index) => (
                <Card
                  key={index}
                  onClick={() => handleCardClick(index)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <AnimatePresence>
                    {showImages && (
                      <motion.img
                        src={image}
                        initial={{ opacity: 0 }}
                        animate={{
                          opacity: 1,
                          scale: [1, 1.1, 1],
                          transition: { repeat: Infinity, duration: 2 },
                        }}
                        exit={{ opacity: 0 }}
                      />
                    )}
                  </AnimatePresence>
                </Card>
              ))}
            </Grid>

            {gameState === "guessing" && targetImage !== null && (
              <motion.h2 initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                Where was image #{targetImage + 1}?
              </motion.h2>
            )}

            {gameState === "complete" && (
              <>
                <CenteredContainer>
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 200 }}
                  >
                    <CongratsText
                      initial={{ rotate: -180 }}
                      animate={{ rotate: 0 }}
                      transition={{ type: "spring", stiffness: 200 }}
                    >
                      Congratulations! 🎉
                    </CongratsText>

                    <ButtonWrapper
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.5 }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <ClaimButton onClick={handleClaim}>Claim NFT</ClaimButton>
                    </ButtonWrapper>
                  </motion.div>
                </CenteredContainer>

                <RestartButton
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 0.8 }}
                  transition={{ delay: 1, type: "spring", stiffness: 200 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={restartGame}
                >
                  Restart Game
                </RestartButton>
              </>
            )}

            {showClaimModal && (
              <Overlay initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Modal
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 200 }}
                >
                  {!claimSuccess ? (
                    <>
                      <ModalTitle>Claim Your NFT</ModalTitle>
                      <ModalSubheading>
                        Claiming is free!
                        <br />
                        Sign in once and claim forever! ✨
                      </ModalSubheading>
                      <ModalDescription>Your achievements are waiting to become NFTs! 🏆</ModalDescription>
                      <ButtonWrapper style={{ width: "100%" }}>
                        {/* Test button always visible */}
                        {/* <StartButton
                          onClick={() => setClaimSuccess(true)}
                          style={{ fontSize: '1rem', padding: '12px 24px', marginBottom: '12px' }}
                        >
                          Test Success
                        </StartButton> */}

                        {ecoSystemAccount?.address ? (
                          <div style={{ marginTop: 20, width: "100%", display: "block" }}>
                            {typeof targetImage === "number" && (
                              <MintButton
                                contractAddress={"0xa8e42121e318e3D3BeD7f5969AF6D360045317DD"}
                                chain={b3Chain}
                                tokenId={Number(targetImage) - 1}
                                account={signerAccount}
                                to={ecoSystemAccount?.address as `0x${string}`}
                                className="w-full"
                                onSuccess={txhash => {
                                  console.log("@@txhash", txhash);
                                  setClaimSuccess(true);
                                  setSuccessHash(txhash);
                                }}
                              />
                            )}
                          </div>
                        ) : (
                          <div
                            onClick={() => setShowClaimModal(false)}
                            style={{ display: "flex", justifyContent: "center", alignItems: "center" }}
                          >
                            <B3
                              closeAfterLogin={true}
                              onSessionKeySuccess={() => setShowClaimModal(true)}
                              sessionKeyAddress={sessionKeyAddress}
                            />
                          </div>
                        )}
                      </ButtonWrapper>
                    </>
                  ) : (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200 }}
                    >
                      <SuccessImage
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                      >
                        <img src={targetImage !== null ? images[targetImage] : ""} alt="Winning weapon" />
                      </SuccessImage>
                      <SuccessMessage>
                        <span>🎉</span>
                        NFT Claimed Successfully!
                        <span>🎉</span>
                      </SuccessMessage>
                      {successHash && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
                          <TransactionLink
                            href={`https://explorer.b3.fun/tx/${successHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            View Transaction ↗
                          </TransactionLink>
                        </motion.div>
                      )}
                      <StartButton
                        onClick={() => {
                          setShowClaimModal(false);
                          setClaimSuccess(false);
                          restartGame();
                        }}
                        style={{ fontSize: "1.2rem", marginTop: "2rem" }}
                      >
                        Play Again
                      </StartButton>
                    </motion.div>
                  )}
                </Modal>
              </Overlay>
            )}
          </>
        )}
      </AnimatePresence>
    </GameContainer>
  );
}
