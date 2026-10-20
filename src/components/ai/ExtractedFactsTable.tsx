import React, { useState } from 'react';
import { Search, Filter, Binary, CheckCircle, HelpCircle, FileText } from 'lucide-react';
import { ExtractedFact, FactCategory } from '../../data/models/ExtractedFact';

interface ExtractedFactsTableProps {
  facts: ExtractedFact[];
}

export const ExtractedFactsTable: React.FC<ExtractedFactsTableProps> = ({ facts }) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const categories: string[] = [
    'ALL',
    ...(Array.from(new Set(facts.map((f) => String(f.category)))) as string[]).sort(),
  ];

  const filteredFacts = facts.filter((fact) => {
    if (selectedCategory !== 'ALL' && fact.category !== selectedCategory) {
      return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        fact.label.toLowerCase().includes(q) ||
        fact.value.toLowerCase().includes(q) ||
        fact.evidenceText.toLowerCase().includes(q) ||
        (fact.sourceSection && fact.sourceSection.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Search & Filter bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search extracted facts, values, or evidence quotes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-800 bg-slate-900/90 py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
                selectedCategory === cat
                  ? 'bg-sky-500 text-slate-950 font-bold'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Facts Table */}
      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/90">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-950/80 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Observation / Parameter</th>
                <th className="py-3 px-4">Recorded Value</th>
                <th className="py-3 px-4">Confidence</th>
                <th className="py-3 px-4">Section / Page</th>
                <th className="py-3 px-4">Evidence Excerpt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredFacts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No structured facts found matching the current filter.
                  </td>
                </tr>
              ) : (
                filteredFacts.map((fact) => (
                  <tr key={fact.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-300 border border-slate-700">
                        {fact.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-white">
                      {fact.label}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-sky-400">
                      {fact.value} {fact.unit || ''}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                          fact.confidence === 'HIGH'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : fact.confidence === 'MEDIUM'
                            ? 'bg-sky-500/20 text-sky-400'
                            : 'bg-amber-500/20 text-amber-400'
                        }`}
                      >
                        {fact.confidence}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400 whitespace-nowrap font-mono text-[11px]">
                      {fact.sourceSection || (fact.sourcePage ? `p. ${fact.sourcePage}` : '-')}
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate text-slate-400 italic">
                      "{fact.evidenceText}"
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
