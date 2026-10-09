import Experts from "@/components/Experts";
import PageHeader from "@/components/PageHeader";

export const metadata = { title: "বিশেষজ্ঞ তালিকা · দুগ্ধ সমবায় পোর্টাল" };

export default function Page() {
  return (
    <>
      <PageHeader icon="users" hue="orange" title="বিশেষজ্ঞ তালিকা"
        sub="প্রাণিসম্পদ, ডেইরি ও সমবায় বিষয়ে অভিজ্ঞদের সাথে সরাসরি যোগাযোগ করুন।" />
      <Experts />
    </>
  );
}
