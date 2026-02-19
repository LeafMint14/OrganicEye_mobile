// src/config/LabelMap.js

// --- CROP LABELS ---
// Ensure these match the exact strings sent by the Python script analysis_basis
export const CROP_LABELS = [
  'Healthy',
  'Insect Bite', 
  'Leaf Perforation', // NEW: Added for hit-and-run pest damage
  'Spotting',
  'Wilting',
  'Yellowing',
];

// --- INSECT LABELS ---
export const INSECT_LABELS = [
  'Beneficial Bee',
  'Beneficial Lacewing Larvae',
  'Beneficial Ladybug',
  'ladybug', 
  'Beneficial Larvae',
  'Infected Aphid',
  'Infected Flea Beetle',
  'Infected Pumpkin Beetle',
  'Unidentified Insect', // NEW: Added for unknown bugs
];

// --- getCropInsight ---
export const getCropInsight = (label) => {
  // Normalize the label so casing (e.g., "Insect bite" vs "Insect Bite") doesn't break the app
  const normalizedLabel = label?.toLowerCase()?.trim() || "";

  if (normalizedLabel.includes('healthy')) {
    return {
      title: 'Excellent Condition 🌿',
      description: 'Your Pechay shows healthy growth.',
      medicalDetail: 'No signs of pest or disease stress. The vascular system and leaf surface are completely intact.',
      treatmentSteps: 'Ensure consistent water and well-drained soil. Pechay has shallow roots and dries out quickly. Continue regular watering and fertilizing schedule.',
      source: "Source: The Old Farmer's Almanac",
      youtubeId: 'K_VAEy0og7E' 
    };
  }

  if (normalizedLabel.includes('insect bite')) {
    return {
      title: 'Active Pest Damage 🐜',
      description: 'Holes in leaves with an active pest present.',
      medicalDetail: 'Damage caused by chewing insects currently on the plant. This physically removes leaf tissue, reducing photosynthesis.',
      treatmentSteps: '1. Isolate the affected plant.\n2. Hand-pick visible pests if possible.\n3. Apply Neem Oil, focusing heavily on the undersides of the leaves.',
      source: 'Source: University of Minnesota Extension',
      youtubeId: 'CuAaExSOIh8'
    };
  }

  // NEW: Logic for holes with NO visible insect
  if (normalizedLabel.includes('leaf perforation')) {
    return {
      title: 'Leaf Perforation Detected 🌿',
      description: 'Holes detected without visible pests. This is "Hit and Run" damage.',
      medicalDetail: 'Pests like flea beetles or caterpillars feed primarily at night or hide in the soil during the day, leaving foliar damage behind.',
      treatmentSteps: '1. Inspect the soil and undersides of leaves at dusk/dawn.\n2. Apply organic Neem Oil or Bt spray as a preventative measure.\n3. Set up yellow sticky traps to catch flying adults.',
      source: 'Source: DA-BPI Plant Pest Guide',
      youtubeId: 'CuAaExSOIh8'
    };
  }

  if (normalizedLabel.includes('wilting')) {
    return {
      title: 'Wilting Detected 💧',
      description: 'Pechay wilts heavily from water stress or root issues.',
      medicalDetail: 'Caused by lower water pressure (turgor) inside plant cells, often due to underwatering, extreme heat, or root rot from overwatering.',
      treatmentSteps: '1. Check soil moisture 2 inches deep.\n2. If dry, water deeply at the base.\n3. If soggy, improve drainage immediately to prevent root rot.',
      source: 'Source: UC Davis Vegetable Research Center',
      youtubeId: 'On7_JGLnScs' 
    };
  }

  if (normalizedLabel.includes('spotting')) {
    return {
      title: 'Leaf Spot Detected 🍄',
      description: 'Likely a fungal infection such as Alternaria.',
      medicalDetail: 'Fungal or bacterial spores penetrate the leaf tissue, causing localized cell death (necrosis) which appears as dark spots.',
      treatmentSteps: '1. Destroy affected leaves immediately.\n2. Avoid overhead watering to keep leaves dry.\n3. Ensure good air circulation between crops.',
      source: 'Source: Penn State Extension',
      youtubeId: 'yOqCikg6-3k'
    };
  }

  if (normalizedLabel.includes('yellowing')) {
    return {
      title: 'Yellowing (Chlorosis) 🍂',
      description: 'Often signals a nutrient deficiency in the soil.',
      medicalDetail: 'Chlorosis indicates a severe lack of chlorophyll production. Nitrogen deficiency affects old leaves first; Iron deficiency affects new leaves.',
      treatmentSteps: '1. Check soil pH levels.\n2. Apply a balanced organic fertilizer.\n3. Ensure the plant is receiving adequate, unblocked sunlight.',
      source: 'Source: Utah State University Extension',
      youtubeId: 'PbvvHvWKht0'
    };
  }

  // Fallback if the AI detects something completely unknown
  return {
    title: 'Monitoring Growth',
    description: 'Continuing to monitor the health of your crops.',
    medicalDetail: 'Analyzing systemic leaf patterns.',
    treatmentSteps: 'Continue standard care and monitor for changes.',
    source: '',
    youtubeId: null // Button hides safely
  };
};

// --- getInsectInsight ---
export const getInsectInsight = (label) => {
  const normalizedLabel = label?.toLowerCase() || "";

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

  // NEW: Logic for unrecognized insects
  if (normalizedLabel.includes('unidentified insect')) {
    return {
      title: 'Unidentified Insect 🪲',
      description: 'An insect was detected but its specific species could not be classified. Monitor the plant closely for ensuing damage.',
      source: 'Source: AI Anomaly Detection',
      youtubeId: null
    };
  }

  return {
    title: 'Insect Detected',
    description: `A ${label} was detected. Watch for signs of leaf damage or beneficial behavior.`,
    source: '',
    youtubeId: null
  };
};