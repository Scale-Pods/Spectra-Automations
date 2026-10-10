"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
    className,
    classNames,
    showOutsideDays = true,
    ...props
}: CalendarProps) {
    return (
        <DayPicker
            showOutsideDays={showOutsideDays}
            className={cn("p-3 bg-white border border-slate-200 rounded-[16px]", className)}
            classNames={{
                months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                month: "space-y-4",
                caption: "flex justify-center pt-1 relative items-center",
                caption_label: "text-[14px] font-bold text-slate-900",
                nav: "space-x-1 flex items-center",
                nav_button: cn(
                    buttonVariants({ variant: "outline" }),
                    "h-7 w-7 bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900 p-0 rounded-lg shadow-sm flex items-center justify-center transition-all opacity-90 hover:opacity-100"
                ),
                nav_button_previous: "absolute left-1",
                nav_button_next: "absolute right-1",
                table: "w-full border-collapse space-y-1",
                head_row: "flex",
                head_cell:
                    "text-slate-500 rounded-[8px] w-8 font-semibold text-[12px]",
                row: "flex w-full mt-2",
                cell: cn(
                    "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-violet-50 first:[&:has([aria-selected])]:rounded-l-[8px] last:[&:has([aria-selected])]:rounded-r-[8px]",
                    props.mode === "range"
                        ? "[&:has(>.day-range-end)]:rounded-r-[8px] [&:has(>.day-range-start)]:rounded-l-[8px] first:[&:has([aria-selected])]:rounded-l-[8px] last:[&:has([aria-selected])]:rounded-r-[8px]"
                        : "[&:has([aria-selected])]:rounded-[8px]"
                ),
                day: cn(
                    buttonVariants({ variant: "ghost" }),
                    "h-8 w-8 p-0 font-medium text-slate-800 hover:bg-slate-100 hover:text-slate-900 aria-selected:opacity-100"
                ),
                day_range_start: "day-range-start",
                day_range_end: "day-range-end",
                day_selected:
                    "bg-violet-600 text-white hover:bg-violet-700 hover:text-white focus:bg-violet-600 focus:text-white font-bold shadow-sm",
                day_today: "bg-violet-100 text-violet-800 font-bold border border-violet-200",
                day_outside:
                    "day-outside text-slate-300 opacity-40 aria-selected:bg-slate-100 aria-selected:text-slate-400",
                day_disabled: "text-slate-300 opacity-40",
                day_range_middle:
                    "aria-selected:bg-violet-50 aria-selected:text-violet-900 font-medium",
                day_hidden: "invisible",
                ...classNames,
            }}
            components={{
                IconLeft: ({ ...props }) => <ChevronLeft className="h-4 w-4 text-slate-700 stroke-[2.5]" />,
                IconRight: ({ ...props }) => <ChevronRight className="h-4 w-4 text-slate-700 stroke-[2.5]" />,
            }}
            {...props}
        />
    )
}
Calendar.displayName = "Calendar"

export { Calendar }
