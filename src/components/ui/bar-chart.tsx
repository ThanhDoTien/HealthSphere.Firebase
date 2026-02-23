"use client"

import * as React from "react"
import {
  Bar,
  BarChart as RechartsBarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Rectangle,
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

const barChartDefaultProps = {
  layout: "horizontal" as const,
  stackOffset: "none" as const,
  margin: {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  style: {
    fontSize: 12,
  },
}

type BarChartProps = Omit<
  React.ComponentProps<typeof RechartsBarChart>,
  "data"
> & {
  data: unknown[]
  config: ChartConfig
  showXAxis?: boolean
  showYAxis?: boolean
  showGrid?: boolean
  showLegend?: boolean
  showTooltip?: boolean
  yAxisWidth?: number
}

const BarChart = React.forwardRef<
  React.ElementRef<typeof RechartsBarChart>,
  BarChartProps
>(
  (
    {
      className,
      data,
      config,
      showXAxis = true,
      showYAxis = true,
      showGrid = true,
      showLegend = false,
      showTooltip = true,
      yAxisWidth,
      ...props
    },
    ref
  ) => {
    return (
      <ChartContainer
        config={config}
        className={cn("h-full w-full", className)}
      >
        <RechartsBarChart
          ref={ref}
          data={data}
          {...barChartDefaultProps}
          {...props}
        >
          {showGrid && <CartesianGrid vertical={false} />}
          {showYAxis && <YAxis tickLine={false} axisLine={false} width={yAxisWidth} />}
          {showXAxis && (
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
            />
          )}

          {showTooltip && (
            <ChartTooltip
              content={
                <ChartTooltipContent hideIndicator className="max-w-xs" />
              }
            />
          )}

          {showLegend && (
            <ChartLegend
              content={<ChartLegendContent className="flex-wrap" />}
              wrapperStyle={{
                position: "relative",
                marginTop: "1.5rem",
              }}
            />
          )}
          {Object.entries(config || {}).map(([key, config]) => {
            return (
              <Bar key={key} dataKey={key} name={key} fill={`var(--color)`}>
                {/* @ts-ignore */}
                {config.label && <LabelList dataKey={key} position="top" />}
              </Bar>
            )
          })}
          <ReferenceLine y={0} stroke="hsl(var(--border))" strokeDasharray="3 3" />
        </RechartsBarChart>
      </ChartContainer>
    )
  }
)
BarChart.displayName = "BarChart"

export { BarChart }
