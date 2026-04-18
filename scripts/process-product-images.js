const fs = require('fs');
const path = require('path');
const axios = require('axios');
const sharp = require('sharp');
const https = require('https');

const JSON_PATH = path.join(__dirname, '../src/lib/products/hero-products.json');
const PUBLIC_DIR = path.join(__dirname, '../public/products');

if (!fs.existsSync(PUBLIC_DIR)) {
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
}

async function processImages() {
  console.log('🚀 Bắt đầu xử lý hình ảnh sản phẩm...');
  
  let products;
  try {
    const data = fs.readFileSync(JSON_PATH, 'utf8');
    products = JSON.parse(data);
  } catch (error) {
    console.error('❌ Không thể đọc file JSON:', error.message);
    return;
  }

  let updatedCount = 0;

  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    
    if (product.sourceImageUrl) {
      const fileName = `${product.id}.webp`;
      const localPath = path.join(PUBLIC_DIR, fileName);
      const publicPath = `/products/${fileName}`;

      console.log(`\n📦 Đang xử lý [${product.brand}] ${product.name}...`);

      try {
        const response = await axios({
          url: product.sourceImageUrl,
          responseType: 'arraybuffer',
          timeout: 20000,
          httpsAgent: new https.Agent({  
            rejectUnauthorized: false
          })
        });

        await sharp(response.data)
          .resize(500, 500, {
            fit: 'contain',
            background: { r: 255, g: 255, b: 255, alpha: 1 }
          })
          .webp({ quality: 85 })
          .toFile(localPath);

        product.imageUrl = publicPath;
        updatedCount++;
        console.log(`✅ Đã lưu: ${publicPath}`);
      } catch (error) {
        console.error(`❌ Lỗi khi xử lý ${product.id}:`, error.message);
      }
    }
  }

  if (updatedCount > 0) {
    try {
      fs.writeFileSync(JSON_PATH, JSON.stringify(products, null, 2), 'utf8');
      console.log(`\n🎉 Hoàn thành! Đã cập nhật ${updatedCount} sản phẩm.`);
    } catch (error) {
      console.error('❌ Lỗi khi lưu file JSON:', error.message);
    }
  } else {
    console.log('\n✨ Không có thay đổi nào cần lưu.');
  }
}

processImages();
