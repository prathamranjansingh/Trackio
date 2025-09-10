import ProductionStopwatch from "../timer/ProductionStopwatch";

export default function DashboardGrid() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-6 gap-4 w-full p-4">
      {/* Header */}
      <div className="col-span-2 sm:col-span-2 md:col-span-2 row-span-2 min-h-[300px] bg-gray-400">
        Profile
      </div>

      {/* Socials */}
      <div className="col-span-1 sm:col-span-1 md:col-span-1 bg-red-500 min-h-[100px]">
        Total Questions
      </div>
      <div className="col-span-1 sm:col-span-1 md:col-span-1 bg-green-500 min-h-[100px]">
        Streaks
      </div>
      <div className="col-span-2 sm:col-span-2 md:col-span-2 row-span-2 min-h-[300px]">
        <ProductionStopwatch></ProductionStopwatch>
      </div>
      <div className="col-span-2 sm:col-span-2 md:col-span-2 bg-yellow-500 min-h-[100px]">
        badges
      </div>
      {/* Location */}
      <div className="col-span-2 sm:col-span-2 md:col-span-1 bg-pink-500 min-h-[150px]">
        leetcode topics
      </div>
      {/* About */}
      <div className="col-span-2 sm:col-span-2 md:col-span-4 bg-purple-500 min-h-[150px]">
        heatmap
      </div>

      {/* Email */}
      <div className="col-span-2 sm:col-span-1 md:col-span-1 bg-indigo-500 min-h-[150px]">
        Coding Projects
      </div>

      <div className="col-span-2 sm:col-span-1 md:col-span-3 bg-orange-700 min-h-[150px]">
        Todo
      </div>

      <div className="col-span-2 sm:col-span-1 md:col-span-3 bg-amber-400 min-h-[150px]">
        reminder
      </div>
    </div>
  );
}
