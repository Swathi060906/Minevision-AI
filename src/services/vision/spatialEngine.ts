import { VisionDetection, BoundingBox } from '../../data/models/VisionDetection';
import { ZoneDefinition } from '../../data/models/ZoneDefinition';
import { SafetyObservation, ObservationType, SpatialDetails } from '../../data/models/SafetyObservation';

export interface SpatialAnalysisConfig {
  proximityThresholdMeters?: number; // e.g. 4.0 meters
  ppeConfidenceThreshold?: number;   // e.g. 0.60
  personConfidenceThreshold?: number; // e.g. 0.65
}

export class SpatialEngine {
  /**
   * Derive Safety Observations from raw detections and configured zones
   */
  evaluateSafetyObservations(params: {
    analysisId: string;
    mineId: string;
    inspectionId?: string;
    evidenceId: string;
    detections: VisionDetection[];
    zones: ZoneDefinition[];
    config?: SpatialAnalysisConfig;
    isSyntheticDemo?: boolean;
  }): SafetyObservation[] {
    const {
      analysisId,
      mineId,
      inspectionId,
      evidenceId,
      detections,
      zones,
      isSyntheticDemo = false,
    } = params;

    const ppeThreshold = params.config?.ppeConfidenceThreshold ?? 0.6;
    const personThreshold = params.config?.personConfidenceThreshold ?? 0.65;
    const proximityThresholdMeters = params.config?.proximityThresholdMeters ?? 4.0;

    const observations: SafetyObservation[] = [];
    const now = new Date().toISOString();

    const persons = detections.filter((d) => d.type === 'PERSON');
    const hardHats = detections.filter((d) => d.type === 'HARD_HAT');
    const safetyVests = detections.filter((d) => d.type === 'SAFETY_VEST');
    const vehicles = detections.filter((d) => d.type === 'VEHICLE' || d.type === 'HEMM');

    // -------------------------------------------------------------
    // 1. PPE Association & Missing PPE Analysis
    // -------------------------------------------------------------
    for (let i = 0; i < persons.length; i++) {
      const person = persons[i];
      const pBox = person.boundingBox;

      // Define anatomical regions (normalized coordinates)
      // Head region: upper 35% of person box
      const headRegion: BoundingBox = {
        x: pBox.x - 0.04,
        y: Math.max(0, pBox.y - 0.04),
        width: pBox.width + 0.08,
        height: pBox.height * 0.4,
      };

      // Torso region: middle 50% of person box
      const torsoRegion: BoundingBox = {
        x: pBox.x - 0.04,
        y: pBox.y + pBox.height * 0.15,
        width: pBox.width + 0.08,
        height: pBox.height * 0.55,
      };

      // Check for hard hat overlap
      const matchingHats = hardHats.filter((hat) =>
        boxesOverlap(hat.boundingBox, headRegion)
      );

      // Check for safety vest overlap
      const matchingVests = safetyVests.filter((vest) =>
        boxesOverlap(vest.boundingBox, torsoRegion)
      );

      // --- Hard Hat Evaluation ---
      if (matchingHats.length === 0) {
        if (person.confidence >= personThreshold) {
          // Person detected with sufficient confidence, but no helmet found
          observations.push({
            id: `obs-${Date.now()}-hat-${i + 1}`,
            analysisId,
            mineId,
            inspectionId,
            observationType: 'MISSING_HARD_HAT',
            title: `Potential Missing Hard Hat: Worker ${i + 1}`,
            description: `Worker observed in active mining area without detected industrial safety helmet / hard hat in head region. Person confidence: ${(person.confidence * 100).toFixed(0)}%.`,
            severity: 'HIGH',
            confidence: person.confidence,
            confidenceLevel: person.confidence >= 0.8 ? 'HIGH' : 'MEDIUM',
            detectionIds: [person.id],
            evidenceId,
            spatialDetails: {
              personDetectionId: person.id,
            },
            status: 'PROPOSED',
            isSyntheticDemo,
            createdAt: now,
            updatedAt: now,
          });
        } else {
          // Low person confidence
          observations.push({
            id: `obs-${Date.now()}-unc-hat-${i + 1}`,
            analysisId,
            mineId,
            inspectionId,
            observationType: 'UNCERTAIN_PPE',
            title: `Uncertain Hard Hat Status (Low Confidence): Worker ${i + 1}`,
            description: `Worker detected with low confidence (${(person.confidence * 100).toFixed(0)}%). Hard hat presence cannot be reliably established automatically and requires human verification.`,
            severity: 'LOW',
            confidence: person.confidence,
            confidenceLevel: 'LOW',
            detectionIds: [person.id],
            evidenceId,
            spatialDetails: {
              personDetectionId: person.id,
            },
            status: 'PROPOSED',
            isSyntheticDemo,
            createdAt: now,
            updatedAt: now,
          });
        }
      } else {
        const topHat = matchingHats[0];
        if (topHat.confidence < ppeThreshold) {
          observations.push({
            id: `obs-${Date.now()}-hat-lowconf-${i + 1}`,
            analysisId,
            mineId,
            inspectionId,
            observationType: 'UNCERTAIN_PPE',
            title: `Potential Protective Headgear Ambiguity: Worker ${i + 1}`,
            description: `Headgear detected above worker with borderline confidence (${(topHat.confidence * 100).toFixed(0)}%). Verification needed to confirm compliance with DGMS certified specifications.`,
            severity: 'LOW',
            confidence: topHat.confidence,
            confidenceLevel: 'LOW',
            detectionIds: [person.id, topHat.id],
            evidenceId,
            spatialDetails: {
              personDetectionId: person.id,
              associatedPpeDetectionIds: [topHat.id],
            },
            status: 'PROPOSED',
            isSyntheticDemo,
            createdAt: now,
            updatedAt: now,
          });
        }
      }

      // --- Safety Vest Evaluation ---
      if (matchingVests.length === 0) {
        if (person.confidence >= personThreshold) {
          observations.push({
            id: `obs-${Date.now()}-vest-${i + 1}`,
            analysisId,
            mineId,
            inspectionId,
            observationType: 'MISSING_SAFETY_VEST',
            title: `Potential Missing High-Visibility Vest: Worker ${i + 1}`,
            description: `Worker observed without detected high-visibility reflective safety apparel in torso zone. High-visibility vest is required during heavy machinery movements.`,
            severity: 'MEDIUM',
            confidence: person.confidence,
            confidenceLevel: person.confidence >= 0.8 ? 'HIGH' : 'MEDIUM',
            detectionIds: [person.id],
            evidenceId,
            spatialDetails: {
              personDetectionId: person.id,
            },
            status: 'PROPOSED',
            isSyntheticDemo,
            createdAt: now,
            updatedAt: now,
          });
        }
      }
    }

    // -------------------------------------------------------------
    // 2. Restricted / Unsafe Zone Intrusion Analysis
    // -------------------------------------------------------------
    const activeZones = zones.filter((z) => z.enabled && z.mineId === mineId);

    for (const zone of activeZones) {
      for (let i = 0; i < persons.length; i++) {
        const person = persons[i];
        const pBox = person.boundingBox;

        // Calculate feet point (contact with ground) and center point
        const feetPoint = {
          x: pBox.x + pBox.width / 2,
          y: pBox.y + pBox.height * 0.95,
        };
        const centerPoint = {
          x: pBox.x + pBox.width / 2,
          y: pBox.y + pBox.height / 2,
        };

        const isIntruding =
          isPointInZone(feetPoint, zone) || isPointInZone(centerPoint, zone);

        if (isIntruding) {
          observations.push({
            id: `obs-${Date.now()}-zone-${zone.id}-${i + 1}`,
            analysisId,
            mineId,
            inspectionId,
            observationType: 'RESTRICTED_ZONE_INTRUSION',
            title: `Person Detected Inside Configured Zone: ${zone.name}`,
            description: `Worker detected inside operational zone boundary '${zone.name}' (${zone.zoneType}). Spatial coordinates: (${(centerPoint.x * 100).toFixed(1)}%, ${(centerPoint.y * 100).toFixed(1)}%). Ground feet position confirmed within perimeter.`,
            severity: zone.severity || 'HIGH',
            confidence: person.confidence,
            confidenceLevel: person.confidence >= 0.8 ? 'HIGH' : 'MEDIUM',
            detectionIds: [person.id],
            evidenceId,
            spatialDetails: {
              zoneName: zone.name,
              zoneId: zone.id,
              personDetectionId: person.id,
            },
            status: 'PROPOSED',
            isSyntheticDemo,
            createdAt: now,
            updatedAt: now,
          });
        }
      }
    }

    // -------------------------------------------------------------
    // 3. Person / Vehicle Proximity Analysis
    // -------------------------------------------------------------
    for (let pIdx = 0; pIdx < persons.length; pIdx++) {
      const person = persons[pIdx];
      for (let vIdx = 0; vIdx < vehicles.length; vIdx++) {
        const vehicle = vehicles[vIdx];

        // Estimated distance: distance in normalized space * scene depth estimate (approx 25m wide view)
        const edgeDistNorm = calculateBoxEdgeDistance(person.boundingBox, vehicle.boundingBox);
        const estimatedMeters = Number((edgeDistNorm * 22.0).toFixed(1));

        if (estimatedMeters < proximityThresholdMeters) {
          const isHEMM = vehicle.type === 'HEMM';
          const sev = estimatedMeters < 2.0 ? 'CRITICAL' : 'HIGH';

          observations.push({
            id: `obs-${Date.now()}-prox-${pIdx + 1}-${vIdx + 1}`,
            analysisId,
            mineId,
            inspectionId,
            observationType: 'VEHICLE_PERSON_PROXIMITY',
            title: `Person / ${isHEMM ? 'HEMM' : 'Vehicle'} Proximity Warning`,
            description: `Pedestrian worker observed in close proximity (${estimatedMeters}m estimated) to operating ${vehicle.label || 'machinery'}. Configured operational proximity threshold is ${proximityThresholdMeters.toFixed(1)}m.`,
            severity: sev,
            confidence: Math.min(person.confidence, vehicle.confidence),
            confidenceLevel: Math.min(person.confidence, vehicle.confidence) >= 0.75 ? 'HIGH' : 'MEDIUM',
            detectionIds: [person.id, vehicle.id],
            evidenceId,
            spatialDetails: {
              distanceMetersEstimated: estimatedMeters,
              thresholdMeters: proximityThresholdMeters,
              personDetectionId: person.id,
              vehicleDetectionId: vehicle.id,
            },
            status: 'PROPOSED',
            isSyntheticDemo,
            createdAt: now,
            updatedAt: now,
          });
        }
      }
    }

    return observations;
  }
}

// --- Geometry Helpers ---

function boxesOverlap(a: BoundingBox, b: BoundingBox): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function isPointInZone(point: { x: number; y: number }, zone: ZoneDefinition): boolean {
  const geom = zone.geometry;
  if (geom.type === 'RECTANGLE' && geom.boundingBox) {
    const b = geom.boundingBox;
    return (
      point.x >= b.x &&
      point.x <= b.x + b.width &&
      point.y >= b.y &&
      point.y <= b.y + b.height
    );
  }

  if (geom.type === 'POLYGON' && geom.points && geom.points.length >= 3) {
    return isPointInPolygon(point, geom.points);
  }

  return false;
}

function isPointInPolygon(
  point: { x: number; y: number },
  vs: { x: number; y: number }[]
): boolean {
  const x = point.x;
  const y = point.y;
  let inside = false;

  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    const xi = vs[i].x;
    const yi = vs[i].y;
    const xj = vs[j].x;
    const yj = vs[j].y;

    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }

  return inside;
}

function calculateBoxEdgeDistance(a: BoundingBox, b: BoundingBox): number {
  const leftA = a.x;
  const rightA = a.x + a.width;
  const topA = a.y;
  const bottomA = a.y + a.height;

  const leftB = b.x;
  const rightB = b.x + b.width;
  const topB = b.y;
  const bottomB = b.y + b.height;

  // Horizontal distance between intervals
  let dx = 0;
  if (rightA < leftB) {
    dx = leftB - rightA;
  } else if (rightB < leftA) {
    dx = leftA - rightB;
  }

  // Vertical distance between intervals
  let dy = 0;
  if (bottomA < topB) {
    dy = topB - bottomA;
  } else if (bottomB < topA) {
    dy = topA - bottomB;
  }

  return Math.sqrt(dx * dx + dy * dy);
}

export const spatialEngine = new SpatialEngine();
