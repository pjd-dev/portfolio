import { usePathname } from "next/navigation";
export function usePage() {
  const pathname = usePathname() ?? "";
  const segments = pathname.split("/").filter(Boolean);
  const lang = segments[0] ?? "";
  const page = segments.length > 1 ? `/${segments.slice(1).join("/")}` : "/";
  return { lang, page };
}
