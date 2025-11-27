import { SectionInner, SectionOuter } from "@/components/ui";
import type { FormSection } from "@/lib/validation/section";
import Image from "next/image";
import { FormRenderer } from "./FormRenderer";
export function Form(props: FormSection) {
  return (
    <SectionOuter bleed="x">
      <SectionInner layout="single" align="center">
        <div className="flex h-full flex-row items-center justify-center">
          <div className="hidden md:block">
            <Image
              src="https://placehold.co/400x800/orange/white.png"
              alt="Placeholder"
              width={400}
              height={800}
            />
          </div>

          <FormRenderer config={props} />
        </div>
      </SectionInner>
    </SectionOuter>
  );
}
