import Training from "@/components/Training";
import PageHeader from "@/components/PageHeader";

export const metadata = { title: "প্রশিক্ষণ · দুগ্ধ সমবায় পোর্টাল" };

export default function Page() {
  return (
    <>
      <PageHeader icon="grad" hue="violet" title="গাভী পালন প্রশিক্ষণ"
        sub="আরডিএ, বার্ড, সমবায় একাডেমী ও আঞ্চলিক প্রশিক্ষণ ইন্সটিটিউটের আসন্ন প্রশিক্ষণ দেখুন এবং অনলাইনে নাম নিবন্ধন করুন।" />
      <Training />
    </>
  );
}
