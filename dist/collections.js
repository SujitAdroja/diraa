(function () {
  const catalog = window.DiraaCatalog;
  const buttonGroup = document.querySelector("[data-category-buttons]");
  const select = document.querySelector("[data-category-select]");
  const grid = document.querySelector("[data-product-grid]");
  const count = document.querySelector("[data-product-count]");
  const emptyState = document.querySelector("[data-empty-state]");
  const viewAll = document.querySelector("[data-view-all]");

  if (!catalog || !buttonGroup || !select || !grid || !count || !emptyState) return;

  const { categories, products } = catalog;
  const validSlugs = new Set(categories.map((category) => category.slug));
  const categoryLabels = new Map(categories.map((category) => [category.slug, category.label]));
  const categoryProductCounts = new Map(categories.map((category) => [category.slug, 0]));

  products.forEach((product) => {
    if (product.category === "all") return;
    if (!categoryProductCounts.has(product.category)) return;
    categoryProductCounts.set(product.category, categoryProductCounts.get(product.category) + 1);
  });
  categoryProductCounts.set("all", products.length);

  const getCategoryFromUrl = () => {
    const requested = new URLSearchParams(window.location.search).get("category");
    return requested && validSlugs.has(requested) && requested !== "all" ? requested : "all";
  };

  const writeUrl = (slug, mode) => {
    const url = new URL(window.location.href);
    url.pathname = "/collections";
    if (slug === "all") url.searchParams.delete("category");
    else url.searchParams.set("category", slug);
    window.history[mode]({}, "", `${url.pathname}${url.search}${url.hash}`);
  };

  const productCard = (product) => {
    const article = document.createElement("article");
    article.className = "product-card";
    article.dataset.category = product.category;

    const imageWrap = document.createElement("div");
    imageWrap.className = "product-card-image";

    const image = document.createElement("img");
    image.src = product.image;
    image.width = product.width;
    image.height = product.height;
    image.alt = product.alt;
    image.loading = "lazy";
    imageWrap.append(image);

    const details = document.createElement("div");
    details.className = "product-card-details";

    const category = document.createElement("p");
    category.textContent = categoryLabels.get(product.category);

    const title = document.createElement("h3");
    title.textContent = product.title;

    details.append(category, title);
    article.append(imageWrap, details);
    return article;
  };

  const render = (slug, updateHistory = false) => {
    const activeSlug = validSlugs.has(slug) ? slug : "all";
    const visibleProducts =
      activeSlug === "all" ? products : products.filter((product) => product.category === activeSlug);

    grid.replaceChildren(...visibleProducts.map(productCard));
    grid.hidden = visibleProducts.length === 0;
    emptyState.hidden = visibleProducts.length !== 0;
    count.textContent = `${visibleProducts.length} ${visibleProducts.length === 1 ? "product" : "products"}`;
    select.value = activeSlug;

    buttonGroup.querySelectorAll("button").forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.category === activeSlug));
    });

    if (updateHistory) writeUrl(activeSlug, "pushState");
  };

  categories.forEach((category) => {
    const productCount = categoryProductCounts.get(category.slug) || 0;
    const productLabel = productCount === 1 ? "product" : "products";
    const button = document.createElement("button");
    const buttonCount = document.createElement("span");

    button.type = "button";
    button.dataset.category = category.slug;
    button.append(document.createTextNode(category.label), buttonCount);
    buttonCount.className = "category-filter-count";
    buttonCount.textContent = String(productCount);
    buttonCount.setAttribute("aria-hidden", "true");
    button.setAttribute("aria-label", `${category.label}, ${productCount} ${productLabel}`);
    button.setAttribute("aria-pressed", "false");
    button.addEventListener("click", () => render(category.slug, true));
    buttonGroup.append(button);

    const option = document.createElement("option");
    option.value = category.slug;
    option.textContent = `${category.label} (${productCount})`;
    select.append(option);
  });

  select.addEventListener("change", () => render(select.value, true));
  viewAll?.addEventListener("click", () => render("all", true));
  window.addEventListener("popstate", () => render(getCategoryFromUrl()));

  const initialCategory = getCategoryFromUrl();
  const requested = new URLSearchParams(window.location.search).get("category");
  if (requested && (!validSlugs.has(requested) || requested === "all")) writeUrl("all", "replaceState");
  render(initialCategory);
})();
