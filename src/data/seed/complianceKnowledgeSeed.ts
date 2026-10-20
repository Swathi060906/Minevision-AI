import { ComplianceKnowledge } from '../models/ComplianceKnowledge';

/**
 * SYNTHETIC DEMONSTRATION KNOWLEDGE BASE SEED
 *
 * IMPORTANT COMPLIANCE NOTICE:
 * The records in this file are synthetic demonstration representations developed specifically for
 * testing the MineVision AI Compliance Knowledge Base and RAG retrieval architecture.
 * They are NOT official legal or statutory regulatory publications of DGMS, Ministry of Coal, or CPCB.
 * All records carry `isSyntheticDemo: true` and are segregated from official gazetted publications.
 */

export const INITIAL_COMPLIANCE_KNOWLEDGE_SEED: ComplianceKnowledge[] = [
  {
    id: 'KNOW-VENT-001',
    title: 'Ventilation Air Velocity & Gas Monitoring Standards [DEMO]',
    shortTitle: 'Ventilation & Gas Safety Standards',
    description:
      'Synthetic benchmark specifying minimum face airflow velocities, continuous methane percentage cut-offs, and carbon monoxide detector thresholds in colliery workings.',
    category: 'Ventilation',
    subcategory: 'Airway Hydraulics & Atmospheric Safety',
    jurisdiction: 'National - India (Demonstration Context)',
    authority: 'Directorate General of Mines Safety (DGMS)',
    sourceName: 'Synthetic Demonstration Dataset — Not Official Regulatory Publication',
    sourceReference: 'DEMO-VENT-001',
    sourceUrl: 'https://dgms.gov.in/synthetic-guidelines/ventilation-standards',
    documentType: 'REGULATION',
    documentVersion: '2024.1-Demo',
    effectiveDate: '2024-01-01',
    status: 'ACTIVE',
    applicableMineTypes: ['Underground', 'Mixed'],
    applicableRoles: ['ADMIN', 'OFFICER', 'OPERATOR'],
    tags: ['ventilation', 'methane', 'gas monitoring', 'airflow', 'carbon monoxide', 'underground'],
    keywords: [
      'air velocity',
      'methane',
      'ch4',
      'carbon monoxide',
      'return airway',
      'face velocity',
      'auxiliary fan',
      'continuous monitoring',
      'anemometer',
    ],
    content: `# Ventilation Standards & Gas Threshold Protocols

## Section 1: Mechanical Ventilation Airflow Velocities
All underground coal districts must maintain positive mechanical ventilation supplied by surface main fans. The linear velocity of the air current across the largest working face shall not be less than 0.50 meters per second (m/s) at any point where coal cutting or loading is actively in progress. Return airway velocity must maintain at least 0.30 m/s to prevent gas stratification.

## Section 2: Combustible Gas Limits & Auto-Trip Mandate
Methane (CH4) concentration measured at any working face, return splittings, or sealed goaf border must not exceed 0.75% by volume under normal production. If continuous environmental sensors indicate methane reaching or exceeding 1.00%, all electrical power supply to coal face machines and conveyor drives must automatically trip within 500 milliseconds.

## Section 3: Carbon Monoxide & Toxic Gas Watch
Atmospheric carbon monoxide (CO) levels must remain below 10 parts per million (ppm) during steady operations. Any continuous reading exceeding 25 ppm or a Graham's ratio indicating spontaneous heating requires immediate district personnel withdrawal and ventilation supervisor alert.`,
    summary:
      'Synthetic demo rule defining minimum face air velocity (>= 0.5 m/s), maximum operational methane limit (0.75%), power trip trigger (1.00%), and CO threshold (<= 10 ppm).',
    sections: [
      {
        sectionNumber: 'Sec. 1',
        title: 'Mechanical Ventilation Airflow Velocities',
        clauses: [
          {
            clauseNumber: '1.1',
            title: 'Working Face Air Velocity',
            text: 'Linear velocity of air current at active coal extraction faces must maintain at least 0.5 m/s continuously.',
            penaltiesOrMandates: 'Mandatory stoppage of shearer/LHD when air velocity drops below 0.35 m/s.',
          },
          {
            clauseNumber: '1.2',
            title: 'Return Airway Velocity',
            text: 'Return airway splittings must maintain at least 0.3 m/s to avoid pocket layering of flammable gases.',
          },
        ],
      },
      {
        sectionNumber: 'Sec. 2',
        title: 'Combustible Gas Limits & Auto-Trip Mandate',
        clauses: [
          {
            clauseNumber: '2.1',
            title: 'Normal Operational Methane Limit',
            text: 'Continuous methane concentration in ventilating current must not exceed 0.75% by volume.',
          },
          {
            clauseNumber: '2.2',
            title: 'Interlocked Circuit Interruption',
            text: 'Sensory detection of 1.00% CH4 must trigger instantaneous power trip to all district electrical machinery.',
            penaltiesOrMandates: 'Statutory audit finding and immediate isolation of district power grid.',
          },
        ],
      },
    ],
    clauses: [
      'DEMO-VENT-001-Sec1: Minimum air velocity 0.5 m/s at extraction face.',
      'DEMO-VENT-001-Sec2: Maximum permissible return methane 0.75%.',
      'DEMO-VENT-001-Sec3: Automatic electrical lockout at 1.00% CH4 concentration.',
    ],
    verificationStatus: 'NEEDS_REVIEW',
    verificationNotes: 'SYNTHETIC DEMONSTRATION KNOWLEDGE — NOT OFFICIAL REGULATORY TEXT',
    isSyntheticDemo: true,
    version: 1,
    createdAt: '2024-01-10T08:00:00Z',
    updatedAt: '2024-02-15T10:00:00Z',
  },
  {
    id: 'KNOW-STRATA-002',
    title: 'Strata Control & Systematic Roof Support Protocol [DEMO]',
    shortTitle: 'Roof Support & Strata Control',
    description:
      'Synthetic benchmark prescribing resin-grouted roof bolting patterns, anchorage testing frequency, and convergence indicator monitoring in bord-and-pillar and longwall panels.',
    category: 'Ground Control',
    subcategory: 'Roof & Side Support Management',
    jurisdiction: 'National - India (Demonstration Context)',
    authority: 'Directorate General of Mines Safety (DGMS)',
    sourceName: 'Synthetic Demonstration Dataset — Not Official Regulatory Publication',
    sourceReference: 'DEMO-STRATA-001',
    sourceUrl: 'https://dgms.gov.in/synthetic-guidelines/strata-support',
    documentType: 'REGULATION',
    documentVersion: '2023.2-Demo',
    effectiveDate: '2023-06-01',
    status: 'ACTIVE',
    applicableMineTypes: ['Underground', 'Mixed'],
    applicableRoles: ['ADMIN', 'OFFICER'],
    tags: ['strata control', 'roof bolting', 'ground control', 'anchorage test', 'convergence', 'support plan'],
    keywords: [
      'roof bolt',
      'resin capsule',
      'strata convergence',
      'anchorage testing',
      'rib support',
      'tell-tale indicator',
      'side spalling',
      'junction support',
    ],
    content: `# Systematic Support Rules & Strata Convergence Protocols

## Section 1: Mechanised Roof Bolting Grid
All roadways, junctions, and slice galleries in underground coal seams must be supported strictly in accordance with the colliery Strata Control and Management Plan (SCAMP). High-tensile rebar bolts of minimum 22 mm diameter and 1.8 m length must be installed at a grid spacing not exceeding 1.2 m center-to-center in both longitudinal and transverse directions.

## Section 2: Anchorage Pull-Testing Rigour
Routine quality assurance mandates that at least 1 out of every 50 installed roof bolts undergo non-destructive anchorage pull testing. Tested bolts must sustain a vertical axial pull load of not less than 80 kN for quick-setting resin capsules and 100 kN for full-column grouted tendons with less than 6 mm total displacement.

## Section 3: Dual-Height Convergence Monitoring
Dual-height mechanical tell-tale extensometers must be installed at every gallery four-way junction and at intervals not exceeding 30 meters along active haulage drives. If cumulative upper-bed strata dilation exceeds 10 mm within a 24-hour window, the roadway must be immediately barricaded and re-supported with supplemental hydraulic props or steel arches.`,
    summary:
      'Synthetic demo standard for underground roof bolting grids (1.2m x 1.2m), pull-test load mandates (80-100 kN), and 10mm convergence trigger thresholds.',
    sections: [
      {
        sectionNumber: 'Sec. 1',
        title: 'Mechanised Roof Bolting Grid',
        clauses: [
          {
            clauseNumber: '1.1',
            title: 'Grid Density and Dimensions',
            text: 'Roof bolt spacing must not exceed 1.2 meters between consecutive rows and between individual bolts within a row.',
          },
        ],
      },
      {
        sectionNumber: 'Sec. 2',
        title: 'Anchorage Pull-Testing Rigour',
        clauses: [
          {
            clauseNumber: '2.1',
            title: 'Testing Sample Rate',
            text: 'Minimum 2% of installed bolts (1 in 50) must undergo calibrated hydraulic pull testing within 48 hours of installation.',
          },
          {
            clauseNumber: '2.2',
            title: 'Minimum Axial Load Capacity',
            text: 'Tested anchors must withstand 80 kN axial load with less than 6 mm displacement.',
          },
        ],
      },
    ],
    clauses: [
      'DEMO-STRATA-001-Sec1: Maximum 1.2 m bolting grid in underground roadways.',
      'DEMO-STRATA-001-Sec2: Mandatory 80 kN anchorage load verification.',
      'DEMO-STRATA-001-Sec3: Roadway evacuation upon > 10 mm bed separation.',
    ],
    verificationStatus: 'NEEDS_REVIEW',
    verificationNotes: 'SYNTHETIC DEMONSTRATION KNOWLEDGE — NOT OFFICIAL REGULATORY TEXT',
    isSyntheticDemo: true,
    version: 2,
    createdAt: '2023-05-18T09:00:00Z',
    updatedAt: '2023-11-10T14:30:00Z',
  },
  {
    id: 'KNOW-HAUL-003',
    title: 'Opencast Haul Road Geometry, Berm Heights & Traffic Safety [DEMO]',
    shortTitle: 'Haul Road & Dump Safety',
    description:
      'Synthetic benchmark governing haul road width, maximum gradient, embankment safety berm heights, and automated collision avoidance standards for heavy earthmoving machinery.',
    category: 'Machinery Safety',
    subcategory: 'Surface Transportation & Haulage Geometry',
    jurisdiction: 'National - India (Demonstration Context)',
    authority: 'Directorate General of Mines Safety (DGMS)',
    sourceName: 'Synthetic Demonstration Dataset — Not Official Regulatory Publication',
    sourceReference: 'DEMO-HAUL-001',
    sourceUrl: 'https://dgms.gov.in/synthetic-guidelines/haul-road-standards',
    documentType: 'CIRCULAR',
    documentVersion: '2020.1-Demo',
    effectiveDate: '2020-09-01',
    status: 'ACTIVE',
    applicableMineTypes: ['Open Cast', 'Mixed'],
    applicableRoles: ['ADMIN', 'OFFICER', 'OPERATOR'],
    tags: ['haul road', 'berm height', 'dumper', 'gradient', 'opencast', 'traffic safety'],
    keywords: [
      'haul road width',
      'berm height',
      'dumper tyre',
      'road gradient',
      'collision avoidance',
      'blind curve',
      'parapet wall',
      'runaway ramp',
    ],
    content: `# Opencast Haul Road Geometry & Heavy Vehicle Protection

## Section 1: Haul Road Width & Permissible Gradient
For dual-lane dumper traffic, the total road carriage width must not be less than three times the overall width of the largest heavy dump truck operating on the route plus a 2-meter safety clearance. The longitudinal gradient on permanent haul routes shall not be steeper than 1 in 16. On temporary bench approach ramps, the gradient shall in no circumstance exceed 1 in 10.

## Section 2: Continuous Safety Berm Construction
Every active haul road, elevated bench access ramp, and waste overburden dump crest with an external fall hazard must be protected by a continuous earth embankment (safety berm). The compacted vertical height of the berm must equal or exceed the radius of the largest vehicle tyre operating in the colliery pit.

## Section 3: Visibility Distances & Blind Curve Signage
Curvature radii on heavy haul routes must ensure unobstructed sight line distance of at least 60 meters. Where physical topography restricts sightlines, automated proximity warning beacons and high-visibility convex mirrors must be installed alongside mandatory two-way radio check-in procedures.`,
    summary:
      'Synthetic demo guidance for dual-lane haul road width (3x vehicle width + 2m), 1-in-16 gradient limits, and continuous berm heights matching largest dumper tyre radius.',
    sections: [
      {
        sectionNumber: 'Sec. 1',
        title: 'Road Width and Gradient Tolerances',
        clauses: [
          {
            clauseNumber: '1.1',
            title: 'Dual-Lane Width Calculation',
            text: 'Carriageway width >= (3 x maximum vehicle width) + 2.0 meters.',
          },
          {
            clauseNumber: '1.2',
            title: 'Maximum Road Gradient',
            text: 'Permanent haul ramps capped at 1 in 16; temporary ramps capped at 1 in 10.',
          },
        ],
      },
      {
        sectionNumber: 'Sec. 2',
        title: 'Embankment Berm Dimension',
        clauses: [
          {
            clauseNumber: '2.1',
            title: 'Minimum Berm Height',
            text: 'Compacted berm height must be no less than the radius of largest tyre (e.g. >= 1.5 m for 100T class dumpers).',
          },
        ],
      },
    ],
    clauses: [
      'DEMO-HAUL-001-Sec1: Width >= 3x vehicle width plus 2m clearance.',
      'DEMO-HAUL-001-Sec2: Berm height equal or greater than vehicle tyre radius.',
      'DEMO-HAUL-001-Sec3: Haul road slope capped at 1 in 16.',
    ],
    verificationStatus: 'NEEDS_REVIEW',
    verificationNotes: 'SYNTHETIC DEMONSTRATION KNOWLEDGE — NOT OFFICIAL REGULATORY TEXT',
    isSyntheticDemo: true,
    version: 1,
    createdAt: '2023-01-12T07:00:00Z',
    updatedAt: '2023-08-20T11:15:00Z',
  },
  {
    id: 'KNOW-PPE-004',
    title: 'Personal Protective Equipment & Respiratory Dust Protection [DEMO]',
    shortTitle: 'PPE Standards & Dust Respirators',
    description:
      'Synthetic benchmark establishing mandatory certification, fit testing, and daily usage protocols for safety helmets, steel-toe footwear, high-visibility apparel, and N95/P100 respirators.',
    category: 'Personal Protective Equipment',
    subcategory: 'Individual Safety Gear & Ergonomics',
    jurisdiction: 'National - India (Demonstration Context)',
    authority: 'Directorate General of Mines Safety (DGMS)',
    sourceName: 'Synthetic Demonstration Dataset — Not Official Regulatory Publication',
    sourceReference: 'DEMO-PPE-001',
    sourceUrl: 'https://dgms.gov.in/synthetic-guidelines/ppe-compliance',
    documentType: 'STANDARD_OPERATING_PROCEDURE',
    documentVersion: '2024.2-Demo',
    effectiveDate: '2024-03-01',
    status: 'ACTIVE',
    applicableMineTypes: ['Open Cast', 'Underground', 'Mixed'],
    applicableRoles: ['ADMIN', 'OFFICER', 'OPERATOR'],
    tags: ['ppe', 'respirator', 'safety helmet', 'footwear', 'dust protection', 'worker safety'],
    keywords: [
      'safety helmet',
      'steel toe boots',
      'dust respirator',
      'high-visibility vest',
      'chin strap',
      'fit test',
      'particulate mask',
      'ear defender',
    ],
    content: `# Statutory Personal Protective Equipment Protocols

## Section 1: Universal Mandatory Protective Ensemble
No worker, supervisor, contractor, or official may enter any active mining lease boundary without donning the certified foundational safety ensemble comprising: (a) BIS/DGMS approved industrial safety helmet with four-point suspension and secured chin strap, (b) high-ankle protective footwear featuring steel impact toe caps rated for 200 Joules, and (c) retro-reflective fluorescent class-3 safety vests.

## Section 2: Respirable Dust Zone Protocols
In all designated high-dust zones—including coal cutting faces, dry crushing screening plants, loading hoppers, and transfer conveyor junctions—personnel must wear NIOSH-approved N95 or EN149 FFP2 particulate respirators. Periodic qualitative fit testing must be conducted semi-annually and documented in the pit safety registry.

## Section 3: Hearing Protection in High-Decibel Areas
Wherever ambient noise exposure levels exceed 85 dBA across an 8-hour time-weighted average (such as rotary drill rigs, shovel engine compartments, and secondary crushers), dual protection (earmuffs and silicone foam earplugs) must be supplied and enforced.`,
    summary:
      'Synthetic demo rules specifying mandatory helmets with chin straps, 200J steel toe boots, high-vis vests, N95 dust respirators in coal cutting zones, and ear protection above 85 dBA.',
    sections: [
      {
        sectionNumber: 'Sec. 1',
        title: 'Universal Mandatory Safety Kit',
        clauses: [
          {
            clauseNumber: '1.1',
            title: 'Helmet & Footwear Specifications',
            text: 'Industrial safety helmet with chin strap and 200-Joule impact steel toe footwear are required for pit entry.',
          },
        ],
      },
      {
        sectionNumber: 'Sec. 2',
        title: 'Particulate Dust Respirators',
        clauses: [
          {
            clauseNumber: '2.1',
            title: 'Respirator Deployment in Dust Zones',
            text: 'Certified N95/FFP2 respirators mandatory in coal handling plants and face extraction districts.',
          },
        ],
      },
    ],
    clauses: [
      'DEMO-PPE-001-Sec1: 100% helmet and steel-toe boot enforcement at pit entry points.',
      'DEMO-PPE-001-Sec2: Mandatory particulate respirators in dry dust generating areas.',
      'DEMO-PPE-001-Sec3: Hearing protection required when noise exceeds 85 dBA.',
    ],
    verificationStatus: 'NEEDS_REVIEW',
    verificationNotes: 'SYNTHETIC DEMONSTRATION KNOWLEDGE — NOT OFFICIAL REGULATORY TEXT',
    isSyntheticDemo: true,
    version: 1,
    createdAt: '2024-02-01T08:00:00Z',
    updatedAt: '2024-03-05T09:00:00Z',
  },
  {
    id: 'KNOW-ELEC-005',
    title: 'Flameproof Electrical Apparatus & Hazardous Return Airway Isolation [DEMO]',
    shortTitle: 'Flameproof Electrical Safety',
    description:
      'Synthetic benchmark prescribing Flameproof (FLP) enclosure integrity, earth leakage trip thresholds, and hazardous zone power isolation for underground coal faces.',
    category: 'Electrical Safety',
    subcategory: 'Underground Power Systems & Hazardous Area Classification',
    jurisdiction: 'National - India (Demonstration Context)',
    authority: 'Directorate General of Mines Safety (DGMS)',
    sourceName: 'Synthetic Demonstration Dataset — Not Official Regulatory Publication',
    sourceReference: 'DEMO-ELECTRICAL-001',
    sourceUrl: 'https://dgms.gov.in/synthetic-guidelines/electrical-safety',
    documentType: 'REGULATION',
    documentVersion: '2023.1-Demo',
    effectiveDate: '2023-04-01',
    status: 'ACTIVE',
    applicableMineTypes: ['Underground', 'Mixed'],
    applicableRoles: ['ADMIN', 'OFFICER'],
    tags: ['electrical safety', 'flameproof', 'earth leakage', 'flp', 'hazardous area', 'cables'],
    keywords: [
      'flameproof enclosure',
      'earth leakage relay',
      'intrinsically safe',
      'trailing cable',
      'switchgear',
      'permissible gap',
      'feeder trip',
    ],
    content: `# Flameproof Apparatus & Hazardous District Power Integrity

## Section 1: Flameproof Enclosure Gap Tolerances
Every motor, gate-end box, transformer, and drill control unit operating in an underground gassy coal seam must possess a valid DGMS certificate of flameproofness. The maximum permissible flameproof joint clearance gap across machined flanges shall not exceed 0.40 millimeters for methane gas groups. Any missing bolt or deformed flange face immediately invalidates certification.

## Section 2: Sensitive Earth Leakage Protection
All electrical circuits delivering power to portable, mobile, or face machinery must be guarded by sensitive earth-leakage relays operating on fail-safe solid-state architectures. The trip threshold current shall not exceed 750 milliamperes for 3.3 kV supplies and 300 milliamperes for medium voltage 550 V face distribution networks. Relay trip response must execute within 100 milliseconds.`,
    summary:
      'Synthetic demo rules for flameproof flange gap limits (<= 0.40 mm) and sensitive earth leakage protection thresholds (300mA / 750mA within 100ms).',
    sections: [
      {
        sectionNumber: 'Sec. 1',
        title: 'FLP Joint Tolerances',
        clauses: [
          {
            clauseNumber: '1.1',
            title: 'Flange Gap Tolerances',
            text: 'Maximum permissible flameproof gap across machined enclosure joints is 0.40 mm.',
          },
        ],
      },
    ],
    clauses: [
      'DEMO-ELECTRICAL-001-Sec1: Max 0.40 mm FLP gap tolerance on underground apparatus.',
      'DEMO-ELECTRICAL-001-Sec2: Fast-acting 300 mA earth leakage cutoff on 550V circuits.',
    ],
    verificationStatus: 'NEEDS_REVIEW',
    verificationNotes: 'SYNTHETIC DEMONSTRATION KNOWLEDGE — NOT OFFICIAL REGULATORY TEXT',
    isSyntheticDemo: true,
    version: 1,
    createdAt: '2023-03-10T10:00:00Z',
    updatedAt: '2023-09-12T16:00:00Z',
  },
  {
    id: 'KNOW-ENV-006',
    title: 'Surface Drainage, Effluent pH & Sump Water Discharge Limits [DEMO]',
    shortTitle: 'Environmental Water Effluent Standards',
    description:
      'Synthetic benchmark establishing settled mine sump discharge pH limits, total suspended solids (TSS), and continuous water sprinkling at coal handling plant (CHP) transfer chutes.',
    category: 'Environmental Compliance',
    subcategory: 'Water Quality & Particulate Emission Controls',
    jurisdiction: 'National - India (Demonstration Context)',
    authority: 'Central Pollution Control Board (CPCB) & MoEFCC',
    sourceName: 'Synthetic Demonstration Dataset — Not Official Regulatory Publication',
    sourceReference: 'DEMO-ENV-001',
    sourceUrl: 'https://cpcb.nic.in/synthetic-guidelines/coal-effluent',
    documentType: 'SAFETY_GUIDELINE',
    documentVersion: '2023.3-Demo',
    effectiveDate: '2023-05-15',
    status: 'ACTIVE',
    applicableMineTypes: ['Open Cast', 'Underground', 'Mixed'],
    applicableRoles: ['ADMIN', 'OFFICER', 'OPERATOR'],
    tags: ['environmental compliance', 'effluent', 'water discharge', 'ph limit', 'tss', 'sump water'],
    keywords: [
      'effluent discharge',
      'ph range',
      'total suspended solids',
      'tss',
      'settling pond',
      'acid mine drainage',
      'water treatment',
      'turbidity',
    ],
    content: `# Surface Drainage & Sump Water Environmental Guidelines

## Section 1: Discharge Water Quality Criteria
Untreated pit water pumped from active sump dewatering stations must pass through two-stage sedimentation settling ponds before surface watercourse release. The treated effluent must strictly conform to: (a) Hydrogen ion concentration (pH) strictly maintained between 6.5 and 8.5, (b) Total Suspended Solids (TSS) not exceeding 100 milligrams per liter, and (c) Oil & Grease concentration below 10 milligrams per liter.

## Section 2: Continuous Dust Suppression at Transfer Points
Dry coal handling plants, tertiary crushers, and haul truck dump hoppers must operate automated mist-spray dust suppression systems. Spray headers must deliver atomized water droplets at water pressures not less than 3.5 bars during all active conveyor operational cycles.`,
    summary:
      'Synthetic demo guidelines requiring two-stage settling ponds, pH 6.5 to 8.5 effluent limits, TSS <= 100 mg/L, and continuous 3.5 bar dust suppression sprays.',
    sections: [
      {
        sectionNumber: 'Sec. 1',
        title: 'Effluent Quality Limits',
        clauses: [
          {
            clauseNumber: '1.1',
            title: 'pH and Solids Boundaries',
            text: 'Discharge water pH must stay within 6.5 - 8.5; TSS must not exceed 100 mg/L.',
          },
        ],
      },
    ],
    clauses: [
      'DEMO-ENV-001-Sec1: Mine discharge effluent pH 6.5 to 8.5.',
      'DEMO-ENV-001-Sec2: Total suspended solids capped at 100 mg/L.',
    ],
    verificationStatus: 'NEEDS_REVIEW',
    verificationNotes: 'SYNTHETIC DEMONSTRATION KNOWLEDGE — NOT OFFICIAL REGULATORY TEXT',
    isSyntheticDemo: true,
    version: 1,
    createdAt: '2023-04-20T11:00:00Z',
    updatedAt: '2023-10-04T12:00:00Z',
  },
  {
    id: 'KNOW-EMERG-007',
    title: 'Emergency Refuge Chambers & Self-Contained Self-Rescuer Deployment [DEMO]',
    shortTitle: 'Emergency Rescue & Refuge Chambers',
    description:
      'Synthetic draft guidance regarding deployment distance for airtight refuge chambers, SCSR oxygen duration, and underground emergency evacuation drill intervals.',
    category: 'Emergency Preparedness',
    subcategory: 'Underground Life Support & Refuge Structures',
    jurisdiction: 'National - India (Demonstration Context)',
    authority: 'Directorate General of Mines Safety (DGMS)',
    sourceName: 'Synthetic Demonstration Dataset — Not Official Regulatory Publication',
    sourceReference: 'DEMO-EMERG-001',
    sourceUrl: 'https://dgms.gov.in/synthetic-guidelines/refuge-chambers',
    documentType: 'CIRCULAR',
    documentVersion: '2024.1-DraftDemo',
    effectiveDate: '2024-07-01',
    status: 'ACTIVE',
    applicableMineTypes: ['Underground'],
    applicableRoles: ['ADMIN', 'OFFICER'],
    tags: ['emergency preparedness', 'refuge chamber', 'scsr', 'evacuation', 'rescue', 'oxygen duration'],
    keywords: [
      'refuge chamber',
      'self-rescuer',
      'scsr',
      'oxygen supply',
      'evacuation route',
      'toxic gas shelter',
      'emergency drill',
    ],
    content: `# Underground Refuge Chambers & Evacuation Life Support

## Section 1: Refuge Chamber Placement Boundaries
In long underground mining districts where escape to the surface takes more than 45 minutes of brisk walking, mobile steel refuge chambers must be stationed within 750 meters of any active coal heading. The chamber must provide independent compressed breathing air or chemical oxygen generators capable of supporting 20 trapped personnel for at least 36 continuous hours.

## Section 2: Self-Contained Self-Rescuers (SCSR)
Every subterranean entrant must carry on their waist belt an individual chemical oxygen self-rescuer rated for minimum 30 minutes of heavy physical exertion or 60 minutes of sedentary breathing in an irrespirable atmosphere.`,
    summary:
      'Synthetic demo advisory on refuge chamber placement (<= 750m from face, 36hr life support) and mandatory belt-mounted 30-minute chemical oxygen self-rescuers.',
    sections: [
      {
        sectionNumber: 'Sec. 1',
        title: 'Refuge Chamber Spacing',
        clauses: [
          {
            clauseNumber: '1.1',
            title: 'Chamber Distance Limit',
            text: 'Refuge chambers must be positioned within 750 meters of active headings.',
          },
        ],
      },
    ],
    clauses: [
      'DEMO-EMERG-001-Sec1: Refuge chamber within 750 m with 36-hour air supply.',
      'DEMO-EMERG-001-Sec2: Belt-mounted SCSR mandatory for all underground personnel.',
    ],
    verificationStatus: 'NEEDS_REVIEW',
    verificationNotes: 'SYNTHETIC DEMONSTRATION KNOWLEDGE — NOT OFFICIAL REGULATORY TEXT',
    isSyntheticDemo: true,
    version: 1,
    createdAt: '2024-06-10T14:00:00Z',
    updatedAt: '2024-06-10T14:00:00Z',
  },
  {
    id: 'KNOW-BLAST-008',
    title: 'Controlled Blasting & Flyrock Exclusion Radius Standard [DEMO]',
    shortTitle: 'Explosives & Blasting Safety',
    description:
      'Synthetic unverified proposal establishing deep-hole blasting danger zones, siren timings, vibration peak particle velocity (PPV) limits, and pre-blast clear-off checks.',
    category: 'Explosives & Blasting',
    subcategory: 'Shotfiring & Overburden Fragmentation',
    jurisdiction: 'National - India (Demonstration Context)',
    authority: 'Directorate General of Mines Safety (DGMS)',
    sourceName: 'Synthetic Demonstration Dataset — Not Official Regulatory Publication',
    sourceReference: 'DEMO-SAFETY-001',
    sourceUrl: 'https://dgms.gov.in/synthetic-guidelines/blasting-safety',
    documentType: 'INTERNAL_POLICY',
    documentVersion: '2024.0-UnverifiedDemo',
    effectiveDate: '2024-09-01',
    status: 'DRAFT',
    applicableMineTypes: ['Open Cast', 'Mixed'],
    applicableRoles: ['ADMIN', 'OFFICER'],
    tags: ['explosives', 'blasting', 'flyrock', 'ppv', 'vibration', 'shotfiring'],
    keywords: [
      'danger zone',
      'flyrock radius',
      'peak particle velocity',
      'ppv',
      'muffled blasting',
      'warning siren',
      'blasting shelter',
    ],
    content: `# Controlled Blasting & Danger Perimeter Protocols

## Section 1: Danger Zone Demarcation & Sentry Placement
Prior to shot initiation in any opencast bench, a formal danger zone of 500 meters radius from the blast site must be established. Red warning flags and designated sentries equipped with two-way transceivers must seal all access tracks. A continuous audible siren must sound for three minutes prior to countdown.

## Section 2: Ground Vibration Limits
Peak Particle Velocity (PPV) at the perimeter of the nearest residential structure or public infrastructure must not exceed 10 mm/s for structures with reinforced concrete and 5 mm/s for traditional masonry buildings. Electronic delay detonators must be utilized whenever blasting occurs within 300 meters of permanent surface works.`,
    summary:
      'Synthetic demo unverified draft covering 500m blast danger zone exclusion, 3-minute sirens, and PPV ground vibration limits (5-10 mm/s).',
    sections: [
      {
        sectionNumber: 'Sec. 1',
        title: 'Danger Perimeter',
        clauses: [
          {
            clauseNumber: '1.1',
            title: '500-Meter Danger Zone',
            text: '500m radius must be cleared and guarded by sentries before charging initiation.',
          },
        ],
      },
    ],
    clauses: [
      'DEMO-SAFETY-001-Sec1: 500 meter cleared danger zone for opencast blasting.',
      'DEMO-SAFETY-001-Sec2: Peak particle velocity capped between 5 and 10 mm/s.',
    ],
    verificationStatus: 'UNVERIFIED',
    verificationNotes: 'SYNTHETIC DEMONSTRATION KNOWLEDGE — NOT OFFICIAL REGULATORY TEXT',
    isSyntheticDemo: true,
    version: 1,
    createdAt: '2024-08-01T10:00:00Z',
    updatedAt: '2024-08-01T10:00:00Z',
  },
];
