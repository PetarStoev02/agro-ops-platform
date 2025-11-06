"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon, PlusIcon } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { useOrganization } from "@clerk/nextjs";
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
import { toast } from "sonner";
import { useSyncOrganization } from "@/src/shared/hooks/use-sync-organization";
import { CreateSeasonModal } from "./create-season-modal";
import { cn } from "@/src/shared/lib/utils";

// Schema will be created inside component to access i18n
const getCreateFieldSchema = (t: (msg: string) => string) =>
  z.object({
    name: z.string().min(1, t("Field name is required")),
    bzsNumber: z.string().min(1, t("BZS Number is required")),
    populatedPlace: z.string().min(1, t("Populated place is required")),
    landArea: z.string().min(1, t("Land area is required")),
    locality: z.string().min(1, t("Locality is required")),
    area: z.number().min(0, t("Area must be positive")),
    sowingDate: z.date().optional(),
    cropType: z.string().optional(),
    seasonId: z.string().optional(),
  });

type CreateFieldFormData = z.infer<ReturnType<typeof getCreateFieldSchema>>;

interface CreateFieldFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  initialData?: Partial<CreateFieldFormData> & { fieldId?: string };
}

export function CreateFieldForm({
  open,
  onOpenChange,
  onSuccess,
  initialData,
}: CreateFieldFormProps) {
  const { organization } = useOrganization();
  const { isSyncing } = useSyncOrganization();
  const createField = useMutation(api.fields.create);
  const updateField = useMutation(api.fields.update);
  const convexOrg = useQuery(
    api.organizations.getByClerkOrgId,
    organization?.id ? { clerkOrgId: organization.id } : "skip",
  );
  const seasons = useQuery(
    api.seasons.getByOrganization,
    convexOrg?._id ? { organizationId: convexOrg._id } : "skip",
  );

  const [showCreateSeason, setShowCreateSeason] = React.useState(false);
  const { i18n } = useLingui();
  const t = (msg: string) => i18n._(msg);

  const isEditMode = !!initialData?.fieldId;

  // Find the newest season (most recent startDate)
  const newestSeason = React.useMemo(() => {
    if (!seasons || seasons.length === 0) return null;
    return seasons.reduce((newest, season) => {
      if (!newest) return season;
      return season.startDate > newest.startDate ? season : newest;
    });
  }, [seasons]);

  const form = useForm<CreateFieldFormData>({
    resolver: zodResolver(getCreateFieldSchema(t)),
    defaultValues: {
      name: initialData?.name || "",
      bzsNumber: initialData?.bzsNumber || "",
      populatedPlace: initialData?.populatedPlace || "",
      landArea: initialData?.landArea || "",
      locality: initialData?.locality || "",
      area: initialData?.area || 0,
      sowingDate: initialData?.sowingDate
        ? new Date(initialData.sowingDate)
        : undefined,
      cropType: initialData?.cropType || "",
      seasonId: initialData?.seasonId || newestSeason?._id || "",
    },
  });

  React.useEffect(() => {
    if (initialData) {
      form.reset({
        name: initialData.name || "",
        bzsNumber: initialData.bzsNumber || "",
        populatedPlace: initialData.populatedPlace || "",
        landArea: initialData.landArea || "",
        locality: initialData.locality || "",
        area: initialData.area || 0,
        sowingDate: initialData.sowingDate
          ? new Date(initialData.sowingDate)
          : undefined,
        cropType: initialData.cropType || "",
        seasonId: initialData.seasonId || "",
      });
    } else if (!isEditMode && newestSeason) {
      // Pre-select newest season when creating a new field
      form.setValue("seasonId", newestSeason._id);
    }
  }, [initialData, form, isEditMode, newestSeason]);

  const onSubmit = async (data: CreateFieldFormData) => {
    if (!convexOrg?._id) {
      toast.error(i18n._("Organization not found. Please try again."));
      return;
    }

    try {
      if (isEditMode && initialData?.fieldId) {
        await updateField({
          fieldId: initialData.fieldId as Id<"fields">,
          name: data.name,
          bzsNumber: data.bzsNumber,
          populatedPlace: data.populatedPlace,
          landArea: data.landArea,
          locality: data.locality,
          area: data.area,
          sowingDate: data.sowingDate?.getTime(),
          cropType: data.cropType || undefined,
          seasonId: data.seasonId
            ? (data.seasonId as Id<"seasons">)
            : undefined,
        });
        toast.success(i18n._("Field updated successfully"));
      } else {
        await createField({
          organizationId: convexOrg._id,
          name: data.name,
          bzsNumber: data.bzsNumber,
          populatedPlace: data.populatedPlace,
          landArea: data.landArea,
          locality: data.locality,
          area: data.area,
          sowingDate: data.sowingDate?.getTime(),
          cropType: data.cropType || undefined,
          seasonId: data.seasonId
            ? (data.seasonId as Id<"seasons">)
            : undefined,
        });
        toast.success(i18n._("Field created successfully"));
      }
      form.reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : i18n._("Failed to save field");
      toast.error(errorMessage);
    }
  };

  const handleSeasonCreated = () => {
    setShowCreateSeason(false);
    // The seasons query will automatically refetch
  };

  const isLoading = isSyncing || !convexOrg;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? (
                <Trans id="Edit Field" message="Edit Field" />
              ) : (
                <Trans id="Add Field" message="Add Field" />
              )}
            </DialogTitle>
            <DialogDescription>
              {isEditMode ? (
                <Trans
                  id="Update the field information below."
                  message="Update the field information below."
                />
              ) : (
                <Trans
                  id="Fill in the required information to create a new field."
                  message="Fill in the required information to create a new field."
                />
              )}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        <Trans id="Field Name" message="Field Name" />{" "}
                        <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder={i18n._("Field name")} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bzsNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        <Trans id="BZS Number" message="BZS Number" />{" "}
                        <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="00000-000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="populatedPlace"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        <Trans id="Populated Place" message="Populated Place" />{" "}
                        <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder={i18n._("Select city")} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="landArea"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        <Trans id="Land Area" message="Land Area" />{" "}
                        <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder={i18n._("Select city")} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="locality"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        <Trans id="Locality" message="Locality" />{" "}
                        <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="-" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="area"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        <Trans id="Area (decares)" message="Area (decares)" />{" "}
                        <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          {...field}
                          onChange={(e) => {
                            const value = e.target.value;
                            field.onChange(value ? parseFloat(value) : 0);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sowingDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>
                        <Trans id="Sowing Date" message="Sowing Date" />
                      </FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground",
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>
                                  <Trans
                                    id="Pick a date"
                                    message="Pick a date"
                                  />
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
                  name="cropType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        <Trans id="Crop Type" message="Crop Type" />
                      </FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={i18n._("Select crop type")}
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="wheat">
                            <Trans id="Wheat" message="Wheat" />
                          </SelectItem>
                          <SelectItem value="corn">
                            <Trans id="Corn" message="Corn" />
                          </SelectItem>
                          <SelectItem value="sunflower">
                            <Trans id="Sunflower" message="Sunflower" />
                          </SelectItem>
                          <SelectItem value="barley">
                            <Trans id="Barley" message="Barley" />
                          </SelectItem>
                          <SelectItem value="rapeseed">
                            <Trans id="Rapeseed" message="Rapeseed" />
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="seasonId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        <Trans id="Season" message="Season" />
                      </FormLabel>
                      <div className="flex gap-2">
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue
                                placeholder={i18n._("Select season")}
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {seasons?.map((season) => (
                              <SelectItem key={season._id} value={season._id}>
                                {season.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => setShowCreateSeason(true)}
                          title={i18n._("Create new season")}
                        >
                          <PlusIcon className="h-4 w-4" />
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  <Trans id="Back" message="Back" />
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <Trans id="Saving..." message="Saving..." />
                  ) : isEditMode ? (
                    <Trans id="Update" message="Update" />
                  ) : (
                    <Trans id="Add" message="Add" />
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <CreateSeasonModal
        open={showCreateSeason}
        onOpenChange={setShowCreateSeason}
        onSuccess={handleSeasonCreated}
      />
    </>
  );
}
