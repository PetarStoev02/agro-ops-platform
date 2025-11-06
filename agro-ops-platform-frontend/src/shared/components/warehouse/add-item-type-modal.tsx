"use client";

import * as React from "react";
import { Trans } from "@lingui/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/shared/components/ui/dialog";
import { Button } from "@/src/shared/components/ui/button";

interface AddItemTypeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectChemical: () => void;
  onSelectFertilizer: () => void;
}

export function AddItemTypeModal({
  open,
  onOpenChange,
  onSelectChemical,
  onSelectFertilizer,
}: AddItemTypeModalProps) {
  const handleChemicalClick = () => {
    onSelectChemical();
    onOpenChange(false);
  };

  const handleFertilizerClick = () => {
    onSelectFertilizer();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            <Trans id="Add Item" message="Add Item" />
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3 py-4">
          <Button
            onClick={handleChemicalClick}
            className="w-full"
            variant="default"
          >
            <Trans id="Chemical" message="Chemical" />
          </Button>
          <Button
            onClick={handleFertilizerClick}
            className="w-full"
            variant="default"
          >
            <Trans id="Fertilizer" message="Fertilizer" />
          </Button>
          <Button
            onClick={() => onOpenChange(false)}
            className="w-full"
            variant="outline"
          >
            <Trans id="Back" message="Back" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
