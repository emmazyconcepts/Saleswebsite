import { useEffect, useState } from "react";
import { firestore } from "@/utils/firebase"; // Firestore configuration
import { collection, getDocs, query, where } from "firebase/firestore"; // Firestore methods
import { useRouter } from "next/router";
import { checkAdminAuth } from "@/utils/auth";
import AdminDashboardLayout from "@/components/AdminDashboardLayout";

export default function SalesHistory() {
  const [sales, setSales] = useState([]);
  const [filteredSales, setFilteredSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSale, setSelectedSale] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [performanceMetrics, setPerformanceMetrics] = useState({
    totalSalesAmount: 0,
    averageSaleAmount: 0,
    totalSalesCount: 0,
    topSellingItems: [],
  });
  const router = useRouter();

  useEffect(() => {
    const salesRepUsername = localStorage.getItem("clickedRep");

    if (!checkAdminAuth()) {
      router.push("/admin/login");
    } else {
      fetchSales(salesRepUsername);
    }
  }, [router]);

  const calculatePerformanceMetrics = (salesData) => {
    let totalSalesAmount = 0; // Total sales amount for the sales rep
    let totalSalesCount = 0; // Total number of sales transactions
    let totalProfit = 0; // Total profit for the sales rep
    let itemSales = {}; // Track individual item sales
  
    Object.keys(salesData).forEach((date) => {
      salesData[date].sales.forEach((sale) => {
        totalSalesAmount += sale.total; // Add the sale total to the total sales amount
        totalSalesCount += 1; // Increment the sales count
  
        sale.items.forEach((item) => {
          if (!itemSales[item.name]) {
            itemSales[item.name] = {
              totalAmount: 0,
              quantitySold: 0,
              totalProfit: 0, // Initialize totalProfit for each item
            };
          }
  
          const itemRevenue = item.price * item.quantity; // Revenue from the item
          const itemProfit = (item.price - item.costPrice) * item.quantity; // Profit from the item
  
          itemSales[item.name].totalAmount += itemRevenue; // Add revenue to the item's total amount
          itemSales[item.name].quantitySold += item.quantity; // Add the quantity sold
          itemSales[item.name].totalProfit += itemProfit; // Add the profit for the item
  
          totalProfit += itemProfit; // Add the profit to the total profit
        });
      });
    });
  
    const topSellingItems = Object.keys(itemSales)
      .map((itemName) => ({
        name: itemName,
        totalAmount: itemSales[itemName].totalAmount,
        quantitySold: itemSales[itemName].quantitySold,
        totalProfit: itemSales[itemName].totalProfit, // Include the total profit for this item
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 3); // Get the top 3 selling items
  
    const averageSaleAmount = totalSalesCount
      ? totalSalesAmount / totalSalesCount
      : 0; // Calculate average sale amount
  
    return {
      totalSalesAmount,
      averageSaleAmount,
      totalSalesCount,
      totalProfit,
      topSellingItems,
    };
  };
  
  
  
  

  const fetchSales = async (salesRepUsername) => {
    try {
      const salesQuery = query(
        collection(firestore, "sales"),
        where("salesRepUsername", "==", salesRepUsername)
      );
      const salesSnapshot = await getDocs(salesQuery);
      const salesList = salesSnapshot.docs.map((doc) => doc.data());

      const groupedSales = salesList.reduce((acc, sale) => {
        const date = new Date(sale.timestamp.seconds * 1000).toLocaleDateString();
        if (!acc[date]) {
          acc[date] = { sales: [], totalAmount: 0 };
        }
        acc[date].sales.push(sale);
        acc[date].totalAmount += sale.total;
        return acc;
      }, {});

      setSales(groupedSales);
      setFilteredSales(groupedSales);

      const metrics = calculatePerformanceMetrics(groupedSales);
      setPerformanceMetrics(metrics);
    } catch (error) {
      setError("Error fetching sales data.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);

    if (e.target.value) {
      const selectedDateNormalized = new Date(e.target.value).setHours(0, 0, 0, 0);

      const filtered = Object.keys(sales).reduce((acc, date) => {
        const saleDateNormalized = new Date(
          sales[date].sales[0].timestamp.seconds * 1000
        ).setHours(0, 0, 0, 0);

        if (selectedDateNormalized === saleDateNormalized) {
          acc[date] = sales[date];
        }
        return acc;
      }, {});

      setFilteredSales(filtered);
    } else {
      setFilteredSales(sales);
    }
  };

  const handleSaleClick = (sale) => {
    setSelectedSale(sale);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedSale(null);
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="text-red-500">{error}</p>;



  

  return (
    <AdminDashboardLayout>
      <div className="min-h-screen p-6">
        <div className="bg-white p-6 rounded-xl shadow-lg max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-indigo-800">Sales History</h1>
            <p className="text-gray-600 mt-2">
              View detailed sales data and performance metrics.
            </p>
          </div>

       {/* Performance Metrics */}
<div className="bg-indigo-50 p-6 rounded-lg shadow mb-6">
  <h2 className="text-2xl font-bold text-indigo-700 mb-4">
    Performance Metrics
  </h2>
  <p className="text-gray-700">
    <strong>Total Sales Amount:</strong> #{performanceMetrics.totalSalesAmount}
  </p>
  <p className="text-gray-700">
    <strong>Average Sale Amount:</strong> #{performanceMetrics.averageSaleAmount.toFixed(2)}
  </p>
  <p className="text-gray-700">
    <strong>Total Sales Count:</strong> {performanceMetrics.totalSalesCount}
  </p>
  <p className="text-gray-700">
    <strong>Total Profit:</strong> #{performanceMetrics.totalProfit.toFixed(2)}
  </p>
  <div className=" text-black">
    <strong>Top-Selling Items:</strong>
    <ul className="mt-2 list-disc pl-6">
      {performanceMetrics.topSellingItems.map((item, index) => (
        <li key={index}>
          {item.name} - #{item.totalAmount} ({item.quantitySold} sold, Profit: #{item.totalProfit.toFixed(2)})
        </li>
      ))}
    </ul>
  </div>
</div>


          {/* Date Picker */}
          <div className="mb-6">
            <input
              type="date"
              value={selectedDate}
              onChange={handleDateChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700"
            />
          </div>

          {/* Sales List */}
          {Object.keys(filteredSales).length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 text-lg">No sales data for this date.</p>
            </div>
          ) : (
            Object.keys(filteredSales).map((date) => (
              <div key={date} className="mb-8 bg-gray-50 rounded-lg shadow p-4">
                <h2 className="text-xl font-bold text-indigo-700 mb-4">
                  {date} - Total Sales: #{filteredSales[date].totalAmount}
                </h2>
                <ul className="space-y-4">
                  {filteredSales[date].sales.map((sale, index) => (
                    <li
                      key={index}
                      className="p-4 bg-white rounded-lg shadow hover:bg-gray-100 transition duration-300 cursor-pointer"
                      onClick={() => handleSaleClick(sale)}
                    >
                      <p className="text-gray-700">
                        <strong>Sales Rep:</strong> {sale.salesRepUsername}
                      </p>
                      <p className="text-gray-700">
                        <strong>Total:</strong> #{sale.total}
                      </p>
                      <p className="text-gray-500">
                        <strong>Date:</strong>{" "}
                        {new Date(sale.timestamp.seconds * 1000).toLocaleTimeString()}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}

          {/* Sale Details Modal */}
          {isModalOpen && selectedSale && (
            <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg max-w-lg w-full relative shadow-lg">
                <button
                  onClick={closeModal}
                  className="absolute top-2 right-2 text-2xl text-red-600 hover:text-red-800"
                >
                  &times;
                </button>
                <h2 className="text-2xl font-bold text-indigo-700 mb-4">Sale Details</h2>
                <div className="text-gray-700">
                  <p>
                    <strong>Sales Rep:</strong> {selectedSale.salesRepUsername}
                  </p>
                  <p>
                    <strong>Total Sale Amount:</strong> #{selectedSale.total}
                  </p>
                  <p>
                    <strong>Date:</strong>{" "}
                    {new Date(selectedSale.timestamp.seconds * 1000).toLocaleString()}
                  </p>
                  <p>
                    <strong>Amount Paid:</strong> #{selectedSale.amountPaid}
                  </p>
                  <p>
                    <strong>Change Given:</strong> #{selectedSale.changeGiven}
                  </p>
                </div>
                <div className="mt-4">
                  <p className="font-bold text-gray-800">Items Sold:</p>
                  <ul className="mt-2 list-disc pl-6 space-y-2">
                    {selectedSale.items?.length > 0 ? (
                      selectedSale.items.map((item, index) => (
                        <li key={index} className="text-gray-700">
                          {item.name} (x{item.quantity}) - #{item.price} each
                        </li>
                      ))
                    ) : (
                      <p>No items available.</p>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminDashboardLayout>
  );
}
