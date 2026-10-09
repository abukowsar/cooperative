import SamityGate from "@/components/samity/Gate";
import Ledger from "@/components/samity/Ledger";

export const metadata = { title: "সমিতির খাতা · দুগ্ধ সমবায় পোর্টাল" };

export default function Page() {
  return (
    <SamityGate>
      <Ledger />
    </SamityGate>
  );
}
