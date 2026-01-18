// src/config/LabelMap.js

// --- CROP LABELS ---
// Ensure these match the exact strings sent by the Python script analysis_basis
export const CROP_LABELS = [
  'Healthy',
  'Insect Bite', // Matches your Python script key
  'Spotting',
  'Wilting',
  'Yellowing',
];

// --- INSECT LABELS ---
export const INSECT_LABELS = [
  'Beneficial Bee',
  'Beneficial Lacewing Larvae',
  'Beneficial Ladybug',
  'ladybug', // Added to catch lowercase variations from model
  'Beneficial Larvae',
  'Infected Aphid',
  'Infected Flea Beetle',
  'Infected Pumpkin Beetle',
];

// --- getCropInsight ---
export const getCropInsight = (label) => {
  switch (label) {
    case 'Healthy':
      return {
        title: 'Excellent Condition 🌿',
        description: 'Your Pechay shows healthy growth. Ensure consistent water and well-drained soil. Pechay has shallow roots and dries out quickly.',
        source: 'Source: The Old Farmer\'s Almanac',
        youtubeId: 'K_VAEy0og7E' 
      };
    case 'Insect Bite': // Updated casing to match script
      return {
        title: 'Pest Damage Detected 🐜',
        description: 'Small "shot-holes" are likely Flea Beetles. Larger holes suggest Cabbage Loopers. Apply Neem Oil focusing on leaf undersides.',
        source: 'Source: University of Minnesota Extension',
        youtubeId: 'CuAaExSOIh8'
      };
    case 'Wilting':
      return {
        title: 'Wilting Detected 💧',
        description: 'Pechay wilts from water stress. Check soil 2 inches deep. If dry, water at the base. If soggy, improve drainage to prevent root rot.',
        source: 'Source: UC Davis Vegetable Research Center',
        youtubeId: 'On7_JGLnScs' 
      };
    case 'Spotting':
      return {
        title: 'Leaf Spot Detected 🍄',
        description: 'Likely fungal (Alternaria). Destroy affected leaves. Avoid overhead watering and ensure good air circulation.',
        source: 'Source: Penn State Extension',
        youtubeId: 'yOqCikg6-3k'
      };
    case 'Yellowing':
      return {
        title: 'Yellowing (Chlorosis) 🍂',
        description: 'Often signals Nitrogen deficiency in old leaves or Iron deficiency in new ones. Apply balanced organic fertilizer.',
        source: 'Source: Utah State University Extension',
        youtubeId: 'PbvvHvWKht0'
      };
    default:
      return {
        title: 'Monitoring Growth',
        description: 'Continuing to monitor the health of your crops.',
        source: '',
        youtubeId: null
      };
  }
};

// --- getInsectInsight ---
export const getInsectInsight = (label) => {
  // Normalize label to handle casing differences
  const normalizedLabel = label?.toLowerCase();

  if (normalizedLabel.includes('bee')) {
    return {
      title: 'Beneficial: Bee 🐝',
      description: 'Crucial pollinators! Protect them by avoiding daytime pesticide use. They help increase crop yields significantly.',
      source: 'Source: The Xerces Society',
      youtubeId: 'L2wh6s-P-2M'
    };
  }
  
  if (normalizedLabel.includes('ladybug')) {
    return {
      title: 'Beneficial: Ladybug 🐞',
      description: 'Natural pest controllers. They eat large quantities of aphids. Their presence is a sign of a healthy garden ecosystem.',
      source: 'Source: Cornell University',
      youtubeId: '0n_2_y-818I'
    };
  }

  if (normalizedLabel.includes('lacewing') || normalizedLabel.includes('larvae')) {
    return {
      title: 'Beneficial: Predator Larvae 🐛',
      description: 'Likely a Lacewing larva or "Aphid Lion." These are voracious predators of soft-bodied pests like thrips and mites.',
      source: 'Source: UC Agriculture',
      youtubeId: 'U54tBFqxufA'
    };
  }

  if (normalizedLabel.includes('aphid')) {
    return {
      title: 'Pest: Aphid Colony 🦟',
      description: 'Sap-sucking insects that stunt growth. Use a strong water jet to knock them off or apply Neem Oil for heavy infestations.',
      source: 'Source: RHS',
      youtubeId: 'G-b0g40-2vU'
    };
  }

  if (normalizedLabel.includes('flea beetle')) {
    return {
      title: 'Pest: Flea Beetle 🦗',
      description: 'Chews round "shot-holes" in leaves. Protect seedlings with row covers or Diatomaceous Earth (DE).',
      source: 'Source: UMN Extension',
      youtubeId: 'CuAaExSOIh8'
    };
  }

  if (normalizedLabel.includes('pumpkin beetle') || normalizedLabel.includes('cucumber beetle')) {
    return {
      title: 'Pest: Pumpkin Beetle 🎃',
      description: 'Feeds on leaves and flowers. Can transmit bacterial wilt. Hand-pick in the morning and use yellow sticky traps.',
      source: 'Source: Australian Museum',
      youtubeId: 'c1QYg5dYnF8'
    };
  }

  return {
    title: 'Insect Detected',
    description: `A ${label} was detected. Watch for signs of leaf damage or beneficial behavior.`,
    source: '',
    youtubeId: null
  };
};