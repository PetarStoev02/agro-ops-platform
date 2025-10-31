import { AuthenticatedLayout } from "@/src/shared/components/authenticated-layout";

export default function ImportsExportsPage() {
  return (
    <AuthenticatedLayout>
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold">Imports & Exports</h1>
      </div>
    </AuthenticatedLayout>
  );
}
