"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { Combobox } from "@/src/shared/components/ui/combobox";
import { toast } from "sonner";
import { useSyncOrganization } from "@/src/shared/hooks/use-sync-organization";

const getChemicalSchema = (t: (msg: string) => string) =>
  z.object({
    name: z.string().min(1, t("Name is required")),
    quantity: z.number().min(0, t("Quantity must be positive")),
  });

type ChemicalFormData = z.infer<ReturnType<typeof getChemicalSchema>>;

interface AddChemicalFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  editItemId?: string;
}

export function AddChemicalForm({
  open,
  onOpenChange,
  onSuccess,
  editItemId,
}: AddChemicalFormProps) {
  const { organization } = useOrganization();
  const { isSyncing } = useSyncOrganization();
  const createInventory = useMutation(api.inventory.create);
  const updateInventory = useMutation(api.inventory.update);
  const convexOrg = useQuery(
    api.organizations.getByClerkOrgId,
    organization?.id ? { clerkOrgId: organization.id } : "skip",
  );
  const editItem = useQuery(
    api.inventory.getById,
    editItemId ? { itemId: editItemId as Id<"inventory"> } : "skip",
  );

  // Query allowed chemicals from global registry
  const allowedChemicals = useQuery(api.chemicals.getPrimary);

  const { i18n } = useLingui();
  const t = (msg: string) => i18n._(msg);

  const isEditMode = !!editItemId;

  const form = useForm<ChemicalFormData>({
    resolver: zodResolver(getChemicalSchema(t)),
    defaultValues: {
      name: "",
      quantity: 0,
    },
  });

  React.useEffect(() => {
    if (editItem && isEditMode) {
      form.reset({
        name: editItem.name,
        quantity: editItem.quantity,
      });
    } else if (!isEditMode) {
      form.reset({
        name: "",
        quantity: 0,
      });
    }
  }, [editItem, isEditMode, form]);

  const onSubmit = async (data: ChemicalFormData) => {
    if (!convexOrg?._id) {
      toast.error(i18n._("Organization not found. Please try again."));
      return;
    }

    try {
      if (isEditMode && editItemId) {
        await updateInventory({
          itemId: editItemId as Id<"inventory">,
          name: data.name,
          quantity: data.quantity,
          unit: "Литър (л.)",
        });
        toast.success(i18n._("Chemical updated successfully"));
      } else {
        await createInventory({
          organizationId: convexOrg._id,
          name: data.name,
          category: "chemical",
          quantity: data.quantity,
          unit: "Литър (л.)", // Default unit for chemicals
        });
        toast.success(i18n._("Chemical added successfully"));
      }
      form.reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : isEditMode
            ? i18n._("Failed to update chemical")
            : i18n._("Failed to add chemical");
      toast.error(errorMessage);
    }
  };

  const isLoading = isSyncing || !convexOrg;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? (
              <Trans id="Edit Chemical" message="Редактиране на препарат" />
            ) : (
              <Trans id="Add Chemical" message="Add Chemical" />
            )}
          </DialogTitle>
          <DialogDescription>
            {isEditMode ? (
              <Trans
                id="Update the chemical information below."
                message="Обновете информацията за препарата по-долу."
              />
            ) : (
              <Trans
                id="Fill in the required information to add a chemical."
                message="Попълнете необходимата информация за добавяне на препарат."
              />
            )}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
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
                          value: chemical.name,
                          label: chemical.name,
                          dose: chemical.dose,
                          dangerTypes: chemical.dangerTypes,
                        })) || []
                      }
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value);
                      }}
                      placeholder={i18n._("Name of preparation/product")}
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
                    <Trans id="Quantity" message="Quantity" />{" "}
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
                      value={field.value || ""}
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
                <Trans id="Back" message="Back" />
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isEditMode ? (
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
  );
}
