export interface Weapon {
  id: number;
  name: string;
  description: string;
  image: string;
  stats: {
    strength: number;
    defense: number;
    speed: number;
    magic: number;
  };
}

export const weapons: Weapon[] = [
  {
    id: 0,
    name: "Intermediate Sword",
    description:
      "A balanced blade for the skilled warrior, perfect for those who are no longer novices but have yet to reach the pinnacle of swordsmanship.",
    image: "/weapons/0.webp",
    stats: {
      strength: 70,
      defense: 65,
      speed: 75,
      magic: 40
    }
  },
  {
    id: 1,
    name: "Legendary Sword",
    description:
      "Forged in the fires of ancient myths, this sword radiates with a power that has been spoken of in legends. Only the worthiest of heroes can wield it.",
    image: "/weapons/1.webp",
    stats: {
      strength: 90,
      defense: 85,
      speed: 80,
      magic: 75
    }
  },
  {
    id: 2,
    name: "Goat Ribbon",
    description:
      "A mystical ribbon adorned with the emblem of the goat, symbolizing agility and tenacity. It enhances the wearer's speed and resilience in battle.",
    image: "/weapons/2.webp",
    stats: {
      strength: 45,
      defense: 60,
      speed: 95,
      magic: 70
    }
  },
  {
    id: 3,
    name: "Yolo Bow",
    description:
      "Crafted for the fearless and daring archer, this bow embodies the spirit of 'You Only Live Once.' It shoots arrows with incredible precision and speed.",
    image: "/weapons/3.webp",
    stats: {
      strength: 85,
      defense: 40,
      speed: 90,
      magic: 55
    }
  },
  {
    id: 4,
    name: "Aqua Mamoa",
    description:
      "A weapon infused with the essence of the ocean. The Aqua Mamoa unleashes powerful water-based attacks, drowning enemies in waves of fury.",
    image: "/weapons/4.webp",
    stats: {
      strength: 75,
      defense: 70,
      speed: 65,
      magic: 90
    }
  },
  {
    id: 5,
    name: "Legendary Pikaxer",
    description:
      "An enchanted pickaxe that doubles as a devastating weapon. Legends say it can cleave through rock and armor with equal ease.",
    image: "/weapons/5.webp",
    stats: {
      strength: 95,
      defense: 80,
      speed: 50,
      magic: 65
    }
  },
  {
    id: 6,
    name: "Multi Bow",
    description:
      "A versatile bow capable of firing multiple arrows simultaneously. Perfect for taking down several targets at once or overwhelming a single foe.",
    image: "/weapons/6.webp",
    stats: {
      strength: 80,
      defense: 45,
      speed: 85,
      magic: 70
    }
  },
  {
    id: 7,
    name: "Noob Pikaxer",
    description:
      "A basic pickaxe for beginners, this tool is ideal for those just starting their journey. It may be simple, but in the right hands, it can still pack a punch.",
    image: "/weapons/7.webp",
    stats: {
      strength: 50,
      defense: 55,
      speed: 60,
      magic: 30
    }
  },
  {
    id: 8,
    name: "Tron Bomb",
    description:
      "A high-tech explosive device inspired by the digital realm. The Tron Bomb releases a burst of energy that disrupts and annihilates anything in its blast radius.",
    image: "/weapons/8.webp",
    stats: {
      strength: 100,
      defense: 30,
      speed: 70,
      magic: 85
    }
  }
];
