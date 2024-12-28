import { useState } from "react";
import { useRouter } from "next/router";
import { firestore } from "@/utils/firebase"; // Firestore configuration
import { query, where, getDocs, collection } from "firebase/firestore"; // Firestore methods

export default function SalesRepLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!username || !password) {
      setError("Both username and password are required.");
      setLoading(false);
      return;
    }

    try {
      // Query Firestore to find the sales rep with matching username and password
      const q = query(
        collection(firestore, "salesReps"),
        where("username", "==", username),
        where("password", "==", password)
      );

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setError("Invalid username or password.");
        setLoading(false);
      } else {
        // If a matching sales rep is found, redirect to the dashboard
        const salesRep = querySnapshot.docs[0].data();
        localStorage.setItem("isAuthenticated", true); // Store authentication status
        localStorage.setItem("salesRepUsername", salesRep.username); // Store the username
        router.push("/salesrep/dashboard");
      }
    } catch (error) {
      setError("Error during login, please try again.");
      setLoading(false);
      console.error(error);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-blue-500 to-purple-600">
      <div className="p-8 bg-white rounded-lg shadow-lg w-96">
        <h1 className="text-3xl font-bold mb-6 text-center text-blue-600">Sales Rep Login</h1>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <form onSubmit={handleLogin}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-4 py-2 mb-4 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 mb-4 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <button
            type="submit"
            className="w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          >
            {loading ? "Logging In..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
