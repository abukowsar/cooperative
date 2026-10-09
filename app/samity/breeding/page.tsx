import SamityGate from "@/components/samity/Gate";
import Breeding from "@/components/samity/Breeding";

export const metadata = { title: "প্রজনন ক্যালেন্ডার · দুগ্ধ সমবায় পোর্টাল" };

export default function Page() {
  return (
    <SamityGate icon="heart" hue="rose" title="প্রজনন ক্যালেন্ডার">
      <Breeding />
    </SamityGate>
  );
}
