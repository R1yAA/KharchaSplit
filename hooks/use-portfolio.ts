"use client";

import { useMemo } from "react";
import { useInvestments } from "./use-investments";
import { useValuations } from "./use-valuations";
import { computePortfolioSummary, getMonthlyPortfolioTimeline } from "@/lib/investments";

export function usePortfolio(months = 12) {
  const { data: investments = [] } = useInvestments();
  const { data: valuations = [] } = useValuations();

  return useMemo(() => {
    const summary = computePortfolioSummary(investments, valuations);
    const timeline = getMonthlyPortfolioTimeline(investments, valuations, months);
    return { summary, timeline, investments, valuations };
  }, [investments, valuations, months]);
}
