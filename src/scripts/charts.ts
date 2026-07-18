interface TooltipRow {
    label: string;
    value: string;
    color?: string;
}

interface TooltipPayload {
    title: string;
    rows: TooltipRow[];
}

let tooltip: HTMLDivElement | null = null;

function ensureTooltip(): HTMLDivElement {
    if (tooltip) return tooltip;
    tooltip = document.createElement("div");
    tooltip.className =
        "pointer-events-none fixed z-50 hidden max-w-72 rounded-md bg-(--bg-secondary) px-3 py-2 text-sm text-(--text-color) shadow-[4px_4px_8px_var(--shadow-dark)]";
    tooltip.setAttribute("role", "status");
    document.body.appendChild(tooltip);
    return tooltip;
}

function renderTooltip(payload: TooltipPayload): void {
    const el = ensureTooltip();
    el.replaceChildren();
    const title = document.createElement("div");
    title.className = "mb-1 font-mono text-xs text-(--text-muted)";
    title.textContent = payload.title;
    el.appendChild(title);
    for (const row of payload.rows) {
        const line = document.createElement("div");
        line.className = "flex items-center gap-2";
        if (row.color) {
            const key = document.createElement("span");
            key.className = "inline-block h-0.5 w-3 shrink-0 rounded-full";
            key.style.background = row.color;
            line.appendChild(key);
        }
        const value = document.createElement("span");
        value.className = "font-bold";
        value.textContent = row.value;
        const label = document.createElement("span");
        label.className = "text-(--text-muted)";
        label.textContent = row.label;
        line.append(value, label);
        el.appendChild(line);
    }
    el.classList.remove("hidden");
}

function moveTooltip(x: number, y: number): void {
    if (!tooltip) return;
    const rect = tooltip.getBoundingClientRect();
    const left = Math.min(x + 14, window.innerWidth - rect.width - 8);
    const top = Math.min(y + 14, window.innerHeight - rect.height - 8);
    tooltip.style.left = `${Math.max(left, 8)}px`;
    tooltip.style.top = `${Math.max(top, 8)}px`;
}

function hideTooltip(): void {
    tooltip?.classList.add("hidden");
}

function payloadFrom(mark: Element): TooltipPayload | null {
    const raw = mark.getAttribute("data-tooltip");
    if (!raw) return null;
    try {
        return JSON.parse(raw) as TooltipPayload;
    } catch {
        return null;
    }
}

export function attachChartTooltips(root: ParentNode = document): void {
    for (const mark of root.querySelectorAll<Element>("[data-tooltip]:not([data-tooltip-wired])")) {
        mark.setAttribute("data-tooltip-wired", "");
        mark.addEventListener("pointerenter", event => {
            const payload = payloadFrom(mark);
            if (!payload) return;
            renderTooltip(payload);
            const e = event as PointerEvent;
            moveTooltip(e.clientX, e.clientY);
        });
        mark.addEventListener("pointermove", event => {
            const e = event as PointerEvent;
            moveTooltip(e.clientX, e.clientY);
        });
        mark.addEventListener("pointerleave", hideTooltip);
        mark.addEventListener("focus", () => {
            const payload = payloadFrom(mark);
            if (!payload) return;
            renderTooltip(payload);
            const rect = mark.getBoundingClientRect();
            moveTooltip(rect.left + rect.width / 2, rect.top);
        });
        mark.addEventListener("blur", hideTooltip);
    }
}
