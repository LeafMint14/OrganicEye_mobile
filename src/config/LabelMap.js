// src/config/LabelMap.js

// --- CROP LABELS (Unchanged) ---
export const CROP_LABELS = [
  'Healthy',
  'Insect bite',
  'Spotting',
  'Wilting',
  'Yellowing',
];

// --- INSECT LABELS (Unchanged) ---
export const INSECT_LABELS = [
  'Beneficial Bee',
  'Beneficial Lacewing Larvae',
  'Beneficial Ladybug',
  'Beneficial Larvae',
  'Infected Aphid',
  'Infected Flea Beetle',
  'Infected Pumpkin Beetle',
];

// --- getCropInsight (Unchanged) ---
export const getCropInsight = (label) => {
  switch (label) {
    case 'Healthy':
      return {
        title: 'Excellent Condition 🌿',
        description: 'Your Pechay shows healthy growth. To maintain this, ensure it receives consistent water (about 1 inch per week) and is in well-drained soil. Pechay has shallow roots, so it can dry out quickly.',
        source: 'Source: The Old Farmer\'s Almanac',
        youtubeId: 'K_VAEy0og7E' 
      };
    case 'Insect bite':
      return {
        title: 'Pest Damage Detected 🐜',
        description: 'Small "shot-holes" are likely from Flea Beetles. Larger holes suggest Cabbage Loopers or Slugs. Apply an organic insecticide like Neem Oil or insecticidal soap, focusing on the undersides of leaves. Using floating row covers can prevent pests from reaching the plants.',
        source: 'Source: University of Minnesota Extension',
        youtubeId: 'CuAaExSOIh8'
      };
    case 'Wilting':
      return {
        title: 'Wilting Detected 💧',
        description: 'Pechay wilts from water stress. Check the soil 2 inches deep. If dry, water deeply at the plant\'s base. If the soil is soggy, this indicates root rot from over-watering or poor drainage. Let the soil dry out and ensure good drainage.',
        source: 'Source: UC Davis Vegetable Research Center',
        youtubeId: 'On7_JGLnScs' 
      };
    case 'Spotting':
      return {
        title: 'Leaf Spot Detected 🍄',
        description: 'This is likely a fungal or bacterial spot (like Alternaria or Cercospora). Remove and destroy affected leaves immediately (do not compost them). To prevent spread, avoid overhead watering—water the soil, not the leaves. Ensure good air circulation between plants.',
        source: 'Source: Penn State Extension',
        youtubeId: 'yOqCikg6-3k'
      };
    case 'Yellowing':
      return {
        title: 'Yellowing (Chlorosis) 🍂',
        description: 'Yellowing of older, lower leaves often signals a Nitrogen deficiency. Yellowing on new leaves can indicate an Iron or Magnesium deficiency. This can also be caused by over-watering. Apply a balanced organic fertilizer and ensure the soil is not waterlogged.',
        source: 'Source: Utah State University Extension',
        youtubeId: 'PbvvHvWKht0'
      };
    default:
      return {
        title: 'No Insight Available',
        description: 'No specific insight is available for this detection.',
        source: '',
        youtubeId: null
      };
  }
};


// --- 1. NEW INSECT INSIGHT FUNCTION ---
export const getInsectInsight = (label) => {
  switch (label) {
    case 'Beneficial Bee':
      return {
        title: 'Beneficial: Bee 🐝',
        description: 'This is a honey bee, a crucial pollinator for your crops. Bees are beneficial and should be protected. Avoid spraying pesticides when they are active (during the day). Planting flowers nearby can attract more.',
        source: 'Source: The Xerces Society',
        youtubeId: 'L2wh6s-P-2M' // "Attracting Pollinators"
      };
    case 'Beneficial Lacewing Larvae':
    case 'Beneficial Larvae': // Grouping these together
      return {
        title: 'Beneficial: Lacewing Larvae 🐛',
        description: 'This is a lacewing larva, often called an "Aphid Lion." It\'s a voracious predator of soft-bodied pests like aphids, thrips, and spider mites. This is a very good insect to have in your garden!',
        source: 'Source: University of California Agriculture',
        youtubeId: 'U54tBFqxufA' // "All About Green Lacewings"
      };
    case 'Beneficial Ladybug':
      return {
        title: 'Beneficial: Ladybug 🐞',
        description: 'A welcome visitor! Ladybugs (or Lady Beetles) are famous for eating large quantities of aphids, protecting your plants from damage. Do not remove or spray this insect.',
        source: 'Source: Cornell University',
        youtubeId: '0n_2_y-818I' // "Using Ladybugs for Pest Control"
      };
    case 'Infected Aphid':
      return {
        title: 'Pest: Aphids 🦟',
        description: 'Aphids are small, sap-sucking insects that stunt plant growth and spread disease. A strong jet of water can knock them off. For heavy infestations, use insecticidal soap or Neem Oil. Encourage beneficial insects like ladybugs to control them naturally.',
        source: 'Source: The Royal Horticultural Society',
        youtubeId: 'G-b0g40-2vU' // "How To Get Rid Of Aphids"
      };
    case 'Infected Flea Beetle':
      return {
        title: 'Pest: Flea Beetle 🦗',
        description: 'Flea Beetles chew small, round "shot-holes" in leaves, which is especially damaging to young seedlings. Use floating row covers to protect plants. Dusting with Diatomaceous Earth (DE) or applying Neem Oil can help control them.',
        source: 'Source: University of Minnesota Extension',
        youtubeId: 'CuAaExSOIh8' // "Getting Rid of Flea Beetles"
      };
    case 'Infected Pumpkin Beetle':
      return {
        title: 'Pest: Pumpkin Beetle 🎃',
        description: 'Also known as the Cucumber Beetle, this pest feeds on leaves, flowers, and fruit, and can transmit bacterial wilt. Remove them by hand (dropping into soapy water) in the morning. Use yellow sticky traps and apply organic pesticides like pyrethrin if necessary.',
        source: 'Source: Australian Museum',
        youtubeId: 'c1QYg5dYnF8' // "How to Control Cucumber Beetles"
      };
    default:
      return {
        title: 'No Insight Available',
        description: 'No specific insight is available for this detection.',
        source: '',
        youtubeId: null
      };
  }
};