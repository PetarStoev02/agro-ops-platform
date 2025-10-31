import { AuthenticatedLayout } from "@/src/shared/components/authenticated-layout";

export default function DiariesPage() {
  return (
    <AuthenticatedLayout>
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold">Diaries for БАБХ</h1>
      </div>
    </AuthenticatedLayout>
  );
}
