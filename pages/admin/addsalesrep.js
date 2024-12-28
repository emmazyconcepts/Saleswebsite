import React, { useState, useEffect } from "react";
import { firestore } from "@/utils/firebase"; // Firestore configuration
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import AdminDashboardLayout from "@/components/AdminDashboardLayout";
import { checkAdminAuth } from "@/utils/auth";
import { useRouter } from "next/router";



const ManageSalesReps = () => {
  const [salesReps, setSalesReps] = useState([]);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("retailer");
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const router = useRouter();

  useEffect(() => {
    // Redirect to login page if not authenticated
    if (!checkAdminAuth()) {
      router.push("/admin/login");
    } } )

  // Fetch sales reps
  const fetchSalesReps = async () => {
    try {
      const querySnapshot = await getDocs(collection(firestore, "salesReps"));
      const fetchedSalesReps = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setSalesReps(fetchedSalesReps);
    } catch (error) {
      console.error("Error fetching sales reps:", error);
    }
  };

  useEffect(() => {
    fetchSalesReps();
  }, []);

  // Add a new sales rep
  const addSalesRep = async () => {
    if (!username || !password) {
      setError("All fields are required.");
      return;
    }
    try {
      const newSalesRep = {
        username,
        password,
        role,
        createdAt: serverTimestamp(),
      };
      await addDoc(collection(firestore, "salesReps"), newSalesRep);
      setSuccess("Sales rep added successfully!");
      setError(null);
      setUsername("");
      setPassword("");
      setRole("retailer");
      fetchSalesReps();
    } catch (error) {
      console.error("Error adding sales rep:", error);
      setError("Failed to add sales rep.");
    }
  };

  // Edit an existing sales rep
  const editSalesRep = async () => {
    if (!username || !password) {
      setError("All fields are required.");
      return;
    }
    try {
      const salesRepRef = doc(firestore, "salesReps", editId);
      await updateDoc(salesRepRef, { username, password, role });
      setSuccess("Sales rep updated successfully!");
      setError(null);
      setEditMode(false);
      setEditId(null);
      setUsername("");
      setPassword("");
      setRole("retailer");
      fetchSalesReps();
    } catch (error) {
      console.error("Error updating sales rep:", error);
      setError("Failed to update sales rep.");
    }
  };

  // Delete a sales rep
  const deleteSalesRep = async (id) => {
    try {
      await deleteDoc(doc(firestore, "salesReps", id));
      setSuccess("Sales rep deleted successfully!");
      fetchSalesReps();
    } catch (error) {
      console.error("Error deleting sales rep:", error);
      setError("Failed to delete sales rep.");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editMode) {
      editSalesRep();
    } else {
      addSalesRep();
    }
  };

  const handleEdit = (salesRep) => {
    setEditMode(true);
    setEditId(salesRep.id);
    setUsername(salesRep.username);
    setPassword(salesRep.password);
    setRole(salesRep.role);
  };

  return (
    <AdminDashboardLayout>

<div className="p-6 bg-white rounded-lg shadow-md">
  <h2 className="text-2xl font-bold mb-6 text-gray-900">Manage Sales Reps</h2>

  {/* Form for Adding/Editing Sales Rep */}
  <div className="mb-8 p-4 bg-gray-50 rounded-lg border border-gray-300">
    <h3 className="text-lg font-semibold mb-4 text-gray-900">
      {editMode ? "Edit Sales Rep" : "Add Sales Rep"}
    </h3>
    {error && <p className="text-red-600 mb-4">{error}</p>}
    {success && <p className="text-green-600 mb-4">{success}</p>}
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-1">Username</label>
        <input
          type="text"
          placeholder="Enter Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-900"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-1">Password</label>
        <input
          type="password"
          placeholder="Enter Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-900"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-1">Role</label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-900"
        >
          <option value="retailer">Retailer</option>
          <option value="wholesaler">Wholesaler</option>
        </select>
      </div>
      <button
        type="submit"
        className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 font-semibold"
      >
        {editMode ? "Update Sales Rep" : "Add Sales Rep"}
      </button>
    </form>
  </div>

  {/* Sales Reps List */}
  <div>
    <h3 className="text-lg font-semibold mb-4 text-gray-900">Existing Sales Reps</h3>
    <table className="w-full border-collapse bg-gray-50 border border-gray-300 rounded-lg">
      <thead className="bg-gray-100">
        <tr>
          <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-900">
            Username
          </th>
          <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-900">
            Role
          </th>
          <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-900">
            Actions
          </th>
        </tr>
      </thead>
      <tbody>
        {salesReps.map((salesRep) => (
          <tr key={salesRep.id} className="hover:bg-gray-100">
            <td className="border border-gray-300 px-4 py-2 text-gray-900">{salesRep.username}</td>
            <td className="border border-gray-300 px-4 py-2 text-gray-900">{salesRep.role}</td>
            <td className="border border-gray-300 px-4 py-2 space-x-2">
              <button
                onClick={() => handleEdit(salesRep)}
                className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Edit
              </button>
              <button
                onClick={() => deleteSalesRep(salesRep.id)}
                className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>


    </AdminDashboardLayout>

  );
};

export default ManageSalesReps;
