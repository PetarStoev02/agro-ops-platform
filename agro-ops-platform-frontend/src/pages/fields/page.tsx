"use client";

import * as React from "react";
import { useQuery } from "convex/react";
import { useOrganization } from "@clerk/nextjs";
import { useNavigate, useParams, useRouterState } from "@tanstack/react-router";
import {
  PlusIcon,
  SearchIcon,
  MoreHorizontalIcon,
  EditIcon,
  TrashIcon,
  CopyIcon,
} from "lucide-react";
import { Trans } from "@lingui/react";
import { useLingui } from "@lingui/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/src/shared/components/ui/button";
import { Input } from "@/src/shared/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/shared/components/ui/table";
import { Skeleton } from "@/src/shared/components/ui/skeleton";
import {
  Empty,
  EmptyDescription,
  EmptyMedia,
  EmptyTitle,
} from "@/src/shared/components/ui/empty";
import { CreateFieldForm } from "@/src/shared/components/fields/create-field-form";
import { useSyncOrganization } from "@/src/shared/hooks/use-sync-organization";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/src/shared/components/ui/dropdown-menu";
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
import { useMutation } from "convex/react";
import { toast } from "sonner";

export default function FieldsPage() {
  const { organization } = useOrganization();
  const { isSyncing } = useSyncOrganization();
  const navigate = useNavigate();
  const { companySlug } = useParams({ from: "/_authed/$companySlug/fields" });
  const { i18n } = useLingui();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [showCreateForm, setShowCreateForm] = React.useState(false);
  const [editingField, setEditingField] = React.useState<string | null>(null);
  const [duplicatingField, setDuplicatingField] = React.useState<string | null>(
    null,
  );
  const [deletingField, setDeletingField] = React.useState<string | null>(null);
  const deleteField = useMutation(api.fields.remove);

  const convexOrg = useQuery(
    api.organizations.getByClerkOrgId,
    organization?.id ? { clerkOrgId: organization.id } : "skip",
  );

  const fields = useQuery(
    api.fields.getByOrganization,
    convexOrg?._id ? { organizationId: convexOrg._id } : "skip",
  );

  const seasons = useQuery(
    api.seasons.getByOrganization,
    convexOrg?._id ? { organizationId: convexOrg._id } : "skip",
  );

  // Create a map of season IDs to names for quick lookup
  const seasonMap = React.useMemo(() => {
    const map = new Map<string, string>();
    seasons?.forEach((season) => {
      map.set(season._id, season.name);
    });
    return map;
  }, [seasons]);

  // Map crop type values to translated labels
  const cropTypeMap = React.useMemo(() => {
    return new Map([
      ["wheat", i18n._("Wheat")],
      ["corn", i18n._("Corn")],
      ["sunflower", i18n._("Sunflower")],
      ["barley", i18n._("Barley")],
      ["rapeseed", i18n._("Rapeseed")],
    ]);
  }, [i18n]);

  // Filter fields based on search query
  const filteredFields = React.useMemo(() => {
    if (!fields) return [];
    if (!searchQuery.trim()) return fields;

    const query = searchQuery.toLowerCase();
    return fields.filter(
      (field) =>
        field.name.toLowerCase().includes(query) ||
        field.bzsNumber.toLowerCase().includes(query) ||
        field.populatedPlace.toLowerCase().includes(query) ||
        field.landArea.toLowerCase().includes(query) ||
        field.locality.toLowerCase().includes(query) ||
        (field.cropType && field.cropType.toLowerCase().includes(query)),
    );
  }, [fields, searchQuery]);

  const handleFieldClick = (fieldId: string, e?: React.MouseEvent) => {
    // Don't navigate if clicking on the actions button
    if (e && (e.target as HTMLElement).closest("[data-action-menu]")) {
      return;
    }
    const slug = companySlug || organization?.slug;
    if (!slug) {
      console.error("No companySlug available for navigation");
      return;
    }
    navigate({
      to: "/$companySlug/fields/$fieldId",
      params: {
        companySlug: slug,
        fieldId: String(fieldId),
      },
    });
  };

  const handleEdit = (fieldId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const field = fields?.find((f) => f._id === fieldId);
    if (field) {
      setEditingField(fieldId);
      setShowCreateForm(true);
    }
  };

  const handleDuplicate = (fieldId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const field = fields?.find((f) => f._id === fieldId);
    if (field) {
      // Set duplicatingField so the form knows to create a new field with copied data
      setDuplicatingField(fieldId);
      setEditingField(null);
      setShowCreateForm(true);
    }
  };

  const handleDeleteClick = (fieldId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingField(fieldId);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingField) return;

    try {
      await deleteField({ fieldId: deletingField as Id<"fields"> });
      toast.success(i18n._("Field deleted successfully"));
      setDeletingField(null);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : i18n._("Failed to delete field");
      toast.error(errorMessage);
      setDeletingField(null);
    }
  };

  const isLoading = isSyncing || !convexOrg || fields === undefined;

  // Don't render if we're on a field details page
  const router = useRouterState();
  const isFieldDetailsPage = router.location.pathname.match(/\/fields\/[^/]+$/);

  if (isFieldDetailsPage) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            <Trans id="Fields" message="Fields" />
          </h1>
          <p className="text-muted-foreground">
            <Trans
              id="Manage your agricultural fields"
              message="Manage your agricultural fields"
            />
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <PlusIcon className="mr-2 h-4 w-4" />
          <Trans id="Add Field" message="Add Field" />
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={i18n._("Search fields...")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : filteredFields.length === 0 ? (
        <Empty>
          <EmptyMedia variant="icon">
            <SearchIcon className="h-6 w-6" />
          </EmptyMedia>
          <EmptyTitle>
            {searchQuery ? (
              <Trans id="No fields found" message="No fields found" />
            ) : (
              <Trans id="No fields yet" message="No fields yet" />
            )}
          </EmptyTitle>
          <EmptyDescription>
            {searchQuery ? (
              <Trans
                id="Try adjusting your search query"
                message="Try adjusting your search query"
              />
            ) : (
              <Trans
                id="Get started by creating your first field"
                message="Get started by creating your first field"
              />
            )}
          </EmptyDescription>
          {!searchQuery && (
            <Button onClick={() => setShowCreateForm(true)}>
              <PlusIcon className="mr-2 h-4 w-4" />
              <Trans id="Add Field" message="Add Field" />
            </Button>
          )}
        </Empty>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Trans id="Field Name" message="Field Name" />
                </TableHead>
                <TableHead>
                  <Trans id="BZS Number" message="BZS Number" />
                </TableHead>
                <TableHead>
                  <Trans id="Area (decares)" message="Area (decares)" />
                </TableHead>
                <TableHead>
                  <Trans id="Populated Place" message="Populated Place" />
                </TableHead>
                <TableHead>
                  <Trans id="Crop Type" message="Crop Type" />
                </TableHead>
                <TableHead>
                  <Trans id="Season" message="Season" />
                </TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFields.map((field) => (
                <TableRow
                  key={field._id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={(e) => handleFieldClick(field._id, e)}
                >
                  <TableCell className="font-medium">{field.name}</TableCell>
                  <TableCell>{field.bzsNumber}</TableCell>
                  <TableCell>{field.area.toFixed(2)}</TableCell>
                  <TableCell>{field.populatedPlace}</TableCell>
                  <TableCell>
                    {field.cropType
                      ? cropTypeMap.get(field.cropType) || field.cropType
                      : "-"}
                  </TableCell>
                  <TableCell>
                    {field.seasonId
                      ? seasonMap.get(field.seasonId) || "-"
                      : "-"}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        data-action-menu
                        className="hover:bg-muted rounded-md p-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontalIcon className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => handleEdit(field._id, e)}
                        >
                          <EditIcon className="mr-2 h-4 w-4" />
                          <Trans id="Edit" message="Edit" />
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => handleDuplicate(field._id, e)}
                        >
                          <CopyIcon className="mr-2 h-4 w-4" />
                          <Trans id="Duplicate" message="Duplicate" />
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={(e) => handleDeleteClick(field._id, e)}
                        >
                          <TrashIcon className="mr-2 h-4 w-4" />
                          <Trans id="Delete" message="Delete" />
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <CreateFieldForm
        open={showCreateForm}
        onOpenChange={(open) => {
          setShowCreateForm(open);
          if (!open) {
            setEditingField(null);
            setDuplicatingField(null);
          }
        }}
        initialData={
          editingField
            ? fields?.find((f) => f._id === editingField)
              ? {
                  fieldId: editingField,
                  name: fields.find((f) => f._id === editingField)!.name,
                  bzsNumber: fields.find((f) => f._id === editingField)!
                    .bzsNumber,
                  populatedPlace: fields.find((f) => f._id === editingField)!
                    .populatedPlace,
                  landArea: fields.find((f) => f._id === editingField)!
                    .landArea,
                  locality: fields.find((f) => f._id === editingField)!
                    .locality,
                  area: fields.find((f) => f._id === editingField)!.area,
                  sowingDate: fields.find((f) => f._id === editingField)!
                    .sowingDate
                    ? new Date(
                        fields.find((f) => f._id === editingField)!.sowingDate!,
                      )
                    : undefined,
                  cropType: fields.find((f) => f._id === editingField)!
                    .cropType,
                  seasonId: fields.find((f) => f._id === editingField)!
                    .seasonId,
                }
              : undefined
            : duplicatingField
              ? fields?.find((f) => f._id === duplicatingField)
                ? {
                    // Don't include fieldId so it creates a new field
                    name: `${fields.find((f) => f._id === duplicatingField)!.name} (Copy)`,
                    bzsNumber: fields.find((f) => f._id === duplicatingField)!
                      .bzsNumber,
                    populatedPlace: fields.find(
                      (f) => f._id === duplicatingField,
                    )!.populatedPlace,
                    landArea: fields.find((f) => f._id === duplicatingField)!
                      .landArea,
                    locality: fields.find((f) => f._id === duplicatingField)!
                      .locality,
                    area: fields.find((f) => f._id === duplicatingField)!.area,
                    sowingDate: fields.find((f) => f._id === duplicatingField)!
                      .sowingDate
                      ? new Date(
                          fields.find(
                            (f) => f._id === duplicatingField,
                          )!.sowingDate!,
                        )
                      : undefined,
                    cropType: fields.find((f) => f._id === duplicatingField)!
                      .cropType,
                    seasonId: fields.find((f) => f._id === duplicatingField)!
                      .seasonId,
                  }
                : undefined
              : undefined
        }
        onSuccess={() => {
          // Fields will automatically refetch
          setEditingField(null);
          setDuplicatingField(null);
        }}
      />

      <AlertDialog
        open={!!deletingField}
        onOpenChange={(open) => !open && setDeletingField(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              <Trans id="Delete Field" message="Delete Field" />
            </AlertDialogTitle>
            <AlertDialogDescription>
              <Trans
                id="Are you sure you want to delete this field? This action cannot be undone."
                message="Are you sure you want to delete this field? This action cannot be undone."
              />
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              <Trans id="Cancel" message="Cancel" />
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              <Trans id="Delete" message="Delete" />
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
