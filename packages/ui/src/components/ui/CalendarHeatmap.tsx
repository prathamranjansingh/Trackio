"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker, DayPickerProps } from "react-day-picker"

import { cn } from "lib/utils"
import { buttonVariants } from "@/components/ui/button"

// ----------------- Utility Types -----------------
type UnionKeys<T> = T extends T ? keyof T : never
type Expand<T> = T extends T ? { [K in keyof T]: T[K] } : never
type OneOf<T extends {}[]> = {
  [K in keyof T]: Expand<
    T[K] & Partial<Record<Exclude<UnionKeys<T[number]>, keyof T[K]>, never>>
  >
}[number]

// ----------------- Core Types -----------------
export type Classname = string
export type WeightedDateEntry = {
  date: Date
  weight: number
}

interface IDatesPerVariant {
  datesPerVariant: Date[][]
}
interface IWeightedDatesEntry {
  weightedDates: WeightedDateEntry[]
}

type VariantDatesInput = OneOf<[IDatesPerVariant, IWeightedDatesEntry]>

export type CalendarProps = React.ComponentProps<typeof DayPicker> & {
  variantClassnames: Classname[]
} & VariantDatesInput

// ----------------- Utility Functions -----------------
function useModifiers(
  variantClassnames: Classname[],
  datesPerVariant: Date[][]
): [Record<string, Date[]>, Record<string, string>] {
  const noOfVariants = variantClassnames.length

  const variantLabels = Array.from({ length: noOfVariants }, (_, idx) => `__variant${idx}`)

  const modifiers: Record<string, Date[]> = {}
  const modifiersClassNames: Record<string, string> = {}

  variantLabels.forEach((key, index) => {
    modifiers[key] = datesPerVariant[index] ?? [] // ✅ no undefined
    modifiersClassNames[key] = variantClassnames[index] ?? "" // ✅ fixed undefined → string
  })

  return [modifiers, modifiersClassNames]
}


function categorizeDatesPerVariant(
  weightedDates: WeightedDateEntry[],
  noOfVariants: number
): Date[][] {
  if (!weightedDates || weightedDates.length === 0) {
    return Array.from({ length: noOfVariants }, () => [])
  }

  const sortedEntries = [...weightedDates].sort((a, b) => a.weight - b.weight)
  const categorizedRecord: Date[][] = Array.from({ length: noOfVariants }, () => [])

  const minNumber = sortedEntries[0]?.weight ?? 0
  const maxNumber = sortedEntries[sortedEntries.length - 1]?.weight ?? 0
  const range = minNumber === maxNumber ? 1 : (maxNumber - minNumber) / noOfVariants

  sortedEntries.forEach((entry) => {
    const category = Math.min(
      Math.floor((entry.weight - minNumber) / range),
      noOfVariants - 1
    )
    categorizedRecord[category]?.push(entry.date)
  })

  return categorizedRecord
}

// ----------------- Main Component -----------------
function CalendarHeatmap({
  variantClassnames,
  datesPerVariant,
  weightedDates,
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  const noOfVariants = variantClassnames.length

  const weighted = weightedDates ?? []
  const dates = datesPerVariant ?? categorizeDatesPerVariant(weighted, noOfVariants)

  const [modifiers, modifiersClassNames] = useModifiers(variantClassnames, dates)

  return (
    <DayPicker
      modifiers={modifiers}
      modifiersClassNames={modifiersClassNames}
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell:
          "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
        ),
        day_range_end: "day-range-end",
        // day_selected:
        //   "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside:
          "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ...props }) => <ChevronLeft className="h-4 w-4" />,
        IconRight: ({ ...props }) => <ChevronRight className="h-4 w-4" />,
      }}
      {...props}
    />
  )
}

CalendarHeatmap.displayName = "CalendarHeatmap"

export { CalendarHeatmap }
