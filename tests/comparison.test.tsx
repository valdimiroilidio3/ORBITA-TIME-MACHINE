// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Comparison } from "@/components/Comparison";

const prototype = {
  entry: "index",
  pages: [
    { slug: "index", title: "Início" },
    { slug: "servicos", title: "Serviços" },
    { slug: "contacto", title: "Contacto" },
  ],
};

afterEach(cleanup);

describe("BeforeAfterSlider (Comparison)", () => {
  it("apresenta as etiquetas de experiência atual e nova proposta", () => {
    render(
      <Comparison
        timeMachineId="tm_1"
        companyName="Casa do Rio"
        beforeDesktop="/api/artifacts/a1"
        captureSource="playwright"
        prototype={prototype}
      />,
    );
    expect(screen.getByText(/EXPERIÊNCIA ATUAL/)).toBeTruthy();
    expect(screen.getAllByText(/NOVA PROPOSTA/).length).toBeGreaterThan(0);
    expect(screen.getByAltText(/website atual de Casa do Rio/i)).toBeTruthy();
  });

  it("expõe um divisor acessível por teclado (role slider)", () => {
    render(
      <Comparison
        timeMachineId="tm_1"
        companyName="Casa do Rio"
        beforeDesktop="/api/artifacts/a1"
        captureSource="playwright"
        prototype={prototype}
      />,
    );
    const slider = screen.getByRole("slider", { name: /divisor de comparação/i });
    expect((slider as HTMLInputElement).value).toBe("50");
    fireEvent.change(slider, { target: { value: "80" } });
    expect((slider as HTMLInputElement).value).toBe("80");
    expect(screen.getByText(/Posição 80%/)).toBeTruthy();
  });

  it("permite alternar entre modos e dispositivo", () => {
    render(
      <Comparison
        timeMachineId="tm_1"
        companyName="Casa do Rio"
        beforeDesktop="/api/artifacts/a1"
        captureSource="playwright"
        prototype={prototype}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Lado a lado" }));
    expect(screen.getByRole("button", { name: "Lado a lado" }).getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(screen.getByRole("button", { name: "Mobile" }));
    expect(screen.getByRole("button", { name: "Mobile" }).getAttribute("aria-pressed")).toBe("true");
  });

  it("amplia a captura num diálogo modal", () => {
    render(
      <Comparison
        timeMachineId="tm_1"
        companyName="Casa do Rio"
        beforeDesktop="/api/artifacts/a1"
        captureSource="playwright"
        prototype={prototype}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /ampliar captura/i }));
    expect(screen.getByRole("dialog", { name: /captura do website atual ampliada/i })).toBeTruthy();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("mostra estado alternativo quando não existe captura do site atual", () => {
    render(
      <Comparison
        timeMachineId="tm_1"
        companyName="Casa do Rio"
        captureSource="none"
        prototype={prototype}
      />,
    );
    expect(screen.getByText(/SEM CAPTURA DO WEBSITE ATUAL/)).toBeTruthy();
    expect(screen.getByText(/Nenhuma imagem é fabricada/i)).toBeTruthy();
    expect(screen.queryByRole("slider")).toBeNull();
    const currentButton = screen.getByRole("button", { name: "Site atual" }) as HTMLButtonElement;
    expect(currentButton.disabled).toBe(true);
  });

  it("bloqueia a comparação quando não existe protótipo", () => {
    render(
      <Comparison
        timeMachineId="tm_1"
        companyName="Casa do Rio"
        beforeDesktop="/api/artifacts/a1"
        captureSource="playwright"
        prototype={null}
      />,
    );
    expect(screen.getByText(/Ainda não existe protótipo gerado/i)).toBeTruthy();
  });

  it("carrega o protótipo num iframe isolado com sandbox", () => {
    const { container } = render(
      <Comparison
        timeMachineId="tm_1"
        companyName="Casa do Rio"
        beforeDesktop="/api/artifacts/a1"
        captureSource="playwright"
        prototype={prototype}
      />,
    );
    const iframe = container.querySelector("iframe")!;
    expect(iframe.getAttribute("src")).toBe("/api/prototype/tm_1/index");
    expect(iframe.getAttribute("sandbox")).toBe("allow-scripts");
  });
});
