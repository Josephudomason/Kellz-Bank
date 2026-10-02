import Image from "next/image";
import logo from "@/app/KellzBank.png";

export default function BrandLogo({ className }: { className: string }) {
  return (
    <span className={`relative block shrink-0 overflow-hidden ${className}`}>
      <Image src={logo} alt="Kellz Bank" fill sizes="140px" loading="eager" className="object-cover" />
    </span>
  );
}