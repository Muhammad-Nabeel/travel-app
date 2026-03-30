import { TrendingUp } from "lucide-react";
import styles from "./trending-searches.module.css";

type TrendingRoute = {
  origin: string;
  destination: string;
};

type TrendingSearchesProps = {
  routes: TrendingRoute[];
  onSelect: (route: TrendingRoute) => void;
};

export function TrendingSearches({ routes, onSelect }: TrendingSearchesProps) {
  return (
    <div className={styles.trendingRoot}>
      <p className={styles.trendingTitle}>
        <TrendingUp className="mr-1 inline-block h-3 w-3 align-middle" />
        Trending searches
      </p>
      <div className={styles.trendingList}>
        {routes.map((route) => (
          <button
            key={`${route.origin}-${route.destination}`}
            type="button"
            className={styles.trendingChip}
            onClick={() => onSelect(route)}
          >
            {route.origin} to {route.destination}
          </button>
        ))}
      </div>
    </div>
  );
}
