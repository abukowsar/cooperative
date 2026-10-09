import Link from "next/link";
import Icon from "@/components/Icon";
import PageHeader from "@/components/PageHeader";
import { GUIDES } from "@/lib/content";

export const metadata = { title: "জ্ঞানভাণ্ডার · দুগ্ধ সমবায় পোর্টাল" };

export default function Learn() {
  return (
    <>
      <PageHeader icon="book" hue="leaf" title="জ্ঞানভাণ্ডার"
        sub="ঘাস চাষ, সাইলেজ, কেঁচো সার, নিরাপদ সবজি, পরিষ্কার দুধ দোহন ও বাছুরের যত্নের সহজ ধাপে ধাপে গাইড।" />
      <div className="chips no-print" style={{ marginBottom: 16 }}>
        {GUIDES.map((g) => <a key={g.id} href={`#${g.id}`} className="chip" style={{ textDecoration: "none", color: "inherit" }}>{g.title}</a>)}
      </div>
      <div className="guides">
        {GUIDES.map((g) => (
          <article key={g.id} id={g.id} className={`guide hue-${g.hue}`}>
            <header>
              <span><Icon name={g.icon} size={24} /></span>
              <h3>{g.title}</h3>
            </header>
            <p className="lead">{g.lead}</p>
            <ol>{g.steps.map((s) => <li key={s}>{s}</li>)}</ol>
          </article>
        ))}
      </div>
      <div className="notice" style={{ marginTop: 20 }}>
        আরও জানতে চান? <Link href="/forum">সমস্যা ও পরামর্শ</Link> বিভাগে প্রশ্ন করুন অথবা <Link href="/experts">বিশেষজ্ঞ তালিকা</Link> থেকে সরাসরি যোগাযোগ করুন।
      </div>
    </>
  );
}
