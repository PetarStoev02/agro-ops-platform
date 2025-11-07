"use client";

import { useQuery, useAction } from "convex/react";
import { useOrganization } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { Trans } from "@lingui/react";
import { Button } from "@/src/shared/components/ui/button";
import { Card, CardContent } from "@/src/shared/components/ui/card";
import { FileText, Edit, Loader2 } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

export function OrganizationProfile() {
  const { organization } = useOrganization();
  const navigate = useNavigate();
  const [isGenerating, setIsGenerating] = useState(false);

  const convexOrg = useQuery(
    api.organizations.getByClerkOrgId,
    organization?.id ? { clerkOrgId: organization.id } : "skip",
  );

  const generateBABH = useAction(api.babhDocument.generateBABHDocument);

  if (!convexOrg) {
    return null;
  }

  const handleEditProfile = () => {
    // Navigate to profile edit page or open modal
    // For now, we'll navigate to onboarding to edit
    navigate({ to: "/onboarding" });
  };

  const handleGenerateBABH = async () => {
    if (!organization?.id) {
      toast.error("Organization not found");
      return;
    }

    setIsGenerating(true);
    try {
      const result = await generateBABH({
        clerkOrgId: organization.id,
      });

      // Convert base64 to blob and download
      const binaryString = atob(result.document);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = result.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("BABH document generated successfully");
    } catch (error) {
      console.error("Error generating BABH document:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to generate BABH document"
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Single Card with All Data */}
      <Card>
        <CardContent className="p-6">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Left Column */}
            <div className="space-y-4">
              <div className="flex justify-between items-start py-2 border-b">
                <span className="font-medium text-muted-foreground">
                  <Trans id="Farm Name" message="Farm Name" />:
                </span>
                <span className="font-bold text-right">{convexOrg.name}</span>
              </div>
              <div className="flex justify-between items-start py-2 border-b">
                <span className="font-medium text-muted-foreground">
                  <Trans id="Municipality" message="Municipality" />:
                </span>
                <span className="font-bold text-right">
                  {convexOrg.municipality || "-"}
                </span>
              </div>
              <div className="flex justify-between items-start py-2 border-b">
                <span className="font-medium text-muted-foreground">
                  <Trans id="Settlement" message="Settlement" />:
                </span>
                <span className="font-bold text-right">
                  {convexOrg.settlement || "-"}
                </span>
              </div>
              <div className="flex justify-between items-start py-2">
                <span className="font-medium text-muted-foreground">
                  <Trans id="Address" message="Address" />:
                </span>
                <span className="font-bold text-right">
                  {convexOrg.address || "-"}
                </span>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div className="flex justify-between items-start py-2 border-b">
                <span className="font-medium text-muted-foreground">
                  <Trans
                    id="Directorate 'Agriculture'"
                    message="Directorate 'Agriculture'"
                  />
                  :
                </span>
                <span className="font-bold text-right">
                  {convexOrg.agricultureDirectorate || "-"}
                </span>
              </div>
              <div className="flex justify-between items-start py-2 border-b">
                <span className="font-medium text-muted-foreground">
                  <Trans id="(ОДБХ)" message="(ОДБХ)" />:
                </span>
                <span className="font-bold text-right">
                  {convexOrg.regionalFoodSafetyDirectorate || "-"}
                </span>
              </div>
              <div className="flex justify-between items-start py-2">
                <span className="font-medium text-muted-foreground">
                  <Trans
                    id="EKATTE Registration"
                    message="EKATTE Registration"
                  />
                  :
                </span>
                <div className="flex gap-1">
                  {convexOrg.ekatteRegistration ? (
                    convexOrg.ekatteRegistration.split("").map((digit, idx) => (
                      <div
                        key={idx}
                        className="flex h-8 w-8 items-center justify-center rounded border bg-background font-bold"
                      >
                        {digit}
                      </div>
                    ))
                  ) : (
                    <span className="font-bold">-</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Button
            variant="outline"
            className="w-full"
            onClick={handleGenerateBABH}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileText className="mr-2 h-4 w-4" />
            )}
            <Trans
              id="Generate home page for BABH"
              message="Generate home page for BABH"
            />
          </Button>
        </div>
        <Button className="w-full sm:w-auto" onClick={handleEditProfile}>
          <Edit className="mr-2 h-4 w-4" />
          <Trans id="EDIT PROFILE" message="EDIT PROFILE" />
        </Button>
      </div>
    </div>
  );
}
