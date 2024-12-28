import { useState } from "react";
import { useRouter } from "next/router";

export default function AdminDashboardLayout({ children }) {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    // Remove the admin token from localStorage
    localStorage.removeItem("admin_token");

    // Redirect to the admin login page
    router.push("/admin-login");
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Function to check if the link is active
  const isActive = (path) => {
    return router.pathname === path ? "bg-blue-500" : "hover:bg-blue-500";
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Mobile Menu Button */}
      <button
        className="sm:hidden text-blue-600 p-4"
        onClick={toggleMobileMenu}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16m-7 6h7"
          />
        </svg>
      </button>

      {/* Mobile Sidebar */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-blue-600 text-white p-6 block sm:hidden">
          <button
            className="text-white mb-4"
            onClick={toggleMobileMenu}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
          <h1 className="text-2xl font-bold mb-8">Admin Dashboard</h1>
          <nav className="space-y-4">
            <a
              href="/admin"
              className={`block py-2 px-4 rounded ${isActive('/admin')}`}
              onClick={toggleMobileMenu}
            >
              Dashboard
            </a>
            <a
              href="/admin/addsalesrep"
              className={`block py-2 px-4 rounded ${isActive('/admin/addsalesrep')}`}
              onClick={toggleMobileMenu}
            >
              Add Sales Rep
            </a>
            <a
              href="/admin/managesalesreps"
              className={`block py-2 px-4 rounded ${isActive('/admin/managesalesreps')}`}
              onClick={toggleMobileMenu}
            >
              Manage Sales Rep
            </a>
            <a
              href="/admin/addgoods"
              className={`block py-2 px-4 rounded ${isActive('/admin/addgoods')}`}
              onClick={toggleMobileMenu}
            >
              Add Goods
            </a>
            <a
              href="/admin/managegoods"
              className={`block py-2 px-4 rounded ${isActive('/admin/managegoods')}`}
              onClick={toggleMobileMenu}
            >
              Manage Goods
            </a>
            <a
              onClick={() => {
                toggleMobileMenu();
                handleLogout();
              }}
              href="#"
              className={`block py-2 px-4 rounded ${isActive('#')}`}
            >
              Logout
            </a>
          </nav>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="w-64 bg-blue-600 text-white h-screen p-6 hidden sm:block">
        <h1 className="text-2xl font-bold mb-8">Admin Dashboard</h1>
        <nav className="space-y-4">
          <a
            href="/admin"
            className={`block py-2 px-4 rounded ${isActive('/admin')}`}
          >
            Dashboard
          </a>
          <a
            href="/admin/addsalesrep"
            className={`block py-2 px-4 rounded ${isActive('/admin/addsalesrep')}`}
          >
            Add Sales Rep
          </a>
          <a
            href="/admin/managesalesreps"
            className={`block py-2 px-4 rounded ${isActive('/admin/managesalesreps')}`}
          >
            Manage Sales Rep
          </a>
          <a
            href="/admin/addgoods"
            className={`block py-2 px-4 rounded ${isActive('/admin/addgoods')}`}
          >
            Add Goods
          </a>
          <a
            href="/admin/managegoods"
            className={`block py-2 px-4 rounded ${isActive('/admin/managegoods')}`}
          >
            Manage Goods
          </a>
          <a
            onClick={handleLogout}
            href="#"
            className={`block py-2 px-4 rounded ${isActive('#')}`}
          >
            Logout
          </a>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 p-6">{children}</div>
    </div>
  );
}
