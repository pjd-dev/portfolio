import clsx from "clsx";
import { WildWorld, CondeSans } from "../fonts";
import { getDictionary } from "@/lib/getDictionary";
import ParallaxImage from "../../components/parallaxImg";
import LanguageToggle from "../../components/LanguageToggle";
export default async function Page({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);
  return (
    <main className="h-screen bg-black ">
      <section className="absolute top-0 h-screen overflow-hidden grid place-items-center w-full ">
        {/* Parallax layer (client-only render) */}
        <ParallaxImage
          src="/poses/jump.webp"
          alt={dictionary.img.background.alt}
        />
      </section>
      <div className="absolute h-full w-full">
        <h1
          className={clsx(
            CondeSans.className,
            " text-[#eaeaea] tracking-[0.5px] font-semibold text-[40vw] md:text-[15vw] select-none wrap-break-word",
          )}
        >
          {dictionary.name}
        </h1>
        <h2
          className={clsx(
            WildWorld.className,
            "absolute left-[5vw] bottom-[6vh] text-[#eaeaea] tracking-[0.5px] font-semibold text-[6vw] select-none",
          )}
        >
          {dictionary.title}
        </h2>
      </div>

      <div className="absolute flex flex-col md:flex-row-reverse right-0 w-full md:top-1/2  items-center gap-4 md:gap-8 lg:gap-12 p-4 md:p-8 lg:p-12 ">
        {/*<button>
          <a
            className="glass-button"
            href="https://www.linkedin.com/in/jean-darry-p"
            target="_blank"
            rel="noopener noreferrer"
          >
            {dictionary.buttons.hireMe}
          </a>
        </button>*/}
      </div>
      <div className="  absolute top-20 right-4 md:right-8 lg:right-12 ">
        <LanguageToggle locale={lang as "en" | "fr"} />
      </div>
    </main>
  );
}
