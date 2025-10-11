/**
 * Meta Tags Controller
 * Handles server-side meta tag generation for social media sharing
 */

import Restaurant from '../models/restaurant.model.js';

/**
 * Generate HTML with restaurant-specific meta tags
 * This endpoint is called by social media crawlers
 */
export const getRestaurantMeta = async (req, res) => {
  try {
    const { slug } = req.params;
    
    // Fetch restaurant data
    const restaurant = await Restaurant.findOne({ slug }).select('name theme slug');
    
    if (!restaurant) {
      // Return default meta tags if restaurant not found
      return res.send(generateDefaultHTML());
    }
    
    // Generate HTML with restaurant-specific meta tags
    const html = generateRestaurantHTML(restaurant);
    res.send(html);
    
  } catch (error) {
    console.error('Error generating meta tags:', error);
    res.send(generateDefaultHTML());
  }
};

/**
 * Generate HTML with restaurant-specific meta tags
 */
const generateRestaurantHTML = (restaurant) => {
  const { name, theme, slug } = restaurant;
  const baseUrl = process.env.FRONTEND_URL || 'https://dineos.ae';
  const restaurantUrl = `${baseUrl}/restaurant/${slug}`;
  const logoUrl = theme?.logo?.url || `${baseUrl}/wecan-og-banner.png`;
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  
  <!-- Primary Favicon -->
  <link rel="icon" type="image/png" sizes="32x32" href="${logoUrl}" />
  <link rel="icon" type="image/png" sizes="16x16" href="${logoUrl}" />
  <link rel="apple-touch-icon" sizes="180x180" href="${logoUrl}" />
  <link rel="icon" type="image/png" sizes="512x512" href="${logoUrl}" />

  <!-- Page Title & Description -->
  <title>${name} | Digital Menu</title>
  <meta name="title" content="${name} | Digital Menu" />
  <meta name="description" content="Explore ${name}'s digital menu. Browse our delicious offerings and place your order seamlessly." />

  <!-- Open Graph / Facebook / WhatsApp / LinkedIn -->
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${restaurantUrl}" />
  <meta property="og:title" content="${name} | Digital Menu" />
  <meta property="og:description" content="Explore ${name}'s digital menu. Browse our delicious offerings and place your order seamlessly." />
  <meta property="og:image" content="${logoUrl}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:type" content="image/png" />
  <meta property="og:image:alt" content="${name} logo" />

  <!-- Twitter / X -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:url" content="${restaurantUrl}" />
  <meta name="twitter:title" content="${name} | Digital Menu" />
  <meta name="twitter:description" content="Explore ${name}'s digital menu. Browse our delicious offerings and place your order seamlessly." />
  <meta name="twitter:image" content="${logoUrl}" />

  <!-- Redirect to actual SPA after meta tags are read -->
  <script>
    // Redirect to the actual SPA after a short delay
    setTimeout(() => {
      window.location.href = '${restaurantUrl}';
    }, 100);
  </script>
</head>
<body>
  <div style="text-align: center; padding: 50px; font-family: Arial, sans-serif;">
    <h1>${name}</h1>
    <p>Loading digital menu...</p>
    <img src="${logoUrl}" alt="${name} logo" style="max-width: 200px; height: auto;" />
  </div>
</body>
</html>`;
};

/**
 * Generate default HTML for non-restaurant pages
 */
const generateDefaultHTML = () => {
  const baseUrl = process.env.FRONTEND_URL || 'https://dineos.ae';
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  
  <!-- Primary Favicon -->
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
  <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
  <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
  <link rel="icon" type="image/png" sizes="512x512" href="/wecan-icon-512.png" />

  <!-- Page Title & Description -->
  <title>Digital Menu | Contactless Digital Menu Solution</title>
  <meta name="title" content="Digital Menu | Contactless Digital Menu Solution" />
  <meta name="description" content="A seamless digital QR menu solution designed for restaurants, cafes, and bars. Enhance customer experience with contactless ordering, easy menu browsing, and secure payments — all from the convenience of a smartphone." />

  <!-- Open Graph / Facebook / WhatsApp / LinkedIn -->
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${baseUrl}" />
  <meta property="og:title" content="Digital Menu | Contactless Digital Menu Solution" />
  <meta property="og:description" content="A seamless digital QR menu solution designed for restaurants, cafes, and bars. Enhance customer experience with contactless ordering, easy menu browsing, and secure payments — all from the convenience of a smartphone." />
  <meta property="og:image" content="${baseUrl}/wecan-og-banner.png" />

  <!-- Twitter / X -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:url" content="${baseUrl}" />
  <meta name="twitter:title" content="Digital Menu | Contactless Digital Menu Solution" />
  <meta name="twitter:description" content="A seamless digital QR menu solution designed for restaurants, cafes, and bars. Enhance customer experience with contactless ordering, easy menu browsing, and secure payments — all from the convenience of a smartphone." />
  <meta name="twitter:image" content="${baseUrl}/wecan-og-banner.png" />
</head>
<body>
  <div style="text-align: center; padding: 50px; font-family: Arial, sans-serif;">
    <h1>Digital Menu</h1>
    <p>Contactless Digital Menu Solution</p>
  </div>
</body>
</html>`;
};
