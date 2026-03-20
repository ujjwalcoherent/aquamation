const fs = require('fs');
const path = require('path');

// Years: 2021-2033
const years = [2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033];

// US-only geography with regional breakdown
const regions = {
  "U.S.": ["Northeast", "Southeast", "Midwest", "Southwest", "West"]
};

// Aquamation segment definitions with market share splits
const segmentTypes = {
  "by Application": {
    "Human Aquamation": 0.45,
    "Pet or Animal Aquamation": 0.35,
    "Medical & Research Specimen Disposal": 0.20
  },
  "by System Type": {
    "Batch Aquamation Systems": 0.60,
    "Continuous Aquamation Systems": 0.40
  },
  "by Capacity": {
    "Small Capacity Systems (up to 100 lbs / ~45 kg) — typically pet and small animal systems": 0.30,
    "Medium Capacity Systems (100–500 lbs / ~45–225 kg) — single human body and large animal systems": 0.45,
    "Large Capacity Systems (500+ lbs / ~225+ kg) — institutional, and high-volume systems": 0.25
  },
  "By End User": {
    "Funeral Homes & Cremation Service Providers": 0.30,
    "Veterinary Clinics & Pet Aftercare / Pet Cremation Centers": 0.25,
    "Hospitals / Medical Schools / Donated Body Programs": 0.20,
    "Research Institutions / Laboratories": 0.15,
    "Municipal Facilities": 0.10
  },
  "by Technology Or Process Type": {
    "Low Temperature Alkaline Hydrolysis": 0.55,
    "High Temperature Alkaline Hydrolysis": 0.45
  }
};

// US base value (USD Million) for 2021 - total market ~$80M
const regionBaseValues = {
  "U.S.": 80
};

// Regional share within US
const countryShares = {
  "U.S.": { "Northeast": 0.25, "Southeast": 0.22, "Midwest": 0.20, "Southwest": 0.18, "West": 0.15 }
};

// Growth rate (CAGR) ~14% for Aquamation market
const regionGrowthRates = {
  "U.S.": 0.14
};

// Segment-specific growth multipliers
const segmentGrowthMultipliers = {
  "by Application": {
    "Human Aquamation": 1.10,
    "Pet or Animal Aquamation": 1.05,
    "Medical & Research Specimen Disposal": 0.85
  },
  "by System Type": {
    "Batch Aquamation Systems": 0.95,
    "Continuous Aquamation Systems": 1.08
  },
  "by Capacity": {
    "Small Capacity Systems (up to 100 lbs / ~45 kg) — typically pet and small animal systems": 1.05,
    "Medium Capacity Systems (100–500 lbs / ~45–225 kg) — single human body and large animal systems": 1.00,
    "Large Capacity Systems (500+ lbs / ~225+ kg) — institutional, and high-volume systems": 0.95
  },
  "By End User": {
    "Funeral Homes & Cremation Service Providers": 1.08,
    "Veterinary Clinics & Pet Aftercare / Pet Cremation Centers": 1.05,
    "Hospitals / Medical Schools / Donated Body Programs": 0.95,
    "Research Institutions / Laboratories": 0.90,
    "Municipal Facilities": 0.88
  },
  "by Technology Or Process Type": {
    "Low Temperature Alkaline Hydrolysis": 0.97,
    "High Temperature Alkaline Hydrolysis": 1.04
  }
};

// Volume multiplier: units per USD Million
const volumePerMillionUSD = 12;

// Seeded pseudo-random for reproducibility
let seed = 42;
function seededRandom() {
  seed = (seed * 16807 + 0) % 2147483647;
  return (seed - 1) / 2147483646;
}

function addNoise(value, noiseLevel = 0.03) {
  return value * (1 + (seededRandom() - 0.5) * 2 * noiseLevel);
}

function roundTo1(val) {
  return Math.round(val * 10) / 10;
}

function roundToInt(val) {
  return Math.round(val);
}

function generateTimeSeries(baseValue, growthRate, roundFn) {
  const series = {};
  for (let i = 0; i < years.length; i++) {
    const year = years[i];
    const rawValue = baseValue * Math.pow(1 + growthRate, i);
    series[year] = roundFn(addNoise(rawValue));
  }
  return series;
}

function generateData(isVolume) {
  const data = {};
  const roundFn = isVolume ? roundToInt : roundTo1;
  const multiplier = isVolume ? volumePerMillionUSD : 1;

  for (const [regionName, subRegions] of Object.entries(regions)) {
    const regionBase = regionBaseValues[regionName] * multiplier;
    const regionGrowth = regionGrowthRates[regionName];

    // Region-level data (U.S.)
    data[regionName] = {};
    for (const [segType, segments] of Object.entries(segmentTypes)) {
      data[regionName][segType] = {};
      for (const [segName, share] of Object.entries(segments)) {
        const segGrowth = regionGrowth * segmentGrowthMultipliers[segType][segName];
        const segBase = regionBase * share;
        data[regionName][segType][segName] = generateTimeSeries(segBase, segGrowth, roundFn);
      }
    }

    // Add "By Region" for the US
    data[regionName]["By Region"] = {};
    for (const subRegion of subRegions) {
      const cShare = countryShares[regionName][subRegion];
      const subRegionGrowthVariation = 1 + (seededRandom() - 0.5) * 0.06;
      const subRegionBase = regionBase * cShare;
      const subRegionGrowth = regionGrowth * subRegionGrowthVariation;
      data[regionName]["By Region"][subRegion] = generateTimeSeries(subRegionBase, subRegionGrowth, roundFn);
    }

    // Sub-region level data
    for (const subRegion of subRegions) {
      const cShare = countryShares[regionName][subRegion];
      const subRegionBase = regionBase * cShare;
      const subRegionGrowthVariation = 1 + (seededRandom() - 0.5) * 0.04;
      const subRegionGrowth = regionGrowth * subRegionGrowthVariation;

      data[subRegion] = {};
      for (const [segType, segments] of Object.entries(segmentTypes)) {
        data[subRegion][segType] = {};
        for (const [segName, share] of Object.entries(segments)) {
          const segGrowth = subRegionGrowth * segmentGrowthMultipliers[segType][segName];
          const segBase = subRegionBase * share;
          const shareVariation = 1 + (seededRandom() - 0.5) * 0.1;
          data[subRegion][segType][segName] = generateTimeSeries(segBase * shareVariation, segGrowth, roundFn);
        }
      }
    }
  }

  return data;
}

// Generate both datasets
seed = 42;
const valueData = generateData(false);
seed = 7777;
const volumeData = generateData(true);

// Write files
const outDir = path.join(__dirname, 'public', 'data');
fs.writeFileSync(path.join(outDir, 'value.json'), JSON.stringify(valueData, null, 2));
fs.writeFileSync(path.join(outDir, 'volume.json'), JSON.stringify(volumeData, null, 2));

console.log('Generated value.json and volume.json successfully');
console.log('Value geographies:', Object.keys(valueData));
console.log('Segment types:', Object.keys(valueData['U.S.']));
console.log('Sample - U.S., by Application:', JSON.stringify(valueData['U.S.']['by Application'], null, 2));
