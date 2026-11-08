// Shared top bar + burger menu for every *.mihran.com site — the single source of truth for navigation.
// Served from https://mihran.com/_shared/nav.js — deploy family/ to update it everywhere.
// Each page needs: <aside class="sidebar" id="site-nav"><a class="brand" href="https://mihran.com/">mihran.com</a></aside>
(() => {
  const SITE = [
    { label: "Home", href: "https://mihran.com/", hosts: ["mihran.com", "www.mihran.com"] },
    { label: "Charlie", href: "https://charlie.mihran.com/", hosts: ["charlie.mihran.com"] },
    { label: "Greg", href: "https://greg.mihran.com/", hosts: ["greg.mihran.com"] },
  ];

  const aside = document.getElementById("site-nav");
  if (!aside) return;
  const host = location.hostname;
  const path = location.pathname.replace(/index\.html$/, "");

  const el = (tag, attrs = {}, ...kids) => {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
    n.append(...kids);
    return n;
  };
  const isCurrent = (href) => {
    const u = new URL(href);
    return u.hostname.replace(/^www\./, "") === host.replace(/^www\./, "") &&
      u.pathname.replace(/index\.html$/, "") === path;
  };
  const link = (item) => {
    const external = !/(^|\.)mihran\.com$/.test(new URL(item.href).hostname);
    const a = el("a", { href: item.href }, item.label);
    if (external) a.append(el("span", { class: "ext", "aria-hidden": "true" }, "↗"));
    if (isCurrent(item.href)) a.setAttribute("aria-current", "page");
    return a;
  };

  // Burger button that opens a popup menu.
  const toggle = el("button", {
    class: "menu-toggle", type: "button", "aria-label": "Menu",
    "aria-expanded": "false", "aria-controls": "site-nav-menu",
  }, el("span", { class: "burger", "aria-hidden": "true" }, el("span"), el("span"), el("span")));
  const isOpen = () => aside.classList.contains("open");
  const setOpen = (open) => {
    aside.classList.toggle("open", open);
    toggle.setAttribute("aria-expanded", String(open));
  };
  toggle.addEventListener("click", () => setOpen(!isOpen()));
  // Close on a click outside the bar, on Escape, or after choosing a link.
  document.addEventListener("click", (e) => { if (isOpen() && !aside.contains(e.target)) setOpen(false); });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isOpen()) { setOpen(false); toggle.focus(); }
  });

  const list = el("ul", { class: "nav" });
  list.addEventListener("click", (e) => { if (e.target.closest("a")) setOpen(false); });
  for (const item of SITE) {
    const li = el("li", {}, link(item));
    if (item.children?.length) {
      li.append(el("ul", { class: "sub" }, ...item.children.map((c) => el("li", {}, link(c)))));
    }
    list.append(li);
  }

  aside.setAttribute("aria-label", "Site");
  aside.append(toggle, el("nav", { id: "site-nav-menu" }, list));
})();
