import { AuthenticatedLayout } from "@/src/shared/components/authenticated-layout";

export default function AuditsPage() {
  return (
    <AuthenticatedLayout>
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold">Audits & Compliance</h1>
      </div>
    </AuthenticatedLayout>
  );
}
