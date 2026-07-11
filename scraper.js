const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = './data.json';

// Link produk Itemku yang kamu berikan
const targets = [
    { id: '3425149', url: 'https://www.itemku.com/g/growtopia/lock?from=searchhomepage&item_info_group_id=104&item_info_id=21719&server_id=62&product_id=3425149' },
    { id: '2453334', url: 'https://www.itemku.com/g/growtopia/lock?from=searchhomepage&item_info_group_id=104&item_info_id=21719&server_id=62&product_id=2453334' },
    { id: '2133494', url: 'https://www.itemku.com/g/growtopia/lock?from=searchhomepage&item_info_group_id=104&item_info_id=21719&server_id=62&product_id=2133494' }
];

async function runTracker() {
    let prices = [];
    let currentData = {};

    for (let target of targets) {
        try {
            // Menggunakan User-Agent samaran agar tidak diblokir sistem keamanan web (WAF)
            const response = await axios.get(target.url, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
            });
            const $ = cheerio.load(response.data);
            
            // Itemku biasanya menyimpan data state di dalam script Next.js atau elemen harga spesifik.
            // Baris ini mencari elemen yang memuat angka harga. Kamu mungkin perlu menyesuaikan selector '.price-text' dengan Inspect Element di web Itemku.
            const priceText = $('.price-text').first().text().replace(/[^0-9]/g, '');
            const price = parseInt(priceText, 10);

            if (price) {
                prices.push(price);
                currentData[target.id] = price;
            }
        } catch (error) {
            console.error(`Gagal mengambil data untuk ID ${target.id}:`, error.message);
        }
    }

    if (prices.length > 0) {
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        const avgPrice = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);

        const newRecord = {
            timestamp: new Date().toISOString(),
            prices: currentData,
            min: minPrice,
            max: maxPrice,
            avg: avgPrice
        };

        // Simpan ke database JSON
        let db = [];
        if (fs.existsSync(path)) {
            db = JSON.parse(fs.readFileSync(path));
        }
        db.push(newRecord);

        // Batasi database misal 1000 data terakhir agar file tidak terlalu besar
        if (db.length > 1000) db.shift();

        fs.writeFileSync(path, JSON.stringify(db, null, 2));
        console.log("Data harga berhasil diperbarui:", newRecord);
    }
}

runTracker();
