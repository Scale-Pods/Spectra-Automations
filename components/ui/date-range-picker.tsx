"use client"

import * as React from "react"
import { format, subDays, subMonths, subYears, startOfMonth, endOfMonth, startOfDay } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

export interface DateRangePickerProps extends React.HTMLAttributes<HTMLDivElement> {
    value?: DateRange;
    onUpdate?: (values: { range: DateRange | undefined, label?: string }) => void;
}

export function DateRangePicker({
    className,
    value,
    onUpdate,
    ...props
}: DateRangePickerProps) {
    const [date, setDate] = React.useState<DateRange | undefined>(value || {
        from: subDays(new Date(), 7),
        to: new Date(),
    })

    React.useEffect(() => {
        if (value) {
            setDate(value)
        }
    }, [value])

    const [tempDate, setTempDate] = React.useState<DateRange | undefined>(date)
    const [tempLabel, setTempLabel] = React.useState<string | undefined>("Last 7 days")
    const [open, setOpen] = React.useState(false)
    const [isMounted, setIsMounted] = React.useState(false)

    React.useEffect(() => {
        setIsMounted(true)
    }, [])

    React.useEffect(() => {
        if (open) {
            setTempDate(date)
        }
    }, [open, date])

    if (!isMounted) {
        return <div className={cn("grid gap-2 h-10 w-[260px] bg-[var(--fill-quaternary)] rounded-[10px] animate-pulse", className)}></div>
    }

    const presets = [
        {
            label: "Today",
            getValue: () => {
                const today = new Date();
                return { from: startOfDay(today), to: today };
            }
        },
        {
            label: "Last 7 days",
            getValue: () => {
                const today = new Date();
                return { from: startOfDay(subDays(today, 7)), to: today };
            }
        },
        {
            label: "Last 30 days",
            getValue: () => {
                const today = new Date();
                return { from: startOfDay(subDays(today, 30)), to: today };
            }
        },
        {
            label: "This Month",
            getValue: () => {
                const today = new Date();
                return { from: startOfDay(startOfMonth(today)), to: endOfMonth(today) };
            }
        },
        {
            label: "Last 3 Months",
            getValue: () => {
                const today = new Date();
                return { from: startOfDay(subMonths(today, 3)), to: today };
            }
        },
        {
            label: "Last 6 Months",
            getValue: () => {
                const today = new Date();
                return { from: startOfDay(subMonths(today, 6)), to: today };
            }
        },
        {
            label: "Last 1 year",
            getValue: () => {
                const today = new Date();
                return { from: startOfDay(subYears(today, 1)), to: today };
            }
        },
    ];

    const handlePresetChange = (value: string) => {
        const preset = presets.find(p => p.label === value);
        if (preset) {
            setTempDate(preset.getValue());
            setTempLabel(value);
        }
    };

    const handleApply = () => {
        setDate(tempDate);
        setOpen(false);
        if (onUpdate) {
            onUpdate({ range: tempDate, label: tempLabel });
        }
    };

    const handleCancel = () => {
        setOpen(false);
    };

    const handleClear = () => {
        setDate(undefined);
        setTempDate(undefined);
        setTempLabel(undefined);
        setOpen(false);
        if (onUpdate) {
            onUpdate({ range: undefined, label: undefined });
        }
    };

    return (
        <div className={cn("grid gap-2", className)}>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        id="date"
                        variant={"outline"}
                        className={cn(
                            "w-[260px] justify-start text-left font-normal bg-white border border-slate-200 text-slate-800 hover:bg-slate-50 hover:text-slate-900 rounded-[10px] h-10 shadow-sm transition-all",
                            !date && "text-slate-400"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4 text-violet-600" />
                        {date?.from ? (
                            date.to ? (
                                <>
                                    {format(date.from, "LLL dd, y")} -{" "}
                                    {format(date.to, "LLL dd, y")}
                                </>
                            ) : (
                                format(date.from, "LLL dd, y")
                            )
                        ) : (
                            <span>Pick a date</span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-transparent border-none shadow-none z-50" align="end">
                    <div className="flex rounded-[20px] bg-white border border-slate-200/90 shadow-2xl overflow-hidden">
                        <div className="p-2.5 border-r border-slate-200 w-[165px] bg-slate-50/80">
                            <div className="space-y-1">
                                {presets.map((preset) => {
                                    const isSelected = tempLabel === preset.label;
                                    return (
                                        <Button
                                            key={preset.label}
                                            variant="ghost"
                                            className={cn(
                                                "w-full justify-start text-[13px] h-8 rounded-lg transition-all px-3 font-medium",
                                                isSelected
                                                    ? "bg-violet-600 text-white font-semibold hover:bg-violet-700 hover:text-white shadow-sm"
                                                    : "text-slate-700 hover:text-slate-900 hover:bg-slate-200/70"
                                            )}
                                            onClick={() => handlePresetChange(preset.label)}
                                        >
                                            {preset.label}
                                        </Button>
                                    );
                                })}
                                <div className="pt-2 mt-2 border-t border-slate-200">
                                    <Button
                                        variant="ghost"
                                        className={cn(
                                            "w-full justify-start text-[13px] h-8 rounded-lg transition-all px-3 font-medium",
                                            tempLabel === "Custom Range"
                                                ? "bg-violet-600 text-white font-semibold hover:bg-violet-700 hover:text-white shadow-sm"
                                                : "text-slate-700 hover:text-slate-900 hover:bg-slate-200/70"
                                        )}
                                        onClick={() => setTempLabel("Custom Range")}
                                    >
                                        Custom Range
                                    </Button>
                                </div>
                            </div>
                        </div>
                        <div className="p-1 bg-white">
                            <Calendar
                                initialFocus
                                mode="range"
                                defaultMonth={tempDate?.from}
                                selected={tempDate}
                                onSelect={(val) => {
                                    setTempDate(val);
                                    setTempLabel("Custom Range");
                                }}
                                numberOfMonths={2}
                            />
                        </div>
                    </div>
                    <div className="p-3 flex items-center justify-end gap-2 mt-1.5 rounded-[16px] bg-white shadow-xl border border-slate-200">
                        <Button variant="ghost" size="sm" onClick={handleClear} className="h-8 px-4 text-rose-600 hover:bg-rose-50 hover:text-rose-700 mr-auto font-medium rounded-lg">
                            Clear
                        </Button>
                        <Button variant="ghost" size="sm" onClick={handleCancel} className="h-8 px-4 text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium rounded-lg">
                            Cancel
                        </Button>
                        <Button size="sm" onClick={handleApply} className="h-8 px-4 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-lg shadow-sm">
                            Apply
                        </Button>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    )
}
