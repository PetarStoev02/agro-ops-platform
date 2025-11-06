"use client";

import * as React from "react";
import { useQuery, useMutation } from "convex/react";
import { useOrganization } from "@clerk/nextjs";
import { Trans } from "@lingui/react";
import { useLingui } from "@lingui/react";
import {
  PlusIcon,
  TrashIcon,
  AlertTriangleIcon,
  MoreHorizontalIcon,
  PencilIcon,
} from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/src/shared/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/shared/components/ui/table";
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
import { toast } from "sonner";
import { useSyncOrganization } from "@/src/shared/hooks/use-sync-organization";
import { AddItemTypeModal } from "@/src/shared/components/warehouse/add-item-type-modal";
import { AddFertilizerTypeModal } from "@/src/shared/components/warehouse/add-fertilizer-type-modal";
import { AddChemicalForm } from "@/src/shared/components/warehouse/add-chemical-form";
import { AddGranularFertilizerForm } from "@/src/shared/components/warehouse/add-granular-fertilizer-form";
import { AddFoliarFertilizerForm } from "@/src/shared/components/warehouse/add-foliar-fertilizer-form";

export default function WarehousePage() {
  const { organization } = useOrganization();
  const { isSyncing } = useSyncOrganization();
  const { i18n } = useLingui();
  const removeInventory = useMutation(api.inventory.remove);

  const convexOrg = useQuery(
    api.organizations.getByClerkOrgId,
    organization?.id ? { clerkOrgId: organization.id } : "skip",
  );

  const inventoryItems = useQuery(
    api.inventory.getByOrganization,
    convexOrg?._id ? { organizationId: convexOrg._id } : "skip",
  );

  const [showAddItemTypeModal, setShowAddItemTypeModal] = React.useState(false);
  const [showFertilizerTypeModal, setShowFertilizerTypeModal] =
    React.useState(false);
  const [showChemicalForm, setShowChemicalForm] = React.useState(false);
  const [showGranularForm, setShowGranularForm] = React.useState(false);
  const [showFoliarForm, setShowFoliarForm] = React.useState(false);
  const [deleteItemId, setDeleteItemId] =
    React.useState<Id<"inventory"> | null>(null);
  const [editItem, setEditItem] = React.useState<{
    id: Id<"inventory">;
    category: string;
    fertilizerType?: string;
  } | null>(null);

  const handleAddItem = () => {
    setShowAddItemTypeModal(true);
  };

  const handleSelectChemical = () => {
    setShowChemicalForm(true);
  };

  const handleSelectFertilizer = () => {
    setShowFertilizerTypeModal(true);
  };

  const handleSelectGranular = () => {
    setShowGranularForm(true);
  };

  const handleSelectFoliar = () => {
    setShowFoliarForm(true);
  };

  const handleEditItem = (item: {
    _id: Id<"inventory">;
    category: string;
    fertilizerType?: string;
  }) => {
    setEditItem({
      id: item._id,
      category: item.category,
      fertilizerType: item.fertilizerType,
    });
    if (item.category === "chemical") {
      setShowChemicalForm(true);
    } else if (item.category === "fertilizer") {
      if (item.fertilizerType === "гранулиран") {
        setShowGranularForm(true);
      } else if (item.fertilizerType === "листен") {
        setShowFoliarForm(true);
      }
    }
  };

  const handleDelete = async () => {
    if (!deleteItemId) return;

    try {
      await removeInventory({ itemId: deleteItemId });
      toast.success(i18n._("Item deleted successfully"));
      setDeleteItemId(null);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : i18n._("Failed to delete item");
      toast.error(errorMessage);
    }
  };

  const handleSuccess = () => {
    // Forms will close themselves, just refresh the data
    setEditItem(null);
  };

  const chemicals = React.useMemo(() => {
    if (!inventoryItems) return [];
    return inventoryItems.filter((item) => item.category === "chemical");
  }, [inventoryItems]);

  const fertilizers = React.useMemo(() => {
    if (!inventoryItems) return [];
    return inventoryItems.filter((item) => item.category === "fertilizer");
  }, [inventoryItems]);

  const isLoading = isSyncing || !convexOrg;

  const getFertilizerTypeLabel = (type?: string) => {
    if (type === "гранулиран") return i18n._("Granular");
    if (type === "листен") return i18n._("Foliar");
    return "";
  };

  // Helper function to check if quantity is under 100 kg/liters
  const isLowStock = (item: {
    quantity: number;
    unit: string;
    category: string;
    fertilizerType?: string;
  }): boolean => {
    // For granular fertilizers, convert to kg
    if (
      item.category === "fertilizer" &&
      item.fertilizerType === "гранулиран"
    ) {
      if (item.unit === "Тон") {
        return item.quantity * 1000 < 100;
      }
      if (item.unit === "Килограм (кг.)") {
        return item.quantity < 100;
      }
    }
    // For foliar fertilizers, check liters
    if (item.category === "fertilizer" && item.fertilizerType === "листен") {
      if (item.unit === "Литър (л.)") {
        return item.quantity < 100;
      }
      if (item.unit === "Килограм (кг.)") {
        return item.quantity < 100;
      }
    }
    // For chemicals, check liters
    if (item.category === "chemical") {
      if (item.unit === "Литър (л.)") {
        return item.quantity < 100;
      }
    }
    return false;
  };

  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              <Trans id="Warehouse & Inventory" message="Склад и Инвентар" />
            </h1>
            <p className="text-muted-foreground mt-1">
              <Trans
                id="Manage your inventory items"
                message="Управление на инвентарни артикули"
              />
            </p>
          </div>
          <Button onClick={handleAddItem} disabled={isLoading}>
            <PlusIcon className="mr-2 h-4 w-4" />
            <Trans id="Add Item" message="Add Item" />
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            <Trans id="Loading..." message="Зареждане..." />
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {/* Chemicals Table */}
            <div>
              <h2 className="text-xl font-semibold mb-4">
                <Trans id="Chemicals" message="Препарати" />
              </h2>
              {chemicals.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground rounded-md border">
                  <Trans
                    id="No chemicals found. Click 'Add Item' to add a chemical."
                    message="Няма намерени препарати. Кликнете 'Добави' за да добавите препарат."
                  />
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>
                          <Trans id="Name" message="Name" />
                        </TableHead>
                        <TableHead>
                          <Trans id="Quantity" message="Quantity" />
                        </TableHead>
                        <TableHead>
                          <Trans id="Unit" message="Unit" />
                        </TableHead>
                        <TableHead className="text-right">
                          <MoreHorizontalIcon className="h-4 w-4 mx-auto" />
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {chemicals.map((item) => (
                        <TableRow key={item._id}>
                          <TableCell className="font-medium">
                            {item.name}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {isLowStock(item) && (
                                <AlertTriangleIcon className="h-4 w-4 text-destructive" />
                              )}
                              <span
                                className={
                                  isLowStock(item)
                                    ? "text-destructive font-medium"
                                    : ""
                                }
                              >
                                {item.quantity}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>{item.unit}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontalIcon className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => handleEditItem(item)}
                                >
                                  <PencilIcon className="h-4 w-4 mr-2" />
                                  <Trans id="Edit" message="Edit" />
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  variant="destructive"
                                  onClick={() => setDeleteItemId(item._id)}
                                >
                                  <TrashIcon className="h-4 w-4 mr-2" />
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
            </div>

            {/* Fertilizers Table */}
            <div>
              <h2 className="text-xl font-semibold mb-4">
                <Trans id="Fertilizers" message="Торове" />
              </h2>
              {fertilizers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground rounded-md border">
                  <Trans
                    id="No fertilizers found. Click 'Add Item' to add a fertilizer."
                    message="Няма намерени торове. Кликнете 'Добави' за да добавите тор."
                  />
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>
                          <Trans id="Name" message="Name" />
                        </TableHead>
                        <TableHead>
                          <Trans id="Type" message="Type" />
                        </TableHead>
                        <TableHead>
                          <Trans id="Quantity" message="Quantity" />
                        </TableHead>
                        <TableHead>
                          <Trans id="Unit" message="Unit" />
                        </TableHead>
                        <TableHead>
                          <Trans
                            id="Nitrogen Content"
                            message="Nitrogen Content"
                          />
                        </TableHead>
                        <TableHead className="text-right">
                          <MoreHorizontalIcon className="h-4 w-4 mx-auto" />
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fertilizers.map((item) => {
                        const lowStock = isLowStock(item);
                        return (
                          <TableRow key={item._id}>
                            <TableCell className="font-medium">
                              {item.name}
                            </TableCell>
                            <TableCell>
                              {item.fertilizerType
                                ? getFertilizerTypeLabel(item.fertilizerType)
                                : "-"}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {lowStock && (
                                  <AlertTriangleIcon className="h-4 w-4 text-destructive" />
                                )}
                                <span
                                  className={
                                    lowStock
                                      ? "text-destructive font-medium"
                                      : ""
                                  }
                                >
                                  {item.quantity}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>{item.unit}</TableCell>
                            <TableCell>
                              {item.nitrogenContent !== undefined
                                ? `${item.nitrogenContent}%`
                                : "-"}
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreHorizontalIcon className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => handleEditItem(item)}
                                  >
                                    <PencilIcon className="h-4 w-4 mr-2" />
                                    <Trans id="Edit" message="Edit" />
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    variant="destructive"
                                    onClick={() => setDeleteItemId(item._id)}
                                  >
                                    <TrashIcon className="h-4 w-4 mr-2" />
                                    <Trans id="Delete" message="Delete" />
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <AddItemTypeModal
        open={showAddItemTypeModal}
        onOpenChange={setShowAddItemTypeModal}
        onSelectChemical={handleSelectChemical}
        onSelectFertilizer={handleSelectFertilizer}
      />

      <AddFertilizerTypeModal
        open={showFertilizerTypeModal}
        onOpenChange={setShowFertilizerTypeModal}
        onSelectGranular={handleSelectGranular}
        onSelectFoliar={handleSelectFoliar}
      />

      <AddChemicalForm
        open={showChemicalForm}
        onOpenChange={(open) => {
          setShowChemicalForm(open);
          if (!open) setEditItem(null);
        }}
        onSuccess={handleSuccess}
        editItemId={editItem?.category === "chemical" ? editItem.id : undefined}
      />

      <AddGranularFertilizerForm
        open={showGranularForm}
        onOpenChange={(open) => {
          setShowGranularForm(open);
          if (!open) setEditItem(null);
        }}
        onSuccess={handleSuccess}
        editItemId={
          editItem?.category === "fertilizer" &&
          editItem.fertilizerType === "гранулиран"
            ? editItem.id
            : undefined
        }
      />

      <AddFoliarFertilizerForm
        open={showFoliarForm}
        onOpenChange={(open) => {
          setShowFoliarForm(open);
          if (!open) setEditItem(null);
        }}
        onSuccess={handleSuccess}
        editItemId={
          editItem?.category === "fertilizer" &&
          editItem.fertilizerType === "листен"
            ? editItem.id
            : undefined
        }
      />

      <AlertDialog
        open={deleteItemId !== null}
        onOpenChange={(open) => !open && setDeleteItemId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              <Trans id="Delete Item" message="Изтриване на артикул" />
            </AlertDialogTitle>
            <AlertDialogDescription>
              <Trans
                id="Are you sure you want to delete this item? This action cannot be undone."
                message="Сигурни ли сте, че искате да изтриете този артикул? Това действие не може да бъде отменено."
              />
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              <Trans id="Cancel" message="Cancel" />
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              <Trans id="Delete" message="Delete" />
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
