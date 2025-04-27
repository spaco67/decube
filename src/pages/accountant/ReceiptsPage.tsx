import React, { useState, useEffect } from "react";
import DashboardLayout from "../../components/Layout/DashboardLayout";
import { supabase } from "../../lib/supabase";
import { Receipt } from "../../types";
import { Eye, Download, Printer, Share2, Search } from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const ReceiptsPage: React.FC = () => {
  const [receipts, setReceipts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);
  const [shareUrl, setShareUrl] = useState("");
  const [platform, setPlatform] = useState<string>("");

  useEffect(() => {
    fetchReceipts();
  }, []);

  const fetchReceipts = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get receipts with related order and waiter info
      const { data, error } = await supabase
        .from("receipts")
        .select(
          `
          *,
          order:orders(
            id,
            table_id,
            waiter_id,
            status,
            total_amount,
            created_at,
            payment_method,
            order_items:order_items(
              id,
              menu_item_id,
              quantity,
              price,
              status,
              menu_item:menu_items(name)
            )
          ),
          created_by:users(name, email)
        `
        )
        .order("created_at", { ascending: false });

      if (error) throw error;

      setReceipts(data || []);
    } catch (err: any) {
      console.error("Error fetching receipts:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const generateReceiptPDF = (receipt: any) => {
    try {
      const doc = new jsPDF();

      // Header
      doc.setFontSize(20);
      doc.text("DECUBE Restaurant", 105, 20, { align: "center" });

      doc.setFontSize(12);
      doc.text("Receipt", 105, 30, { align: "center" });

      // Receipt Info
      doc.setFontSize(10);
      doc.text(`Receipt ID: ${receipt.id.substring(0, 8)}`, 20, 40);
      doc.text(
        `Date: ${new Date(receipt.created_at).toLocaleString()}`,
        20,
        45
      );
      doc.text(
        `Payment Method: ${receipt.order.payment_method || "Not specified"}`,
        20,
        50
      );

      // Order Items Table
      const tableColumn = ["Item", "Quantity", "Price", "Total"];
      const tableRows: any[][] = [];

      let totalAmount = 0;

      receipt.order.order_items.forEach((item: any) => {
        const itemName = item.menu_item ? item.menu_item.name : "Unknown Item";
        const itemTotal = item.price * item.quantity;
        totalAmount += itemTotal;

        tableRows.push([
          itemName,
          item.quantity,
          `₦${item.price.toFixed(2)}`,
          `₦${itemTotal.toFixed(2)}`,
        ]);
      });

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 60,
        theme: "striped",
        headStyles: { fillColor: [0, 128, 128] },
      });

      // Total
      const finalY = (doc as any).lastAutoTable.finalY + 10;
      doc.text(`Total Amount: ₦${totalAmount.toFixed(2)}`, 150, finalY, {
        align: "right",
      });

      // Footer
      doc.setFontSize(8);
      const pageWidth = doc.internal.pageSize.width;
      doc.text("Thank you for dining with us!", pageWidth / 2, finalY + 20, {
        align: "center",
      });

      return doc;
    } catch (err) {
      console.error("Error generating PDF:", err);
      setError("Failed to generate PDF. Please try again.");
      return null;
    }
  };

  const printReceipt = (receipt: any) => {
    const doc = generateReceiptPDF(receipt);
    if (doc) {
      const filename = `receipt-${receipt.id.substring(0, 8)}.pdf`;
      window.open(doc.output("bloburl"), "_blank");
    }
  };

  const downloadReceipt = (receipt: any) => {
    const doc = generateReceiptPDF(receipt);
    if (doc) {
      const filename = `receipt-${receipt.id.substring(0, 8)}.pdf`;
      doc.save(filename);

      // Update receipt record with filename
      updateReceiptFile(receipt.id, filename);
    }
  };

  const updateReceiptFile = async (receiptId: string, filename: string) => {
    try {
      const { error } = await supabase
        .from("receipts")
        .update({ filename })
        .eq("id", receiptId);

      if (error) throw error;
    } catch (err) {
      console.error("Error updating receipt record:", err);
    }
  };

  const handleShare = (receipt: any) => {
    setSelectedReceipt(receipt);
    setShowShareModal(true);
  };

  const shareReceipt = async () => {
    if (!selectedReceipt || !platform) return;

    try {
      // In a real app, you'd upload the PDF to storage and get a share URL
      // For demo purposes, we'll just update the record
      const mockShareUrl = `https://decube.example.com/receipts/${selectedReceipt.id}`;

      const { error } = await supabase
        .from("receipts")
        .update({
          shared_url: mockShareUrl,
          shared_platform: platform,
        })
        .eq("id", selectedReceipt.id);

      if (error) throw error;

      setShareUrl(mockShareUrl);

      // In a real app, you would redirect to the social platform with the share URL
      // For demo, just show the URL
      alert(`Receipt would be shared on ${platform} with URL: ${mockShareUrl}`);

      setShowShareModal(false);
      fetchReceipts(); // Refresh the list
    } catch (err: any) {
      console.error("Error sharing receipt:", err);
      setError(err.message);
    }
  };

  const filteredReceipts = receipts.filter((receipt) => {
    const searchLower = searchTerm.toLowerCase();
    const orderId = receipt.order?.id || "";
    const paymentMethod = receipt.order?.payment_method || "";
    const totalAmount = receipt.order?.total_amount || "";

    return (
      orderId.toLowerCase().includes(searchLower) ||
      paymentMethod.toLowerCase().includes(searchLower) ||
      totalAmount.toString().includes(searchLower)
    );
  });

  return (
    <DashboardLayout title="Receipt Management">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4">
          Receipts
        </h2>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-4">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search receipts..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg dark:bg-gray-800 dark:text-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search
              size={18}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="text-center p-8">
            <p className="text-gray-500 dark:text-gray-400">
              Loading receipts...
            </p>
          </div>
        ) : (
          <>
            {filteredReceipts.length > 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Receipt ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Order Total
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Payment Method
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredReceipts.map((receipt) => (
                      <tr key={receipt.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {receipt.id.substring(0, 8)}...
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {new Date(receipt.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          ₦
                          {parseFloat(receipt.order?.total_amount || 0).toFixed(
                            2
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {receipt.order?.payment_method || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => printReceipt(receipt)}
                              className="text-teal-600 hover:text-teal-800 dark:text-teal-500 dark:hover:text-teal-400"
                              title="Print"
                            >
                              <Printer size={18} />
                            </button>
                            <button
                              onClick={() => downloadReceipt(receipt)}
                              className="text-blue-600 hover:text-blue-800 dark:text-blue-500 dark:hover:text-blue-400"
                              title="Download"
                            >
                              <Download size={18} />
                            </button>
                            <button
                              onClick={() => handleShare(receipt)}
                              className="text-purple-600 hover:text-purple-800 dark:text-purple-500 dark:hover:text-purple-400"
                              title="Share"
                            >
                              <Share2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center">
                <p className="text-gray-500 dark:text-gray-400">
                  {searchTerm
                    ? "No receipts matching your search"
                    : "No receipts found"}
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Share Receipt
            </h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Share On Platform
              </label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-800 dark:text-white"
              >
                <option value="">Select platform</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="email">Email</option>
                <option value="twitter">Twitter</option>
                <option value="facebook">Facebook</option>
              </select>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowShareModal(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={shareReceipt}
                disabled={!platform}
                className={`px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md transition-colors ${
                  !platform ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                Share
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default ReceiptsPage;
