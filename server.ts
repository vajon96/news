import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import admin from "firebase-admin";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin (using internal authentication if available)
if (!admin.apps.length) {
  try {
    admin.initializeApp();
  } catch (e) {
    console.warn("Firebase Admin failed to initialize. SEO tags will be defaults.", e);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Vite instance
  let vite: any;
  if (process.env.NODE_ENV !== "production") {
    vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "custom", // Changed from 'spa' to 'custom' to handle HTML transformation
    });
    app.use(vite.middlewares);
  }

  // Handle OG Tags for News Articles
  app.get('/news/:slug', async (req, res) => {
    const { slug } = req.params;
    let title = "Cox Bazar Times";
    let desc = "Modern News Portal for Cox's Bazar";
    let image = "https://images.unsplash.com/photo-1544161515-4ad68f738bd8?auto=format&fit=crop&q=80&w=1200";
    let url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;

    try {
      if (admin.apps.length) {
        const newsSnap = await admin.firestore().collection('news')
          .where('slug', '==', slug)
          .where('status', '==', 'published')
          .limit(1)
          .get();

        if (!newsSnap.empty) {
          const article = newsSnap.docs[0].data();
          title = article.title + " | Cox Bazar Times";
          desc = article.excerpt || article.content.substring(0, 160).replace(/<[^>]*>?/gm, '');
          image = article.featuredImage || image;
        }
      }
    } catch (e) {
      console.error("Error fetching news metadata for SSR:", e);
    }

    const htmlPath = process.env.NODE_ENV === 'production' 
      ? path.resolve(__dirname, 'dist', 'index.html')
      : path.resolve(__dirname, 'index.html');

    let template = fs.readFileSync(htmlPath, 'utf-8');

    // If development, use vite transform
    if (vite) {
      template = await vite.transformIndexHtml(req.originalUrl, template);
    }

    // Inject Meta Tags
    const metaTags = `
      <title>${title}</title>
      <meta name="description" content="${desc}">
      <meta property="og:title" content="${title}">
      <meta property="og:description" content="${desc}">
      <meta property="og:image" content="${image}">
      <meta property="og:url" content="${url}">
      <meta property="og:type" content="article">
      <meta name="twitter:card" content="summary_large_image">
      <meta name="twitter:title" content="${title}">
      <meta name="twitter:description" content="${desc}">
      <meta name="twitter:image" content="${image}">
    `;

    // Extremely basic injection: replace <head> with <head> + tags 
    // or use a placeholder if you have one in index.html
    const transformedHtml = template.replace(/<title>.*?<\/title>/, metaTags);
    
    res.status(200).set({ 'Content-Type': 'text/html' }).end(transformedHtml);
  });

  if (process.env.NODE_ENV !== "production") {
    // Other routes handled by Vite SPA fallback
    app.get('*', async (req, res, next) => {
      const url = req.originalUrl;
      try {
        let template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
