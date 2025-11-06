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
  FormDescription,
} from "@/src/shared/components/ui/form";
import { Input } from "@/src/shared/components/ui/input";
import { Textarea } from "@/src/shared/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/shared/components/ui/select";
import { toast } from "sonner";
import { useSyncOrganization } from "@/src/shared/hooks/use-sync-organization";

const getFoliarFertilizerSchema = (t: (msg: string) => string) =>
  z.object({
    name: z.string().min(1, t("Product name is required")),
    contents: z.string().min(1, t("Contents is required")),
    nitrogenContent: z
      .number()
      .min(0)
      .max(100, t("Nitrogen content must be between 0 and 100")),
    quantity: z.number().min(0, t("Quantity must be positive")),
    unit: z.string().min(1, t("Unit of measurement is required")),
  });

type FoliarFertilizerFormData = z.infer<
  ReturnType<typeof getFoliarFertilizerSchema>
>;

interface AddFoliarFertilizerFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  editItemId?: string;
}

export function AddFoliarFertilizerForm({
  open,
  onOpenChange,
  onSuccess,
  editItemId,
}: AddFoliarFertilizerFormProps) {
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

  const { i18n } = useLingui();
  const t = (msg: string) => i18n._(msg);

  const isEditMode = !!editItemId;

  const form = useForm<FoliarFertilizerFormData>({
    resolver: zodResolver(getFoliarFertilizerSchema(t)),
    defaultValues: {
      name: "",
      contents: "",
      nitrogenContent: 0,
      quantity: 0,
      unit: "Килограм (кг.)",
    },
  });

  React.useEffect(() => {
    if (editItem && isEditMode) {
      form.reset({
        name: editItem.name,
        contents: editItem.contents || "",
        nitrogenContent: editItem.nitrogenContent || 0,
        quantity: editItem.quantity,
        unit: editItem.unit,
      });
    } else if (!isEditMode) {
      form.reset({
        name: "",
        contents: "",
        nitrogenContent: 0,
        quantity: 0,
        unit: "Килограм (кг.)",
      });
    }
  }, [editItem, isEditMode, form]);

  const onSubmit = async (data: FoliarFertilizerFormData) => {
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
          unit: data.unit,
          contents: data.contents,
          nitrogenContent: data.nitrogenContent,
        });
        toast.success(i18n._("Foliar fertilizer updated successfully"));
      } else {
        await createInventory({
          organizationId: convexOrg._id,
          name: data.name,
          category: "fertilizer",
          quantity: data.quantity,
          unit: data.unit,
          contents: data.contents,
          nitrogenContent: data.nitrogenContent,
          fertilizerType: "листен",
        });
        toast.success(i18n._("Foliar fertilizer added successfully"));
      }
      form.reset({
        name: "",
        contents: "",
        nitrogenContent: 0,
        quantity: 0,
        unit: "Килограм (кг.)",
      });
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : isEditMode
            ? i18n._("Failed to update fertilizer")
            : i18n._("Failed to add fertilizer");
      toast.error(errorMessage);
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
                id="Edit Foliar Fertilizer"
                message="Редактиране на листен тор"
              />
            ) : (
              <Trans id="Foliar Fertilizer" message="Листен тор" />
            )}
          </DialogTitle>
          <DialogDescription>
            {isEditMode ? (
              <Trans
                id="Update the foliar fertilizer information below."
                message="Обновете информацията за листния тор по-долу."
              />
            ) : (
              <Trans
                id="Fill in the required information to add a foliar fertilizer."
                message="Попълнете необходимата информация за добавяне на листен тор."
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
                    <Trans id="Product name" message="Име на продукт" />{" "}
                    <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder={i18n._("Product name")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contents"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    <Trans
                      id="Content of fertilizer"
                      message="Съдържание на торта"
                    />{" "}
                    <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={i18n._(
                        "Enter fertilizer content in free text",
                      )}
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    <Trans
                      id="Enter the content of the fertilizer in free text. The data from this field will be used when filling out the logbook for certification by BABH."
                      message="Въведете съдържанието на торта в свободен текст. Данните от това поле ще се използват при попълване на дневника за заверка от БАБХ"
                    />
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="nitrogenContent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    <Trans
                      id="Nitrogen (N) content in (%)"
                      message="Съдържание на азот (N) в (%)"
                    />{" "}
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
              name="unit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    <Trans
                      id="Unit of measurement"
                      message="Unit of measurement"
                    />{" "}
                    <span className="text-destructive">*</span>
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={i18n._("Select unit")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Килограм (кг.)">
                        <Trans id="Kilogram (kg)" message="Килограм (кг.)" />
                      </SelectItem>
                      <SelectItem value="Литър (л.)">
                        <Trans id="Liter (l)" message="Литър (л.)" />
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormItem>
              <FormLabel>
                <Trans id="Type" message="Type" />{" "}
                <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input value="Листен" disabled readOnly />
              </FormControl>
            </FormItem>

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
