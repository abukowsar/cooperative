import Tools from "@/components/Tools";
import PageHeader from "@/components/PageHeader";

export const metadata = { title: "খামার টুলস · দুগ্ধ সমবায় পোর্টাল" };

export default function Page() {
  return (
    <>
      <PageHeader icon="calc" hue="teal" title="খামার টুলস"
        sub="ঋণের কিস্তি, দৈনিক খাদ্য, টিকার তারিখ, দুগ্ধজাত পণ্যের লাভ, বায়োগ্যাস ও মোটাতাজাকরণের হিসাব, সব এক জায়গায়।" />
      <Tools />
    </>
  );
}
