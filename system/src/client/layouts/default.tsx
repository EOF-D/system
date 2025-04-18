import { Navbar } from "@/client/components/Navbar";

/**
 * The default layout for the site.
 * @param {string} page The name of the page to highlight on the navbar.
 * @param {React.ReactNode} children The content to be displayed within the layout.
 * @returns {JSX.Element} The layout component.
 */
export function Layout({
  page,
  children,
}: {
  page: string;
  children: React.ReactNode;
}): JSX.Element {
  return (
    <div className="relative flex flex-col h-screen">
      <Navbar activePage={page} />
      <main
        className="container max-w-7xl px-6 flex-grow pt-16"
        style={{ paddingTop: "40px" }}
      >
        {children}
      </main>
    </div>
  );
}
