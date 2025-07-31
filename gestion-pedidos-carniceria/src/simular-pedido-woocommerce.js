const WooCommerceRestApi = require("@woocommerce/woocommerce-rest-api").default;
const dotenv = require('dotenv');

// Cargar variables de entorno desde el archivo .env
dotenv.config({ path: './gestion-pedidos-carniceria/.env' });

// Configurar la API de WooCommerce
const WooCommerce = new WooCommerceRestApi({
  url: process.env.WC_URL,
  consumerKey: process.env.WC_CONSUMER_KEY,
  consumerSecret: process.env.WC_CONSUMER_SECRET,
  version: "wc/v3"
});

// Definir los datos del pedido
const orderData = {
  payment_method: "stripe",
  payment_method_title: "Tarjeta de crédito (Stripe)",
  set_paid: true,
  billing: {
    first_name: "Juan",
    last_name: "Pérez",
    address_1: "Calle Falsa 123",
    address_2: "",
    city: "Madrid",
    state: "Madrid",
    postcode: "28001",
    country: "ES",
    email: "juan.perez@example.com",
    phone: "600111222"
  },
  shipping: {
    first_name: "Ana",
    last_name: "García",
    address_1: "Avenida de la Innovación 456",
    address_2: "Oficina 3B",
    city: "Barcelona",
    state: "Barcelona",
    postcode: "08001",
    country: "ES"
  },
  line_items: [
    {
      product_id: 93, // Reemplazar con un ID de producto válido
      quantity: 2
    },
    {
        product_id: 22, // Reemplazar con un ID de producto válido
        quantity: 1
    }
  ],
  shipping_lines: [
    {
      method_id: "flat_rate",
      method_title: "Tarifa Plana",
      total: "10.00"
    }
  ],
  status: "processing" // Se establece como 'processing' para simular un pago completado
};

// Función para crear el pedido
async function crearPedidoSimulado() {
  console.log("📦 Creando pedido simulado en WooCommerce...");
  try {
    const response = await WooCommerce.post("orders", orderData);
    console.log("✅ Pedido creado con éxito!");
    console.log("   ID del Pedido:", response.data.id);
    console.log("   Número de Pedido:", response.data.number);
    console.log("   Estado:", response.data.status);
    console.log("   Total:", response.data.total);
    console.log("   URL del Pedido:", response.data.order_key);
  } catch (error) {
    console.error("❌ Error al crear el pedido:");
    if (error.response) {
      console.error("   - Status:", error.response.status);
      console.error("   - Data:", JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }
  }
}

// Ejecutar la función
crearPedidoSimulado();
