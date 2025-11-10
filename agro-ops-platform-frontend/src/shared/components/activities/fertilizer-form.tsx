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

// Schema for fertilizer form
const getFertilizerSchema = (t: (msg: string) => string) =>
  z
    .object({
      date: z.date({
        message: t("Date is required"),
      }),
      fertilizerId: z.string().min(1, t("Fertilizer is required")),
      dose: z.number().min(0, t("Dose must be positive")),
      fertilizedArea: z
        .number()
        .min(0.01, t("Fertilized area must be greater than 0")),
      fertilizerType: z.string().optional(),
    })
    .refine(
      (_data) => {
        // This will be validated on the backend
        return true;
      },
      {
        message: t("Insufficient quantity in storage"),
        path: ["fertilizerId"],
      },
    );

type FertilizerFormData = z.infer<ReturnType<typeof getFertilizerSchema>>;

interface FertilizerFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  fieldId?: Id<"fields">;
  cropType?: string;
  initialData?: Partial<FertilizerFormData> & { activityId?: Id<"activities"> };
}

export function FertilizerForm({
  open,
  onOpenChange,
  onSuccess,
  fieldId,
  cropType,
  initialData,
}: FertilizerFormProps) {
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

  const availableFertilizers = useQuery(
    api.activities.getAvailableFertilizers,
    convexOrg?._id && cropType
      ? { organizationId: convexOrg._id, cropType }
      : convexOrg?._id
        ? { organizationId: convexOrg._id }
        : "skip",
  );

  const field = useQuery(api.fields.getById, fieldId ? { fieldId } : "skip");

  const isEditMode = !!initialData?.activityId;

  const form = useForm<FertilizerFormData>({
    resolver: zodResolver(getFertilizerSchema(t)),
    defaultValues: {
      date: initialData?.date ? new Date(initialData.date) : new Date(),
      fertilizerId: initialData?.fertilizerId || "",
      dose: initialData?.dose ?? 0,
      fertilizedArea: initialData?.fertilizedArea ?? field?.area ?? 0,
      fertilizerType: initialData?.fertilizerType || "",
    },
  });

  // Watch for changes to calculate required quantity
  const selectedFertilizerId = form.watch("fertilizerId");
  const dose = form.watch("dose");
  const fertilizedArea = form.watch("fertilizedArea");

  // Get selected fertilizer details
  const selectedFertilizer = React.useMemo(() => {
    if (!selectedFertilizerId || !availableFertilizers) return null;
    return availableFertilizers.find((f) => f._id === selectedFertilizerId);
  }, [selectedFertilizerId, availableFertilizers]);

  // Calculate required quantity and validate
  const requiredQuantity = React.useMemo(() => {
    if (!dose || !fertilizedArea || !selectedFertilizer) return 0;
    return dose * fertilizedArea;
  }, [dose, fertilizedArea, selectedFertilizer]);

  // Validate quantity availability
  React.useEffect(() => {
    if (selectedFertilizer && requiredQuantity > 0) {
      if (requiredQuantity > selectedFertilizer.quantity) {
        form.setError("fertilizerId", {
          type: "manual",
          message: i18n._("Insufficient quantity available"),
        });
      } else {
        form.clearErrors("fertilizerId");
      }
    }
  }, [selectedFertilizer, requiredQuantity, form, i18n]);

  const onSubmit = async (data: FertilizerFormData) => {
    if (!convexOrg?._id || !user?.id) {
      toast.error(i18n._("Organization or user not found"));
      return;
    }

    if (!selectedFertilizer) {
      toast.error(i18n._("Please select a fertilizer"));
      return;
    }

    // Final quantity check
    if (requiredQuantity > selectedFertilizer.quantity) {
      toast.error(i18n._("Insufficient quantity available"));
      return;
    }

    try {
      if (isEditMode && initialData?.activityId) {
        await updateActivity({
          activityId: initialData.activityId,
          category: "fertilizer",
          type: "fertilizer",
          date: data.date.getTime(),
          fertilizerId: data.fertilizerId as Id<"inventory">,
          fertilizerName: selectedFertilizer.name,
          dose: data.dose,
          fertilizedArea: data.fertilizedArea,
          fertilizerType: data.fertilizerType,
          fieldId: fieldId,
        });
        toast.success(i18n._("Fertilizer application updated successfully"));
      } else {
        await createActivity({
          organizationId: convexOrg._id,
          fieldId: fieldId,
          category: "fertilizer",
          type: "fertilizer",
          date: data.date.getTime(),
          userId: user.id,
          fertilizerId: data.fertilizerId as Id<"inventory">,
          fertilizerName: selectedFertilizer.name,
          dose: data.dose,
          fertilizedArea: data.fertilizedArea,
          fertilizerType: data.fertilizerType,
        });
        toast.success(i18n._("Fertilizer application created successfully"));
      }

      form.reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : i18n._("Failed to save fertilizer application");
      toast.error(message);
    }
  };

  const isLoading = isSyncing || !convexOrg;

  const hasNoFertilizers =
    availableFertilizers && availableFertilizers.length === 0;
  const hasNoFertilizersForCrop = cropType && hasNoFertilizers;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? (
              <Trans
                id="Edit Fertilizer Application"
                message="Edit Fertilizer Application"
              />
            ) : (
              <Trans
                id="Add Fertilizer Application"
                message="Add Fertilizer Application"
              />
            )}
          </DialogTitle>
          <DialogDescription>
            {isEditMode ? (
              <Trans
                id="Update the fertilizer application information below."
                message="Update the fertilizer application information below."
              />
            ) : (
              <Trans
                id="Fill in the required information to record a fertilizer application."
                message="Fill in the required information to record a fertilizer application."
              />
            )}
          </DialogDescription>
        </DialogHeader>

        {hasNoFertilizersForCrop && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangleIcon className="h-4 w-4" />
            <AlertTitle>
              <Trans
                id="No available fertilizers"
                message="No available fertilizers"
              />
            </AlertTitle>
            <AlertDescription>
              <Trans
                id="You do not have any fertilizers applicable to {cropType} in your warehouse. Please navigate to your warehouse and add the necessary fertilizers."
                message="You do not have any fertilizers applicable to {cropType} in your warehouse. Please navigate to your warehouse and add the necessary fertilizers."
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
              name="fertilizerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    <Trans id="Fertilizer" message="Fertilizer" />{" "}
                    <span className="text-destructive">*</span>
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                    disabled={hasNoFertilizers}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={i18n._("Select fertilizer")}
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableFertilizers?.map((fertilizer) => (
                        <SelectItem key={fertilizer._id} value={fertilizer._id}>
                          {fertilizer.name} ({fertilizer.quantity}{" "}
                          {fertilizer.unit})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedFertilizer && requiredQuantity > 0 && (
                    <p className="text-sm text-muted-foreground mt-1">
                      <Trans
                        id="Required: {quantity} {unit}"
                        message="Required: {quantity} {unit}"
                        values={{
                          quantity: requiredQuantity.toFixed(2),
                          unit: selectedFertilizer.unit,
                        }}
                      />
                    </p>
                  )}
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
                      <Trans id="Dose (per dka)" message="Dose (per dka)" />{" "}
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
                name="fertilizedArea"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <Trans
                        id="Fertilized Area (dka)"
                        message="Fertilized Area (dka)"
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
            </div>

            <FormField
              control={form.control}
              name="fertilizerType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    <Trans id="Fertilizer Type" message="Fertilizer Type" />
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={i18n._("Type of fertilizer, seeds, PPP")}
                      {...field}
                    />
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
              <Button type="submit" disabled={isLoading || hasNoFertilizers}>
                <Trans id="Continue" message="Continue" />
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
