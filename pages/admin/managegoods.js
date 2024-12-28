import React, { useState, useEffect } from "react";
import { firestore } from "@/utils/firebase"; // Firestore configuration
import { collection, query, orderBy, getDocs, doc, deleteDoc } from "firebase/firestore";
import EditProduct from "../../components/EditProduct"; // Assuming the EditProduct component is in the same folder
import { format } from 'date-fns'; // To format the date
import AdminDashboardLayout from "@/components/AdminDashboardLayout";
import { checkAdminAuth } from "@/utils/auth";
import { useRouter } from "next/router";


const ManageProducts = () => {
  const [goods, setGoods] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGood, setSelectedGood] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [sortOrder, setSortOrder] = useState("desc"); // State to store sorting order (ascending/descending)
  const router = useRouter();

  useEffect(() => {
    // Redirect to login page if not authenticated
    if (!checkAdminAuth()) {
      router.push("/admin/login");
    } } )

  // Fetch goods from Firestore
  const fetchGoods = async () => {
    const q = query(collection(firestore, "goods"), orderBy("timestamp", sortOrder));
    const querySnapshot = await getDocs(q);
    const fetchedGoods = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    setGoods(fetchedGoods);
  };

  useEffect(() => {
    fetchGoods();
  }, [sortOrder]); // Re-fetch goods whenever sortOrder changes

  // Handle search input
  const handleSearch = (event) => {
    setSearchQuery(event.target.value);
  };

  // Filter goods based on the search query (checks both name and productId)
  const filteredGoods = goods.filter((good) =>
    good.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    good.productId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Conditional styling for stock and quantity fields if they are below 5
  const getFieldClass = (value) => {
    return value < 5 ? "border-red-500 bg-red-100" : "border-gray-300";
  };

  // Delete good from Firestore
  const deleteGood = async (id) => {
    try {
      await deleteDoc(doc(firestore, "goods", id));
      // Remove the deleted good from the local state
      setGoods(goods.filter(good => good.id !== id));
    } catch (error) {
      console.error("Error deleting product: ", error);
    }
  };

  return (


   < AdminDashboardLayout>


<div className="p-6 bg-white rounded-lg shadow-md">
  <h2 className="text-2xl font-bold mb-6 text-black">Manage Products</h2>

  {/* Search Bar */}
  <div className="mb-6">
    <label htmlFor="search" className="block text-sm font-medium text-black mb-2">
      Search for products by name or product ID
    </label>
    <input
      id="search"
      type="text"
      placeholder="Search..."
      value={searchQuery}
      onChange={handleSearch}
      className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-black"
    />
  </div>

  {/* Sorting Dropdown */}
  <div className="mb-6 flex items-center">
    <label htmlFor="sort" className="mr-2 text-sm font-medium text-black">Sort by Date:</label>
    <select
      id="sort"
      value={sortOrder}
      onChange={(e) => setSortOrder(e.target.value)}
      className="p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-black"
    >
      <option value="desc">Newest First</option>
      <option value="asc">Oldest First</option>
    </select>
  </div>

  {/* Product List */}
  <div className="mb-6 overflow-x-auto">
    <table className="min-w-full table-auto bg-gray-50 border-collapse rounded-lg">
      <thead>
        <tr>
          <th className="px-6 py-3 text-sm font-semibold text-left text-black">Product Name</th>
          <th className="px-6 py-3 text-sm font-semibold text-left text-black">Price</th>
          <th className="px-6 py-3 text-sm font-semibold text-left text-black">Stock</th>
          <th className="px-6 py-3 text-sm font-semibold text-left text-black">Quantity</th>
          <th className="px-6 py-3 text-sm font-semibold text-left text-black">Date Added</th>
          <th className="px-6 py-3 text-sm font-semibold text-left text-black">Actions</th>
        </tr>
      </thead>
      <tbody>
        {filteredGoods.length > 0 ? (
          filteredGoods.map((good) => (
            <tr key={good.id} className="hover:bg-gray-100">
              <td className="px-6 py-4 text-sm text-black">{good.name}</td>
              <td className="px-6 py-4 text-sm text-black">{good.price}</td>
              <td
                className={`px-6 py-4 text-sm ${
                  good.stock < 20 ? "text-red-500 animate-blink" : "text-black"
                }`}
              >
                {good.stock}
              </td>
              <td className={`px-6 py-4 text-sm ${good.quantity < 5 ? "text-red-500" : "text-black"}`}>
                {good.quantity}
              </td>
              <td className="px-6 py-4 text-sm text-black">
                {good.timestamp ? format(good.timestamp.toDate(), 'MM/dd/yyyy') : 'No date'}
              </td>
              <td className="px-6 py-4 text-sm space-x-2">
                <button
                  onClick={() => {
                    setSelectedGood(good);
                    setIsEditing(true);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteGood(good.id)}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan="6" className="text-center py-4 text-gray-600">
              No products found
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>

  {/* Edit Product Form */}
  {isEditing && selectedGood && (
    <EditProduct selectedGood={selectedGood} setIsEditing={setIsEditing} />
  )}
</div>


   </AdminDashboardLayout>
 
  );
};

export default ManageProducts;
