import React, { useState, useEffect, useRef } from "react";
import { firestore } from "@/utils/firebase";
import { collection, addDoc } from "firebase/firestore";
import { Html5QrcodeScanner } from "html5-qrcode";
import AdminDashboardLayout from "@/components/AdminDashboardLayout";
import { checkAdminAuth } from "@/utils/auth";
import { useRouter } from "next/router";




const AdminAddGoods = () => {
  const router = useRouter();

  useEffect(() => {
    // Redirect to login page if not authenticated
    if (!checkAdminAuth()) {
      router.push("/admin/login");
    } } )

  const [formData, setFormData] = useState({
    name: "",
    price: "",
    productId: "",
    type: "retail",
    quantity: 0,
    stock: "",
  });

  const [scanning, setScanning] = useState(false);
  const scannerContainerRef = useRef(null);
  const scannerInstanceRef = useRef(null); // Store the scanner instance

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(firestore, "goods"), {
        ...formData,
        price: parseFloat(formData.price),
        quantity: formData.type === "wholesale" ? parseInt(formData.quantity) : 0,
        stock: parseInt(formData.stock),
        timestamp: new Date(),
      });
      alert("Good added successfully!");
      setFormData({
        name: "",
        price: "",
        productId: "",
        type: "retail",
        quantity: 0,
        stock: "",
      });
    } catch (error) {
      console.error("Error adding document:", error);
      alert("Failed to add the good. Try again.");
    }
  };

  const startScanning = () => {
    if (scanning) return;

    setScanning(true);

    setTimeout(() => {
      const scannerElementId = scannerContainerRef.current.id;

      try {
        const scanner = new Html5QrcodeScanner(
          scannerElementId,
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          false
        );

        scanner.render(
          (decodedText) => {
            setFormData((prev) => ({ ...prev, productId: decodedText }));
            stopScanning();
          },
          (error) => {
            console.warn("QR Code scanning error:", error);
          }
        );

        scannerInstanceRef.current = scanner; // Save scanner instance
      } catch (error) {
        console.error("Error initializing scanner:", error);
      }
    }, 100); // Allow DOM to fully render
  };

  const stopScanning = () => {
    const scanner = scannerInstanceRef.current;

    if (scanner) {
      scanner.clear().catch((err) => console.error("Failed to clear scanner:", err));
      scannerInstanceRef.current = null; // Clear the reference
    }

    setScanning(false);
  };

  useEffect(() => {
    return () => {
      if (scanning) {
        stopScanning();
      }
    };
  }, [scanning]);

  return (
    <AdminDashboardLayout>
    <h1 className="text-2xl font-bold mb-6 text-black">Admin - Add Goods</h1>
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
      <div className="mb-4">
        <label className="block text-sm font-medium text-black mb-2">Good Name:</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          required
          className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-black"
        />
      </div>
  
      <div className="mb-4">
        <label className="block text-sm font-medium text-black mb-2">Price:</label>
        <input
          type="number"
          name="price"
          value={formData.price}
          onChange={handleInputChange}
          required
          className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-black"
        />
      </div>
  
      <div className="mb-4">
        <label className="block text-sm font-medium text-black mb-2">Product ID (Optional):</label>
        <input
          type="text"
          name="productId"
          value={formData.productId}
          onChange={handleInputChange}
          className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-black"
        />
        <button
          type="button"
          onClick={startScanning}
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Scan Product ID
        </button>
      </div>
  
      {scanning && (
        <div
          id="scanner"
          ref={scannerContainerRef}
          style={{
            width: "250px",
            height: "250px",
            marginTop: "10px",
            marginBottom: "20px",
            border: "2px solid #ccc",
          }}
        ></div>
      )}
  
      <div className="mb-4">
        <label className="block text-sm font-medium text-black mb-2">Type:</label>
        <select
          name="type"
          value={formData.type}
          onChange={handleInputChange}
          className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-black"
        >
          <option value="retail">Retail</option>
          <option value="wholesale">Wholesale</option>
        </select>
      </div>
  
      {formData.type === "wholesale" && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-black mb-2">Quantity:</label>
          <input
            type="number"
            name="quantity"
            value={formData.quantity}
            onChange={handleInputChange}
            required
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-black"
          />
        </div>
      )}
  
      <div className="mb-4">
        <label className="block text-sm font-medium text-black mb-2">Stock Available:</label>
        <input
          type="number"
          name="stock"
          value={formData.stock}
          onChange={handleInputChange}
          required
          className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-black"
        />
      </div>
  
      <button
        type="submit"
        className="mt-4 w-full px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
      >
        Add Good
      </button>
    </form>
  </AdminDashboardLayout>
  
  );
};

export default AdminAddGoods;
