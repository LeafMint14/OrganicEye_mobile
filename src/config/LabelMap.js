



export const CROP_LABELS = [
  'Healthy',
  'Insect Bite', 
  'Leaf Perforation', 
  'Spotting',
  'Wilting',
  'Yellowing',
  'Unidentified Crop', 
];


export const INSECT_LABELS = [
  'Beneficial Bee',
  'Beneficial Lacewing Larvae',
  'Beneficial Ladybug',
  'ladybug', 
  'Beneficial Larvae',
  'Infected Aphid',
  'Infected Flea Beetle',
  'Infected Pumpkin Beetle',
  'Unidentified Insect', 
];


export const getCropInsight = (label) => {
  
  const normalizedLabel = label?.toLowerCase()?.trim() || "";

  if (normalizedLabel.includes('healthy')) {
    return {
      title: 'Optimal Health & Vigor 🌿',
      description: 'The plant exhibits normal turgidity, uniform coloration, and an absence of necrotic lesions.',
      medicalDetail: 'Chlorophyll synthesis is operating efficiently. The vascular flow (xylem and phloem) is unimpeded, allowing for proper nutrient distribution.',
      treatmentSteps: '1. Maintain current agronomic practices.\n2. Continue monitoring soil moisture levels.\n3. Keep weed competition low around the base.',
      source: "Source: Department of Agriculture (DA-BPI) Agronomy Guidelines",
      youtubeId: 'K_VAEy0og7E' 
    };
  }

  if (normalizedLabel.includes('insect bite')) {
    return {
      title: 'Active Herbivory Damage 🐛',
      description: 'Physical removal of leaf tissue by masticating (chewing) pests currently active on the plant.',
      medicalDetail: 'Loss of foliar tissue directly reduces the photosynthetic surface area. Open wounds also create vulnerable entry points for secondary fungal or bacterial pathogens.',
      treatmentSteps: '1. Isolate the affected plant to prevent pest migration.\n2. Manually remove visible pests.\n3. Apply Bacillus thuringiensis (Bt) or Neem Oil, targeting the undersides of the foliage.',
      source: 'Source: UC Statewide Integrated Pest Management Program (UC IPM)',
      youtubeId: 'CuAaExSOIh8'
    };
  }

  
  if (normalizedLabel.includes('leaf perforation')) {
    return {
      title: 'Foliar Perforation (Hit & Run) 🌿',
      description: '"Shot-hole" damage detected without a visible pest present.',
      medicalDetail: 'Typically caused by nocturnal feeders or highly mobile pests (like Flea Beetles) that hide in the topsoil during daylight hours, leaving foliar damage behind.',
      treatmentSteps: '1. Inspect the soil and undersides of leaves at dusk/dawn.\n2. Apply organic Diatomaceous Earth (DE) around the stem base.\n3. Deploy yellow sticky traps to monitor adult populations.',
      source: 'Source: DOST-PCAARRD Pest Management Guide',
      youtubeId: 'CuAaExSOIh8'
    };
  }

  if (normalizedLabel.includes('wilting')) {
    return {
      title: 'Vascular Wilt / Loss of Turgor 💧',
      description: 'Drooping foliage indicating severe water stress or root compromise.',
      medicalDetail: 'Caused by a critical drop in turgor pressure inside plant cells. This can be abiotic (drought, extreme heat, root anoxia from waterlogging) or biotic (pathogens blocking the xylem).',
      treatmentSteps: '1. Assess soil moisture depth (2 inches down).\n2. If dry, apply deep basal watering.\n3. If soggy, improve soil drainage immediately to mitigate root rot.\n4. If soil moisture is perfect, suspect soil-borne wilt pathogens.',
      source: 'Source: UMass Extension Greenhouse Crops and Floriculture',
      youtubeId: 'On7_JGLnScs' 
    };
  }

  if (normalizedLabel.includes('spotting')) {
    return {
      title: 'Necrotic Lesions / Leaf Spot 🍄',
      description: 'Localized areas of dead tissue, typically indicative of fungal or bacterial infection.',
      medicalDetail: 'Pathogens (such as Alternaria or Cercospora) penetrate the leaf epidermis, causing localized cellular necrosis. This thrives in high-humidity microclimates with poor airflow.',
      treatmentSteps: '1. Prune and safely destroy heavily infected leaves (do not compost).\n2. Transition to basal/drip watering to keep foliage dry.\n3. Apply a copper-based organic fungicide if lesions rapidly spread.',
      source: 'Source: Penn State Extension - Plant Disease Clinics',
      youtubeId: 'yOqCikg6-3k'
    };
  }

  if (normalizedLabel.includes('yellowing')) {
    return {
      title: 'Foliar Chlorosis 🍂',
      description: 'Loss of green pigmentation, strongly signaling a nutrient deficiency or pH imbalance.',
      medicalDetail: 'Chlorosis indicates a severe breakdown in chlorophyll production. If older leaves yellow first, it indicates a mobile nutrient deficiency (Nitrogen). If new leaves yellow, it indicates an immobile nutrient deficiency (Iron).',
      treatmentSteps: '1. Conduct a rapid soil pH test.\n2. Apply a fast-acting organic foliar spray (fish emulsion) to bypass root lock-out.\n3. Amend soil with balanced N-P-K fertilizer.',
      source: 'Source: Utah State University Extension',
      youtubeId: 'PbvvHvWKht0'
    };
  }

  
  if (normalizedLabel.includes('unidentified crop')) {
    return {
      title: 'Unidentified Vegetation 🌱',
      description: 'A plant was detected, but it does not visually match the Brassica rapa (Pechay) profile.',
      medicalDetail: 'This could be a weed, an intercropped species, or the image angle is obscuring the primary diagnostic features of the crop.',
      treatmentSteps: '1. Verify the camera angle.\n2. Ensure no invasive weeds are competing for nutrients in the soil.',
      source: 'Source: OrganicEye AI Anomaly Detection',
      youtubeId: null 
    };
  }

  
  return {
    title: 'Monitoring Growth',
    description: 'Continuing to monitor the health of your crops.',
    medicalDetail: 'Analyzing systemic leaf patterns.',
    treatmentSteps: 'Continue standard care and monitor for changes.',
    source: '',
    youtubeId: null 
  };
};


export const getInsectInsight = (label) => {
  const normalizedLabel = label?.toLowerCase() || "";

  
  if (normalizedLabel.includes('flea beetle')) {
    return {
      title: 'Pest: Flea Beetle 🦗',
      description: 'Small, highly mobile jumping beetles that chew distinctive "shot-holes" into foliage. Heavy feeding can quickly stunt or kill young seedlings. Adults often overwinter in surrounding plant debris.',
      source: 'Source: UMass Extension Agriculture',
      youtubeId: 'CuAaExSOIh8'
    };
  }

  if (normalizedLabel.includes('pumpkin beetle') || normalizedLabel.includes('cucumber beetle')) {
    return {
      title: 'Pest: Cucurbit Beetle 🎃',
      description: 'A highly destructive pest that feeds on leaves, flowers, and roots. Crucially, they act as primary vectors for Erwinia tracheiphila, a pathogen causing fatal bacterial wilt in crops.',
      source: 'Source: Entomological Society of America',
      youtubeId: '8Q1zmD1Wtho'
    };
  }

  if (normalizedLabel.includes('aphid')) {
    return {
      title: 'Pest: Aphid Colony 🦟',
      description: 'Soft-bodied insects that use piercing-sucking mouthparts to extract phloem sap. They excrete honeydew, which promotes black sooty mold and frequently act as vectors for devastating plant viruses.',
      source: 'Source: UC Davis Department of Entomology',
      youtubeId: 'mVdou1MJCAE'
    };
  }

  
  if (normalizedLabel.includes('beneficial bee') || (normalizedLabel.includes('bee') && !normalizedLabel.includes('beetle'))) {
    return {
      title: 'Beneficial: Pollinator Bee 🐝',
      description: 'Essential pollinator for ecosystem stability and maximum crop yield. They transfer pollen between floral reproductive structures. Protect foraging bees by strictly avoiding daytime pesticide applications.',
      source: 'Source: The Xerces Society',
      youtubeId: '47Jv5pLIRdI'
    };
  }
  
  if (normalizedLabel.includes('ladybug')) {
    return {
      title: 'Beneficial: Ladybird Beetle 🐞',
      description: 'A voracious natural predator. Both the adult beetles and their larval stages actively hunt and consume massive quantities of soft-bodied pests like aphids, scale insects, and mealybugs.',
      source: 'Source: Cornell University College of Agriculture',
      youtubeId: '6ciREinriw4'
    };
  }

  if (normalizedLabel.includes('lacewing') || normalizedLabel.includes('beneficial larvae')) {
    return {
      title: 'Beneficial: Lacewing Larva 🐛',
      description: 'Highly active predators in the garden ecosystem, commonly referred to as "Aphid Lions". They utilize large, sickle-shaped mandibles to hunt aphids, mites, and small caterpillars.',
      source: 'Source: UC Statewide Integrated Pest Management Program',
      youtubeId: 'fwsiCLLi9UE'
    };
  }

  
  if (normalizedLabel.includes('unidentified insect')) {
    return {
      title: 'Unidentified Arthropod 🪲',
      description: 'An organism was detected but its exact morphology could not be matched to the known database. Closely monitor the surrounding foliage for emerging signs of herbivory or disease transmission.',
      source: 'Source: OrganicEye AI Anomaly Detection',
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