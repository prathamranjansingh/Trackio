// TypeScript module augmentation to make Recharts types compatible with our usage.
// This avoids touching component source files while fixing type errors.
declare module "recharts" {
  // Declare commonly used component exports to satisfy type lookups
  // Use any to avoid strict coupling to specific Recharts versions.
  export const ResponsiveContainer: any
  export const Tooltip: any
  export const Legend: any

  // Augment TooltipProps to include payload and label with permissive types
  // Recharts generics vary across versions; keep defaults broad.
  interface TooltipProps<ValueType = any, NameType = any> {
    payload?: any[]
    label?: any
  }

  // Ensure LegendProps exposes a payload array and verticalAlign prop we pick from.
  interface LegendProps {
    payload?: any[]
    verticalAlign?: any
  }
}


