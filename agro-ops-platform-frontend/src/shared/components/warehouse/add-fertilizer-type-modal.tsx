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

interface AddFertilizerTypeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectGranular: () => void;
  onSelectFoliar: () => void;
}

export function AddFertilizerTypeModal({
  open,
  onOpenChange,
  onSelectGranular,
  onSelectFoliar,
}: AddFertilizerTypeModalProps) {
  const handleGranularClick = () => {
    onSelectGranular();
    onOpenChange(false);
  };

  const handleFoliarClick = () => {
    onSelectFoliar();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            <Trans id="Add Fertilizer" message="Добавяне на тор" />
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3 py-4">
          <Button
            onClick={handleGranularClick}
            className="w-full"
            variant="default"
          >
            <Trans id="Granular" message="ГРАНУЛИРАН" />
          </Button>
          <Button
            onClick={handleFoliarClick}
            className="w-full"
            variant="default"
          >
            <Trans id="Foliar" message="ЛИСТЕН" />
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
