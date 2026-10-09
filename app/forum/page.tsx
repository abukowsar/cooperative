import Forum from "@/components/Forum";
import PageHeader from "@/components/PageHeader";

export const metadata = { title: "সমস্যা ও পরামর্শ · দুগ্ধ সমবায় পোর্টাল" };

export default function Page() {
  return (
    <>
      <PageHeader icon="message" hue="sky" title="সমস্যা ও পরামর্শ"
        sub="গাভী পালনে যেকোনো সমস্যা লিখুন। প্রাণিসম্পদ বিশেষজ্ঞ, চিকিৎসক ও অভিজ্ঞ সমবায়ীরা পরামর্শ দেবেন।" />
      <Forum />
    </>
  );
}
