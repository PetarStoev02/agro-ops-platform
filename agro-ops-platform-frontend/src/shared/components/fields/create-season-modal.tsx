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
import { toast } from "sonner";
import { useSyncOrganization } from "@/src/shared/hooks/use-sync-organization";

// Schema will be created inside component to access i18n
const getCreateSeasonSchema = (t: (msg: string) => string) =>
  z.object({
    year: z
      .number()
      .int(t("Year must be an integer"))
      .min(2000, t("Year must be 2000 or later"))
      .max(2100, t("Year must be 2100 or earlier")),
  });

type CreateSeasonFormData = z.infer<ReturnType<typeof getCreateSeasonSchema>>;

interface CreateSeasonModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateSeasonModal({
  open,
  onOpenChange,
  onSuccess,
}: CreateSeasonModalProps) {
  const { organization } = useOrganization();
  const { isSyncing } = useSyncOrganization();
  const createSeason = useMutation(api.seasons.create);
  const convexOrg = useQuery(
    api.organizations.getByClerkOrgId,
    organization?.id ? { clerkOrgId: organization.id } : "skip",
  );
  const { i18n } = useLingui();
  const t = (msg: string) => i18n._(msg);

  const form = useForm<CreateSeasonFormData>({
    resolver: zodResolver(getCreateSeasonSchema(t)),
    defaultValues: {
      year: new Date().getFullYear(),
    },
  });

  const onSubmit = async (data: CreateSeasonFormData) => {
    if (!convexOrg?._id) {
      toast.error(i18n._("Organization not found. Please try again."));
      return;
    }

    try {
      await createSeason({
        organizationId: convexOrg._id,
        year: data.year,
        isActive: false,
      });
      toast.success(
        `Season ${data.year} / ${data.year + 1} created successfully`,
      );
      form.reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : i18n._("Failed to create season");
      toast.error(errorMessage);
    }
  };

  const isLoading = isSyncing || !convexOrg;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            <Trans id="Create New Season" message="Create New Season" />
          </DialogTitle>
          <DialogDescription>
            <Trans
              id="Create a new season by entering the year. The season will be named {year} / {nextYear}."
              message="Create a new season by entering the year. The season will be named {year} / {nextYear}."
              values={{
                year: form.watch("year")?.toString() || "",
                nextYear: form.watch("year")
                  ? (form.watch("year") + 1).toString()
                  : "",
              }}
            />
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="year"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    <Trans id="Year" message="Year" />
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="2024"
                      {...field}
                      onChange={(e) => {
                        const value = e.target.value;
                        field.onChange(value ? parseInt(value, 10) : undefined);
                      }}
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
                {isLoading ? (
                  <Trans id="Creating..." message="Creating..." />
                ) : (
                  <Trans id="Create Season" message="Create Season" />
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
