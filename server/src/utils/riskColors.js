function getRiskColor(level) {
  switch ((level || '').toLowerCase()) {
    case 'low':
      return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'medium':
      return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'high':
      return 'bg-red-100 text-red-700 border-red-200';
    case 'critical':
      return 'bg-red-200 text-red-900 border-red-400';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
}