"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "convex/react";
import { Trans } from "@lingui/react";
import { useLingui } from "@lingui/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/src/shared/components/ui/button";
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
import { toast } from "sonner";

const getAddChemicalSchema = (t: (msg: string) => string) =>
  z.object({
    name: z.string().min(1, t("Chemical name is required")),
    dose: z.string().min(1, t("Dose is required")),
    dangerTypes: z.string().min(1, t("At least one danger type is required")),
  });

type AddChemicalFormData = z.infer<ReturnType<typeof getAddChemicalSchema>>;

export function AddChemicalForm() {
  const { i18n } = useLingui();
  const t = (msg: string) => i18n._(msg);
  const addChemical = useMutation(api.chemicals.addChemical);

  const form = useForm<AddChemicalFormData>({
    resolver: zodResolver(getAddChemicalSchema(t)),
    defaultValues: {
      name: "",
      dose: "",
      dangerTypes: "",
    },
  });

  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const onSubmit = async (data: AddChemicalFormData) => {
    setIsSubmitting(true);
    try {
      // Parse danger types (comma-separated or space-separated)
      const dangerTypesArray = data.dangerTypes
        .split(/[,;]/)
        .map((d) => d.trim())
        .filter(Boolean);

      if (dangerTypesArray.length === 0) {
        form.setError("dangerTypes", {
          message: t("At least one danger type is required"),
        });
        setIsSubmitting(false);
        return;
      }

      // The backend will handle duplicate logic automatically
      await addChemical({
        name: data.name.trim(),
        dose: data.dose.trim(),
        dangerTypes: dangerTypesArray,
      });

      toast.success(i18n._("Chemical added successfully"));

      // Reset form
      form.reset();
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : i18n._("Failed to add chemical");
      toast.error(errorMessage);
      console.error("Add chemical error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                <Trans id="Chemical Name" message="Име на препарат" />
              </FormLabel>
              <FormControl>
                <Input placeholder={i18n._("Enter chemical name")} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="dose"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                <Trans id="Dose" message="Доза" />
              </FormLabel>
              <FormControl>
                <Input placeholder={i18n._("e.g., 2.5 л/дка")} {...field} />
              </FormControl>
              <FormDescription>
                <Trans
                  id="Enter dose with unit (e.g., 2.5 л/дка)"
                  message="Въведете доза с мерна единица (напр. 2.5 л/дка)"
                />
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="dangerTypes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                <Trans id="Danger Types" message="Видове опасност" />
              </FormLabel>
              <FormControl>
                <Input placeholder={i18n._("e.g., A, B or A;B")} {...field} />
              </FormControl>
              <FormDescription>
                <Trans
                  id="Enter danger types separated by comma or semicolon (e.g., A, B or A;B)"
                  message="Въведете видовете опасност разделени със запетая или точка и запетая (напр. A, B или A;B)"
                />
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <Trans id="Adding..." message="Добавяне..." />
          ) : (
            <Trans id="Add Chemical" message="Add Chemical" />
          )}
        </Button>
      </form>
    </Form>
  );
}
