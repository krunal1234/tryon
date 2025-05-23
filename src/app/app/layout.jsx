import Navigation from "../components/ui/Navigation";

export default function StorefrontLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-grow">{children}</main>
      <footer className="bg-gray-100 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} JewelTryOn. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}