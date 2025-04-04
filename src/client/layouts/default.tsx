import { Navbar } from "@/client/components/navbar";

/**
 * The default layout for the application.
 * @param {string} page The name of the page to highlight on the navbar.
 * @param {React.ReactNode} children The content to be displayed within the layout.
 */
function Layout({
  page,
  children,
}: {
  page: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex flex-col h-screen">
      <Navbar activePage={page} />
      <main className="container mx-auto max-w-7xl px-6 flex-grow pt-16">
        {children}
      </main>
    </div>
  );
}

export default Layout;
