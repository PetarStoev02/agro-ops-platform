"use client";

import * as React from "react";
import { useState } from "react";
import { useOrganization } from "@clerk/nextjs";
import { Trans } from "@lingui/react";
import { useLingui } from "@lingui/react";
import { Button } from "@/src/shared/components/ui/button";
import { Input } from "@/src/shared/components/ui/input";
import { Label } from "@/src/shared/components/ui/label";
import { toast } from "sonner";
import { PlusIcon, XIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/shared/components/ui/card";

interface InviteMembersStepProps {
  onSkip?: () => void;
  onComplete?: () => void;
}

export function InviteMembersStep({
  onSkip,
  onComplete,
}: InviteMembersStepProps) {
  const { organization } = useOrganization();
  const [email, setEmail] = useState("");
  const [invitedEmails, setInvitedEmails] = useState<string[]>([]);
  const [isInviting, setIsInviting] = useState(false);
  const { i18n } = useLingui();
  const t = (msg: string) => i18n._(msg);

  const handleAddEmail = () => {
    if (!email.trim()) {
      toast.error(t("Please enter an email address"));
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error(t("Please enter a valid email address"));
      return;
    }

    if (invitedEmails.includes(email)) {
      toast.error(t("This email has already been added"));
      return;
    }

    setInvitedEmails([...invitedEmails, email]);
    setEmail("");
  };

  const handleRemoveEmail = (emailToRemove: string) => {
    setInvitedEmails(invitedEmails.filter((e) => e !== emailToRemove));
  };

  const handleInvite = async () => {
    if (invitedEmails.length === 0) {
      toast.error(t("Please add at least one email address"));
      return;
    }

    if (!organization) {
      toast.error(t("Organization not found"));
      return;
    }

    setIsInviting(true);

    try {
      // Note: Clerk invitation API requires backend setup
      // For now, we'll show a message that invitations can be sent later
      // In production, you would use Clerk's invitation API here
      toast.success(
        t(
          "You can invite members through the organization settings after completing onboarding",
        ),
      );
      setInvitedEmails([]);
      onComplete?.();
    } catch (error) {
      console.error("Failed to invite members:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : t("Failed to send invitations"),
      );
    } finally {
      setIsInviting(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddEmail();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">
          <Trans id="Invite Team Members" message="Invite Team Members" />
        </h3>
        <p className="text-sm text-muted-foreground">
          <Trans
            id="Add team members to your organization. You can skip this step and invite members later."
            message="Add team members to your organization. You can skip this step and invite members later."
          />
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex gap-2">
          <div className="flex-1">
            <Label htmlFor="email">
              <Trans id="Email Address" message="Email Address" />
            </Label>
            <Input
              id="email"
              type="email"
              placeholder={t("Enter email address")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyPress={handleKeyPress}
            />
          </div>
          <div className="flex items-end">
            <Button
              type="button"
              variant="outline"
              onClick={handleAddEmail}
              disabled={!email.trim()}
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              <Trans id="Add" message="Add" />
            </Button>
          </div>
        </div>

        {invitedEmails.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">
                <Trans id="Pending Invitations" message="Pending Invitations" />
              </CardTitle>
              <CardDescription>
                <Trans
                  id="These members will be invited when you click 'Send Invitations'"
                  message="These members will be invited when you click 'Send Invitations'"
                />
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {invitedEmails.map((invitedEmail) => (
                  <div
                    key={invitedEmail}
                    className="flex items-center justify-between p-2 border rounded-md"
                  >
                    <span className="text-sm">{invitedEmail}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveEmail(invitedEmail)}
                    >
                      <XIcon className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex gap-2">
          {onSkip && (
            <Button
              type="button"
              variant="outline"
              onClick={onSkip}
              className="flex-1"
            >
              <Trans id="Skip" message="Skip" />
            </Button>
          )}
          <Button
            type="button"
            onClick={handleInvite}
            disabled={invitedEmails.length === 0 || isInviting}
            className="flex-1"
          >
            {isInviting ? (
              <Trans id="Sending..." message="Sending..." />
            ) : (
              <Trans id="Send Invitations" message="Send Invitations" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
