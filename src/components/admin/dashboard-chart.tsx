"use client";

import { TrendingUp } from "lucide-react";

interface ChartData {
  day: string;
  amount: number;
}

interface DashboardChartProps {
  data: ChartData[];
  title: string;
  total: string;
}

export function DashboardChart({ data, title, total }: DashboardChartProps) {
  const maxAmount = Math.max(...data.map((d) => d.amount), 1);

  return (
    <div className="flex flex-col h-full bg-card/40 border border-zinc-200/50 shadow-sm backdrop-blur-md rounded-2xl p-6 group transition-all duration-300 hover:shadow-lg hover:border-primary/20">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest leading-none mb-2">{title}</h2>
          <p className="text-2xl font-black text-foreground tracking-tight">{total}</p>
        </div>
        <div className="flex items-center gap-1.5 text-2xs font-black text-success bg-success/10 px-3 py-1 rounded-full border border-success/20 uppercase tracking-widest shadow-sm">
          <TrendingUp className="h-3 w-3" />
          +12.5%
        </div>
      </div>

      <div className="flex-1 flex items-end gap-2 min-h-[140px]">
        {data.map((item, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-3 group/bar">
            {/* Bar with tooltip-like hover */}
            <div className="relative w-full flex items-end justify-center group/bar">
              <div
                className="w-full max-w-[40px] bg-primary/20 rounded-t-lg transition-all duration-500 ease-out group-hover/bar:bg-primary/40 relative overflow-hidden"
                style={{
                  height: `${(item.amount / maxAmount) * 100}%`,
                  transitionDelay: `${i * 50}ms`
                }}
              >
                {/* Shiny effect */}
                <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/5 to-white/10 opacity-0 group-hover/bar:opacity-100 transition-opacity" />
              </div>

              {/* Tooltip on hover */}
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-zinc-900 text-white text-2xs px-2 py-1 rounded opacity-0 group-hover/bar:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20 font-bold border border-zinc-700 shadow-xl">
                R$ {item.amount.toLocaleString('pt-BR')}
              </div>
            </div>

            <span className="text-2xs font-bold text-muted-foreground group-hover/bar:text-foreground transition-colors uppercase">
              {item.day}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
