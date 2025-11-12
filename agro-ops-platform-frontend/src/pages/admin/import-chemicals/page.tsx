"use client";

import * as React from "react";
import { useQuery } from "convex/react";
import { useOrganization, useUser } from "@clerk/nextjs";
import { Trans } from "@lingui/react";
import { useLingui } from "@lingui/react";
import { useNavigate } from "@tanstack/react-router";
import { api } from "@/convex/_generated/api";
import { AddChemicalForm } from "@/src/shared/components/admin/add-chemical-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/shared/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/shared/components/ui/table";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/src/shared/components/ui/alert";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/src/shared/components/ui/pagination";
import { AlertTriangleIcon, ShieldCheckIcon } from "lucide-react";
import { toast } from "sonner";

export default function AdminImportChemicalsPage() {
  const { organization } = useOrganization();
  const { user } = useUser();
  const { i18n } = useLingui();
  const navigate = useNavigate();

  // Check if user is admin (organization admin or has admin role)
  const isAdmin = React.useMemo(() => {
    if (!organization || !user) return false;

    const membershipRole = organization.membership?.role;
    const roleAllowsAdmin =
      membershipRole === "org:admin" || membershipRole === "org:owner";

    const userMetadata = user.publicMetadata as Record<string, unknown> | undefined;
    const userPrivateMetadata = user.privateMetadata as Record<string, unknown> | undefined;
    const metadataAllowsAdmin =
      userMetadata?.isAdmin === true || userPrivateMetadata?.isAdmin === true;

    return roleAllowsAdmin || metadataAllowsAdmin;
  }, [organization, user]);

  // Get all imported chemicals
  const allChemicals = useQuery(api.chemicals.getAll);

  // Pagination state
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 50;

  // Calculate pagination values
  const totalPages = allChemicals
    ? Math.ceil(allChemicals.length / itemsPerPage)
    : 0;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedChemicals = allChemicals?.slice(startIndex, endIndex) || [];

  // Reset to page 1 when chemicals change
  React.useEffect(() => {
    if (allChemicals && currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [allChemicals, currentPage, totalPages]);

  // Scroll to top when page changes
  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentPage]);

  // Redirect if not admin
  React.useEffect(() => {
    if (organization && user && !isAdmin) {
      toast.error(i18n._("Access denied. Admin privileges required."));
      if (organization.slug) {
        navigate({
          to: "/$companySlug",
          params: { companySlug: organization.slug },
        });
      }
    }
  }, [isAdmin, organization, user, navigate, i18n]);

  if (!organization || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Alert variant="destructive" className="max-w-md">
          <AlertTriangleIcon className="h-4 w-4" />
          <AlertTitle>
            <Trans id="Access Denied" message="Достъпът е отказан" />
          </AlertTitle>
          <AlertDescription>
            <Trans
              id="You need admin privileges to access this page."
              message="Нужни са администраторски права за достъп до тази страница."
            />
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const primaryCount = allChemicals?.filter((c) => c.isPrimary).length || 0;
  const totalCount = allChemicals?.length || 0;

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ShieldCheckIcon className="h-8 w-8" />
            <Trans
              id="Admin: Manage Chemicals"
              message="Админ: Управление на препарати"
            />
          </h1>
          <p className="text-muted-foreground mt-1">
            <Trans
              id="Add chemicals to the global registry"
              message="Добавяне на препарати в глобалния регистър"
            />
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            <Trans id="Add Chemical" message="Add Chemical" />
          </CardTitle>
          <CardDescription>
            <Trans
              id="Add a new chemical to the global registry. If a chemical with the same name exists but with different danger types, it will be added as a secondary entry."
              message="Добавете нов препарат в глобалния регистър. Ако съществува препарат със същото име, но с различни видове опасност, той ще бъде добавен като вторичен запис."
            />
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AddChemicalForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            <Trans id="All Chemicals" message="Всички препарати" />
          </CardTitle>
          <CardDescription>
            <Trans
              id="Overview of all chemicals in the registry"
              message="Преглед на всички препарати в регистъра"
            />
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-4 border rounded-lg">
              <div className="text-2xl font-bold">{totalCount}</div>
              <div className="text-sm text-muted-foreground">
                <Trans id="Total Chemicals" message="Общо препарати" />
              </div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="text-2xl font-bold">{primaryCount}</div>
              <div className="text-sm text-muted-foreground">
                <Trans id="Primary Entries" message="Основни записи" />
              </div>
            </div>
          </div>

          {allChemicals && allChemicals.length > 0 && (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <Trans id="Name" message="Name" />
                    </TableHead>
                    <TableHead>
                      <Trans id="Dose" message="Доза" />
                    </TableHead>
                    <TableHead>
                      <Trans id="Danger Types" message="Видове опасност" />
                    </TableHead>
                    <TableHead>
                      <Trans id="Primary" message="Основен" />
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedChemicals.map((chemical) => (
                    <TableRow key={chemical._id}>
                      <TableCell className="font-medium">
                        {chemical.name}
                      </TableCell>
                      <TableCell>{chemical.dose}</TableCell>
                      <TableCell>
                        {chemical.dangerTypes.length > 0
                          ? chemical.dangerTypes.join(", ")
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {chemical.isPrimary ? (
                          <span className="text-green-600">✓</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {totalPages > 1 && (
                <div className="p-4 border-t">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            if (currentPage > 1) {
                              setCurrentPage(currentPage - 1);
                            }
                          }}
                          className={
                            currentPage === 1
                              ? "pointer-events-none opacity-50"
                              : "cursor-pointer"
                          }
                        />
                      </PaginationItem>
                      {(() => {
                        const pages: (number | "ellipsis")[] = [];
                        const showEllipsis = totalPages > 7;

                        if (!showEllipsis) {
                          // Show all pages if total pages <= 7
                          for (let i = 1; i <= totalPages; i++) {
                            pages.push(i);
                          }
                        } else {
                          // Always show first page
                          pages.push(1);

                          if (currentPage <= 4) {
                            // Near the beginning: 1 2 3 4 5 ... last
                            for (let i = 2; i <= 5; i++) {
                              pages.push(i);
                            }
                            pages.push("ellipsis");
                            pages.push(totalPages);
                          } else if (currentPage >= totalPages - 3) {
                            // Near the end: 1 ... (n-4) (n-3) (n-2) (n-1) n
                            pages.push("ellipsis");
                            for (let i = totalPages - 4; i <= totalPages; i++) {
                              pages.push(i);
                            }
                          } else {
                            // In the middle: 1 ... (c-1) c (c+1) ... last
                            pages.push("ellipsis");
                            for (
                              let i = currentPage - 1;
                              i <= currentPage + 1;
                              i++
                            ) {
                              pages.push(i);
                            }
                            pages.push("ellipsis");
                            pages.push(totalPages);
                          }
                        }

                        return pages.map((item, index) => {
                          if (item === "ellipsis") {
                            return (
                              <PaginationItem key={`ellipsis-${index}`}>
                                <PaginationEllipsis />
                              </PaginationItem>
                            );
                          }

                          return (
                            <PaginationItem key={item}>
                              <PaginationLink
                                href="#"
                                onClick={(e) => {
                                  e.preventDefault();
                                  setCurrentPage(item);
                                }}
                                isActive={currentPage === item}
                                className="cursor-pointer"
                              >
                                {item}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        });
                      })()}
                      <PaginationItem>
                        <PaginationNext
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            if (currentPage < totalPages) {
                              setCurrentPage(currentPage + 1);
                            }
                          }}
                          className={
                            currentPage === totalPages
                              ? "pointer-events-none opacity-50"
                              : "cursor-pointer"
                          }
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                  <div className="mt-2 text-center text-sm text-muted-foreground">
                    <Trans
                      id="Showing {start} to {end} of {total} chemicals"
                      message="Показване на {start} до {end} от {total} препарати"
                      values={{
                        start: startIndex + 1,
                        end: Math.min(endIndex, totalCount),
                        total: totalCount,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {(!allChemicals || allChemicals.length === 0) && (
            <div className="text-center py-8 text-muted-foreground">
              <Trans
                id="No chemicals added yet. Use the form above to add chemicals."
                message="Все още няма добавени препарати. Използвайте формата по-горе, за да добавите препарати."
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
