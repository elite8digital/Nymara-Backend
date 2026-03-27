export const sendWhatsAppMessage = async (to, order) => {
  try {
    console.log(" Sending WhatsApp message to:", to, "with order:", order.oId);

    const response = await fetch(
      `https://graph.facebook.com/v23.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to,
          type: "template",
          template: {
            name: "new_order", // must match exactly in Meta
            language: { code: "en" },
            components: [
              {
                type: "body",
                parameters: [
                  { type: "text", text: order.oId },
                  { type: "text", text: order.totalAmount.toString() },
                  { type: "text", text: order.orderDate.toLocaleString() }
                ],
              },
            ],
          },
        }),
      }
    );

    const data = await response.json();
    console.log("📨 WhatsApp API Response:", JSON.stringify(data, null, 2));

    if (!response.ok) {
      throw new Error(data.error?.message || "Failed to send WhatsApp message");
    }

    return data;
  } catch (err) {
    console.error("❌ WhatsApp Notification failed:", err.message);
    throw err;
  }
};


export const sendCancelOrderMessage = async (to, order) => {
  try {
    console.log(" Sending WhatsApp cancel message to:", to, "with order:", order.oId);

    const response = await fetch(
      `https://graph.facebook.com/v23.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to,
          type: "template",
          template: {
            name: "cancel_order", // 👈 must match exactly in Meta WhatsApp templates
            language: { code: "en" },
            components: [
              {
                type: "body",
                parameters: [
                  { type: "text", text: order.oId }, // Order ID
                  { type: "text", text: order.totalAmount.toString() }, // Amount
                  { type: "text", text: new Date().toLocaleString() } // Cancellation timestamp
                ],
              },
            ],
          },
        }),
      }
    );

    const data = await response.json();
    console.log("📨 WhatsApp API Response:", JSON.stringify(data, null, 2));

    if (!response.ok) {
      throw new Error(data.error?.message || "Failed to send WhatsApp cancel message");
    }

    return data;
  } catch (err) {
    console.error("❌ WhatsApp Cancel Notification failed:", err.message);
    throw err;
  }
};
