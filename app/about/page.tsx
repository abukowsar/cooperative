import { ACTS, bn } from "@/lib/shared";
import PageHeader from "@/components/PageHeader";

export const metadata = { title: "প্রকল্প ও যোগাযোগ · দুগ্ধ সমবায় পোর্টাল" };

const PARTNERS: [string, string[]][] = [
  ["বাস্তবায়নকারী", ["সমবায় অধিদপ্তর, পল্লী উন্নয়ন ও সমবায় বিভাগ"]],
  ["টেকনিক্যাল পার্টনার", ["প্রাণিসম্পদ অধিদপ্তর (DLS)", "মিল্কভিটা", "ব্র্যাক কৃত্রিম প্রজনন এন্টারপ্রাইজ"]],
  ["প্রশিক্ষণ পার্টনার", [
    "পল্লী উন্নয়ন একাডেমী (RDA), বগুড়া",
    "বাংলাদেশ পল্লী উন্নয়ন একাডেমী (বার্ড), কুমিল্লা",
    "বাংলাদেশ কৃষি বিশ্ববিদ্যালয়, ময়মনসিংহ",
    "চট্টগ্রাম ভেটেরিনারি ও এনিম্যাল সায়েন্সেস বিশ্ববিদ্যালয়",
    "রুরাল রিকনস্ট্রাকশন ফাউন্ডেশন (RRF)",
    "ইসিবি ফাউন্ডেশন",
    "ইনটেক এগ্রো লিমিটেড, বগুড়া",
    "রেশমা কৃষি উদ্যোগ, বগুড়া",
    "বাংলাদেশ সমবায় একাডেমী, কোটবাড়ী, কুমিল্লা ও অধীন ১০টি আঞ্চলিক সমবায় প্রশিক্ষণ ইন্সটিটিউট",
  ]],
  ["সহযোগী প্রতিষ্ঠান", ["কৃষি সম্প্রসারণ অধিদপ্তর", "যুব উন্নয়ন অধিদপ্তর", "ইডকল (IDCOL)", "সবুজ শক্তি", "বাংলাদেশ ডেইরি এন্ড ফ্যাটেনিং এসোসিয়েশন"]],
];

const LINKS = [
  ["https://www.facebook.com/share/g/1By3MpRsVw/", "ফেসবুক গ্রুপ: দুগ্ধ সমবায়ের কার্যক্রম সম্প্রসারণ প্রকল্প", "facebook.com/share/g/1By3MpRsVw"],
  ["https://youtube.com/@tofayelahamed9004", "ইউটিউব চ্যানেল: গাভী পালন বিষয়ক ভিডিও", "youtube.com/@tofayelahamed9004"],
  ["https://www.facebook.com/profile.php?id=61555812547446", "ফেসবুক আইডি: তোফায়েল আহম্মদ, প্রকল্প পরিচালক", "facebook.com/profile.php?id=61555812547446"],
];

export default function About() {
  return (
    <section className="page">
      <PageHeader icon="info" hue="brown" title="প্রকল্প পরিচিতি ও যোগাযোগ" sub="দুগ্ধ ঘাটতি উপজেলায় দুগ্ধ সমবায়ের কার্যক্রম সম্প্রসারণ প্রকল্প" />
      <p className="lede">
        দুগ্ধ চাষী ও খামারীদের সমবায় সমিতিতে সংগঠিত করে উন্নত জাতের গাভী পালনের মাধ্যমে দুধের উৎপাদন বাড়ানো এই প্রকল্পের মূল লক্ষ্য।
        প্রকল্পটি ৫০টি উপজেলায় চলছিল; সেপ্টেম্বরে প্রশাসনিক আদেশের পর এখন ৮১টি উপজেলায় বাস্তবায়িত হবে।
      </p>
      <div className="goals"><span>দুধের উৎপাদন বৃদ্ধি</span><span>কর্মসংস্থান সৃষ্টি</span><span>নারীর ক্ষমতায়ন</span></div>

      <h2>প্রকল্পের কার্যক্রম</h2>
      <ul className="acts">
        {ACTS.map((a, i) => <li key={a}><span className="n">{bn(i + 1)}</span><span>{a}</span></li>)}
      </ul>

      <h2>অংশীদার</h2>
      <div className="partners">
        {PARTNERS.map(([title, items]) => (
          <div className="pgroup" key={title}>
            <h3>{title}</h3>
            <ul>{items.map((p) => <li key={p}>{p}</li>)}</ul>
          </div>
        ))}
      </div>

      <h2>যোগাযোগ</h2>
      <div className="sign">
        <b>তোফায়েল আহম্মদ</b><br />
        প্রকল্প পরিচালক (যুগ্ম-নিবন্ধক), বিসিএস সমবায় ক্যাডার<br />
        <span className="hint">দুগ্ধ ঘাটতি উপজেলায় দুগ্ধ সমবায়ের কার্যক্রম সম্প্রসারণ প্রকল্প, সমবায় অধিদপ্তর</span>
      </div>
      <div className="links">
        {LINKS.map(([href, label, small]) => (
          <a key={href} href={href} target="_blank" rel="noopener noreferrer">{label}<small>{small}</small></a>
        ))}
      </div>
      <p className="hint">জেলা ও উপজেলা সমবায় অফিসারগণ আওতাধীন সমিতির সদস্যদের এই পোর্টালে যুক্ত করুন এবং &quot;সমিতির খাতা&quot; ব্যবহারে উৎসাহিত করুন।</p>
    </section>
  );
}
