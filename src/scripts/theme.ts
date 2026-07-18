const STORAGE_KEY = "theme";

export function initThemeToggle(button: HTMLElement): void {
    button.addEventListener("click", () => {
        const dark = document.body.classList.toggle("dark");
        localStorage.setItem(STORAGE_KEY, dark ? "dark" : "light");
        button.setAttribute("aria-pressed", String(dark));
    });
    button.setAttribute("aria-pressed", String(document.body.classList.contains("dark")));
}
