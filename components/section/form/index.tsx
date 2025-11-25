import type { FormSection } from "@/lib/validation/section";
import Image from "next/image";
import { FormRenderer } from "./FormRenderer";
import { FormWrapper, Shell } from "./ui";
export function Form(props: FormSection) {
  return (
    <FormWrapper>
      <Shell>
        <div className="hidden h-full w-2xl md:block">
          <Image src="https://placehold.co/600x400/orange/white" alt="Placeholder" />
        </div>
        <FormRenderer config={props} />
      </Shell>
    </FormWrapper>
  );
}
