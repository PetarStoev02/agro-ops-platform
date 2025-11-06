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

// Schema for field inspection form
const getFieldInspectionSchema = (t: (msg: string) => string) =>
  z.object({
    startDate: z.date({
      message: t("Start date is required"),
    }),
    surveyedArea: z
      .number()
      .min(0.01, t("Surveyed area must be greater than 0")),
    attackedArea: z.number().min(0, t("Attacked area must be 0 or positive")),
    damage: z.string().min(1, t("Damage is required")),
    damageType: z.string().min(1, t("Damage type is required")),
    attackDensity: z.string().min(1, t("Attack density is required")),
    phenologicalPhase: z.string().optional(),
  });

type FieldInspectionFormData = z.infer<
  ReturnType<typeof getFieldInspectionSchema>
>;

interface FieldInspectionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  fieldId?: Id<"fields">;
  initialData?: Partial<FieldInspectionFormData> & {
    activityId?: Id<"activities">;
  };
}

export function FieldInspectionForm({
  open,
  onOpenChange,
  onSuccess,
  fieldId,
  initialData,
}: FieldInspectionFormProps) {
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

  const isEditMode = !!initialData?.activityId;

  const form = useForm<FieldInspectionFormData>({
    resolver: zodResolver(getFieldInspectionSchema(t)),
    defaultValues: {
      startDate: initialData?.startDate
        ? new Date(initialData.startDate)
        : new Date(),
      surveyedArea: initialData?.surveyedArea ?? 0,
      attackedArea: initialData?.attackedArea ?? 0,
      damage: initialData?.damage || "",
      damageType: initialData?.damageType || "",
      attackDensity: initialData?.attackDensity || "",
      phenologicalPhase: initialData?.phenologicalPhase || "",
    },
  });

  const onSubmit = async (data: FieldInspectionFormData) => {
    if (!convexOrg?._id || !user?.id) {
      toast.error(i18n._("Organization or user not found"));
      return;
    }

    try {
      if (isEditMode && initialData?.activityId) {
        await updateActivity({
          activityId: initialData.activityId,
          category: "field_inspection",
          type: "field_inspection",
          date: data.startDate.getTime(),
          startDate: data.startDate.getTime(),
          surveyedArea: data.surveyedArea,
          attackedArea: data.attackedArea,
          damage: data.damage,
          damageType: data.damageType,
          attackDensity: data.attackDensity,
          phenologicalPhase: data.phenologicalPhase,
          fieldId: fieldId,
        });
        toast.success(i18n._("Field inspection updated successfully"));
      } else {
        await createActivity({
          organizationId: convexOrg._id,
          fieldId: fieldId,
          category: "field_inspection",
          type: "field_inspection",
          date: data.startDate.getTime(),
          userId: user.id,
          startDate: data.startDate.getTime(),
          surveyedArea: data.surveyedArea,
          attackedArea: data.attackedArea,
          damage: data.damage,
          damageType: data.damageType,
          attackDensity: data.attackDensity,
          phenologicalPhase: data.phenologicalPhase,
        });
        toast.success(i18n._("Field inspection created successfully"));
      }

      form.reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : i18n._("Failed to save field inspection");
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
              <Trans
                id="Edit Field Inspection"
                message="Edit Field Inspection"
              />
            ) : (
              <Trans id="Add Field Inspection" message="Add Field Inspection" />
            )}
          </DialogTitle>
          <DialogDescription>
            {isEditMode ? (
              <Trans
                id="Update the field inspection information below."
                message="Update the field inspection information below."
              />
            ) : (
              <Trans
                id="Fill in the required information to record a field inspection."
                message="Fill in the required information to record a field inspection."
              />
            )}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="surveyedArea"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <Trans
                        id="Surveyed Area (dka)"
                        message="Surveyed Area (dka)"
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
                name="attackedArea"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <Trans
                        id="Attacked Area (dka)"
                        message="Attacked Area (dka)"
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
              name="damage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    <Trans id="Damage" message="Damage" />{" "}
                    <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder={i18n._("Type of damage")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="damageType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    <Trans id="Damage Type" message="Damage Type" />{" "}
                    <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder={i18n._("Type of damage")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="attackDensity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    <Trans
                      id="Attack Density/Degree"
                      message="Attack Density/Degree"
                    />{" "}
                    <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={i18n._("Density or degree of attack")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phenologicalPhase"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    <Trans
                      id="Phenological Phase"
                      message="Phenological Phase"
                    />
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={i18n._("Phenological phase")}
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
