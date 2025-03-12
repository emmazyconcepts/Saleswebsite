import { useEffect, useState, useRef, use } from "react";
import { useRouter } from "next/router";

import { firestore } from "@/utils/firebase"; // Firestore configuration

import { Html5Qrcode } from "html5-qrcode"; // Make sure to install this library


import {
  collection,
  getDocs,
  getDoc,
  addDoc,
  doc,
  db,
  batch,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore"; // Firestore methods

export default function SalesRepDashboard() {
  const [sales, setSales] = useState([]);
  const [goods, setGoods] = useState([]); // Available goods from Firestore
  const [cart, setCart] = useState([]); // Goods added to the cart
  const [total, setTotal] = useState(0); // Total price of items in cart
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null); // Success message
  const [searchQuery, setSearchQuery] = useState(""); // Search query for goods
  const [showPopup, setShowPopup] = useState(false); // To toggle the popup visibility
  const [selectedQuantity, setSelectedQuantity] = useState(1); // Selected quantity in popup
  const [filteredGoods, setFilteredGoods] = useState([]); // Filtered goods based on search
  const [amountPaid, setAmountPaid] = useState(0); // Amount paid by the customer
  const [salesRepUsername, setSalesRepUsername] = useState(null); // Store the salesRepUsername
  const router = useRouter();
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false); // State to track maintenance mode status











  const popupRef = useRef(null);

  // Close the popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        setShowPopup(false);
      }
    };

    if (showPopup) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showPopup]);

  // useEffect(() => {
  //   handleScanForGoods()
  // },[])


  useEffect(() => {
    const checkMaintenanceMode = async () => {
      try {
        const maintenanceDoc = await getDoc(doc(firestore, "settings", "maintenance"));
        if (maintenanceDoc.exists()) {
          const isActive = maintenanceDoc.data().isActive; // Check the `isActive` field
          setIsMaintenanceMode(isActive);
        } else {
          console.error("Maintenance mode document not found.");
        }
      } catch (error) {
        console.error("Error fetching maintenance mode status:", error);
      }
    };

    const checkAuthentication = () => {
      const isAuthenticated = localStorage.getItem("isAuthenticated");

      if (!isAuthenticated) {
        router.push("/salesrep/login");
      } else {
        const username = localStorage.getItem("salesRepUsername");

        if (username) {
          setSalesRepUsername(username);
          fetchSales(username);
        } else {
          setError("Sales Rep username is missing.");
        }

        fetchGoods();
      }
    };

    const initialize = async () => {
      await checkMaintenanceMode();
      checkAuthentication();
    };

    initialize();
  }, [router]);






  const fetchSales = async (salesRepUsername) => {
    try {
      const salesSnapshot = await getDocs(collection(firestore, "sales"));
      const salesList = salesSnapshot.docs.map((doc) => doc.data());

      // Filter sales to only include those made by the current sales rep
      const filteredSales = salesList.filter(
        (sale) => sale.salesRepUsername === salesRepUsername
      );

      setSales(filteredSales);
    } catch (error) {
      setError("Error fetching sales data.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };



  const fetchGoods = async () => {
    try {
      const goodsSnapshot = await getDocs(collection(firestore, "goods"));
      const goodsList = goodsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setGoods(goodsList);
      setFilteredGoods(goodsList); // Initially, show all goods
    } catch (error) {
      setError("Error fetching goods.");
      console.error(error);
    }
  };




  // Inside your SalesRepDashboard component
  const handleScanForGoods = () => {
    const html5QrCode = new Html5Qrcode("qr-reader");
    const qrCodeSuccessCallback = async (decodedText) => {
      try {
        // Fetch product details from Firestore by productId
        const productRef = collection(firestore, "goods");
        const productSnapshot = await getDocs(productRef);
        const goodsList = productSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        const scannedProduct = goodsList.find(
          (item) => item.productId === decodedText
        );

        if (scannedProduct) {
          addToCart(scannedProduct); // Add scanned product to the cart
          console.log(`Product "${scannedProduct.name}" added to cart.`);
        } else {
          console.error("Product not found.");
        }
      } catch (error) {
        console.error("Error fetching scanned product:", error);
      }
      // Do not stop scanning; allow continuous scanning
    };

    const config = { fps: 10, qrbox: { width: 250, height: 250 } };

    // Start scanning
    html5QrCode.start(
      { facingMode: "environment" }, // Use rear camera
      config,
      qrCodeSuccessCallback
    ).catch((error) => {
      console.error("QR Code scanning failed:", error);
    });
  };



  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    const filtered = goods.filter((item) =>
      item.name.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredGoods(filtered);
  };

  const batch = writeBatch(firestore);  // Correct usage of batch


  const addToCart = (item) => {
    const existingItem = cart.find((cartItem) => cartItem.id === item.id);
    const quantity = selectedQuantity;

    if (existingItem) {
      setCart(
        cart.map((cartItem) =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + quantity }
            : cartItem
        )
      );
      setTotal((prevTotal) => prevTotal + item.price * quantity);
    } else {
      setCart((prevCart) => [
        { ...item, quantity }, // Add new item at the top
        ...prevCart,           // Append existing cart items after
      ]);
      setTotal((prevTotal) => prevTotal + item.price * quantity);
    }

    setShowPopup(false); // Close the popup after adding to cart
    setSelectedQuantity(1); // Reset quantity input
  };


  const removeFromCart = (index) => {
    const updatedCart = [...cart];
    const removedItem = updatedCart.splice(index, 1);
    setCart(updatedCart);
    setTotal((prevTotal) => prevTotal - removedItem[0].price * removedItem[0].quantity);
  };

  const updateQuantity = (index, quantity) => {
    if (quantity === 0) {
      // Remove the item if quantity is set to 0
      removeFromCart(index);
    } else {
      const updatedCart = [...cart];
      updatedCart[index].quantity = quantity;
      setCart(updatedCart);

      const newTotal = updatedCart.reduce(
        (total, item) => total + item.price * item.quantity,
        0
      );
      setTotal(newTotal);
    }
  };

  const calculateChange = () => {
    if (amountPaid >= total) {
      return amountPaid - total;
    }
    return 0;
  };

  const completeSale = async () => {
    if (cart.length === 0 || amountPaid === 0 || !salesRepUsername) {
      alert("Cart, amount paid, and salesRepUsername cannot be empty");
      return;
    }

    const changeGiven = calculateChange();

    try {
      const newSale = {
        salesRepUsername,
        items: cart,
        total,
        amountPaid,
        changeGiven,
        timestamp: serverTimestamp(),
      };

      const saleRef = await addDoc(collection(firestore, "sales"), newSale);
      setSuccess("Sale completed successfully!");

      const batch = writeBatch(firestore);

      cart.forEach((item) => {
        const goodsRef = doc(firestore, 'goods', item.id);
        const newStock = item.stock - item.quantity;

        if (newStock >= 0) {
          batch.update(goodsRef, { stock: newStock });
        } else {
          alert(`Not enough stock for ${item.name}`);
        }
      });

      await batch.commit();

      // Generate receipt content
      const receiptContent = `
       <body>
  <h1>OMO EKO PROVISION STORE</h1>
  <h2>Receipt</h2>

  <div class="store-info">
    <p>No 1 Alagbo Plaza, Opposite African Primary School, Sango Saki</p>
    <p>08035493389 | 08026293977 | 07066290577</p>
  </div>

  <div class="receipt-details">
    <p><strong>Sales Rep:</strong> ${salesRepUsername}</p>
    <p><strong>Total:</strong> ${total}</p>
    <p><strong>Amount Paid:</strong> ${amountPaid}</p>
    <p><strong>Change Given:</strong> ${changeGiven}</p>
  </div>

  <ul>
    ${cart.map(item => `<li>${item.name} - ${item.quantity} x ${item.price}</li>`).join('')}
  </ul>

  <div class="footer">
    <p>Thank you for your purchase!</p>
    <p>Goods taken in good condition can’t be returned.</p>
  </div>
</body>
        <style>
          body {
      font-family: 'Arial', sans-serif;
      max-width: 300px;
      margin: 0 auto;
      padding: 20px;
      border: 1px solid #ccc;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
    }
    h1, h2 {
      text-align: center;
      margin: 0;
    }
    h1 {
      font-size: 24px;
      color: #333;
    }
    h2 {
      font-size: 18px;
      color: #555;
      margin-bottom: 10px;
    }
    .store-info {
      text-align: center;
      font-size: 14px;
      color: #666;
      margin-bottom: 15px;
    }
    .store-info p {
      margin: 5px 0;
    }
    .receipt-details {
      font-size: 14px;
      color: #333;
      margin-bottom: 15px;
    }
    .receipt-details p {
      margin: 5px 0;
    }
    ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    li {
      margin: 5px 0;
      font-size: 14px;
      color: #444;
    }
    .footer {
      text-align: center;
      font-size: 12px;
      color: #777;
      margin-top: 20px;
    }
    .footer p {
      margin: 5px 0;
    }
        </style>

      `;

      // Open a new window for the receipt and print
      const printWindow = window.open('', '_blank');
      printWindow.document.write(receiptContent);
      printWindow.document.close();
      printWindow.print();

      // Reset the cart and other values
      setCart([]);
      setTotal(0);
      setAmountPaid(0);
      fetchSales(salesRepUsername);
    } catch (error) {
      console.error("Error completing sale:", error);
      alert("Failed to complete sale.");
    }
  };




  if (loading) return <p>Loading...</p>;
  if (error) return <p className="text-red-500">{error}</p>;










  return (
    <div className="min-h-screen bg-gradient-to-r from-indigo-600 to-indigo-800 p-8">


      {isMaintenanceMode && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-80 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg text-center space-y-4 shadow-lg max-w-md mx-auto">
            <h1 className="text-xl font-bold text-red-600">Maintenance Mode</h1>
            <p className="text-gray-700">
              The system is currently under maintenance. You will not be able to access the application until maintenance is completed.
            </p>
          </div>
        </div>
      )}


      <div className="bg-white p-6 rounded-xl shadow-lg max-w-6xl mx-auto">
        <h1 className="text-4xl font-semibold text-center text-black mb-8">
          Sales Rep Dashboard
        </h1>
        <h2 className="text-2xl font-medium text-center text-black mb-6">
          Welcome, {salesRepUsername || "Sales Rep"}
        </h2>
        {success && <h2 className="text-green-600 text-2xl font-medium text-center mb-6">{success}</h2>}
        {error && <h2 className="text-red-600 mb-2 text-2xl font-medium text-center">{error}</h2>}


        <div className="grid grid-cols-1 md:grid-cols-2 gap-20 ">
          {/* Left Column */}
          <div className="pr-20 md:border-r-4 md:border-gray-300">
            <h3 className="text-xl font-semibold text-black mb-4">Add Sale</h3>

            <input
              type="text"
              placeholder="Search for goods..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 text-black"
            />
            <div className="overflow-y-auto max-h-64 mb-10 mt-10">
              {filteredGoods.map((item) => (
                <div key={item.id} className="flex justify-between mb-4 ">
                  <span className="text-black">{item.name}</span>
                  <button
                    onClick={() => addToCart(item)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none"
                  >
                    Add to Cart
                  </button>
                </div>
              ))}
            </div>



            <button
              onClick={() => handleScanForGoods()}
              className="w-full px-5 py-3 bg-indigo-600 text-white rounded-lg mb-6 hover:bg-indigo-700 focus:outline-none transition duration-300"
            >
              Scan for Goods
            </button>

            {/* Popup for QR Code Scanner */}
            <div id="qr-reader" className="mb-4"></div>


          </div>



          {/* Right Column */}
          <div>
            {/* Cart */}
            <div className="mb-6">
              <h3 className="font-semibold text-black mb-2">Cart</h3>
              {cart.length > 0 ? (
                <div>
                  <ul>
                    {cart.map((item, index) => (
                      <li key={index} className="flex justify-between mb-4">
                        <span className="text-black">{item.name}</span>
                        <div className="flex items-center space-x-4">
                          <button
                            onClick={() => updateQuantity(index, item.quantity - 1)}
                            className="px-4 py-2 bg-gray-300 text-black rounded-lg hover:bg-gray-400 focus:outline-none"
                          >
                            −
                          </button>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) =>
                              updateQuantity(index, parseInt(e.target.value))
                            }
                            className="w-16 text-center border border-gray-300 rounded-lg text-black"
                          />
                          <button
                            onClick={() => updateQuantity(index, item.quantity + 1)}
                            className="px-4 py-2 bg-gray-300 text-black rounded-lg hover:bg-gray-400 focus:outline-none"
                          >
                            +
                          </button>
                        </div>
                        <span className="font-medium text-black">
                          #{item.price * item.quantity}
                        </span>
                        <button
                          onClick={() => removeFromCart(index)}
                          className="text-red-600 hover:text-red-700 transition duration-300"
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 font-semibold text-black">
                    Total: #{total}
                  </div>
                </div>
              ) : (
                <p className="text-black">No items in cart.</p>
              )}
            </div>

            {/* Amount Paid */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-black mb-2">
                Amount Paid
              </label>
              <input
                type="number"
                value={amountPaid}
                onChange={(e) => setAmountPaid(parseFloat(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black"
              />
            </div>

            {/* Complete Sale Button */}
            <button
              onClick={completeSale}
              className="w-full px-5 py-3 bg-indigo-600 text-white rounded-lg mb-6 hover:bg-indigo-700 focus:outline-none transition duration-300"
            >
              Complete Sale
            </button>

            {/* Display Change */}
            {calculateChange() > 0 && (
              <div className="mt-4 text-lg font-semibold text-black">
                <strong>Change Given:</strong> #{calculateChange()}
              </div>
            )}

            {/* Sales History Button */}
            <div className="mt-6">
              <button
                onClick={() => window.location.replace("/salesrep/sales")}
                className="w-full px-5 py-3 bg-gray-800 text-white rounded-lg shadow-md hover:bg-gray-900 focus:outline-none transition duration-300"
              >
                View Sales History
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>




  );
}


// old code 