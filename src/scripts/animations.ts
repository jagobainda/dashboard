import { animate, stagger } from "animejs";

const motionOK = (): boolean => window.matchMedia("(prefers-reduced-motion: no-preference)").matches;

export function staggerCards(selector: string): void {
    const cards = document.querySelectorAll(selector);
    if (cards.length === 0 || !motionOK()) return;
    animate(cards, {
        opacity: [0, 1],
        translateY: [12, 0],
        duration: 500,
        delay: stagger(60),
        ease: "outQuad",
    });
}

export function countUp(el: HTMLElement, format: (value: number) => string): void {
    const target = Number(el.dataset.value ?? "0");
    if (!motionOK() || !Number.isFinite(target) || target === 0) return;
    const state = { value: 0 };
    animate(state, {
        value: target,
        duration: 900,
        ease: "outCubic",
        onUpdate: () => {
            el.textContent = format(Math.round(state.value));
        },
    });
}
