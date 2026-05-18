import { describe, expect, it } from "vitest";

import { parseAnnouncementMessageContent } from "@/lib/announcements/message-content";

describe("announcement message content parser", () => {
  it("extracts a clickable image from anchor + img snippet", () => {
    const content = parseAnnouncementMessageContent(`
      <a href="https://calculaartesao.com.br" target="_blank">
        <img src="https://i.postimg.cc/0QCr506G/image.png" alt="Banner Calcula Artesao" />
      </a>
      Use o cupom LANCAMENTO30.
    `);

    expect(content.image).toEqual({
      href: "https://calculaartesao.com.br",
      src: "https://i.postimg.cc/0QCr506G/image.png",
      alt: "Banner Calcula Artesao",
    });
    expect(content.text).toBe("Use o cupom LANCAMENTO30.");
  });

  it("extracts a standalone image when there is no anchor", () => {
    const content = parseAnnouncementMessageContent(`
      <img src="https://i.postimg.cc/0QCr506G/image.png" alt="Cupom" />
      Promoção ativa até 24/05.
    `);

    expect(content.image).toEqual({
      href: null,
      src: "https://i.postimg.cc/0QCr506G/image.png",
      alt: "Cupom",
    });
    expect(content.text).toBe("Promoção ativa até 24/05.");
  });

  it("keeps text-only messages unchanged", () => {
    const content = parseAnnouncementMessageContent(
      "Use o cupom LANCAMENTO30 e clique em Ativar cupom.",
    );

    expect(content.image).toBeNull();
    expect(content.text).toBe("Use o cupom LANCAMENTO30 e clique em Ativar cupom.");
  });
});
