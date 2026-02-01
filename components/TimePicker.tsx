"use client";

import React, { useEffect, useState } from "react";
import { Clock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FormControl } from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface TimePickerProps {
    field: {
        value?: string;
        onChange: (value: string) => void;
    };
}

export function TimePicker({ field }: TimePickerProps) {
    const [isOpen, setIsOpen] = useState(false);

    const [tempHour, setTempHour] = useState("09");
    const [tempMinute, setTempMinute] = useState("00");

    useEffect(() => {
        if (field.value && field.value.includes(':')) {
            const [h, m] = field.value.split(":");
            setTempHour(h);
            setTempMinute(m);
        } else {
            // Reset to default if value is cleared or invalid
            setTempHour("09");
            setTempMinute("00");
        }
    }, [field.value, isOpen]);

    const handleSetTime = () => {
        field.onChange(`${tempHour}:${tempMinute}`);
        setIsOpen(false);
    };

    const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"));
    const minutes = Array.from({ length: 60 / 5 }, (_, i) => (i * 5).toString().padStart(2, "0"));

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <FormControl>
                    <Button
                        variant="outline"
                        className={cn(
                            "w-full justify-start text-left font-normal",
                            !field.value && "text-muted-foreground"
                        )}
                    >
                        <Clock className="mr-2 h-4 w-4" />
                        {field.value ? field.value : <span>Pick a time</span>}
                    </Button>
                </FormControl>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
                <div className="flex items-center gap-2 p-2">
                    <Select onValueChange={setTempHour} value={tempHour}>
                        <SelectTrigger className="w-[80px]"><SelectValue /></SelectTrigger>
                        <SelectContent>{hours.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
                    </Select>
                    :
                    <Select onValueChange={setTempMinute} value={tempMinute}>
                        <SelectTrigger className="w-[80px]"><SelectValue /></SelectTrigger>
                        <SelectContent>{minutes.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                    </Select>
                </div>
                <div className="border-t p-2 flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => setIsOpen(false)}>Cancel</Button>
                    <Button size="sm" onClick={handleSetTime}>Set</Button>
                </div>
            </PopoverContent>
        </Popover>
    );
}
