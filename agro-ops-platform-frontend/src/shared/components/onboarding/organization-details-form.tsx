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
import { toast } from "sonner";
import { useSyncOrganization } from "@/src/shared/hooks/use-sync-organization";

// Schema for organization details form
const getOrganizationDetailsSchema = (t: (msg: string) => string) =>
  z.object({
    name: z.string().min(1, t("Organization name is required")),
    municipality: z.string().min(1, t("Municipality is required")),
    settlement: z.string().min(1, t("Settlement is required")),
    address: z.string().min(1, t("Address is required")),
    agricultureDirectorate: z
      .string()
      .min(1, t("Agriculture Directorate is required")),
    regionalFoodSafetyDirectorate: z
      .string()
      .min(1, t("Regional Food Safety Directorate is required")),
    ekatteRegistration: z
      .string()
      .length(5, t("EKATTE registration must be exactly 5 digits"))
      .regex(/^\d+$/, t("EKATTE registration must contain only digits")),
  });

type OrganizationDetailsFormData = z.infer<
  ReturnType<typeof getOrganizationDetailsSchema>
>;

interface OrganizationDetailsFormProps {
  onSuccess?: () => void;
  initialData?: Partial<OrganizationDetailsFormData>;
  onSubmitRef?: React.MutableRefObject<(() => void) | null>;
}

// Bulgarian municipalities (common ones)
const BULGARIAN_MUNICIPALITIES = [
  "София",
  "Пловдив",
  "Варна",
  "Бургас",
  "Русе",
  "Стара Загора",
  "Плевен",
  "Сливен",
  "Добрич",
  "Шумен",
  "Перник",
  "Хасково",
  "Ямбол",
  "Кърджали",
  "Кюстендил",
  "Монтана",
  "Видин",
  "Враца",
  "Габрово",
  "Търговище",
  "Разград",
  "Силистра",
  "Търговище",
  "Ловеч",
  "Пазарджик",
  "Смолян",
  "Благоевград",
  "Кюстендил",
];

// Bulgarian directorates (common ones)
const AGRICULTURE_DIRECTORATES = [
  "София",
  "Пловдив",
  "Варна",
  "Бургас",
  "Русе",
  "Стара Загора",
  "Плевен",
  "Сливен",
  "Добрич",
  "Шумен",
];

export function OrganizationDetailsForm({
  onSuccess,
  initialData,
  onSubmitRef,
}: OrganizationDetailsFormProps) {
  const { organization } = useOrganization();
  const { isSyncing } = useSyncOrganization();
  const updateDetails = useMutation(
    api.organizations.updateOrganizationDetails,
  );
  const convexOrg = useQuery(
    api.organizations.getByClerkOrgId,
    organization?.id ? { clerkOrgId: organization.id } : "skip",
  );
  const { i18n } = useLingui();
  const t = (msg: string) => i18n._(msg);

  const form = useForm<OrganizationDetailsFormData>({
    resolver: zodResolver(getOrganizationDetailsSchema(t)),
    defaultValues: {
      name: initialData?.name || organization?.name || "",
      municipality: initialData?.municipality || "",
      settlement: initialData?.settlement || "",
      address: initialData?.address || "",
      agricultureDirectorate: initialData?.agricultureDirectorate || "",
      regionalFoodSafetyDirectorate:
        initialData?.regionalFoodSafetyDirectorate || "",
      ekatteRegistration: initialData?.ekatteRegistration || "",
    },
  });

  const onSubmit = async (data: OrganizationDetailsFormData) => {
    if (!organization?.id) {
      toast.error(t("Organization not found. Please try again."));
      return;
    }

    try {
      await updateDetails({
        clerkOrgId: organization.id,
        municipality: data.municipality,
        settlement: data.settlement,
        address: data.address,
        agricultureDirectorate: data.agricultureDirectorate,
        regionalFoodSafetyDirectorate: data.regionalFoodSafetyDirectorate,
        ekatteRegistration: data.ekatteRegistration,
      });
      toast.success(t("Organization details updated successfully"));
      onSuccess?.();
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : t("Failed to update organization details");
      toast.error(errorMessage);
    }
  };

  // Expose submit function via ref
  React.useEffect(() => {
    if (onSubmitRef) {
      onSubmitRef.current = () => {
        form.handleSubmit(onSubmit)();
      };
    }
  }, [onSubmitRef, form, onSubmit]);

  const isLoading = isSyncing || !convexOrg;

  return (
    <Form {...form}>
      <form
        id="org-details-form"
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                <Trans
                  id="Name of farm/organization"
                  message="Name of farm/organization"
                />
              </FormLabel>
              <FormControl>
                <Input placeholder={t("Enter organization name")} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="municipality"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                <Trans id="Municipality" message="Municipality" />
              </FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t("Select municipality")} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {BULGARIAN_MUNICIPALITIES.map((municipality) => (
                    <SelectItem key={municipality} value={municipality}>
                      {municipality}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="settlement"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                <Trans id="Settlement" message="Settlement" />
              </FormLabel>
              <FormControl>
                <Input placeholder={t("Enter settlement name")} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                <Trans id="Address" message="Address" />
              </FormLabel>
              <FormControl>
                <Input placeholder={t("Enter full address")} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="agricultureDirectorate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                <Trans
                  id="Directorate 'Agriculture'"
                  message="Directorate 'Agriculture'"
                />
              </FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={t("Select agriculture directorate")}
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {AGRICULTURE_DIRECTORATES.map((directorate) => (
                    <SelectItem key={directorate} value={directorate}>
                      {directorate}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="regionalFoodSafetyDirectorate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                <Trans
                  id="Regional Food Safety Directorate (ОДБХ)"
                  message="Regional Food Safety Directorate (ОДБХ)"
                />
              </FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={t("Select regional food safety directorate")}
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {AGRICULTURE_DIRECTORATES.map((directorate) => (
                    <SelectItem key={directorate} value={directorate}>
                      {directorate}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="ekatteRegistration"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                <Trans id="EKATTE Registration" message="EKATTE Registration" />
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="30822"
                  maxLength={5}
                  {...field}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "");
                    field.onChange(value);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="hidden">
          <button type="submit" />
        </div>
      </form>
    </Form>
  );
}
