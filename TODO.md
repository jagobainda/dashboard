# TODO

Pending setup tasks. Delete each line once done.

## Assets

- [ ] Replace the template favicon/og-image with dashboard-specific ones
      (`public/imgs/favicon/favicon.ico`, `favicon.png`, `og-image.png`).

## Follow-ups

- [ ] Consider adding `@astrojs/check` + `typescript` to run `astro check` in CI
      (the template CI only runs build + format).
- [ ] When there are enough days of data, review the `labelEvery` density of the
      "Visitas por día" axis and consider a date-range filter row above the charts.

## Icons (when you need them)

`astro-icon` is installed but ships no icon data. For each Iconify set you use,
install its package, e.g. `npm i @iconify-json/bi`, then `<Icon name="bi:github" />`.
Alternatively drop local SVGs into `src/icons/` and use `<Icon name="my-icon" />`.
