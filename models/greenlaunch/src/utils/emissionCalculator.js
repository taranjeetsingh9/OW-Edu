
const ROCKET_PROFILES = {
  falcon9: {
    displayName: 'Falcon 9',
    fuelType: 'RP-1 / LOX',
    baseCO2PerLaunchKg: 425000,
    baseNOxPerLaunchKg: 1800,
    baseBlackCarbonKg: 520,
    baseWaterVaporKg: 78000,
    payloadCapacityKg: { moon: 3500, mars: 4020 }
  },
  newGlenn: {
    displayName: 'New Glenn',
    fuelType: 'Methalox',
    baseCO2PerLaunchKg: 360000,
    baseNOxPerLaunchKg: 1400,
    baseBlackCarbonKg: 280,
    baseWaterVaporKg: 64000,
    payloadCapacityKg: { moon: 8000, mars: 9000 }
  },
  ariane6: {
    displayName: 'Ariane 6',
    fuelType: 'Hydrolox + SRB',
    baseCO2PerLaunchKg: 510000,
    baseNOxPerLaunchKg: 2100,
    baseBlackCarbonKg: 610,
    baseWaterVaporKg: 95000,
    payloadCapacityKg: { moon: 4300, mars: 5000 }
  }
};

const DESTINATION_FACTORS = {
  moon: {
    displayName: 'Moon',
    distanceKm: 384000,
    trajectory: 'Trans-Lunar Injection (TLI)',
    co2Multiplier: 1.35,
    noxMultiplier: 1.1,
    missionDurationDays: 5,
    ontarioCorrectionFactor: 1.08
  },
  mars: {
    displayName: 'Mars',
    distanceKm: 225000000,
    trajectory: 'Hohmann Transfer',
    co2Multiplier: 1.6,
    noxMultiplier: 1.2,
    missionDurationDays: 210,
    ontarioCorrectionFactor: 1.15
  }
};

const ONTARIO_LAUNCH_SITES = {
  timmins: {
    name: 'Timmins Stratospheric Launch Facility',
    latitude: 48.47,
    longitude: -81.33,
    elevationM: 295,
    regulatoryNotes: [
      'Transport Canada experimental corridor',
      'Indigenous consultation required (Mattagami/Nayla First Nations)'
    ],
    localWeatherPenalty: 1.05
  },
  chapleau: {
    name: 'Chapleau Northern Launch Range',
    latitude: 47.84,
    longitude: -83.38,
    elevationM: 323,
    regulatoryNotes: [
      'Extended polar corridor',
      'Wildlife migration impact assessment needed'
    ],
    localWeatherPenalty: 1.12
  }
};

function computeEmissionSummary({ rocketId, destination, payloadMassKg, launchSite }) {
  const rocket = ROCKET_PROFILES[rocketId];
  if (!rocket) {
    throw new Error(`Unsupported rocketId "${rocketId}". Available: ${Object.keys(ROCKET_PROFILES).join(', ')}`);
  }

  const target = DESTINATION_FACTORS[destination];
  if (!target) {
    throw new Error(`Unsupported destination "${destination}". Use one of: ${Object.keys(DESTINATION_FACTORS).join(', ')}`);
  }

  const site = ONTARIO_LAUNCH_SITES[launchSite];
  if (!site) {
    throw new Error(`Unsupported launchSite "${launchSite}". Available: ${Object.keys(ONTARIO_LAUNCH_SITES).join(', ')}`);
  }

  const capacity = rocket.payloadCapacityKg[destination];
  if (!capacity) {
    throw new Error(`No payload capacity data for ${rocket.displayName} to ${target.displayName}`);
  }

  const payload = typeof payloadMassKg === 'number' && payloadMassKg > 0
    ? payloadMassKg
    : Math.round(capacity * 0.6);

  const payloadRatio = Math.min(payload / capacity, 1);

  const co2 = rocket.baseCO2PerLaunchKg *
    target.co2Multiplier *
    site.localWeatherPenalty *
    target.ontarioCorrectionFactor *
    (0.5 + 0.5 * payloadRatio);

  const nox = rocket.baseNOxPerLaunchKg *
    target.noxMultiplier *
    (0.7 + 0.3 * payloadRatio);

  return {
    rocket: rocket.displayName,
    destination: target.displayName,
    launchSite: site.name,
    totalsKg: {
      co2: Math.round(co2),
      nox: Math.round(nox),
      blackCarbon: rocket.baseBlackCarbonKg,
      waterVapor: rocket.baseWaterVaporKg
    },
    intensity: {
      perKgPayload: Math.round(co2 / payload),
      perKm: +(co2 / target.distanceKm).toFixed(3)
    },
    assumptions: {
      payloadMassKg: payload,
      payloadCapacityKg: capacity,
      payloadUtilizationPercent: Math.round(payloadRatio * 100),
      trajectoryType: target.trajectory,
      missionDurationDays: target.missionDurationDays,
      adjustments: [
        `Ontario correction factor ${target.ontarioCorrectionFactor}`,
        `Local weather penalty ${site.localWeatherPenalty}`
      ]
    },
    compliance: {
      transportCanada: co2 > 450000 ? 'review-required' : 'standard',
      indigenousConsultationRequired: true,
      additionalNotes: site.regulatoryNotes
    }
  };
}

module.exports = {
  computeEmissionSummary,
  ROCKET_PROFILES,
  DESTINATION_FACTORS,
  ONTARIO_LAUNCH_SITES
};