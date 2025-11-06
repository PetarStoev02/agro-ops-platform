"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { useOrganization, useUser } from "@clerk/nextjs";
import { Trans } from "@lingui/react";
import { useLingui } from "@lingui/react";
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
import { Calendar } from "@/src/shared/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/shared/components/ui/popover";
import { toast } from "sonner";
import { useSyncOrganization } from "@/src/shared/hooks/use-sync-organization";
import { cn } from "@/src/shared/lib/utils";

// Schema for farm activity form
const getFarmActivitySchema = (t: (msg: string) => string) =>
  z
    .object({
      startDate: z.date({
        message: t("Start date is required"),
      }),
      endDate: z.date({
        message: t("End date is required"),
      }),
      activityType: z.string().min(1, t("Activity type is required")),
      treatedArea: z
        .number()
        .min(0.01, t("Treated area must be greater than 0")),
      materialType: z.string().optional(),
      quantity: z.string().optional(),
    })
    .refine((data) => data.endDate >= data.startDate, {
      message: t("End date must be after or equal to start date"),
      path: ["endDate"],
    });

type FarmActivityFormData = z.infer<ReturnType<typeof getFarmActivitySchema>>;

interface FarmActivityFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  fieldId?: Id<"fields">;
  initialData?: Partial<FarmActivityFormData> & {
    activityId?: Id<"activities">;
  };
}

export function FarmActivityForm({
  open,
  onOpenChange,
  onSuccess,
  fieldId,
  initialData,
}: FarmActivityFormProps) {
  const { organization } = useOrganization();
  const { user } = useUser();
  const { isSyncing } = useSyncOrganization();
  const createActivity = useMutation(api.activities.create);
  const updateActivity = useMutation(api.activities.update);
  const { i18n } = useLingui();
  const t = (msg: string) => i18n._(msg);

  const convexOrg = useQuery(
    api.organizations.getByClerkOrgId,
    organization?.id ? { clerkOrgId: organization.id } : "skip",
  );

  const field = useQuery(api.fields.getById, fieldId ? { fieldId } : "skip");

  const isEditMode = !!initialData?.activityId;

  const form = useForm<FarmActivityFormData>({
    resolver: zodResolver(getFarmActivitySchema(t)),
    defaultValues: {
      startDate: initialData?.startDate
        ? new Date(initialData.startDate)
        : new Date(),
      endDate: initialData?.endDate
        ? new Date(initialData.endDate)
        : new Date(),
      activityType: initialData?.activityType || "",
      treatedArea: initialData?.treatedArea ?? field?.area ?? 0,
      materialType: initialData?.materialType || "",
      quantity: initialData?.quantity || "",
    },
  });

  const onSubmit = async (data: FarmActivityFormData) => {
    if (!convexOrg?._id || !user?.id) {
      toast.error(i18n._("Organization or user not found"));
      return;
    }

    try {
      if (isEditMode && initialData?.activityId) {
        await updateActivity({
          activityId: initialData.activityId,
          category: "farm_activity",
          type: "farm_activity",
          date: data.startDate.getTime(),
          startDate: data.startDate.getTime(),
          endDate: data.endDate.getTime(),
          activityType: data.activityType,
          treatedArea: data.treatedArea,
          materialType: data.materialType,
          quantity: data.quantity,
          fieldId: fieldId,
        });
        toast.success(i18n._("Farm activity updated successfully"));
      } else {
        await createActivity({
          organizationId: convexOrg._id,
          fieldId: fieldId,
          category: "farm_activity",
          type: "farm_activity",
          date: data.startDate.getTime(),
          userId: user.id,
          startDate: data.startDate.getTime(),
          endDate: data.endDate.getTime(),
          activityType: data.activityType,
          treatedArea: data.treatedArea,
          materialType: data.materialType,
          quantity: data.quantity,
        });
        toast.success(i18n._("Farm activity created successfully"));
      }

      form.reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : i18n._("Failed to save farm activity");
      toast.error(message);
    }
  };

  const isLoading = isSyncing || !convexOrg;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? (
              <Trans id="Edit Farm Activity" message="Edit Farm Activity" />
            ) : (
              <Trans id="Add Farm Activity" message="Add Farm Activity" />
            )}
          </DialogTitle>
          <DialogDescription>
            {isEditMode ? (
              <Trans
                id="Update the farm activity information below."
                message="Update the farm activity information below."
              />
            ) : (
              <Trans
                id="Fill in the required information to record a farm activity."
                message="Fill in the required information to record a farm activity."
              />
            )}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>
                      <Trans id="Start Date" message="Start Date" />{" "}
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
                name="endDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>
                      <Trans id="End Date" message="End Date" />{" "}
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
            </div>

            <FormField
              control={form.control}
              name="activityType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    <Trans id="Activity Type" message="Activity Type" />{" "}
                    <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={i18n._("SOWING, HARVESTING, etc.")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="treatedArea"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    <Trans
                      id="Processed Area (dka)"
                      message="Processed Area (dka)"
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
              name="materialType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    <Trans id="Material Type" message="Material Type" />
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={i18n._("Type of Fertilizers, Seeds, PPP")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    <Trans
                      id="Quantity (kg./l./dka.)"
                      message="Quantity (kg./l./dka.)"
                    />
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={i18n._("10 pieces/dka or 10 kg/dka")}
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
              <Button type="submit" disabled={isLoading}>
                <Trans id="Continue" message="Continue" />
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
