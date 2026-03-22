"use client"

import * as React from "react"
import { Pie, PieChart as RechartsPieChart, Sector } from "recharts"
import { PieSectorDataItem } from "recharts/types/polar/Pie"

import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { cn } from "@/lib/utils"

const pieChartDefaultProps = {
  data: [],
  nameKey: "name",
  dataKey: "value",
  cx: "50%",
  cy: "50%",
  outerRadius: "80%",
  innerRadius: "0%",
  label: false,
  labelLine: false,
  isAnimationActive: true,
  stroke: "none",
  style: {
    fontSize: 12,
  },
}

type PieChartProps = Omit<
  React.ComponentProps<typeof RechartsPieChart>,
  "data"
> & {
  data: unknown[]
  config: ChartConfig
  showLegend?: boolean
  showTooltip?: boolean
  nameKey?: string
  dataKey?: string
  innerRadius?: string | number
  outerRadius?: string | number
  label?: any
  labelLine?: any
}

const PieChart = React.forwardRef<
  React.ElementRef<typeof RechartsPieChart>,
  PieChartProps
>(
  (
    {
      className,
      data,
      config,
      showLegend = true,
      showTooltip = true,
      nameKey,
      dataKey,
      innerRadius,
      outerRadius,
      label,
      labelLine,
      ...props
    },
    ref
  ) => {
    return (
      <ChartContainer
        config={config}
        className={cn("h-full w-full", className)}
      >
        <RechartsPieChart ref={ref} {...pieChartDefaultProps} {...props}>
          {showTooltip && (
            <ChartTooltip content={<ChartTooltipContent hideIndicator />} />
          )}

          <Pie
            data={data}
            nameKey={nameKey || pieChartDefaultProps.nameKey}
            dataKey={dataKey || pieChartDefaultProps.dataKey}
            innerRadius={innerRadius !== undefined ? innerRadius : pieChartDefaultProps.innerRadius}
            outerRadius={outerRadius !== undefined ? outerRadius : pieChartDefaultProps.outerRadius}
            label={label !== undefined ? label : pieChartDefaultProps.label}
            labelLine={labelLine !== undefined ? labelLine : pieChartDefaultProps.labelLine}
          >
            {Object.entries(config).map(([key, config], i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
              <Sector key={i} name={key} />
            ))}
          </Pie>

          {showLegend && <ChartLegend content={<ChartLegendContent />} />}
        </RechartsPieChart>
      </ChartContainer>
    )
  }
)
PieChart.displayName = "PieChart"

export { PieChart }
