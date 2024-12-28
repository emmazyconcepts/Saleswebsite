import { useState } from "react";
import { useRouter } from "next/router";
import { firestore } from "@/utils/firebase";  // Your Firebase setup
import { doc, getDoc } from "firebase/firestore"; // Import getDoc from Firestore

export default function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      // Fetch the admin details from Firestore
      const docRef = doc(firestore, "admins", "admin");
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const adminData = docSnap.data();
        // Compare the entered username and password with the stored details
        if (username === adminData.username && password === adminData.password) {
          // Store an admin token in localStorage
          localStorage.setItem("admin_token", "your_admin_token_here");

          // Redirect to the admin dashboard
          router.push("/admin");
        } else {
          setError("Invalid username or password");
        }
      } else {
        console.error("Admin details not found in Firestore.");
      }
    } catch (error) {
      console.error("Error during login:", error);
      setError("An error occurred. Please try again.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-blue-500 to-purple-600">
      <div className="p-8 bg-white rounded-lg shadow-lg w-96">
        <h1 className="text-3xl font-bold mb-6 text-center text-blue-600">Admin Login</h1>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <form onSubmit={handleLogin}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-4 py-2 mb-4 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 mb-4 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}
