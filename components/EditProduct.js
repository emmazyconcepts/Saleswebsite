import React, { useState, useEffect } from "react";
import { updateDoc, doc } from "firebase/firestore";
import { firestore } from "@/utils/firebase"; // Firestore configuration
import { Html5QrcodeScanner } from "html5-qrcode"; // For QR scanning

const EditProduct = ({ selectedGood, setIsEditing }) => {
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    productId: "",
    type: "",
    quantity: "",
    stock: "",
  });

  const [scanner, setScanner] = useState(null);

  useEffect(() => {
    if (selectedGood) {
      setFormData({
        name: selectedGood.name,
        price: selectedGood.price,
        productId: selectedGood.productId,
        type: selectedGood.type,
        quantity: selectedGood.quantity,
        stock: selectedGood.stock,
      });
    }

    // Initialize QR code scanner
    const html5QrCodeScanner = new Html5QrcodeScanner("qr-reader", {
      fps: 10,
      qrbox: 250, // Scanner box size, adjusted to prevent full screen
    });

    html5QrCodeScanner.render(onScanSuccess, onScanFailure);
    setScanner(html5QrCodeScanner);

    // Cleanup scanner on component unmount
    return () => {
      if (scanner) {
        scanner.clear();
      }
    };
  }, [selectedGood]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleUpdate = async () => {
    try {
      await updateDoc(doc(firestore, "goods", selectedGood.id), {
        name: formData.name,
        price: formData.price,
        productId: formData.productId,
        type: formData.type,
        quantity: formData.quantity,
        stock: formData.stock,
      });
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating product: ", error);
    }
  };

  const onScanSuccess = (decodedText) => {
    setFormData((prevState) => ({
      ...prevState,
      productId: decodedText, // Set scanned productId
    }));
    scanner.stop(); // Stop scanning after successful scan
  };

  const onScanFailure = (error) => {
    console.error("QR Scan Error:", error);
  };

  // Conditional styling for stock and quantity fields if they are below 5
  const getFieldClass = (value) => {
    return value < 5 ? "border-red-500 bg-red-100" : "border-gray-300";
  };

  return (
    <div className="p-4 bg-white shadow-md rounded-md max-w-3xl mx-auto text-black">
      <h2 className="text-lg font-bold mb-4">Edit Product</h2>
      <div className="mb-2">
        <label className="block text-sm font-medium">Product Name</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          required
          className="mt-2 p-2 border border-gray-300 rounded-md w-full"
        />
      </div>

      <div className="mb-2">
        <label className="block text-sm font-medium">Price</label>
        <input
          type="number"
          name="price"
          value={formData.price}
          onChange={handleInputChange}
          required
          className="mt-2 p-2 border border-gray-300 rounded-md w-full"
        />
      </div>

      <div className="mb-2">
        <label className="block text-sm font-medium">Product ID</label>
        <input
          type="text"
          name="productId"
          value={formData.productId}
          onChange={handleInputChange}
          required
          className="mt-2 p-2 border border-gray-300 rounded-md w-full"
        />
        <div className="mt-2">
          <button
            onClick={() => {
              // Start scanning when the button is clicked
              scanner && scanner.render(onScanSuccess, onScanFailure);
            }}
            className="px-4 py-2 bg-green-500 text-white rounded-md"
          >
            Scan Product ID
          </button>
        </div>
      </div>

      {/* QR Scanner area with fixed height and width */}
      <div
        id="qr-reader"
        style={{
          width: "100%",
          height: "550px", // Fixed height for scanner box
          marginTop: "20px",
          marginBottom: "20px",
          borderRadius: "8px",
          overflow: "hidden",
          position: "relative",
        }}
      ></div>

      <div className="mb-2">
        <label className="block text-sm font-medium">Type</label>
        <select
          name="type"
          value={formData.type}
          onChange={handleInputChange}
          required
          className="mt-2 p-2 border border-gray-300 rounded-md w-full"
        >
          <option value="retail">Retail</option>
          <option value="wholesale">Wholesale</option>
        </select>
      </div>

      <div className="mb-2">
        <label className="block text-sm font-medium">Quantity</label>
        <input
          type="number"
          name="quantity"
          value={formData.quantity}
          onChange={handleInputChange}
          required
          className={`mt-2 p-2 border ${getFieldClass(formData.quantity)} rounded-md w-full`}
        />
      </div>

      <div className="mb-2">
        <label className="block text-sm font-medium">Stock</label>
        <input
          type="number"
          name="stock"
          value={formData.stock}
          onChange={handleInputChange}
          required
          className={`mt-2 p-2 border ${getFieldClass(formData.stock)} rounded-md w-full`}
        />
      </div>

      <div className="mt-4">
        <button
          onClick={handleUpdate}
          className="px-4 py-2 bg-blue-600 text-white rounded-md"
        >
          Update Product
        </button>
        <button
          onClick={() => setIsEditing(false)}
          className="px-4 py-2 ml-2 bg-gray-500 text-white rounded-md"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default EditProduct;
