import Ticker from "@/components/exchange/Ticker";
import LiveFeed from "@/components/exchange/LiveFeed";
import Leaderboard from "@/components/exchange/Leaderboard";
import HotTasks from "@/components/exchange/HotTasks";

export default function Home() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <Ticker />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <LiveFeed />
        </div>
        <div className="space-y-6">
          <Leaderboard />
          <HotTasks />
        </div>
      </div>
    </div>
  );
}
