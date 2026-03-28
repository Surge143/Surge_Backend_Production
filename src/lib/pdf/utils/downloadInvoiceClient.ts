/**
 * Utility function to download an invoice PDF from the client side.
 *
 * @param type - 'order' or 'subscription'
 * @param id - The ID of the order or subscription
 * @param token - Optional authentication token (if needed by your API)
 */
export async function downloadInvoice(
  type: "order" | "subscription",
  id: string | number,
  token?: string,
) {
  try {
    let url = `/api/website/invoice/${type}/${id}`;
    if (token) {
      url += `?token=${encodeURIComponent(token)}`;
    }

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/pdf",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to download invoice: ${response.statusText}`);
    }

    // Convert the response to a blob
    const blob = await response.blob();

    // Create a temporary URL for the blob
    const downloadUrl = window.URL.createObjectURL(blob);

    // Create a temporary anchor element and trigger the download
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = downloadUrl;

    // The API provides the filename in the Content-Disposition header,
    // but as a fallback we can generate one here.
    const contentDisposition = response.headers.get("Content-Disposition");
    let filename = `invoice-${type}-${id}.pdf`;
    if (contentDisposition && contentDisposition.includes("filename=")) {
      const matches = /filename="([^"]+)"/.exec(contentDisposition);
      if (matches && matches[1]) {
        filename = matches[1];
      }
    }

    a.download = filename;
    document.body.appendChild(a);
    a.click();

    // Cleanup
    window.URL.revokeObjectURL(downloadUrl);
    document.body.removeChild(a);

    return { success: true };
  } catch (error) {
    console.error("Error downloading invoice:", error);
    return { success: false, error };
  }
}
