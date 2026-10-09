import Icon from "./Icon";
import type { IconName } from "@/lib/content";

export default function PageHeader({ icon, hue, title, sub, children }: {
  icon: IconName; hue: string; title: string; sub?: string; children?: React.ReactNode;
}) {
  return (
    <div className={`phead hue-${hue}`}>
      <span className="ic"><Icon name={icon} size={28} /></span>
      <div>
        <h1>{title}</h1>
        {sub && <p>{sub}</p>}
      </div>
      {children && <div className="phead-extra">{children}</div>}
    </div>
  );
}
