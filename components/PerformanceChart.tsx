"use client";

import { useState } from "react";
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, LabelList } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Activity, Brain, BookOpen, Layers } from "lucide-react";

interface PerformanceChartProps {
  data: {
    date: string;
    iq: number;
    gk: number;
    total: number;
  }[];
  name: string;
}

type ViewType = "total" | "iq" | "gk";

export default function PerformanceChart({ data, name }: PerformanceChartProps) {
  const [activeView, setActiveView] = useState<ViewType>("total");

  if (!data || data.length === 0) return null;

  const viewConfigs = {
    total: {
      label: "Total Analysis",
      dataKey: "total",
      color: "#f59e0b", // Amber
      icon: <Layers className="w-4 h-4" />
    },
    iq: {
      label: "IQ Analysis",
      dataKey: "iq",
      color: "#6366f1", // Indigo
      icon: <Brain className="w-4 h-4" />
    },
    gk: {
      label: "GK Analysis",
      dataKey: "gk",
      color: "#ec4899", // Pink
      icon: <BookOpen className="w-4 h-4" />
    }
  };

  const current = viewConfigs[activeView];

  return (
    <Card className="w-full border-0 shadow-2xl rounded-[2.5rem] md:rounded-[3.1rem] bg-white ring-1 ring-black/5 overflow-hidden animate-in fade-in zoom-in duration-700">
      <CardHeader className="pb-4 px-6 md:px-10 pt-8 md:pt-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1">
            <CardTitle className="text-2xl md:text-3xl font-black text-foreground flex items-center gap-3">
              <Activity className="w-7 h-7 text-primary" />
              {current.label}
            </CardTitle>
            <p className="text-muted-foreground font-medium text-sm md:text-base">Tracking progress for {name}</p>
          </div>
          
          <div className="flex bg-neutral-100 p-1 rounded-2xl w-full md:w-auto overflow-x-auto no-scrollbar">
            {(["total", "iq", "gk"] as ViewType[]).map((view) => (
              <button
                key={view}
                onClick={() => setActiveView(view)}
                className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap flex-1 md:flex-none ${
                  activeView === view 
                    ? 'bg-white text-foreground shadow-lg shadow-black/5 ring-1 ring-black/5' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {viewConfigs[view].icon}
                {view}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 md:p-10">
        <div className="h-[300px] md:h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={current.color} stopOpacity={0.2}/>
                  <stop offset="95%" stopColor={current.color} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#a3a3a3', fontSize: 10, fontWeight: 700 }}
                interval={0}
                dy={15}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#a3a3a3', fontSize: 11, fontWeight: 700 }}
                dx={-10}
              />
              <Tooltip 
                contentStyle={{ 
                  borderRadius: '1.5rem', 
                  border: 'none', 
                  boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)',
                  padding: '20px',
                  fontWeight: 800
                }}
                cursor={{ stroke: current.color, strokeWidth: 2, strokeDasharray: '5 5' }}
              />
              <Area 
                type="linear" 
                dataKey={current.dataKey} 
                stroke={current.color} 
                strokeWidth={4}
                fillOpacity={1} 
                fill="url(#colorValue)" 
                animationDuration={1500}
                dot={{ r: 6, fill: current.color, strokeWidth: 3, stroke: '#fff', fillOpacity: 1 }}
                activeDot={{ r: 9, strokeWidth: 4, stroke: '#fff' }}
              >
                <LabelList 
                  dataKey={current.dataKey} 
                  position="top" 
                  offset={15} 
                  style={{ fill: current.color, fontSize: 12, fontWeight: 900 }} 
                />
              </Area>
            </AreaChart>
          </ResponsiveContainer>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-10">
          {[
            { l: "IQ Peak", v: Math.max(...data.map(d => d.iq)), c: "text-indigo-600", bg: "bg-indigo-50" },
            { l: "GK Peak", v: Math.max(...data.map(d => d.gk)), c: "text-pink-600", bg: "bg-pink-50" },
            { l: "Aggregate Peak", v: Math.max(...data.map(d => d.total)), c: "text-amber-600", bg: "bg-amber-50" }
          ].map((stat, i) => (
            <div key={i} className={`${stat.bg} p-6 rounded-3xl border border-white flex flex-col items-center shadow-sm`}>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-2">{stat.l}</p>
              <p className={`text-3xl font-black ${stat.c} tracking-tight`}>{stat.v}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
