"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon, AlertTriangleIcon } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { useOrganization, useUser } from "@clerk/nextjs";
import { Trans } from "@lingui/react";
import { useLingui } from "@lingui/react";
import { useNavigate } from "@tanstack/react-router";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/src/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/shared/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/src/shared/components/ui/form";
import { Input } from "@/src/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/shared/components/ui/select";
import { Combobox } from "@/src/shared/components/ui/combobox";
import { Calendar } from "@/src/shared/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/shared/components/ui/popover";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/src/shared/components/ui/alert";
import { toast } from "sonner";
import { useSyncOrganization } from "@/src/shared/hooks/use-sync-organization";
import { cn } from "@/src/shared/lib/utils";

// Schema for chemical treatment form
const getChemicalTreatmentSchema = (t: (msg: string) => string) =>
  z
    .object({
      date: z.date({
        message: t("Date is required"),
      }),
      allowedChemicalId: z.string().min(1, t("Chemical is required")),
      chemicalId: z.string().optional(), // Optional inventory reference
      infestationType: z.string().min(1, t("Infestation type is required")),
      dose: z.number().min(0, t("Dose must be positive")),
      quarantinePeriod: z
        .number()
        .min(0, t("Quarantine period must be 0 or positive")),
      treatedArea: z
        .number()
        .min(0.01, t("Treated area must be greater than 0")),
      equipment: z.string().min(1, t("Equipment is required")),
    })
    .refine(
      (_data) => {
        // This will be validated on the backend, but we can do a basic check here
        return true;
      },
      {
        message: t("Insufficient quantity in storage"),
        path: ["chemicalId"],
      },
    );

type ChemicalTreatmentFormData = z.infer<
  ReturnType<typeof getChemicalTreatmentSchema>
>;

interface ChemicalTreatmentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  fieldId?: Id<"fields">;
  cropType?: string;
  initialData?: Partial<ChemicalTreatmentFormData> & {
    activityId?: Id<"activities">;
  };
}

export function ChemicalTreatmentForm({
  open,
  onOpenChange,
  onSuccess,
  fieldId,
  cropType,
  initialData,
}: ChemicalTreatmentFormProps) {
  const { organization } = useOrganization();
  const { user } = useUser();
  const { isSyncing } = useSyncOrganization();
  const createActivity = useMutation(api.activities.create);
  const updateActivity = useMutation(api.activities.update);
  const navigate = useNavigate();
  const { i18n } = useLingui();
  const t = (msg: string) => i18n._(msg);

  const convexOrg = useQuery(
    api.organizations.getByClerkOrgId,
    organization?.id ? { clerkOrgId: organization.id } : "skip",
  );

  const availableChemicals = useQuery(
    api.activities.getAvailableChemicals,
    convexOrg?._id && cropType
      ? { organizationId: convexOrg._id, cropType }
      : convexOrg?._id
        ? { organizationId: convexOrg._id }
        : "skip",
  );

  // Query allowed chemicals from global registry
  const allowedChemicals = useQuery(api.chemicals.getPrimary);

  const field = useQuery(api.fields.getById, fieldId ? { fieldId } : "skip");

  const isEditMode = !!initialData?.activityId;

  const form = useForm<ChemicalTreatmentFormData>({
    resolver: zodResolver(getChemicalTreatmentSchema(t)),
    defaultValues: {
      date: initialData?.date ? new Date(initialData.date) : new Date(),
      allowedChemicalId: "",
      chemicalId: initialData?.chemicalId || "",
      infestationType: initialData?.infestationType || "",
      dose: initialData?.dose ?? 0,
      quarantinePeriod: initialData?.quarantinePeriod ?? 0,
      treatedArea: initialData?.treatedArea ?? field?.area ?? 0,
      equipment: initialData?.equipment || "",
    },
  });

  // Watch for changes to calculate required quantity
  const selectedChemicalId = form.watch("chemicalId");
  const selectedAllowedChemicalId = form.watch("allowedChemicalId");
  const dose = form.watch("dose");
  const treatedArea = form.watch("treatedArea");

  // Get selected allowed chemical details
  const selectedAllowedChemical = React.useMemo(() => {
    if (!selectedAllowedChemicalId || !allowedChemicals) return null;
    return allowedChemicals.find((c) => c._id === selectedAllowedChemicalId);
  }, [selectedAllowedChemicalId, allowedChemicals]);

  // Get selected inventory chemical details (for quantity validation)
  const selectedChemical = React.useMemo(() => {
    if (!selectedChemicalId || !availableChemicals) return null;
    return availableChemicals.find((c) => c._id === selectedChemicalId);
  }, [selectedChemicalId, availableChemicals]);

  // Auto-fill dose when allowed chemical is selected
  React.useEffect(() => {
    if (selectedAllowedChemical?.dose) {
      // Extract numeric value from dose string (e.g., "2.5 л/дка" -> 2.5)
      const doseMatch = selectedAllowedChemical.dose.match(/[\d.]+/);
      if (doseMatch) {
        const numericDose = parseFloat(doseMatch[0]);
        if (!isNaN(numericDose)) {
          form.setValue("dose", numericDose);
        }
      }
    }
  }, [selectedAllowedChemical, form]);

  // Calculate required quantity and validate (if inventory item is selected)
  const requiredQuantity = React.useMemo(() => {
    if (!dose || !treatedArea || !selectedChemical) return 0;
    return dose * treatedArea;
  }, [dose, treatedArea, selectedChemical]);

  // Validate quantity availability (only if inventory item is selected)
  React.useEffect(() => {
    if (selectedChemical && requiredQuantity > 0) {
      if (requiredQuantity > selectedChemical.quantity) {
        form.setError("chemicalId", {
          type: "manual",
          message: i18n._("Insufficient quantity available"),
        });
      } else {
        form.clearErrors("chemicalId");
      }
    }
  }, [selectedChemical, requiredQuantity, form, i18n]);

  const onSubmit = async (data: ChemicalTreatmentFormData) => {
    if (!convexOrg?._id || !user?.id) {
      toast.error(i18n._("Organization or user not found"));
      return;
    }

    if (!selectedAllowedChemical) {
      toast.error(i18n._("Please select a chemical"));
      return;
    }

    // Final quantity check (only if inventory item is selected)
    if (selectedChemical && requiredQuantity > selectedChemical.quantity) {
      toast.error(i18n._("Insufficient quantity available"));
      return;
    }

    try {
      if (isEditMode && initialData?.activityId) {
        await updateActivity({
          activityId: initialData.activityId,
          category: "chemical_treatment",
          type: "chemical_treatment",
          date: data.date.getTime(),
          chemicalId: data.chemicalId as Id<"inventory"> | undefined,
          chemicalName: selectedAllowedChemical.name,
          infestationType: data.infestationType,
          dose: data.dose,
          quarantinePeriod: data.quarantinePeriod,
          treatedArea: data.treatedArea,
          equipment: data.equipment,
          fieldId: fieldId,
        });
        toast.success(i18n._("Chemical treatment updated successfully"));
      } else {
        await createActivity({
          organizationId: convexOrg._id,
          fieldId: fieldId,
          category: "chemical_treatment",
          type: "chemical_treatment",
          date: data.date.getTime(),
          userId: user.id,
          chemicalId: data.chemicalId as Id<"inventory"> | undefined,
          chemicalName: selectedAllowedChemical.name,
          infestationType: data.infestationType,
          dose: data.dose,
          quarantinePeriod: data.quarantinePeriod,
          treatedArea: data.treatedArea,
          equipment: data.equipment,
        });
        toast.success(i18n._("Chemical treatment created successfully"));
      }

      form.reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : i18n._("Failed to save chemical treatment");
      toast.error(message);
    }
  };

  const isLoading = isSyncing || !convexOrg;

  const hasNoChemicals = availableChemicals && availableChemicals.length === 0;
  const hasNoChemicalsForCrop = cropType && hasNoChemicals;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? (
              <Trans
                id="Edit Chemical Treatment"
                message="Edit Chemical Treatment"
              />
            ) : (
              <Trans
                id="Add Chemical Treatment"
                message="Add Chemical Treatment"
              />
            )}
          </DialogTitle>
          <DialogDescription>
            {isEditMode ? (
              <Trans
                id="Update the chemical treatment information below."
                message="Update the chemical treatment information below."
              />
            ) : (
              <Trans
                id="Fill in the required information to record a chemical treatment."
                message="Fill in the required information to record a chemical treatment."
              />
            )}
          </DialogDescription>
        </DialogHeader>

        {hasNoChemicalsForCrop && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangleIcon className="h-4 w-4" />
            <AlertTitle>
              <Trans
                id="No available chemicals"
                message="No available chemicals"
              />
            </AlertTitle>
            <AlertDescription>
              <Trans
                id="You do not have any chemicals applicable to {cropType} in your warehouse. Please navigate to your warehouse and add the necessary chemicals."
                message="You do not have any chemicals applicable to {cropType} in your warehouse. Please navigate to your warehouse and add the necessary chemicals."
                values={{ cropType: cropType || "" }}
              />
              <Button
                variant="link"
                className="p-0 h-auto ml-1 underline"
                onClick={() => {
                  onOpenChange(false);
                  navigate({
                    to: "/$companySlug/warehouse",
                    params: { companySlug: organization?.slug || "" },
                  });
                }}
              >
                <Trans id="To warehouse" message="To warehouse" />
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>
                    <Trans id="Date" message="Date" />{" "}
                    <span className="text-destructive">*</span>
                  </FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground",
                          )}
                        >
                          {field.value ? (
                            format(field.value, "dd.MM.yyyy")
                          ) : (
                            <span>
                              <Trans id="Pick a date" message="Pick a date" />
                            </span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="allowedChemicalId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    <Trans id="Chemical" message="Chemical" />{" "}
                    <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Combobox
                      options={
                        allowedChemicals?.map((chemical) => ({
                          value: chemical._id,
                          label: chemical.name,
                          dose: chemical.dose,
                          dangerTypes: chemical.dangerTypes,
                        })) || []
                      }
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder={i18n._("Search and select chemical...")}
                      searchPlaceholder={i18n._("Search chemicals...")}
                      emptyMessage={i18n._("No chemicals found.")}
                      renderOption={(option) => (
                        <div className="flex flex-col">
                          <span>{option.label}</span>
                          {Array.isArray(option.dangerTypes) &&
                            option.dangerTypes.length > 0 && (
                              <span className="text-xs text-muted-foreground">
                                {option.dangerTypes.join(", ")}
                              </span>
                            )}
                        </div>
                      )}
                    />
                  </FormControl>
                  {selectedAllowedChemical && (
                    <p className="text-sm text-muted-foreground mt-1">
                      <Trans
                        id="Dose: {dose}"
                        message="Dose: {dose}"
                        values={{ dose: selectedAllowedChemical.dose }}
                      />
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="infestationType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    <Trans id="Infestation Type" message="Infestation Type" />{" "}
                    <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={i18n._("Type of infestation")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="dose"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <Trans id="Dose (l/dka)" message="Dose (l/dka)" />{" "}
                      <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0"
                        {...field}
                        onChange={(e) => {
                          const value = e.target.value;
                          field.onChange(value ? parseFloat(value) : 0);
                        }}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="quarantinePeriod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <Trans
                        id="Quarantine Period (0 = none)"
                        message="Quarantine Period (0 = none)"
                      />{" "}
                      <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="1"
                        placeholder="0"
                        {...field}
                        onChange={(e) => {
                          const value = e.target.value;
                          field.onChange(value ? parseInt(value, 10) : 0);
                        }}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="treatedArea"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    <Trans
                      id="Treated Area (dka)"
                      message="Treated Area (dka)"
                    />{" "}
                    <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="0"
                      {...field}
                      onChange={(e) => {
                        const value = e.target.value;
                        field.onChange(value ? parseFloat(value) : 0);
                      }}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="equipment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    <Trans id="Equipment" message="Equipment" />{" "}
                    <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder={i18n._("Equipment used")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                <Trans id="Cancel" message="Cancel" />
              </Button>
              <Button type="submit" disabled={isLoading || hasNoChemicals}>
                <Trans id="Continue" message="Continue" />
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
