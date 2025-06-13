import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// File paths for data storage
const productsFile = path.join(__dirname, 'data', 'products.json');
const cartFile = path.join(__dirname, 'data', 'cart.json');

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize data files if they don't exist
if (!fs.existsSync(productsFile)) {
  const initialProducts = [
    {
      id: 1,
      name: "Premium Wireless Headphones",
      price: 299,
      image: "https://images.pexels.com/photos/3394651/pexels-photo-3394651.jpeg?auto=compress&cs=tinysrgb&w=800",
      description: "Experience crystal-clear audio with our premium wireless headphones featuring active noise cancellation and 30-hour battery life.",
      category: "Electronics",
      inStock: true,
      rating: 4.8,
      features: ["Active Noise Cancellation", "30h Battery Life", "Fast Charging", "Premium Materials"]
    },
    {
      id: 2,
      name: "Professional Camera Lens",
      price: 1299,
      image: "https://images.pexels.com/photos/90946/pexels-photo-90946.jpeg?auto=compress&cs=tinysrgb&w=800",
      description: "Capture stunning photographs with this professional-grade camera lens designed for professional photographers and enthusiasts.",
      category: "Photography",
      inStock: true,
      rating: 4.9,
      features: ["85mm f/1.4", "Weather Sealed", "Ultra-Sharp", "Professional Grade"]
    },
    {
      id: 3,
      name: "Luxury Smartwatch",
      price: 799,
      image: "https://images.pexels.com/photos/437037/pexels-photo-437037.jpeg?auto=compress&cs=tinysrgb&w=800",
      description: "Stay connected in style with our luxury smartwatch featuring health monitoring, GPS, and premium materials.",
      category: "Wearables",
      inStock: true,
      rating: 4.7,
      features: ["Health Monitoring", "GPS Tracking", "7-Day Battery", "Premium Design"]
    },
    {
      id: 4,
      name: "Gaming Mechanical Keyboard",
      price: 189,
      image: "https://images.pexels.com/photos/841228/pexels-photo-841228.jpeg?auto=compress&cs=tinysrgb&w=800",
      description: "Elevate your gaming experience with our premium mechanical keyboard featuring RGB lighting and tactile switches.",
      category: "Gaming",
      inStock: true,
      rating: 4.6,
      features: ["Mechanical Switches", "RGB Lighting", "Gaming Optimized", "Durable Build"]
    },
    {
      id: 5,
      name: "Wireless Charging Pad",
      price: 89,
      image: "https://images.pexels.com/photos/4219654/pexels-photo-4219654.jpeg?auto=compress&cs=tinysrgb&w=800",
      description: "Charge your devices wirelessly with our sleek and efficient charging pad compatible with all Qi-enabled devices.",
      category: "Accessories",
      inStock: true,
      rating: 4.5,
      features: ["Fast Charging", "Universal Compatibility", "Sleek Design", "Safety Features"]
    },
    {
      id: 6,
      name: "Premium Coffee Machine",
      price: 449,
      image: "https://images.pexels.com/photos/4226805/pexels-photo-4226805.jpeg?auto=compress&cs=tinysrgb&w=800",
      description: "Brew barista-quality coffee at home with our premium espresso machine featuring precision temperature control.",
      category: "Home & Kitchen",
      inStock: true,
      rating: 4.8,
      features: ["15-bar Pressure", "Milk Frother", "Programmable", "Premium Build"]
    }
  ];
  fs.writeFileSync(productsFile, JSON.stringify(initialProducts, null, 2));
}

if (!fs.existsSync(cartFile)) {
  fs.writeFileSync(cartFile, JSON.stringify([], null, 2));
}

// Helper functions
const readProducts = () => {
  try {
    const data = fs.readFileSync(productsFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading products:', error);
    return [];
  }
};

const readCart = () => {
  try {
    const data = fs.readFileSync(cartFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading cart:', error);
    return [];
  }
};

const writeCart = (cart) => {
  try {
    fs.writeFileSync(cartFile, JSON.stringify(cart, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing cart:', error);
    return false;
  }
};

// API Routes

// Get all products
app.get('/api/products', (req, res) => {
  const products = readProducts();
  res.json(products);
});

// Get single product
app.get('/api/products/:id', (req, res) => {
  const products = readProducts();
  const product = products.find(p => p.id === parseInt(req.params.id));
  
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }
  
  res.json(product);
});

// Get cart items
app.get('/api/cart', (req, res) => {
  const cart = readCart();
  res.json(cart);
});

// Add item to cart
app.post('/api/cart', (req, res) => {
  const { productId, quantity = 1 } = req.body;
  
  if (!productId) {
    return res.status(400).json({ error: 'Product ID is required' });
  }
  
  const products = readProducts();
  const product = products.find(p => p.id === parseInt(productId));
  
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }
  
  const cart = readCart();
  const existingItem = cart.find(item => item.productId === parseInt(productId));
  
  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    cart.push({
      id: Date.now(),
      productId: parseInt(productId),
      product: product,
      quantity: quantity,
      addedAt: new Date().toISOString()
    });
  }
  
  if (writeCart(cart)) {
    res.json({ message: 'Item added to cart', cart });
  } else {
    res.status(500).json({ error: 'Failed to update cart' });
  }
});

// Update cart item quantity
app.put('/api/cart/:id', (req, res) => {
  const { quantity } = req.body;
  const itemId = parseInt(req.params.id);
  
  if (!quantity || quantity < 0) {
    return res.status(400).json({ error: 'Valid quantity is required' });
  }
  
  const cart = readCart();
  const itemIndex = cart.findIndex(item => item.id === itemId);
  
  if (itemIndex === -1) {
    return res.status(404).json({ error: 'Cart item not found' });
  }
  
  if (quantity === 0) {
    cart.splice(itemIndex, 1);
  } else {
    cart[itemIndex].quantity = quantity;
  }
  
  if (writeCart(cart)) {
    res.json({ message: 'Cart updated', cart });
  } else {
    res.status(500).json({ error: 'Failed to update cart' });
  }
});

// Remove item from cart
app.delete('/api/cart/:id', (req, res) => {
  const itemId = parseInt(req.params.id);
  const cart = readCart();
  const itemIndex = cart.findIndex(item => item.id === itemId);
  
  if (itemIndex === -1) {
    return res.status(404).json({ error: 'Cart item not found' });
  }
  
  cart.splice(itemIndex, 1);
  
  if (writeCart(cart)) {
    res.json({ message: 'Item removed from cart', cart });
  } else {
    res.status(500).json({ error: 'Failed to update cart' });
  }
});

// Clear cart
app.delete('/api/cart', (req, res) => {
  if (writeCart([])) {
    res.json({ message: 'Cart cleared' });
  } else {
    res.status(500).json({ error: 'Failed to clear cart' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});