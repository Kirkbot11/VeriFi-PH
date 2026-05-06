export function getRiskColor(level) {
  switch ((level || "").toLowerCase()) {
    case "low":
      return "bg-green-100 text-green-800 border-green-300";

    case "medium":
      return "bg-yellow-100 text-yellow-800 border-yellow-300";

    case "high":
      return "bg-orange-100 text-orange-800 border-orange-300";

    case "critical":
      return "bg-red-100 text-red-800 border-red-300";

    default:
      return "bg-gray-100 text-gray-800 border-gray-300";
  }
}