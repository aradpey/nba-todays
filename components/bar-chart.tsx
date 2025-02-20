"use client"

import { Bar, BarChart as RechartsBarChart, ResponsiveContainer, XAxis, YAxis } from "recharts"

interface BarChartProps {
  data: { name: string; points: number }[]
}

export function BarChart({ data }: BarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <RechartsBarChart data={data}>
        <XAxis dataKey="name" />
        <YAxis />
        <Bar dataKey="points" fill="#8884d8" />
      </RechartsBarChart>
    </ResponsiveContainer>
  )
}

