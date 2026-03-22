"use client"

import * as React from "react"
import {
  Legend,
  Line,
  Pie,
  Tooltip,
  ResponsiveContainer,
  TooltipProps,
} from "recharts"
import { NameType, ValueType } from "recharts/types/component/DefaultTooltipContent"

import { cn } from "@/lib/utils"

// #region Chart Types
export type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode
    icon?: React.ComponentType
    color?: string
  }
}

interface ChartContextProps {
  config: ChartConfig
}
// #endregion

// #region Chart Context
const ChartContext = React.createContext<ChartContextProps | null>(null)

function useChart() {
  const context = React.useContext(ChartContext)

  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer>")
  }

  return context
}
// #endregion

const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    config: ChartConfig
    children: React.ReactElement
  }
>(({ config, children, className, ...props }, ref) => {
  const chartId = React.useId()

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-chart={chartId}
        ref={ref}
        className={cn(
          "flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line]:stroke-border/50",
          className
        )}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <ResponsiveContainer>{children}</ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  )
})
ChartContainer.displayName = "ChartContainer"

// #region Chart Components
const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
  const style = React.useMemo(() => {
    return Object.entries(config)
      .map(([key, itemConfig]) => {
        const color = itemConfig.color ?? "hsl(var(--primary))"
        return `
[data-chart=${id}] .recharts-bar[name="${key}"],
[data-chart=${id}] .recharts-line[name="${key}"],
[data-chart=${id}] .recharts-area[name="${key}"],
[data-chart=${id}] .recharts-pie-sector[name="${key}"] {
  --color: ${color};
  fill: var(--color);
  stroke: var(--color);
}
[data-chart=${id}] .recharts-dot[name="${key}"] {
  fill: var(--color);
}
[data-chart=${id}] .recharts-tooltip-cursor {
  stroke: hsl(var(--border));
}
`
      })
      .join("\n")
  }, [id, config])

  return <style dangerouslySetInnerHTML={{ __html: style }} />
}

const ChartTooltip = Tooltip

const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  TooltipProps<ValueType, NameType> & {
    className?: string
    hideIndicator?: boolean
    hideLabel?: boolean
  }
>(({ active, payload, className, hideIndicator, hideLabel }, ref) => {
  const { config } = useChart()

  if (!active || !payload || payload.length === 0) {
    return null
  }

  return (
    <div
      ref={ref}
      className={cn(
        "grid min-w-32 items-start gap-1.5 rounded-lg border bg-background/95 p-2.5 text-sm shadow-xl",
        className
      )}
    >
      {!hideLabel && (
        <div className="font-medium">{payload[0].payload.date || payload[0].payload.name}</div>
      )}
      <div className="grid gap-1.5">
        {payload.map((item, index) => {
          const key = `${item.dataKey || item.name}`
          const itemConfig = config[key]
          const color = item.color || itemConfig?.color

          // Tự động thêm đơn vị và tỷ lệ phần trăm
          const unit = key === 'calories' ? ' kcal' : 
                       ['protein', 'carbs', 'fat', 'fiber'].includes(key) ? ' g' : 
                       key === 'duration' ? ' h' : '';
          
          const percentage = item.payload.percent 
            ? ` (${Number((item.payload.percent * 100).toFixed(1))}%)` 
            : '';

          return (
            <div
              key={index}
              className="flex items-center gap-2"
            >
              {!hideIndicator && (
                <div
                  className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                  style={{
                    backgroundColor: color,
                  }}
                />
              )}
              <div className="flex flex-1 justify-between gap-4">
                <p className="text-muted-foreground">{itemConfig?.label || item.name}</p>
                <p className="font-mono font-bold">
                  {item.value?.toString()}{unit}{percentage}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
})
ChartTooltipContent.displayName = "ChartTooltipContent"

const ChartLegend = Legend

const ChartLegendContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> &
    Pick<React.ComponentProps<typeof Legend>, "payload" | "verticalAlign">
>(({ className, payload, verticalAlign }, ref) => {
  const { config } = useChart()

  if (!payload) {
    return null
  }

  return (
    <div
      ref={ref}
      className={cn(
        "flex items-center justify-center gap-4",
        verticalAlign === "top" ? "pb-3" : "pt-3",
        className
      )}
    >
      {payload.map((item) => {
        const key = `${item.value}`
        const itemConfig = config[key]

        return (
          <div
            key={item.value}
            className="flex items-center gap-1.5"
          >
            <div
              className="h-2 w-2 shrink-0 rounded-[2px]"
              style={{
                backgroundColor: item.color,
              }}
            />
            <p className="text-muted-foreground">{itemConfig?.label}</p>
          </div>
        )
      })}
    </div>
  )
})
ChartLegendContent.displayName = "ChartLegendContent"

// #endregion

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
}
