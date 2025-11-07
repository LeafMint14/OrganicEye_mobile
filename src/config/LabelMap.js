// src/config/labelMap.js

// These are the 5 Crop classes from your new model
export const CROP_LABELS = [
  'Healthy',
  'Insect bite',
  'Spotting',
  'Wilting',
  'Yellowing',
];

// These are the 7 Insect classes from your new model
export const INSECT_LABELS = [
  'Beneficial Bee',
  'Beneficial Lacewing Larvae',
  'Beneficial Ladybug',
  'Beneficial Larvae',
  'Infected Aphid',
  'Infected Flea Beetle',
  'Infected Pumpkin Beetle',
];



export const getCropInsight = (label) => {
  switch (label) {
    case 'Healthy':
      return {
        title: 'Excellent Condition 🌿',
        description: 'Your Pechay shows healthy growth. To maintain this, ensure it receives consistent water (about 1 inch per week) and is in well-drained soil. Pechay has shallow roots, so it can dry out quickly.',
        source: 'Source: The Old Farmer\'s Almanac',
        youtubeId: 'K_VAEy0og7E' // "Growing Bok Choy from Seed to Harvest"
      };
    case 'Insect Bite':
      return {
        title: 'Pest Damage Detected 🐜',
        description: 'Small "shot-holes" are likely from Flea Beetles. Larger holes suggest Cabbage Loopers or Slugs. Apply an organic insecticide like Neem Oil or insecticidal soap, focusing on the undersides of leaves. Using floating row covers can prevent pests from reaching the plants.',
        source: 'Source: University of Minnesota Extension',
        youtubeId: 'CuAaExSOIh8' // "Getting Rid of Flea Beetles in the Garden Organically"
      };
    case 'Wilting':
      return {
        title: 'Wilting Detected 💧',
        description: 'Pechay wilts from water stress. Check the soil 2 inches deep. If dry, water deeply at the plant\'s base. If the soil is soggy, this indicates root rot from over-watering or poor drainage. Let the soil dry out and ensure good drainage.',
        source: 'Source: UC Davis Vegetable Research Center',
        youtubeId: 'On7_JGLnScs' // "3 Reasons Your Plants are WILTING"
      };
    case 'Spotting':
      return {
        title: 'Leaf Spot Detected 🍄',
        description: 'This is likely a fungal or bacterial spot (like Alternaria or Cercospora). Remove and destroy affected leaves immediately (do not compost them). To prevent spread, avoid overhead watering—water the soil, not the leaves. Ensure good air circulation between plants.',
        source: 'Source: Penn State Extension',
        youtubeId: 'yOqCikg6-3k' // "How to Treat Fungal Leaf Spots on Plants"
      };
    case 'Yellowing':
      return {
        title: 'Yellowing (Chlorosis) 🍂',
        description: 'Yellowing of older, lower leaves often signals a Nitrogen deficiency. Yellowing on new leaves can indicate an Iron or Magnesium deficiency. This can also be caused by over-watering. Apply a balanced organic fertilizer and ensure the soil is not waterlogged.',
        source: 'Source: Utah State University Extension',
        youtubeId: 'PbvvHvWKht0' // "Why are my Vegetable Plant Leaves Turning Yellow?" (Full length)
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