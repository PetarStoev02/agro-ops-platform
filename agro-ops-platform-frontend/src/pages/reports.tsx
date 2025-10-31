import { AuthenticatedLayout } from "@/src/shared/components/authenticated-layout";

export default function ReportsPage() {
  return (
    <AuthenticatedLayout>
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold">Reports & Analytics</h1>
      </div>
    </AuthenticatedLayout>
  );
}
