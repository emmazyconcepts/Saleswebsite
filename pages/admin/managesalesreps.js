import React, { useState, useEffect } from "react";
import { firestore } from "@/utils/firebase"; // Firestore configuration
import { collection, getDocs } from "firebase/firestore";
import { useRouter } from "next/router"; // For navigation
import AdminDashboardLayout from "@/components/AdminDashboardLayout";
import { checkAdminAuth } from "@/utils/auth";

const ManageSalesReps = () => {
  const [salesReps, setSalesReps] = useState([]);
  const router = useRouter();
  useEffect(() => {
    // Redirect to login page if not authenticated
    if (!checkAdminAuth()) {
      router.push("/admin/login");
    } } )
  

  // Fetch sales reps from Firestore
  const fetchSalesReps = async () => {
    const querySnapshot = await getDocs(collection(firestore, "salesReps"));
    const reps = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setSalesReps(reps);
  };

  useEffect(() => {
    fetchSalesReps();
  }, []);

  // Handle click on sales rep to view their sales and store in localStorage
  const handleRepClick = (repUsername) => {
    // Store the clicked sales rep username in localStorage
    localStorage.setItem("clickedRep", repUsername);
    // Navigate to the sales page for that rep
    router.push(`/sales/${repUsername}`);
  };

  return (
    <AdminDashboardLayout>
      <div className="p-6 bg-white rounded-lg shadow-md text-black">
        <h2 className="text-2xl font-bold mb-6 text-black">Manage Sales Reps</h2>

        {/* Sales Rep List */}
        <div className="mb-6 overflow-x-auto">
          <table className="min-w-full table-auto bg-gray-50 border-collapse rounded-lg">
            <thead>
              <tr>
                <th className="px-6 py-3 text-sm font-semibold text-left text-black">Sales Rep Name</th>
                <th className="px-6 py-3 text-sm font-semibold text-left text-black">Role</th>
                <th className="px-6 py-3 text-sm font-semibold text-left text-black">Actions</th>
              </tr>
            </thead>
            <tbody className=" text-black">
              {salesReps.length > 0 ? (
                salesReps.map((rep) => (
                  <tr key={rep.id} className="hover:bg-gray-100">
                    <td className="px-6 py-4 text-sm text-black font-extrabold">{rep.username}</td>
                    <td className="px-6 py-4 text-sm text-black">{rep.role}</td>
                    <td className="px-6 py-4 text-sm">
                      <button
                        onClick={() => handleRepClick(rep.username)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        View Sales
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="text-center py-4 text-gray-600">
                    No sales reps found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminDashboardLayout>
  );
};

export default ManageSalesReps;
