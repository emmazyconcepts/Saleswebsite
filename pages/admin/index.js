import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { checkAdminAuth } from "@/utils/auth";
import AdminDashboardLayout from "@/components/AdminDashboardLayout";
import { db, doc, updateDoc } from "@/utils/firebase"; // Firebase setup file
import { collection, getDocs, getDoc, setDoc } from "firebase/firestore";

export default function AdminDashboard() {
  const router = useRouter();
  const [isActive, setIsActive] = useState(false);

  // Fetch the current status of isActive from Firestore
  useEffect(() => {
    const fetchMaintenanceStatus = async () => {
      const docRef = doc(db, "settings", "maintenance");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setIsActive(docSnap.data().isActive);
      } else {
        console.log("Document does not exist. Creating it now.");
        // If document doesn't exist, create it with a default value
        await setDoc(docRef, { isActive: false });
        setIsActive(false); // Default is false
      }
    };

    fetchMaintenanceStatus();
  }, []);


  const handleToggle = async () => {
    const docRef = doc(db, "settings", "maintenance");

    try {
      // Update the document if it exists
      await updateDoc(docRef, {
        isActive: !isActive,
      });
      setIsActive(!isActive); // Update the local state
    } catch (error) {
      console.error("Error updating document: ", error);
      // If document doesn't exist, create it
      await setDoc(docRef, { isActive: !isActive });
      setIsActive(!isActive); // Update the local state
    }
  };



  const [totalSales, setTotalSales] = useState(0);
  const [salesReps, setSalesReps] = useState(0);
  const [availableGoods, setAvailableGoods] = useState(0);
  const [lowStockGoods, setLowStockGoods] = useState([]); // State to hold low stock goods

  useEffect(() => {
    // Redirect to login page if not authenticated
    if (!checkAdminAuth()) {
      router.push("/admin/login");
    }

    // Fetch data from Firestore
    const fetchData = async () => {
      try {
        // Fetch total sales
        const salesSnapshot = await getDocs(collection(db, "sales"));
        let totalSalesAmount = 0;
        salesSnapshot.forEach((doc) => {
          totalSalesAmount += doc.data().amount || 0;
        });
        setTotalSales(totalSalesAmount);

        // Fetch sales representatives count
        const repsSnapshot = await getDocs(collection(db, "salesReps"));
        setSalesReps(repsSnapshot.size);

        // Fetch available goods
        const goodsSnapshot = await getDocs(collection(db, "goods"));
        setAvailableGoods(goodsSnapshot.size);

        // Filter goods with low stock
        const lowStock = [];
        goodsSnapshot.forEach((doc) => {
          const data = doc.data();
          const stock = parseInt(data.stock, 10); // Convert stock to a number
          if (stock < 10) {
            lowStock.push({
              id: doc.id, // Document ID
              name: data.name,
              stock: stock,
              quantity: data.quantity,
              price: data.price,
            });
          }
        });
        setLowStockGoods(lowStock);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [router]);

  return (
    <AdminDashboardLayout>
      <header className="mb-6 bg-white shadow rounded-lg p-4">
        <h2 className="text-2xl font-semibold text-gray-800">
          Welcome, Admin
        </h2>
      </header>

      {/* Cards section for sales, reps, goods */}
      <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        <div className="p-6 bg-white rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            Total Sales
          </h3>
          <p className="text-3xl font-bold text-blue-600">₦{totalSales.toLocaleString()}</p>
        </div>

        <div className="p-6 bg-white rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            Sales Representatives
          </h3>
          <p className="text-3xl font-bold text-blue-600">{salesReps}</p>
        </div>

        <div className="p-6 bg-white rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            Available Goods
          </h3>
          <p className="text-3xl font-bold text-blue-600">{availableGoods}</p>
        </div>
      </section>

      <div className="flex flex-col items-center p-4 text-black mt-5">
      <h1 className="text-2xl mb-4">Maintenance Mode</h1>
      <p className="mb-4">{!isActive ? "Website is live" : "Website is under maintenance"}</p>
      <button
        onClick={handleToggle}
        className={`py-2 px-4 rounded text-white ${!isActive ? "bg-green-500" : "bg-red-500"}`}
      >
        {!isActive ? "Enable Maintenance Mode" : "Disable Maintenance Mode"}
      </button>
    </div>


      {/* List of goods with low stock */}
      <section className="mt-8">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">
          Goods with Low Stock
        </h3>
        <div className="bg-white rounded-lg shadow p-4">
          {lowStockGoods.length > 0 ? (
            <ul className="space-y-4">
              {lowStockGoods.map((good) => (
                <li key={good.id} className="flex justify-between items-center">
                  <span className="font-medium text-gray-700">{good.name}</span>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Stock: {good.stock}</p>
                    <p className="text-sm text-gray-500">Quantity: {good.quantity}</p>
                    <p className="text-sm text-gray-500">Price: ₦{good.price}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No goods with low stock.</p>
          )}
        </div>
      </section>
    </AdminDashboardLayout>
  );
}
