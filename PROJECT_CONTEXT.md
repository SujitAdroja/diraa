# Diraa Website — Agent Context

Use this document as the starting context for any agent working on this repository. Read it together with `README.md`, then inspect the files relevant to the requested change before editing.

## Project summary

Diraa is a small, dependency-free static website for a bead jewellery and accessories brand. It has:

- A one-page homepage at `/`
- A filterable product collection page at `/collections`
- Shared catalog data that drives the homepage category links and the collection page
- Responsive layouts, a mobile menu, reveal animations, and a homepage image lightbox

There is no framework, package manager, compilation step, or generated source tree. The files inside `dist/` are the production files and should be edited directly.

## Repository structure

```text
.
├── .openai/hosting.json       # Static hosting configuration; serves dist/
├── PROJECT_CONTEXT.md         # This handoff document
├── README.md                  # Basic project and content notes
└── dist/
    ├── index.html             # Homepage markup and SEO metadata
    ├── styles.css             # Global styles and homepage styles
    ├── script.js              # Shared navigation, reveals, lightbox, current year
    ├── catalog.js             # Single source of truth for categories/products
    ├── home-categories.js     # Builds homepage category links from catalog.js
    ├── home-categories.css    # Homepage dynamic-category styles
    ├── collections/
    │   └── index.html         # Collection page markup and SEO metadata
    ├── collections.js         # Product rendering, filtering, URL state, count
    ├── collections.css        # Collection page styles and responsive layout
    ├── assets/images/         # Product, editorial, and brand imagery
    ├── favicon.png
    ├── apple-touch-icon.png
    ├── robots.txt
    └── sitemap.xml
```

## Run the site locally

From the repository root:

```sh
python3 -m http.server 8080 --directory dist
```

Open:

- Homepage: `http://localhost:8080/`
- Collections: `http://localhost:8080/collections/`

Do not open the HTML files directly with a `file://` URL. The site uses root-relative paths such as `/catalog.js` and `/assets/images/...`, so it needs to be served from `dist/` as the web root.

If a change does not appear, stop and restart the server with `Ctrl+C`, then perform a hard browser refresh (`Ctrl+Shift+R` on Linux/Windows or `Cmd+Shift+R` on macOS). Also confirm that the URL points to port `8080` and not a previously deployed version.

## Catalog architecture

`dist/catalog.js` is the single source of truth for collection categories and product records. It exposes immutable data as:

```js
window.DiraaCatalog = Object.freeze({ categories, products });
```

Each category has this shape:

```js
{
  label: "Necklaces",
  slug: "necklaces"
}
```

The special `all` category must remain present. Each product has this shape:

```js
{
  id: "necklace-edit-01",              // unique and stable
  title: "Necklace Edit 01",
  category: "necklaces",               // must match a category slug
  image: "/assets/images/example.webp", // root-relative path
  width: 900,                            // intrinsic image width
  height: 1350,                          // intrinsic image height
  alt: "Useful description of the image"
}
```

When adding a product:

1. Add its optimized image to `dist/assets/images/`.
2. Add one product object to the `products` array in `dist/catalog.js`.
3. Use a unique `id` and an existing category slug.
4. Supply accurate intrinsic `width` and `height` values to reduce layout shift.
5. Write meaningful `alt` text that describes the image rather than repeating the product title.
6. Verify both the unfiltered collection and its category filter.

When adding or renaming a category, update `categories` in `catalog.js` and ensure all affected product `category` fields use the same slug. Homepage category links and collection filter controls are created automatically from this array.

## Dynamic collection behavior

The collection page loads scripts in this order:

1. `/catalog.js`
2. `/script.js`
3. `/collections.js`

`dist/collections.js`:

- Reads `window.DiraaCatalog`
- Builds desktop filter buttons and the mobile category `<select>`
- Displays catalog-derived product counts beside every desktop category and in every mobile category option
- Renders product cards by mapping the matching objects from `catalog.products`
- Shows every catalog product for the `all` view; there is no fixed eight-product limit
- Filters products using `?category=<slug>`
- Updates browser history and supports back/forward navigation
- Derives the visible product count from `visibleProducts.length`
- Uses the singular label `product` for one result and `products` otherwise
- Shows the coming-soon empty state when a category has no products

The product count placeholder in `dist/collections/index.html` intentionally says `Loading products…`. Do not replace it with a hardcoded number. JavaScript replaces it with the current count from `catalog.js` during the initial render and after every filter change.

Examples:

```text
/collections                    -> all products
/collections?category=necklaces -> necklace products only
```

Invalid category query values are normalized back to the all-products view.

## Homepage data flow

The homepage loads scripts in this order:

1. `/catalog.js`
2. `/home-categories.js`
3. `/script.js`

`dist/home-categories.js` creates the numbered category navigation from every catalog category except `all`. The three large editorial category cards in `dist/index.html` are curated content and are not generated from the catalog.

## Design and implementation conventions

- Use plain HTML, CSS, and browser JavaScript; do not introduce a framework or build system unless the user explicitly requests it.
- Keep production code in `dist/`; there is no separate `src/` directory.
- Reuse the CSS custom properties at the top of `dist/styles.css` for brand colors, fonts, spacing, and header height.
- Preserve the visual language: editorial serif headings, compact uppercase sans-serif labels, rounded/arched image shapes, ivory backgrounds, blue text, and gold/terra/sage accents.
- Keep layouts responsive. Current collection breakpoints are `900px`, `700px`, and `480px`.
- Keep JavaScript dependency-free and defensive when selecting optional DOM elements.
- Preserve accessibility features: semantic headings, skip links, useful image alt text, visible focus styles, `aria-current`, `aria-expanded`, `aria-pressed`, the live product count, reduced-motion handling, and keyboard-operable buttons/dialogs.
- Use root-relative internal links and asset paths because `dist/` is the hosted web root.
- If the production domain changes, update canonical URLs, Open Graph URLs, JSON-LD, `robots.txt`, and `sitemap.xml` together.

## Validation checklist

There is currently no automated test suite or build command. After making changes:

1. Run `git diff --check`.
2. Review `git diff` and avoid overwriting unrelated user changes.
3. Serve `dist/` locally with the Python command above.
4. Check the homepage and `/collections/` at desktop and narrow/mobile widths.
5. On collections, test `All`, a populated category, and an empty category.
6. Confirm the URL query changes when filtering and browser back/forward restores the correct filter.
7. Confirm the product count matches the visible cards.
8. Check the browser console for JavaScript or missing-asset errors.
9. If metadata or routes changed, review `robots.txt`, `sitemap.xml`, canonical links, and Open Graph tags.

Useful repository checks:

```sh
git status --short
git diff --check
git diff
rg -n "DiraaCatalog|data-product-count|data-product-grid" dist
```

## Known content limitations

- Only supplied imagery is represented as product records; do not invent prices, SKUs, materials, stock status, or purchase links.
- Categories without catalog products intentionally show a coming-soon empty state.
- The verified Instagram profile is `https://www.instagram.com/diraa_by_r/`; it is linked from the homepage contact section and both page footers, and appears in the Organization JSON-LD `sameAs` list.
- Verified WhatsApp, email, and other contact destinations have not been supplied, so do not publish placeholder contact links.
- Licensed Canela and Helvetica Neue files were not supplied. The CSS uses system fallbacks and should not ship unlicensed font files.

## Guidance for future agents

Before editing, identify whether the request affects shared catalog data, one page, shared behavior, styles, assets, SEO, or hosting. Keep the scope focused and preserve existing user changes in the worktree. For collection-related tasks, start with `dist/catalog.js`, `dist/collections.js`, and `dist/collections/index.html`; for homepage category tasks, also inspect `dist/home-categories.js`.

Do not deploy, publish, commit, delete assets, or change the hosting project unless the user explicitly asks for that action. After completing work, report the exact files changed, the behavior implemented, and the checks performed.
