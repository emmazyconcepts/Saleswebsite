import { useEffect, useState } from "react";
import { firestore } from "@/utils/firebase"; // Firestore configuration
import { collection, getDocs, query, where } from "firebase/firestore"; // Firestore methods
import { useRouter } from "next/router";

export default function SalesHistory() {
  const [sales, setSales] = useState([]);
  const [filteredSales, setFilteredSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSale, setSelectedSale] = useState(null); // State for selected sale
  const [isModalOpen, setIsModalOpen] = useState(false); // Modal visibility state
  const [selectedDate, setSelectedDate] = useState(""); // Selected date state
  const router = useRouter();

  useEffect(() => {
    const isAuthenticated = localStorage.getItem("isAuthenticated");
    const salesRepUsername = localStorage.getItem("salesRepUsername"); // Assuming username is stored in localStorage

    if (!isAuthenticated || !salesRepUsername) {
      router.push("/salesrep/login");
    } else {
      fetchSales(salesRepUsername);
    }
  }, [router]);

  const [isPerformanceModalOpen, setIsPerformanceModalOpen] = useState(false);
  const openPerformanceModal = () => {
    setIsPerformanceModalOpen(true);
  };

  // Function to close performance modal
  const closePerformanceModal = () => {
    setIsPerformanceModalOpen(false);
  };

  const [performanceMetrics, setPerformanceMetrics] = useState({
    totalSalesAmount: 0,
    averageSaleAmount: 0,
    totalSalesCount: 0,
    topSellingItems: []
  });
  

  const calculatePerformanceMetrics = (salesData) => {
    let totalSalesAmount = 0;
    let totalSalesCount = 0;
    let itemSales = {};
  
    // Loop through all sales to calculate total sales and item-wise sales
    Object.keys(salesData).forEach(date => {
      salesData[date].sales.forEach(sale => {
        totalSalesAmount += sale.total;
        totalSalesCount += 1;
  
        // Track sales for each item
        sale.items.forEach(item => {
          if (!itemSales[item.name]) {
            itemSales[item.name] = { totalAmount: 0, quantitySold: 0 };
          }
          itemSales[item.name].totalAmount += item.price * item.quantity;
          itemSales[item.name].quantitySold += item.quantity;
        });
      });
    });
  
    // Get top-selling items by total sales amount
    const topSellingItems = Object.keys(itemSales)
      .map(itemName => ({
        name: itemName,
        totalAmount: itemSales[itemName].totalAmount,
        quantitySold: itemSales[itemName].quantitySold
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 3); // Get top 3 selling items
  
    const averageSaleAmount = totalSalesCount ? totalSalesAmount / totalSalesCount : 0;
  
    return {
      totalSalesAmount,
      averageSaleAmount,
      totalSalesCount,
      topSellingItems
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
  
      // Group sales by date
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
  
      // Calculate and set performance metrics
      const metrics = calculatePerformanceMetrics(groupedSales);
      setPerformanceMetrics(metrics);
    } catch (error) {
      setError("Error fetching sales data.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  

  const handleSaleClick = (sale) => {
    setSelectedSale(sale);
    setIsModalOpen(true); // Open the modal when a sale is clicked
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedSale(null);
  };

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value); // Set the selected date
  
    // Check if a date is selected
    if (e.target.value) {
      // Normalize the selected date to remove the time part
      const selectedDateNormalized = new Date(e.target.value).setHours(0, 0, 0, 0);
  
      // Filter sales for the selected date
      const filtered = Object.keys(sales).reduce((acc, date) => {
        // Convert sale timestamp to a Date and normalize it
        const saleDateNormalized = new Date(sales[date].sales[0].timestamp.seconds * 1000).setHours(0, 0, 0, 0);
  
        if (selectedDateNormalized === saleDateNormalized) {
          acc[date] = sales[date];
        }
        return acc;
      }, {});
  
      setFilteredSales(filtered);
    } else {
      setFilteredSales(sales); // If no date selected, show all sales
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="min-h-screen bg-gradient-to-r from-indigo-600 to-indigo-800 p-6">
      <div className="bg-white p-6 rounded-xl shadow-xl max-w-4xl mx-auto">
        <div className="mt-6">
          <button
            onClick={() => window.location.replace('/salesrep/dashboard')}
            className="w-full px-5 py-3 bg-gray-800 text-white rounded-lg shadow-md hover:bg-gray-900 focus:outline-none transition duration-300 mb-10"
          >
            Return to dashboard
          </button>
        </div>
  
        <h1 className="text-4xl font-bold text-center text-black mb-8">Sales History</h1>



        <div className="text-center mb-8">
          <button
            onClick={openPerformanceModal}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 focus:outline-none transition duration-300"
          >
            View Sales Performance
          </button>
        </div>



        {isPerformanceModalOpen && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg max-w-lg mx-auto relative">
              <button
                onClick={closePerformanceModal}
                className="absolute top-2 right-2 text-3xl text-red-500"
              >
                &times;
              </button>
              {/* Display performance metrics */}
        <div className="mb-8 text-center text-black">
          <p className="text-xl font-semibold">Sales Performance Metrics</p>
          <div className="space-y-4 mt-4">
            <p className="text-lg"><strong>Total Sales Amount:</strong> #{performanceMetrics.totalSalesAmount}</p>
            <p className="text-lg"><strong>Average Sale Amount:</strong> #{performanceMetrics.averageSaleAmount.toFixed(2)}</p>
            <p className="text-lg"><strong>Total Number of Sales:</strong> {performanceMetrics.totalSalesCount}</p>
          </div>
          <div className="mt-6">
            <p className="text-lg font-semibold">Top Selling Items:</p>
            <ul className="list-disc list-inside mt-2">
              {performanceMetrics.topSellingItems.map((item, index) => (
                <li key={index} className="text-black">
                  {item.name} - Sold {item.quantitySold} units, Total Sales: #{item.totalAmount}
                </li>
              ))}
            </ul>
          </div>
        </div>
  
            </div>
          </div>
        )}
  
     
        {/* Date Picker */}
        <div className="mb-6">
          <input
            type="date"
            value={selectedDate}
            onChange={handleDateChange}
            className="w-full p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-bl"
          />
        </div>
  
        {/* Display sales */}
        {Object.keys(filteredSales).length === 0 ? (
          <p className="text-center text-black">No sales registered for this date.</p>
        ) : (
          Object.keys(filteredSales).map((date) => (
            <div key={date} className="mb-8">
              <h2 className="text-2xl font-semibold text-black mb-4">
                {date} - Total Sales: #{filteredSales[date].totalAmount}
              </h2>
              <ul className="space-y-4">
                {filteredSales[date].sales.map((sale, index) => (
                  <li
                    key={index}
                    className="bg-gray-100 p-4 rounded-lg cursor-pointer hover:bg-gray-200 transition duration-300"
                    onClick={() => handleSaleClick(sale)}
                  >
                    <p className="text-black"><strong>Sales Rep:</strong> {sale.salesRepUsername}</p>
                    <p className="text-black"><strong>Total:</strong> #{sale.total}</p>
                    <p className="text-black"><strong>Date:</strong> {new Date(sale.timestamp.seconds * 1000).toLocaleTimeString()}</p>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
  
        {/* Modal for sale details */}
        {isModalOpen && selectedSale && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg max-w-lg mx-auto relative">
              <button
                onClick={closeModal}
                className="absolute top-2 right-2 text-3xl text-red-500"
              >
                &times;
              </button>
              <h2 className="text-2xl font-semibold text-black mb-6">Sale Details</h2>
              <p className="text-black"><strong>Sales Rep:</strong> {selectedSale.salesRepUsername}</p>
              <p className="text-black"><strong>Total Sale Amount:</strong> #{selectedSale.total}</p>
              <p className="text-black"><strong>Date:</strong> {new Date(selectedSale.timestamp.seconds * 1000).toLocaleString()}</p>
              <p className="text-black"><strong>Amount Paid:</strong> #{selectedSale.amountPaid}</p>
              <p className="text-black"><strong>Change Given:</strong> #{selectedSale.changeGiven}</p>
              <p className="text-black font-semibold mt-4">Items Sold:</p>
              <ul className="space-y-2">
                {selectedSale.items && selectedSale.items.length > 0 ? (
                  selectedSale.items.map((item, index) => (
                    <li key={index} className="text-black">
                      <strong>{item.name}</strong> (x{item.quantity}) - #{item.price} each
                      <br />
                      <strong>Product ID:</strong> {item.productId}
                    </li>
                  ))
                ) : (
                  <li className="text-black">No items available</li>
                )}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
  
}
