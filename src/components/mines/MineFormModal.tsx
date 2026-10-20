import React, { useState } from 'react';
import { X, Pickaxe, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Mine, CreateMineInput, UpdateMineInput, MineType, MineStatus } from '../../types';

interface MineFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateMineInput | UpdateMineInput) => Promise<void>;
  initialMine?: Mine | null;
  mode: 'create' | 'edit';
}

export const MineFormModal: React.FC<MineFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialMine,
  mode,
}) => {
  const [mineCode, setMineCode] = useState(initialMine?.mineCode || initialMine?.code || '');
  const [name, setName] = useState(initialMine?.name || '');
  const [operator, setOperator] = useState(initialMine?.operator || '');
  const [owner, setOwner] = useState(initialMine?.owner || '');
  const [state, setState] = useState(initialMine?.state || 'Jharkhand');
  const [district, setDistrict] = useState(initialMine?.district || '');
  const [basin, setBasin] = useState(initialMine?.basin || '');
  const [mineType, setMineType] = useState<MineType>(initialMine?.mineType || initialMine?.type || 'Open Cast');
  const [status, setStatus] = useState<MineStatus>(initialMine?.status || 'Operational');
  const [latitude, setLatitude] = useState(initialMine?.latitude?.toString() || '23.74');
  const [longitude, setLongitude] = useState(initialMine?.longitude?.toString() || '86.41');
  const [workforce, setWorkforce] = useState(
    initialMine?.registeredWorkforce?.toString() || initialMine?.workforceCount?.toString() || '1200'
  );
  const [activePits, setActivePits] = useState(initialMine?.activePits?.toString() || '3');
  const [contactOfficer, setContactOfficer] = useState(initialMine?.contactOfficer || '');
  const [contactPhone, setContactPhone] = useState(initialMine?.contactPhone || '');
  const [nextInspectionDue, setNextInspectionDue] = useState(initialMine?.nextInspectionDue || '');

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Form Validation
    if (mode === 'create' && !mineCode.trim()) {
      setError('Mine code is required (e.g. DEMO-MINE-009 or CIL-JH-401).');
      return;
    }
    if (!name.trim()) {
      setError('Mine name is required.');
      return;
    }
    if (!operator.trim()) {
      setError('Colliery operating agency is required.');
      return;
    }
    if (!state.trim() || !district.trim() || !basin.trim()) {
      setError('State, District, and Coal Basin are all required.');
      return;
    }

    const parsedWorkforce = parseInt(workforce, 10);
    if (isNaN(parsedWorkforce) || parsedWorkforce <= 0) {
      setError('Workforce count must be a positive integer.');
      return;
    }

    const parsedLat = parseFloat(latitude);
    const parsedLng = parseFloat(longitude);
    if (isNaN(parsedLat) || isNaN(parsedLng)) {
      setError('Coordinates must be valid decimal numbers.');
      return;
    }

    try {
      setIsSubmitting(true);
      if (mode === 'create') {
        await onSubmit({
          mineCode: mineCode.trim().toUpperCase(),
          name: name.trim(),
          operator: operator.trim(),
          owner: owner.trim() || operator.trim(),
          state: state.trim(),
          district: district.trim(),
          basin: basin.trim(),
          location: `${basin.trim()}, ${district.trim()}`,
          mineType,
          status,
          latitude: parsedLat,
          longitude: parsedLng,
          registeredWorkforce: parsedWorkforce,
          currentWorkforce: parsedWorkforce,
          activePits: parseInt(activePits, 10) || 1,
          contactOfficer: contactOfficer.trim() || 'Designated Colliery Agent',
          contactPhone: contactPhone.trim() || '+91-0000-000000',
          nextInspectionDue: nextInspectionDue.trim() || '30 Days from Registration',
        });
      } else {
        await onSubmit({
          name: name.trim(),
          operator: operator.trim(),
          owner: owner.trim() || operator.trim(),
          state: state.trim(),
          district: district.trim(),
          basin: basin.trim(),
          location: `${basin.trim()}, ${district.trim()}`,
          mineType,
          status,
          latitude: parsedLat,
          longitude: parsedLng,
          registeredWorkforce: parsedWorkforce,
          activePits: parseInt(activePits, 10) || 1,
          contactOfficer: contactOfficer.trim(),
          contactPhone: contactPhone.trim(),
          nextInspectionDue: nextInspectionDue.trim(),
        });
      }
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save mine record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150 my-8">
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Pickaxe className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {mode === 'create' ? 'Register New Coal Mine' : `Edit Mine: ${initialMine?.name}`}
              </h3>
              <p className="text-xs text-slate-400">
                Administrative Colliery Surveillance Registration
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-rose-800/80 bg-rose-950/40 p-3 text-xs text-rose-300">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {mode === 'create' ? (
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Mine Code <span className="text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. DEMO-MINE-009 or CCL-JH-402"
                  value={mineCode}
                  onChange={(e) => setMineCode(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 py-2 px-3 text-white font-mono placeholder:text-slate-500 focus:border-amber-500 focus:outline-none uppercase"
                />
              </div>
            ) : (
              <div>
                <label className="block text-slate-400 font-medium mb-1">Mine Code</label>
                <input
                  type="text"
                  disabled
                  value={mineCode}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 py-2 px-3 text-slate-400 font-mono cursor-not-allowed"
                />
              </div>
            )}

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Colliery Name <span className="text-amber-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Karanpura Deep Open Cast Mine"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 py-2 px-3 text-white placeholder:text-slate-500 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Operating Agency / Subsidiary <span className="text-amber-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Central Coalfields Limited"
                value={operator}
                onChange={(e) => setOperator(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 py-2 px-3 text-white placeholder:text-slate-500 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Ownership Entity</label>
              <input
                type="text"
                placeholder="e.g. Coal India Limited PSU"
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 py-2 px-3 text-white placeholder:text-slate-500 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                State <span className="text-amber-400">*</span>
              </label>
              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 py-2 px-3 text-white focus:border-amber-500 focus:outline-none"
              >
                <option value="Jharkhand">Jharkhand</option>
                <option value="Chhattisgarh">Chhattisgarh</option>
                <option value="Odisha">Odisha</option>
                <option value="Madhya Pradesh">Madhya Pradesh</option>
                <option value="West Bengal">West Bengal</option>
                <option value="Telangana">Telangana</option>
                <option value="Tamil Nadu">Tamil Nadu</option>
                <option value="Maharashtra">Maharashtra</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                District <span className="text-amber-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Dhanbad / Korba"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 py-2 px-3 text-white placeholder:text-slate-500 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Coal Basin / Coalfield <span className="text-amber-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Jharia Coalfield, Seam IV"
                value={basin}
                onChange={(e) => setBasin(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 py-2 px-3 text-white placeholder:text-slate-500 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Operational Type</label>
              <select
                value={mineType}
                onChange={(e) => setMineType(e.target.value as MineType)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 py-2 px-3 text-white focus:border-amber-500 focus:outline-none"
              >
                <option value="Open Cast">Open Cast</option>
                <option value="Underground">Underground</option>
                <option value="Mixed">Mixed</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Regulatory Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as MineStatus)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 py-2 px-3 text-white focus:border-amber-500 focus:outline-none"
              >
                <option value="Operational">Operational</option>
                <option value="Under Audit">Under Audit</option>
                <option value="Notice Issued">Notice Issued</option>
                <option value="Suspended">Suspended</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Registered Workforce <span className="text-amber-400">*</span>
              </label>
              <input
                type="number"
                required
                min={1}
                value={workforce}
                onChange={(e) => setWorkforce(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 py-2 px-3 text-white placeholder:text-slate-500 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Active Pits / Inclines</label>
              <input
                type="number"
                min={1}
                value={activePits}
                onChange={(e) => setActivePits(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 py-2 px-3 text-white placeholder:text-slate-500 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Next Inspection Due</label>
              <input
                type="text"
                placeholder="e.g. 15 Oct 2026"
                value={nextInspectionDue}
                onChange={(e) => setNextInspectionDue(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 py-2 px-3 text-white placeholder:text-slate-500 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Latitude (°N)</label>
              <input
                type="text"
                placeholder="e.g. 23.7441"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 py-2 px-3 text-white font-mono placeholder:text-slate-500 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Longitude (°E)</label>
              <input
                type="text"
                placeholder="e.g. 86.4131"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 py-2 px-3 text-white font-mono placeholder:text-slate-500 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Designated Colliery Agent / Officer</label>
              <input
                type="text"
                placeholder="e.g. Shri R. K. Sen (Agent)"
                value={contactOfficer}
                onChange={(e) => setContactOfficer(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 py-2 px-3 text-white placeholder:text-slate-500 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Contact Phone</label>
              <input
                type="text"
                placeholder="e.g. +91-326-2200109"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 py-2 px-3 text-white placeholder:text-slate-500 focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-950 p-3 text-[11px] text-slate-400">
            <strong>Persistence Notice:</strong> Saved colliery data will be stored securely in the browser Local Storage adapter and can be updated by administrators anytime.
          </div>

          <div className="flex justify-end gap-2.5 border-t border-slate-800 pt-4">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="rounded-lg bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 disabled:opacity-50 transition-colors shadow-sm"
            >
              {isSubmitting ? (
                <span>Saving...</span>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{mode === 'create' ? 'Register Colliery' : 'Save Changes'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
