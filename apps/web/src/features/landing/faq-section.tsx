import { Container } from "@bermula/design-system/components/layout/container";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@bermula/design-system/components/ui/accordion";

import { SectionHeading } from "../../components/section-heading";
import { FAQ_ITEMS } from "./faq-items";

export const FaqSection = () => (
  <section
    aria-labelledby="faq-title"
    className="bg-muted/40 py-20 md:py-24"
    id="faq"
  >
    <Container className="flex max-w-3xl flex-col gap-10">
      <SectionHeading
        eyebrow="FAQ"
        id="faq-title"
        title="Pertanyaan yang sering diajukan"
      />
      <Accordion>
        {FAQ_ITEMS.map(({ answer, question }) => (
          <AccordionItem key={question}>
            <AccordionTrigger className="text-base">
              {question}
            </AccordionTrigger>
            {/* `keepMounted`: jawaban tetap ada di HTML SSR (tersembunyi) agar
                terbaca crawler dan cocok dengan JSON-LD FAQPage. */}
            <AccordionContent className="text-muted-foreground" keepMounted>
              <p>{answer}</p>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </Container>
  </section>
);
