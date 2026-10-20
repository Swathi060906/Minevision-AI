import React, { useState } from 'react';
import { X, BookOpen, AlertTriangle, CheckCircle2, Save } from 'lucide-react';
import {
  ComplianceKnowledge,
  CreateKnowledgeInput,
  UpdateKnowledgeInput,
  KnowledgeCategory,
  KnowledgeStatus,
  VerificationStatus,
  DocumentType,
} from '../../types';
import { dataService } from '../../services/dataService';
import { useAuth } from '../../auth/AuthContext';

interface KnowledgeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialKnowledge?: ComplianceKnowledge | null;
  mode: 'create' | 'edit';
}

const CATEGORIES: KnowledgeCategory[] = [
  'Mine Safety',
  'Occupational Health',
  'Environmental Compliance',
  'Explosives & Blasting',
  'Electrical Safety',
  'Machinery Safety',
  'Emergency Preparedness',
  'Personal Protective Equipment',
  'Ventilation',
  'Ground Control',
  'Fire Safety',
  'Labour / Worker Welfare',
  'Reporting & Record Keeping',
];

const DOCUMENT_TYPES: DocumentType[] = [
  'REGULATION',
  'ACT',
  'CIRCULAR',
  'STANDARD_OPERATING_PROCEDURE',
  'SAFETY_GUIDELINE',
  'INTERNAL_POLICY',
];

export const KnowledgeFormModal: React.FC<KnowledgeFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialKnowledge,
  mode,
}) => {
  const { user, logAuditEvent } = useAuth();

  const [title, setTitle] = useState(initialKnowledge?.title || '');
  const [shortTitle, setShortTitle] = useState(initialKnowledge?.shortTitle || '');
  const [description, setDescription] = useState(initialKnowledge?.description || '');
  const [category, setCategory] = useState<KnowledgeCategory>(
    initialKnowledge?.category || 'Mine Safety'
  );
  const [subcategory, setSubcategory] = useState(initialKnowledge?.subcategory || '');
  const [authority, setAuthority] = useState(
    initialKnowledge?.authority || 'Directorate General of Mines Safety (DGMS)'
  );
  const [sourceName, setSourceName] = useState(
    initialKnowledge?.sourceName || 'Coal Mines Regulations Framework'
  );
  const [sourceReference, setSourceReference] = useState(
    initialKnowledge?.sourceReference || 'DEMO-SAFETY-001'
  );
  const [sourceUrl, setSourceUrl] = useState(initialKnowledge?.sourceUrl || '');
  const [documentType, setDocumentType] = useState<DocumentType>(
    initialKnowledge?.documentType || 'REGULATION'
  );
  const [documentVersion, setDocumentVersion] = useState(
    initialKnowledge?.documentVersion || '2024.1'
  );
  const [effectiveDate, setEffectiveDate] = useState(
    initialKnowledge?.effectiveDate || new Date().toISOString().split('T')[0]
  );
  const [status, setStatus] = useState<KnowledgeStatus>(
    initialKnowledge?.status || 'ACTIVE'
  );
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>(
    initialKnowledge?.verificationStatus || 'VERIFIED'
  );
  const [applicableMineTypes, setApplicableMineTypes] = useState<('Open Cast' | 'Underground' | 'Mixed')[]>(
    initialKnowledge?.applicableMineTypes || ['Open Cast', 'Underground', 'Mixed']
  );
  const [applicableRoles, setApplicableRoles] = useState<('ADMIN' | 'OFFICER' | 'OPERATOR')[]>(
    initialKnowledge?.applicableRoles || ['ADMIN', 'OFFICER', 'OPERATOR']
  );
  const [tagsInput, setTagsInput] = useState(
    initialKnowledge?.tags ? initialKnowledge.tags.join(', ') : 'safety, regulation'
  );
  const [keywordsInput, setKeywordsInput] = useState(
    initialKnowledge?.keywords ? initialKnowledge.keywords.join(', ') : 'compliance, safety, hazard'
  );
  const [summary, setSummary] = useState(initialKnowledge?.summary || '');
  const [content, setContent] = useState(initialKnowledge?.content || '');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleToggleMineType = (mType: 'Open Cast' | 'Underground' | 'Mixed') => {
    setApplicableMineTypes((prev) =>
      prev.includes(mType) ? prev.filter((t) => t !== mType) : [...prev, mType]
    );
  };

  const handleToggleRole = (role: 'ADMIN' | 'OFFICER' | 'OPERATOR') => {
    setApplicableRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Title is required.');
      return;
    }
    if (!description.trim()) {
      setError('Description is required.');
      return;
    }
    if (!content.trim()) {
      setError('Document content text is required for chunk generation.');
      return;
    }
    if (applicableMineTypes.length === 0) {
      setError('Please select at least one applicable mine type.');
      return;
    }

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    const keywords = keywordsInput
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean);

    try {
      setIsSubmitting(true);

      if (mode === 'create') {
        const input: CreateKnowledgeInput = {
          title: title.trim(),
          shortTitle: shortTitle.trim() || undefined,
          description: description.trim(),
          category,
          subcategory: subcategory.trim() || undefined,
          jurisdiction: 'National - India (Statutory)',
          authority: authority.trim(),
          sourceName: sourceName.trim(),
          sourceReference: sourceReference.trim(),
          sourceUrl: sourceUrl.trim() || undefined,
          documentType,
          documentVersion: documentVersion.trim() || '1.0',
          effectiveDate,
          status,
          applicableMineTypes,
          applicableRoles,
          tags,
          keywords,
          content: content.trim(),
          summary: summary.trim() || undefined,
          verificationStatus,
          verifiedBy: verificationStatus === 'VERIFIED' ? user?.email : undefined,
          isSyntheticDemo: false,
        };

        const created = await dataService.createKnowledge(input);
        logAuditEvent('COMPLIANCE_KNOWLEDGE_CREATED', {
          knowledgeId: created.id,
          title: created.title,
          category: created.category,
          verificationStatus: created.verificationStatus,
        });
      } else if (initialKnowledge) {
        const updateInput: UpdateKnowledgeInput = {
          title: title.trim(),
          shortTitle: shortTitle.trim(),
          description: description.trim(),
          category,
          subcategory: subcategory.trim(),
          authority: authority.trim(),
          sourceName: sourceName.trim(),
          sourceReference: sourceReference.trim(),
          sourceUrl: sourceUrl.trim(),
          documentType,
          documentVersion: documentVersion.trim(),
          effectiveDate,
          status,
          verificationStatus,
          applicableMineTypes,
          applicableRoles,
          tags,
          keywords,
          content: content.trim(),
          summary: summary.trim(),
        };

        const updated = await dataService.updateKnowledge(initialKnowledge.id, updateInput);
        logAuditEvent('COMPLIANCE_KNOWLEDGE_UPDATED', {
          knowledgeId: updated.id,
          title: updated.title,
          category: updated.category,
          verificationStatus: updated.verificationStatus,
        });
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save knowledge record');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden my-6 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-amber-400" />
            <h2 className="text-base font-bold text-white">
              {mode === 'create' ? 'Add Compliance Knowledge Record' : 'Edit Compliance Knowledge'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="bg-rose-950/40 border-b border-rose-800 p-3 text-xs text-rose-300 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-slate-300 font-semibold mb-1">
                Document Title <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Methane Gas Thresholds and Return Air Velocity Mandate"
                className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                required
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Short Title / Alias</label>
              <input
                type="text"
                value={shortTitle}
                onChange={(e) => setShortTitle(e.target.value)}
                placeholder="e.g. Gas Monitoring Standards"
                className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Category <span className="text-rose-400">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as KnowledgeCategory)}
                className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-white focus:outline-none focus:border-amber-400"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Statutory Reference / Code <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={sourceReference}
                onChange={(e) => setSourceReference(e.target.value)}
                placeholder="e.g. DEMO-SAFETY-001"
                className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-400"
                required
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Authority / Regulatory Body <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={authority}
                onChange={(e) => setAuthority(e.target.value)}
                placeholder="e.g. Directorate General of Mines Safety (DGMS)"
                className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                required
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Document Type</label>
              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value as DocumentType)}
                className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-white focus:outline-none focus:border-amber-400"
              >
                {DOCUMENT_TYPES.map((dt) => (
                  <option key={dt} value={dt}>
                    {dt}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Effective Date</label>
              <input
                type="date"
                value={effectiveDate}
                onChange={(e) => setEffectiveDate(e.target.value)}
                className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Verification Status</label>
              <select
                value={verificationStatus}
                onChange={(e) => setVerificationStatus(e.target.value as VerificationStatus)}
                className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-white focus:outline-none focus:border-amber-400"
              >
                <option value="VERIFIED">VERIFIED</option>
                <option value="NEEDS_REVIEW">NEEDS_REVIEW</option>
                <option value="UNVERIFIED">UNVERIFIED</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Lifecycle Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as KnowledgeStatus)}
                className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-white focus:outline-none focus:border-amber-400"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="DRAFT">DRAFT</option>
                <option value="SUPERSEDED">SUPERSEDED</option>
                <option value="ARCHIVED">ARCHIVED</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Description / Objective <span className="text-rose-400">*</span>
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief overview of what this compliance mandate requires..."
              className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-white focus:outline-none focus:border-amber-400"
              required
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Executive Summary</label>
            <textarea
              rows={2}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Short key takeaways and numeric limits..."
              className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-white focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Statutory Markdown Content & Sections <span className="text-rose-400">*</span>
            </label>
            <p className="text-[11px] text-slate-400 mb-1.5">
              Use markdown headers (<code className="text-amber-300">## Section Name</code>) to automatically trigger deterministic chunk splitting for RAG.
            </p>
            <textarea
              rows={6}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="## Section 1: Requirement Name&#10;Full text here...&#10;&#10;## Section 2: Monitoring Standards&#10;Additional text..."
              className="w-full rounded-lg bg-slate-950 border border-slate-800 p-3 text-white font-mono text-xs focus:outline-none focus:border-amber-400"
              required
            />
          </div>

          {/* Applicable Scopes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">Applicable Mine Types</label>
              <div className="flex flex-wrap gap-2">
                {(['Open Cast', 'Underground', 'Mixed'] as const).map((mType) => (
                  <label
                    key={mType}
                    className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 px-2.5 py-1.5 rounded text-slate-300 cursor-pointer hover:bg-slate-800"
                  >
                    <input
                      type="checkbox"
                      checked={applicableMineTypes.includes(mType)}
                      onChange={() => handleToggleMineType(mType)}
                      className="rounded border-slate-700 text-amber-500 focus:ring-0"
                    />
                    <span>{mType}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">Authorized Roles</label>
              <div className="flex flex-wrap gap-2">
                {(['ADMIN', 'OFFICER', 'OPERATOR'] as const).map((r) => (
                  <label
                    key={r}
                    className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 px-2.5 py-1.5 rounded text-slate-300 cursor-pointer hover:bg-slate-800"
                  >
                    <input
                      type="checkbox"
                      checked={applicableRoles.includes(r)}
                      onChange={() => handleToggleRole(r)}
                      className="rounded border-slate-700 text-amber-500 focus:ring-0"
                    />
                    <span>{r}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Tags (comma separated)</label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="ventilation, methane, airflow"
                className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-white focus:outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Keywords (comma separated)</label>
              <input
                type="text"
                value={keywordsInput}
                onChange={(e) => setKeywordsInput(e.target.value)}
                placeholder="anemometer, face velocity, ch4"
                className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-white focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* Footer buttons */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 transition-colors shadow-sm disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              <span>{isSubmitting ? 'Saving...' : mode === 'create' ? 'Save & Chunk Document' : 'Update Document'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
