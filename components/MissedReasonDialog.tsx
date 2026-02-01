"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface MissedReasonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (reason: string) => void;
  onSkip: () => void;
}

const reasons = ["Forgot", "Busy", "Tired", "Low Motivation"];

export function MissedReasonDialog({ open, onOpenChange, onSave, onSkip }: MissedReasonDialogProps) {
  const [selectedReason, setSelectedReason] = useState("");
  const [otherReason, setOtherReason] = useState("");

  useEffect(() => {
    if (open) {
      setSelectedReason("");
      setOtherReason("");
    }
  }, [open]);

  const handleSave = () => {
    const reasonToSave = selectedReason === "Other" ? otherReason.trim() : selectedReason;
    if (reasonToSave) {
      onSave(reasonToSave);
    }
  };

  const handleSkip = () => {
    onSkip();
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Why was this habit missed?</DialogTitle>
          <DialogDescription>
            Optionally select a reason. This sets completion to 0% and helps provide insights.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <RadioGroup value={selectedReason} onValueChange={setSelectedReason}>
            {reasons.map((reason) => (
              <div key={reason} className="flex items-center space-x-2">
                <RadioGroupItem value={reason} id={`reason-${reason}`} />
                <Label htmlFor={`reason-${reason}`} className="font-normal cursor-pointer">{reason}</Label>
              </div>
            ))}
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Other" id="reason-other" />
              <Label htmlFor="reason-other" className="font-normal cursor-pointer">Other</Label>
            </div>
          </RadioGroup>
          {selectedReason === "Other" && (
            <Input
              placeholder="Please specify"
              value={otherReason}
              onChange={(e) => setOtherReason(e.target.value)}
              className="mt-2"
            />
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={handleSkip}>Skip (mark as missed)</Button>
          <Button onClick={handleSave} disabled={!selectedReason || (selectedReason === 'Other' && !otherReason.trim())}>Save Reason</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
