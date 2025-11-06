"use client";

import * as React from "react";
import { useState } from "react";
import { useOrganization, useOrganizationList } from "@clerk/nextjs";
import { Trans } from "@lingui/react";
import { useLingui } from "@lingui/react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/src/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/shared/components/ui/card";
import { Progress } from "@/src/shared/components/ui/progress";
import { Input } from "@/src/shared/components/ui/input";
import { Label } from "@/src/shared/components/ui/label";
import { toast } from "sonner";
import { useSyncOrganization } from "@/src/shared/hooks/use-sync-organization";
import { OrganizationDetailsForm } from "./organization-details-form";
import { InviteMembersStep } from "./invite-members-step";
import { LanguageSwitcher } from "@/src/shared/components/language-switcher";
import { CheckCircle2Icon } from "lucide-react";

// Helper component for org details step
function OrgDetailsStepContent({
  onSuccess,
  onSkip,
}: {
  onSuccess: () => void;
  onSkip: () => void;
}) {
  const submitRef = React.useRef<(() => void) | null>(null);

  return (
    <>
      <OrganizationDetailsForm onSuccess={onSuccess} onSubmitRef={submitRef} />
      <div className="flex justify-end gap-2">
        <Button type="button" onClick={onSkip} variant="outline">
          <Trans id="Skip" message="Skip" />
        </Button>
        <Button
          type="button"
          onClick={() => {
            if (submitRef.current) {
              submitRef.current();
            }
          }}
        >
          <Trans id="Next" message="Next" />
        </Button>
      </div>
    </>
  );
}

interface OnboardingWizardProps {
  onComplete: () => void;
}

type Step = "create-org" | "org-details" | "invite-members" | "complete";

const STEPS: Step[] = ["create-org", "org-details", "invite-members"];

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState<Step>("create-org");
  const [orgName, setOrgName] = useState("");
  const [isCreatingOrg, setIsCreatingOrg] = useState(false);
  const { organization, isLoaded: orgLoaded } = useOrganization();
  const { createOrganization, setActive } = useOrganizationList();
  const { isSyncing } = useSyncOrganization();
  const markAsOnboarded = useMutation(api.organizations.markAsOnboarded);
  const convexOrg = useQuery(
    api.organizations.getByClerkOrgId,
    organization?.id ? { clerkOrgId: organization.id } : "skip",
  );
  const { i18n } = useLingui();
  const t = (msg: string) => i18n._(msg);

  const currentStepIndex = STEPS.indexOf(currentStep);
  const progress = ((currentStepIndex + 1) / STEPS.length) * 100;

  const handleCreateOrganization = async () => {
    if (!orgName.trim()) {
      toast.error(t("Please enter an organization name"));
      return;
    }

    if (!createOrganization) {
      toast.error(t("Organization creation is not available"));
      return;
    }

    setIsCreatingOrg(true);

    try {
      // Create organization without slug (slugs not enabled in Clerk)
      const newOrg = await createOrganization({
        name: orgName.trim(),
      });

      if (newOrg) {
        await setActive({ organization: newOrg.id });
        toast.success(t("Organization created successfully"));
        setCurrentStep("org-details");
      }
    } catch (error) {
      console.error("Failed to create organization:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : t("Failed to create organization"),
      );
    } finally {
      setIsCreatingOrg(false);
    }
  };

  const handleOrgDetailsComplete = () => {
    setCurrentStep("invite-members");
  };

  const handleInviteComplete = async () => {
    if (!organization?.id) {
      toast.error(t("Organization not found"));
      return;
    }

    try {
      await markAsOnboarded({ clerkOrgId: organization.id });
      setCurrentStep("complete");
      toast.success(t("Onboarding completed successfully"));

      // Wait a moment then redirect
      setTimeout(() => {
        onComplete();
      }, 1500);
    } catch (error) {
      console.error("Failed to mark as onboarded:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : t("Failed to complete onboarding"),
      );
    }
  };

  const handleSkipInvite = async () => {
    if (!organization?.id) {
      toast.error(t("Organization not found"));
      return;
    }

    try {
      await markAsOnboarded({ clerkOrgId: organization.id });
      setCurrentStep("complete");
      toast.success(t("Onboarding completed successfully"));

      setTimeout(() => {
        onComplete();
      }, 1500);
    } catch (error) {
      console.error("Failed to mark as onboarded:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : t("Failed to complete onboarding"),
      );
    }
  };

  if (currentStep === "complete") {
    return (
      <div className="relative flex min-h-screen items-center justify-center">
        <div className="absolute top-4 right-4 z-10">
          <LanguageSwitcher />
        </div>
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2Icon className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle>
              <Trans id="Onboarding Complete!" message="Onboarding Complete!" />
            </CardTitle>
            <CardDescription>
              <Trans
                id="Your organization has been set up successfully. Redirecting to dashboard..."
                message="Your organization has been set up successfully. Redirecting to dashboard..."
              />
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center p-4">
      <div className="absolute top-4 right-4 z-10">
        <LanguageSwitcher />
      </div>
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="mb-4">
            <div className="mb-2 flex items-center justify-between">
              <CardTitle>
                <Trans
                  id="Welcome to Agro Ops Platform"
                  message="Welcome to Agro Ops Platform"
                />
              </CardTitle>
              <span className="text-sm text-muted-foreground">
                {currentStepIndex + 1} / {STEPS.length}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
          <CardDescription>
            {currentStep === "create-org" && (
              <Trans
                id="Let's get started by creating your organization"
                message="Let's get started by creating your organization"
              />
            )}
            {currentStep === "org-details" && (
              <Trans
                id="Please provide your organization details"
                message="Please provide your organization details"
              />
            )}
            {currentStep === "invite-members" && (
              <Trans
                id="Invite team members to your organization (optional)"
                message="Invite team members to your organization (optional)"
              />
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {currentStep === "create-org" && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="org-name">
                  <Trans id="Organization Name" message="Organization Name" />
                </Label>
                <Input
                  id="org-name"
                  placeholder={t("Enter organization name")}
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      handleCreateOrganization();
                    }
                  }}
                />
              </div>
              <Button
                onClick={handleCreateOrganization}
                disabled={!orgName.trim() || isCreatingOrg}
                className="w-full"
              >
                {isCreatingOrg ? (
                  <Trans id="Creating..." message="Creating..." />
                ) : (
                  <Trans
                    id="Create Organization"
                    message="Create Organization"
                  />
                )}
              </Button>
            </div>
          )}

          {currentStep === "org-details" && (
            <div className="space-y-4">
              {(!orgLoaded || isSyncing || !convexOrg) && (
                <div className="text-center text-sm text-muted-foreground">
                  <Trans
                    id="Loading organization..."
                    message="Loading organization..."
                  />
                </div>
              )}
              {orgLoaded && !isSyncing && convexOrg && (
                <OrgDetailsStepContent
                  onSuccess={handleOrgDetailsComplete}
                  onSkip={() => setCurrentStep("invite-members")}
                />
              )}
            </div>
          )}

          {currentStep === "invite-members" && (
            <div className="space-y-4">
              <InviteMembersStep
                onSkip={handleSkipInvite}
                onComplete={handleInviteComplete}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
