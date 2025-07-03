import { useState, useEffect } from "react";
import styled from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import { weapons, Weapon } from "../data/weapons";
import { useTokensFromAddress, useModalStore } from "@b3dotfun/sdk/global-account/react";
import { Token } from "../../../../packages/sdk/dist/types/global-account/react/hooks/useTokensFromAddress";

const BattleContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
`;

const WeaponCard = styled(motion.div)`
  background: linear-gradient(45deg, #2a2a2a, #3a3a3a);
  border-radius: 15px;
  padding: 20px;
  width: 300px;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.3);
  border: 2px solid rgba(255, 255, 255, 0.1);

  .image-container {
    height: 200px;
    border-radius: 10px;
    overflow: hidden;
    margin-bottom: 15px;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  h3 {
    color: #fff;
    font-size: 1.5rem;
    margin: 0 0 10px;
  }

  p {
    color: rgba(255, 255, 255, 0.7);
    font-size: 0.9rem;
    margin-bottom: 15px;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
`;

const StatBar = styled.div<{ value: number }>`
  background: rgba(255, 255, 255, 0.1);
  border-radius: 5px;
  height: 20px;
  position: relative;
  overflow: hidden;

  &::after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: ${props => props.value}%;
    background: linear-gradient(45deg, #ff4444, #ff8844);
    border-radius: 5px;
  }
`;

const WeaponGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin: 20px 0;
`;

const BattleArena = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 40px 0;
  min-height: 400px;
`;

const VersusText = styled(motion.div)`
  font-size: 4rem;
  font-weight: bold;
  color: #ff4444;
  text-shadow: 0 0 20px rgba(255, 68, 68, 0.5);
`;

const PlayerNFTGrid = styled(WeaponGrid)`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 20px;
  background: rgba(0, 0, 0, 0.2);
  padding: 20px;
  border-radius: 20px;
`;

const BattleResult = styled(motion.div)<{ $winner: "player" | "opponent" }>`
  text-align: center;
  margin: 20px 0;
  padding: 40px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 20px;

  h2 {
    font-size: 4rem;
    margin-bottom: 30px;
    background: ${props =>
      props.$winner === "player"
        ? "linear-gradient(45deg, #44ff44, #00dd00)"
        : "linear-gradient(45deg, #ff4444, #ff8844)"};
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    text-shadow: 0 0 20px rgba(68, 255, 68, 0.3);
  }

  .stats-comparison {
    display: flex;
    justify-content: space-around;
    margin: 30px 0;
    font-size: 1.2rem;
    color: rgba(255, 255, 255, 0.9);
  }
`;

const ChooseYourWeapon = styled(motion.div)`
  font-size: clamp(1.5rem, 3vw, 2rem);
  color: rgba(255, 255, 255, 0.9);
  text-align: center;
  margin: 2rem 0;
  max-width: 600px;
  position: relative;
  z-index: 2;
  padding-left: 55px;
  font-family: "Audiowide", sans-serif;
`;

// Helper function to convert Token to Weapon format
function tokenToWeapon(token: Token): Weapon {
  return {
    id: parseInt(token.token_id),
    name: token.name || `NFT #${token.token_id}`,
    description: token.description || "A mysterious NFT weapon",
    image: token.image_url || "/placeholder.png",
    stats: {
      // You might want to derive these from token.extra_metadata.attributes
      strength: Math.floor(Math.random() * 50) + 50, // temporary random stats
      defense: Math.floor(Math.random() * 50) + 50,
      speed: Math.floor(Math.random() * 50) + 50,
      magic: Math.floor(Math.random() * 50) + 50
    }
  };
}

export function BattleGame() {
  const store = useModalStore();
  const ecoSystemAccount = { address: store.ecoSystemAccountAddress };

  const { data: tokensResponse } = useTokensFromAddress({
    ownerAddress: ecoSystemAccount.address,
    chain: 8333,
    limit: 50
  });

  const [selectedWeapon, setSelectedWeapon] = useState<Weapon | null>(null);
  const [opponentWeapon, setOpponentWeapon] = useState<Weapon | null>(null);
  const [battleState, setBattleState] = useState<"selection" | "battle" | "result">("selection");
  const [winner, setWinner] = useState<"player" | "opponent" | null>(null);

  const playerWeapons = tokensResponse?.data.map(tokenToWeapon) || [];

  const startBattle = () => {
    console.log("Starting battle...");
    setBattleState("battle");

    // Randomly select opponent's weapon
    const randomWeapon = weapons[Math.floor(Math.random() * weapons.length)];
    setOpponentWeapon(randomWeapon);

    // Use a cleanup function to ensure the timeout is properly handled
    const battleTimeout = setTimeout(() => {
      try {
        console.log("Timeout fired, calculating scores...");
        const playerScore = calculateScore(selectedWeapon!);
        const opponentScore = calculateScore(randomWeapon);

        console.log("Scores calculated:", { playerScore, opponentScore });
        setWinner(playerScore > opponentScore ? "player" : "opponent");
        console.log("Winner set, transitioning to result state...");
        setBattleState("result");
      } catch (error) {
        console.error("Error in battle timeout:", error);
      }
    }, 4000);

    // Cleanup the timeout if component unmounts
    return () => clearTimeout(battleTimeout);
  };

  // Move the battle logic into a useEffect to handle state updates properly
  useEffect(() => {
    if (battleState === "battle" && selectedWeapon && opponentWeapon) {
      const timer = setTimeout(() => {
        try {
          console.log("Battle timer executing...");
          const playerScore = calculateScore(selectedWeapon);
          const opponentScore = calculateScore(opponentWeapon);

          console.log("Battle scores:", { playerScore, opponentScore });
          setWinner(playerScore > opponentScore ? "player" : "opponent");
          setBattleState("result");
        } catch (error) {
          console.error("Error in battle effect:", error);
        }
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [battleState, selectedWeapon, opponentWeapon]);

  const calculateScore = (weapon: Weapon) => {
    return Object.values(weapon.stats).reduce((a, b) => a + b, 0);
  };

  const renderWeaponCard = (weapon: Weapon, onClick?: () => void) => (
    <WeaponCard whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={onClick}>
      <div className="image-container">
        <img src={weapon.image} alt={weapon.name} />
      </div>
      <h3>{weapon.name}</h3>
      <p>{weapon.description}</p>
      <StatsGrid>
        {Object.entries(weapon.stats).map(([stat, value]) => (
          <div key={stat}>
            <div style={{ marginBottom: 5 }}>{stat.charAt(0).toUpperCase() + stat.slice(1)}</div>
            <StatBar value={value} />
          </div>
        ))}
      </StatsGrid>
    </WeaponCard>
  );

  return (
    <BattleContainer>
      <AnimatePresence mode="wait">
        {battleState === "selection" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ChooseYourWeapon>Choose Your NFT Weapon</ChooseYourWeapon>
            <PlayerNFTGrid>
              {playerWeapons.map(weapon => (
                <motion.div key={weapon.id}>
                  {renderWeaponCard(weapon, () => {
                    setSelectedWeapon(weapon);
                    startBattle();
                  })}
                </motion.div>
              ))}
            </PlayerNFTGrid>
          </motion.div>
        )}

        {battleState === "battle" && selectedWeapon && opponentWeapon && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} key="battle">
            <BattleArena>
              <motion.div
                initial={{ x: -300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{
                  duration: 0.3, // Faster entry
                  type: "spring",
                  stiffness: 300
                }}
              >
                {renderWeaponCard(selectedWeapon)}
              </motion.div>

              <VersusText
                initial={{ scale: 0 }}
                animate={{
                  scale: [1, 1.2, 1]
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                VS
              </VersusText>

              <motion.div
                initial={{ x: 300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{
                  duration: 0.3, // Faster entry
                  type: "spring",
                  stiffness: 300
                }}
              >
                {renderWeaponCard(opponentWeapon)}
              </motion.div>
            </BattleArena>
          </motion.div>
        )}

        {battleState === "result" && winner && selectedWeapon && opponentWeapon && (
          <BattleResult
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            $winner={winner}
            key="result"
          >
            <h2>{winner === "player" ? "Victory! 🎉" : "💔 Defeated! 💔"}</h2>

            <div className="stats-comparison">
              <div>
                <h3>Battle Stats</h3>
                <p>Your Score: {calculateScore(selectedWeapon!)}</p>
                <p>Opponent Score: {calculateScore(opponentWeapon!)}</p>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                setSelectedWeapon(null);
                setOpponentWeapon(null);
                setWinner(null);
                setBattleState("selection");
              }}
              style={{
                fontSize: "1.5rem",
                padding: "15px 30px",
                background: "linear-gradient(45deg, #ff4444, #ff8844)",
                border: "none",
                borderRadius: "10px",
                color: "white",
                cursor: "pointer",
                marginTop: "20px"
              }}
            >
              Battle Again
            </motion.button>
          </BattleResult>
        )}
      </AnimatePresence>
    </BattleContainer>
  );
}

// Continue with battle mechanics and animations...
