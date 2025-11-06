"use client";

import * as React from "react";
import { useQuery, useMutation } from "convex/react";
import { useParams, useNavigate } from "@tanstack/react-router";
import { useOrganization } from "@clerk/nextjs";
import { format } from "date-fns";
import { Trans } from "@lingui/react";
import { useLingui } from "@lingui/react";
import {
  EditIcon,
  TrashIcon,
  PlusIcon,
  CopyIcon,
  FileTextIcon,
  DropletIcon,
  SearchIcon,
  PackageIcon,
  TractorIcon,
  ArrowLeftIcon,
} from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/src/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/shared/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/src/shared/components/ui/accordion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/src/shared/components/ui/alert-dialog";
import { Skeleton } from "@/src/shared/components/ui/skeleton";
import { CreateFieldForm } from "@/src/shared/components/fields/create-field-form";
import { ChemicalTreatmentForm } from "@/src/shared/components/activities/chemical-treatment-form";
import { FieldInspectionForm } from "@/src/shared/components/activities/field-inspection-form";
import { FertilizerForm } from "@/src/shared/components/activities/fertilizer-form";
import { FarmActivityForm } from "@/src/shared/components/activities/farm-activity-form";
import { useSyncOrganization } from "@/src/shared/hooks/use-sync-organization";
import { toast } from "sonner";

// Activity category mappings - labels will be translated in the component
const ACTIVITY_CATEGORIES = {
  chemical_treatment: {
    labelKey: "Performed Chemical Treatments",
    icon: DropletIcon,
    color: "text-foreground",
  },
  field_inspection: {
    labelKey:
      "Field Inspection for Appearance, Development, Density or Degree of Pest Infestation",
    icon: SearchIcon,
    color: "text-foreground",
  },
  fertilizer: {
    labelKey:
      "Used Mineral and Organic Fertilizers, Soil Conditioners and Biologically Active Substances",
    icon: PackageIcon,
    color: "text-foreground",
  },
  farm_activity: {
    labelKey: "Performed Activities/Measures in the Farm",
    icon: TractorIcon,
    color: "text-foreground",
  },
} as const;

export default function FieldDetailsPage() {
  const { fieldId, companySlug } = useParams({
    from: "/_authed/$companySlug/fields/$fieldId",
  });
  const { organization } = useOrganization();
  const navigate = useNavigate();
  const { isSyncing } = useSyncOrganization();
  const [showEditForm, setShowEditForm] = React.useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
  const [openActivityForm, setOpenActivityForm] = React.useState<
    | { category: "chemical_treatment" }
    | { category: "field_inspection" }
    | { category: "fertilizer" }
    | { category: "farm_activity" }
    | { category: string; activityId: Id<"activities"> }
    | null
  >(null);

  // Reset form state when fieldId changes
  React.useEffect(() => {
    setShowEditForm(false);
    setShowDeleteDialog(false);
  }, [fieldId]);

  // Debug: Log when fieldId changes
  React.useEffect(() => {
    console.log("FieldDetailsPage: fieldId changed to", fieldId);
  }, [fieldId]);

  const field = useQuery(
    api.fields.getById,
    fieldId ? { fieldId: fieldId as Id<"fields"> } : "skip",
  );

  const activities = useQuery(
    api.activities.getByField,
    fieldId ? { fieldId: fieldId as Id<"fields"> } : "skip",
  );

  const deleteActivity = useMutation(api.activities.remove);

  const season = useQuery(
    api.seasons.getById,
    field?.seasonId ? { seasonId: field.seasonId } : "skip",
  );

  const deleteField = useMutation(api.fields.remove);
  const { i18n } = useLingui();

  // Activities are already grouped by category from the query
  const activitiesByCategory = activities || {};

  // Get activity count for each category
  const getActivityCount = (categoryKey: string) => {
    return activitiesByCategory[categoryKey]?.length || 0;
  };

  const handleDeleteActivity = async (activityId: Id<"activities">) => {
    try {
      await deleteActivity({ activityId });
      toast.success(i18n._("Activity deleted successfully"));
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : i18n._("Failed to delete activity");
      toast.error(message);
    }
  };

  const handleDelete = async () => {
    if (!fieldId) return;

    try {
      await deleteField({ fieldId: fieldId as Id<"fields"> });
      toast.success(i18n._("Field deleted successfully"));
      navigate({
        to: "/$companySlug/fields",
        params: { companySlug: companySlug || organization?.slug || "" },
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : i18n._("Failed to delete field");
      toast.error(errorMessage);
    }
  };

  const isLoading = isSyncing || field === undefined;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!field) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <p className="text-lg font-medium">
          <Trans id="Field not found" message="Field not found" />
        </p>
        <Button
          variant="outline"
          onClick={() =>
            navigate({
              to: "/$companySlug/fields",
              params: { companySlug: companySlug || organization?.slug || "" },
            })
          }
        >
          <ArrowLeftIcon className="mr-2 h-4 w-4" />
          <Trans id="Back to Fields" message="Back to Fields" />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() =>
              navigate({
                to: "/$companySlug/fields",
                params: {
                  companySlug: companySlug || organization?.slug || "",
                },
              })
            }
          >
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              <Trans id="Field Details" message="Field Details" />
            </h1>
            <p className="text-muted-foreground">
              {field.name} - {field.bzsNumber}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowEditForm(true)}>
            <EditIcon className="mr-2 h-4 w-4" />
            <Trans id="Edit" message="Edit" />
          </Button>
          <Button variant="outline" onClick={() => setShowDeleteDialog(true)}>
            <TrashIcon className="mr-2 h-4 w-4" />
            <Trans id="Delete" message="Delete" />
          </Button>
        </div>
      </div>

      {/* Field Information Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              <Trans id="Field" message="Field" />: {field.bzsNumber}
            </CardTitle>
            <div className="text-sm font-medium">
              <Trans id="Area" message="Area" />: {field.area.toFixed(1)}{" "}
              <Trans id="decares" message="decares" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                <Trans id="Populated Place" message="Populated Place" />
              </p>
              <p className="text-base">{field.populatedPlace}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                <Trans id="Land Area" message="Land Area" />
              </p>
              <p className="text-base">{field.landArea}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                <Trans id="Locality" message="Locality" />
              </p>
              <p className="text-base">{field.locality || "-"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                <Trans id="BZS Number" message="BZS Number" />
              </p>
              <p className="text-base">{field.bzsNumber}</p>
            </div>
            {field.sowingDate && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  <Trans id="Sowing Date" message="Sowing Date" />
                </p>
                <p className="text-base">
                  {format(new Date(field.sowingDate), "dd.MM.yyyy")}
                </p>
              </div>
            )}
            {field.cropType && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  <Trans id="Crop Type" message="Crop Type" />
                </p>
                <p className="text-base">{field.cropType}</p>
              </div>
            )}
            {season && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  <Trans id="Season" message="Season" />
                </p>
                <p className="text-base">{season.name}</p>
              </div>
            )}
          </div>
          <div className="pt-4 border-t">
            <Button variant="outline" size="sm">
              <CopyIcon className="mr-2 h-4 w-4" />
              <Trans id="Clone Activities" message="Clone Activities" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Activities Section */}
      <Card>
        <CardHeader>
          <CardTitle>
            <Trans id="List of Activities" message="List of Activities" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" className="w-full">
            {Object.entries(ACTIVITY_CATEGORIES).map(
              ([categoryKey, category]) => {
                const count = getActivityCount(categoryKey);
                const Icon = category.icon;

                return (
                  <AccordionItem
                    key={categoryKey}
                    value={categoryKey}
                    className="mb-2 last:mb-0 border-b-0"
                  >
                    <AccordionTrigger className={category.color}>
                      <div className="flex items-center gap-3">
                        <Icon className="h-5 w-5" />
                        <span className="text-left">
                          <Trans
                            id={category.labelKey}
                            message={category.labelKey}
                          />{" "}
                          ({count})
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2">
                        {count === 0 ? (
                          <p className="text-sm text-muted-foreground">
                            <Trans
                              id="No activities recorded yet"
                              message="No activities recorded yet"
                            />
                          </p>
                        ) : (
                          activitiesByCategory[categoryKey]?.map((activity) => (
                            <div
                              key={activity._id}
                              className="p-3 border rounded-md text-sm cursor-pointer hover:bg-muted/50 transition-colors"
                              onClick={() =>
                                setOpenActivityForm({
                                  category:
                                    activity.category || "chemical_treatment",
                                  activityId: activity._id,
                                })
                              }
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  {activity.category ===
                                    "chemical_treatment" && (
                                    <>
                                      <p className="font-medium">
                                        {activity.chemicalName || activity.type}
                                      </p>
                                      {activity.infestationType && (
                                        <p className="text-muted-foreground">
                                          <Trans
                                            id="Infestation"
                                            message="Infestation"
                                          />
                                          : {activity.infestationType}
                                        </p>
                                      )}
                                      {activity.treatedArea && (
                                        <p className="text-muted-foreground">
                                          <Trans id="Area" message="Area" />:{" "}
                                          {activity.treatedArea}{" "}
                                          <Trans id="dka" message="dka" />
                                        </p>
                                      )}
                                    </>
                                  )}
                                  {activity.category === "field_inspection" && (
                                    <>
                                      <p className="font-medium">
                                        <Trans
                                          id="Field Inspection"
                                          message="Field Inspection"
                                        />
                                      </p>
                                      {activity.damage && (
                                        <p className="text-muted-foreground">
                                          <Trans id="Damage" message="Damage" />
                                          : {activity.damage}
                                        </p>
                                      )}
                                      {activity.surveyedArea && (
                                        <p className="text-muted-foreground">
                                          <Trans
                                            id="Surveyed Area"
                                            message="Surveyed Area"
                                          />
                                          : {activity.surveyedArea}{" "}
                                          <Trans id="dka" message="dka" />
                                        </p>
                                      )}
                                    </>
                                  )}
                                  {activity.category === "fertilizer" && (
                                    <>
                                      <p className="font-medium">
                                        {activity.fertilizerName ||
                                          activity.type}
                                      </p>
                                      {activity.fertilizedArea && (
                                        <p className="text-muted-foreground">
                                          <Trans id="Area" message="Area" />:{" "}
                                          {activity.fertilizedArea}{" "}
                                          <Trans id="dka" message="dka" />
                                        </p>
                                      )}
                                    </>
                                  )}
                                  {activity.category === "farm_activity" && (
                                    <>
                                      <p className="font-medium">
                                        {activity.activityType || activity.type}
                                      </p>
                                      {activity.treatedArea && (
                                        <p className="text-muted-foreground">
                                          <Trans id="Area" message="Area" />:{" "}
                                          {activity.treatedArea}{" "}
                                          <Trans id="dka" message="dka" />
                                        </p>
                                      )}
                                    </>
                                  )}
                                  {!activity.category && (
                                    <>
                                      <p className="font-medium">
                                        {activity.type}
                                      </p>
                                      {activity.description && (
                                        <p className="text-muted-foreground">
                                          {activity.description}
                                        </p>
                                      )}
                                    </>
                                  )}
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {format(
                                      new Date(activity.date),
                                      "dd.MM.yyyy",
                                    )}
                                  </p>
                                </div>
                                <div
                                  className="flex gap-2 ml-4"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      setOpenActivityForm({
                                        category:
                                          activity.category ||
                                          "chemical_treatment",
                                        activityId: activity._id,
                                      })
                                    }
                                  >
                                    <EditIcon className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      handleDeleteActivity(activity._id)
                                    }
                                  >
                                    <TrashIcon className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full mt-2"
                          onClick={() => {
                            const category = categoryKey as
                              | "chemical_treatment"
                              | "field_inspection"
                              | "fertilizer"
                              | "farm_activity";
                            if (category === "chemical_treatment") {
                              setOpenActivityForm({
                                category: "chemical_treatment",
                              });
                            } else if (category === "field_inspection") {
                              setOpenActivityForm({
                                category: "field_inspection",
                              });
                            } else if (category === "fertilizer") {
                              setOpenActivityForm({ category: "fertilizer" });
                            } else if (category === "farm_activity") {
                              setOpenActivityForm({
                                category: "farm_activity",
                              });
                            }
                          }}
                        >
                          <PlusIcon className="mr-2 h-4 w-4" />
                          <Trans id="Add Activity" message="Add Activity" />
                        </Button>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              },
            )}
          </Accordion>
        </CardContent>
      </Card>

      {/* Report Generation Section */}
      <Card>
        <CardHeader>
          <CardTitle>
            <Trans id="Report Generation" message="Report Generation" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium">
              <Trans
                id="BABH Certification Logbook"
                message="BABH Certification Logbook"
              />
            </h4>
            <p className="text-sm text-muted-foreground">
              {getActivityCount("chemical") === 0 &&
              getActivityCount("inspection") === 0 &&
              getActivityCount("fertilizer") === 0 &&
              getActivityCount("farm_activity") === 0 ? (
                <Trans
                  id="You have not entered any activities, which will lead to the generation of an empty logbook with rows 'No activities performed'."
                  message="You have not entered any activities, which will lead to the generation of an empty logbook with rows 'No activities performed'."
                />
              ) : (
                <Trans
                  id="Generate a logbook for certification in BABH."
                  message="Generate a logbook for certification in BABH."
                />
              )}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" disabled>
                <FileTextIcon className="mr-2 h-4 w-4" />
                <Trans
                  id="Generate BABH Logbook"
                  message="Generate BABH Logbook"
                />
              </Button>
              <Button variant="outline" disabled>
                <FileTextIcon className="mr-2 h-4 w-4" />
                <Trans
                  id="Generate DEMO BABH Logbook"
                  message="Generate DEMO BABH Logbook"
                />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              *{" "}
              <Trans
                id="Generating a logbook costs 1 credit (coming soon)"
                message="Generating a logbook costs 1 credit (coming soon)"
              />
            </p>
          </div>
          <div className="space-y-2 pt-4 border-t">
            <h4 className="font-medium">
              <Trans id="Farm Logbook" message="Farm Logbook" />
            </h4>
            <Button variant="outline" disabled>
              <FileTextIcon className="mr-2 h-4 w-4" />
              <Trans
                id="Generate Farm Logbook"
                message="Generate Farm Logbook"
              />
            </Button>
            <p className="text-xs text-muted-foreground">
              *{" "}
              <Trans
                id="Report generation functionality coming soon"
                message="Report generation functionality coming soon"
              />
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Edit Form Modal */}
      <CreateFieldForm
        open={showEditForm}
        onOpenChange={setShowEditForm}
        initialData={{
          fieldId: field._id,
          name: field.name,
          bzsNumber: field.bzsNumber,
          populatedPlace: field.populatedPlace,
          landArea: field.landArea,
          locality: field.locality,
          area: field.area,
          sowingDate: field.sowingDate ? new Date(field.sowingDate) : undefined,
          cropType: field.cropType,
          seasonId: field.seasonId,
        }}
        onSuccess={() => {
          // Field will automatically refetch
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              <Trans id="Delete Field" message="Delete Field" />
            </AlertDialogTitle>
            <AlertDialogDescription>
              <Trans
                id="Are you sure you want to delete {fieldName}? This action cannot be undone."
                message="Are you sure you want to delete {fieldName}? This action cannot be undone."
                values={{ fieldName: field.name }}
              />
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              <Trans id="Cancel" message="Cancel" />
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive"
            >
              <Trans id="Delete" message="Delete" />
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Activity Forms */}
      {openActivityForm?.category === "chemical_treatment" && (
        <ChemicalTreatmentForm
          open={!!openActivityForm}
          onOpenChange={(open) => !open && setOpenActivityForm(null)}
          onSuccess={() => setOpenActivityForm(null)}
          fieldId={fieldId as Id<"fields">}
          cropType={field?.cropType}
          initialData={
            "activityId" in openActivityForm
              ? activitiesByCategory["chemical_treatment"]?.find(
                  (a) => a._id === openActivityForm.activityId,
                )
                ? {
                    date: new Date(
                      activitiesByCategory["chemical_treatment"]?.find(
                        (a) => a._id === openActivityForm.activityId,
                      )!.date,
                    ),
                    chemicalId:
                      activitiesByCategory["chemical_treatment"]?.find(
                        (a) => a._id === openActivityForm.activityId,
                      )!.chemicalId || "",
                    infestationType:
                      activitiesByCategory["chemical_treatment"]?.find(
                        (a) => a._id === openActivityForm.activityId,
                      )!.infestationType || "",
                    dose:
                      activitiesByCategory["chemical_treatment"]?.find(
                        (a) => a._id === openActivityForm.activityId,
                      )!.dose || 0,
                    quarantinePeriod:
                      activitiesByCategory["chemical_treatment"]?.find(
                        (a) => a._id === openActivityForm.activityId,
                      )!.quarantinePeriod || 0,
                    treatedArea:
                      activitiesByCategory["chemical_treatment"]?.find(
                        (a) => a._id === openActivityForm.activityId,
                      )!.treatedArea || 0,
                    equipment:
                      activitiesByCategory["chemical_treatment"]?.find(
                        (a) => a._id === openActivityForm.activityId,
                      )!.equipment || "",
                    activityId: openActivityForm.activityId,
                  }
                : undefined
              : undefined
          }
        />
      )}

      {openActivityForm?.category === "field_inspection" && (
        <FieldInspectionForm
          open={!!openActivityForm}
          onOpenChange={(open) => !open && setOpenActivityForm(null)}
          onSuccess={() => setOpenActivityForm(null)}
          fieldId={fieldId as Id<"fields">}
          initialData={
            "activityId" in openActivityForm
              ? activitiesByCategory["field_inspection"]?.find(
                  (a) => a._id === openActivityForm.activityId,
                )
                ? {
                    startDate: new Date(
                      activitiesByCategory["field_inspection"]?.find(
                        (a) => a._id === openActivityForm.activityId,
                      )!.startDate || 0,
                    ),
                    surveyedArea:
                      activitiesByCategory["field_inspection"]?.find(
                        (a) => a._id === openActivityForm.activityId,
                      )!.surveyedArea || 0,
                    attackedArea:
                      activitiesByCategory["field_inspection"]?.find(
                        (a) => a._id === openActivityForm.activityId,
                      )!.attackedArea || 0,
                    damage:
                      activitiesByCategory["field_inspection"]?.find(
                        (a) => a._id === openActivityForm.activityId,
                      )!.damage || "",
                    damageType:
                      activitiesByCategory["field_inspection"]?.find(
                        (a) => a._id === openActivityForm.activityId,
                      )!.damageType || "",
                    attackDensity:
                      activitiesByCategory["field_inspection"]?.find(
                        (a) => a._id === openActivityForm.activityId,
                      )!.attackDensity || "",
                    phenologicalPhase:
                      activitiesByCategory["field_inspection"]?.find(
                        (a) => a._id === openActivityForm.activityId,
                      )!.phenologicalPhase || "",
                    activityId: openActivityForm.activityId,
                  }
                : undefined
              : undefined
          }
        />
      )}

      {openActivityForm?.category === "fertilizer" && (
        <FertilizerForm
          open={!!openActivityForm}
          onOpenChange={(open) => !open && setOpenActivityForm(null)}
          onSuccess={() => setOpenActivityForm(null)}
          fieldId={fieldId as Id<"fields">}
          cropType={field?.cropType}
          initialData={
            "activityId" in openActivityForm
              ? activitiesByCategory["fertilizer"]?.find(
                  (a) => a._id === openActivityForm.activityId,
                )
                ? {
                    date: new Date(
                      activitiesByCategory["fertilizer"]?.find(
                        (a) => a._id === openActivityForm.activityId,
                      )!.date,
                    ),
                    fertilizerId:
                      activitiesByCategory["fertilizer"]?.find(
                        (a) => a._id === openActivityForm.activityId,
                      )!.fertilizerId || "",
                    dose:
                      activitiesByCategory["fertilizer"]?.find(
                        (a) => a._id === openActivityForm.activityId,
                      )!.dose || 0,
                    fertilizedArea:
                      activitiesByCategory["fertilizer"]?.find(
                        (a) => a._id === openActivityForm.activityId,
                      )!.fertilizedArea || 0,
                    fertilizerType:
                      activitiesByCategory["fertilizer"]?.find(
                        (a) => a._id === openActivityForm.activityId,
                      )!.fertilizerType || "",
                    activityId: openActivityForm.activityId,
                  }
                : undefined
              : undefined
          }
        />
      )}

      {openActivityForm?.category === "farm_activity" && (
        <FarmActivityForm
          open={!!openActivityForm}
          onOpenChange={(open) => !open && setOpenActivityForm(null)}
          onSuccess={() => setOpenActivityForm(null)}
          fieldId={fieldId as Id<"fields">}
          initialData={
            "activityId" in openActivityForm
              ? activitiesByCategory["farm_activity"]?.find(
                  (a) => a._id === openActivityForm.activityId,
                )
                ? {
                    startDate: new Date(
                      activitiesByCategory["farm_activity"]?.find(
                        (a) => a._id === openActivityForm.activityId,
                      )!.startDate || 0,
                    ),
                    endDate: new Date(
                      activitiesByCategory["farm_activity"]?.find(
                        (a) => a._id === openActivityForm.activityId,
                      )!.endDate || 0,
                    ),
                    activityType:
                      activitiesByCategory["farm_activity"]?.find(
                        (a) => a._id === openActivityForm.activityId,
                      )!.activityType || "",
                    treatedArea:
                      activitiesByCategory["farm_activity"]?.find(
                        (a) => a._id === openActivityForm.activityId,
                      )!.treatedArea || 0,
                    materialType:
                      activitiesByCategory["farm_activity"]?.find(
                        (a) => a._id === openActivityForm.activityId,
                      )!.materialType || "",
                    quantity:
                      activitiesByCategory["farm_activity"]?.find(
                        (a) => a._id === openActivityForm.activityId,
                      )!.quantity || "",
                    activityId: openActivityForm.activityId,
                  }
                : undefined
              : undefined
          }
        />
      )}
    </div>
  );
}
