const SERVICE_SLOTS: Record<string, number> = {
    "jagoba-dev": 1,
    "lostielauncher-web": 2,
    "dotnet-mappers": 3,
    sharkord: 4,
};

const MAX_SLOTS = 8;

export function serviceSlots(services: string[]): Map<string, number> {
    const slots = new Map<string, number>();
    const used = new Set<number>();
    for (const service of services) {
        const slot = SERVICE_SLOTS[service];
        if (slot !== undefined) {
            slots.set(service, slot);
            used.add(slot);
        }
    }
    let next = 1;
    for (const service of [...services].sort()) {
        if (slots.has(service)) continue;
        while (used.has(next) && next <= MAX_SLOTS) next++;
        slots.set(service, Math.min(next, MAX_SLOTS));
        used.add(next);
    }
    return slots;
}

export function seriesColor(slot: number): string {
    return `var(--chart-series-${Math.min(Math.max(slot, 1), MAX_SLOTS)})`;
}

export function serviceLabel(service: string): string {
    return service.replace(/-/g, " ");
}

export interface DonutSegment {
    label: string;
    value: number;
    color: string;
}

export interface DonutArc extends DonutSegment {
    d: string;
    share: number;

    labelX: number;
    labelY: number;
}

function polar(cx: number, cy: number, r: number, angle: number): [number, number] {
    return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
}

export function donutArcs(
    segments: DonutSegment[],
    cx: number,
    cy: number,
    rOuter: number,
    rInner: number,
): DonutArc[] {
    const total = segments.reduce((sum, s) => sum + s.value, 0);
    if (total <= 0) return [];
    const gap = 2 / rOuter;
    let angle = -Math.PI / 2;
    return segments.map(segment => {
        const sweep = (segment.value / total) * Math.PI * 2;
        const start = angle + gap / 2;
        const end = angle + Math.max(sweep - gap / 2, gap);
        angle += sweep;
        const largeArc = end - start > Math.PI ? 1 : 0;
        const [x0, y0] = polar(cx, cy, rOuter, start);
        const [x1, y1] = polar(cx, cy, rOuter, end);
        const [x2, y2] = polar(cx, cy, rInner, end);
        const [x3, y3] = polar(cx, cy, rInner, start);
        const mid = (start + end) / 2;
        return {
            ...segment,
            share: segment.value / total,
            d: [
                `M ${x0.toFixed(2)} ${y0.toFixed(2)}`,
                `A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`,
                `L ${x2.toFixed(2)} ${y2.toFixed(2)}`,
                `A ${rInner} ${rInner} 0 ${largeArc} 0 ${x3.toFixed(2)} ${y3.toFixed(2)}`,
                "Z",
            ].join(" "),
            labelX: Math.cos(mid),
            labelY: Math.sin(mid),
        };
    });
}

export function columnPath(x: number, yTop: number, width: number, yBase: number, radius = 4): string {
    const h = yBase - yTop;
    if (h <= 0) return "";
    const r = Math.min(radius, width / 2, h);
    return [
        `M ${x} ${yBase}`,
        `V ${yTop + r}`,
        `Q ${x} ${yTop} ${x + r} ${yTop}`,
        `H ${x + width - r}`,
        `Q ${x + width} ${yTop} ${x + width} ${yTop + r}`,
        `V ${yBase}`,
        "Z",
    ].join(" ");
}

export function stackSegmentPath(x: number, yTop: number, width: number, yBottom: number, rounded: boolean): string {
    return rounded ? columnPath(x, yTop, width, yBottom) : `M ${x} ${yBottom} V ${yTop} H ${x + width} V ${yBottom} Z`;
}

export function yTicks(maxValue: number): number[] {
    if (maxValue <= 0) return [0];
    const rawStep = maxValue / 3;
    const magnitude = 10 ** Math.floor(Math.log10(rawStep));
    const step = [1, 2, 2.5, 5, 10].map(m => m * magnitude).find(s => s >= rawStep) ?? magnitude * 10;
    const ticks: number[] = [];
    for (let v = 0; v <= maxValue; v += step) ticks.push(v);
    const last = ticks[ticks.length - 1] ?? 0;
    if (last < maxValue) ticks.push(last + step);
    return ticks;
}
