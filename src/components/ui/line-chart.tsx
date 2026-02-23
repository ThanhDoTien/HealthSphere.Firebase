"use client"

import * as React from "react"
import {
  CartesianGrid,
  Dot,
  Label,
  Line,
  LineChart as RechartsLineChart,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts"

import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { cn } from "@/lib/utils"

const lineChartDefaultProps = {
  isAnimationActive: true,
  style: {
    fontSize: 12,
  },
}

type LineChartProps = Omit<
  React.ComponentProps<typeof RechartsLineChart>,
  "data"
> & {
  data: unknown[]
  config: ChartConfig
  showXAxis?: boolean
  showYAxis?: boolean
  showGrid?: boolean
  showLegend?: boolean
  showTooltip?: boolean
}

const LineChart = React.forwardRef<
  React.ElementRef<typeof RechartsLineChart>,
  LineChartProps
>(
  (
    {
      className,
      data,
      config,
      showXAxis = true,
      showYAxis = true,
      showGrid = true,
      showLegend = true,
      showTooltip = true,
      ...props
    },
    ref
  ) => {
    return (
      <ChartContainer
        config={config}
        className={cn("h-full w-full", className)}
      >
        <RechartsLineChart
          ref={ref}
          data={data}
          {...lineChartDefaultProps}
          {...props}
        >
          {showGrid && <CartesianGrid vertical={false} />}
          {showYAxis && (
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              tickLine={false}
              axisLine={false}
            />
          )}
          {showXAxis && (
            <XAxis
              dataKey="date"
              stroke="hsl(var(--muted-foreground))"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
            />
          )}

          {showTooltip && <ChartTooltip content={<ChartTooltipContent />} />}

          {showLegend && <ChartLegend content={<ChartLegendContent />} />}

          {Object.entries(config).map(([key, config]) => (
            <Line
              key={key}
              dataKey={key}
              name={key}
              stroke={`var(--color)`}
              fill={`var(--color)`}
              dot={false}
              type="monotone"
            />
          ))}
          <ReferenceLine
            y={0}
            stroke="hsl(var(--border))"
            strokeDasharray="3 3"
          />
        </RechartsLineChart>
      </ChartContainer>
    )
  }
)
LineChart.displayName = "LineChart"

export { LineChart }
