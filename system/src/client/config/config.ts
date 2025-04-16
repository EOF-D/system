/**
 * Site configuration file.
 */
export const SiteConfig = {
  /**
   * The API URL for the site.
   * @type {string}
   */
  apiUrl: "http://localhost:3000/api",

  /**
   * Majors offered by the site.
   * @type {Array<{ label: string; value: string }>}
   */
  majors: [
    { label: "Computer Science", value: "computer_science" },
    { label: "Data Science", value: "data_science" },
    { label: "Psychology", value: "psychology" },
  ],
};
