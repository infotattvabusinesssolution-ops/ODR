export const ALLOWED_LANGUAGES = ["en", "or", "hi", "bn", "te"];

export const clearTranslationCookies = () => {
  if (typeof window === "undefined") return;

  const hostname = window.location.hostname;
  const domains = [
    hostname,
    `.${hostname}`,
    "utkalodr.com",
    ".utkalodr.com",
    "gokulanandachaudhurifoundation.com",
    ".gokulanandachaudhurifoundation.com",
  ];

  domains.forEach((d) => {
    document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${d};`;
  });
  document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

  try {
    localStorage.removeItem("odrLangCode");
    localStorage.removeItem("appLanguage");
  } catch (e) {}

  // Reset Google Translate combo element if present in DOM
  const combo = document.querySelector(".goog-te-combo");
  if (combo) {
    combo.value = "";
    try {
      combo.dispatchEvent(new Event("change"));
    } catch (e) {}
  }
};

export const applyLanguage = (langCode) => {
  if (!ALLOWED_LANGUAGES.includes(langCode) || langCode === "en") {
    clearTranslationCookies();
    return;
  }

  const hostname = window.location.hostname;
  const domains = [hostname, `.${hostname}`];

  domains.forEach((d) => {
    document.cookie = `googtrans=/en/${langCode}; path=/; domain=${d};`;
  });
  document.cookie = `googtrans=/en/${langCode}; path=/;`;

  try {
    localStorage.setItem("odrLangCode", langCode);
  } catch (e) {}

  const combo = document.querySelector(".goog-te-combo");
  if (combo) {
    combo.value = langCode;
    try {
      combo.dispatchEvent(new Event("change"));
    } catch (e) {}
  }
};
