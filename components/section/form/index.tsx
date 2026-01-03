import ParallaxImage from "@/components/composites/ParallaxeImg";
import { SectionInner, SectionOuter } from "@/components/ui";
import type { FormSection } from "@/lib/validation/section";
import { FormRenderer } from "./FormRenderer";
export function Form(props: FormSection) {
  const { plxImg } = props;
  const hasParallax = Boolean(plxImg?.src);

  return (
    <SectionOuter bleed="x">
      <SectionInner layout="single" align="center">
        {hasParallax ? (
          <div className="grid w-full items-center gap-8 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
            <div className="hidden w-full justify-center md:flex">
              <ParallaxImage
                src={plxImg?.src ?? "/poses/frame-2.png"}
                alt={plxImg?.alt ?? "Parallax figure"}
                speed={0.35}
                maxShift={120}
                mouseFollowStrength={0.3}
              />
            </div>
            <div className="w-full">
              <FormRenderer config={props} />
            </div>
          </div>
        ) : (
          <div className="flex w-full items-center justify-center">
            <div className="w-full">
              <FormRenderer config={props} />
            </div>
          </div>
        )}
      </SectionInner>
    </SectionOuter>
  );
}
