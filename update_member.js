const fs = require('fs');
const path = require('path');

// Konfigurasi URL sesuai Grabber V2
const PROXY_URL = "https://cors-proxy1.vercel.app/api/fetch?url=";
const TARGET_URL = "https://sakurazaka46.com/s/s46/search/artist";

async function scrapeSakurazaka() {
  try {
    console.log("--- Memulai Sinkronisasi Data ---");
    
    // Fetch menggunakan logic yang sama dengan Grabber V2
    const response = await fetch(PROXY_URL + encodeURIComponent(TARGET_URL));
    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
    
    const htmlText = await response.text();
    console.log("Data HTML berhasil diambil.");

    // Regex untuk mengambil blok <li> yang berisi class box
    const memberBlocks = htmlText.match(/<li class="box"[\s\S]*?<\/li>/g);
    if (!memberBlocks) {
      console.error("Gagal mendeteksi blok member. HTML mungkin kosong.");
      process.exit(1);
    }

    const filePath = path.join(__dirname, 'blogprofil.json');
    if (!fs.existsSync(filePath)) {
      throw new Error("File blogprofil.json tidak ditemukan!");
    }

    let blogProfil = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    let updateCount = 0;

    // Bersihkan komentar wovn-src seperti di Grabber V2
    const cleanCommentRegex = //g;

    for (const block of memberBlocks) {
      // 1. Ambil Nama Romaji
      const nameMatch = block.match(/<p class="name">([\s\S]*?)<\/p>/);
      if (nameMatch) {
        const nameRomaji = nameMatch[1].replace(cleanCommentRegex, '').trim();

        // 2. Ambil Gambar
        const imgMatch = block.match(/<img src="([\s\S]*?)"/);
        let imgFullUrl = "";
        if (imgMatch) {
          const imgPath = imgMatch[1];
          imgFullUrl = imgPath.startsWith('http') ? imgPath : "https://sakurazaka46.com" + imgPath;
        }

        // 3. Ambil Link Profile (tanpa query string)
        const linkMatch = block.match(/<a href="([\s\S]*?)"/);
        let linkFullUrl = "";
        if (linkMatch) {
          linkFullUrl = "https://sakurazaka46.com" + linkMatch[1].split('?')[0];
        }

        // 4. Update JSON jika name_romaji cocok
        for (let key in blogProfil) {
          if (blogProfil[key].name_romaji.trim().toLowerCase() === nameRomaji.toLowerCase()) {
            blogProfil[key].img = imgFullUrl;
            blogProfil[key].link = linkFullUrl;
            
            // Update juga nama JP agar selalu fresh
            const kanaMatch = block.match(/<p class="kana">([\s\S]*?)<\/p>/);
            if (kanaMatch) {
              blogProfil[key].name_jp = kanaMatch[1].replace(cleanCommentRegex, '').trim();
            }
            
            updateCount++;
            console.log(`Updated: ${nameRomaji}`);
          }
        }
      }
    }

    fs.writeFileSync(filePath, JSON.stringify(blogProfil, null, 2), 'utf8');
    console.log(`--- Selesai! ${updateCount} member diperbarui ---`);

  } catch (error) {
    console.error("DEBUG ERROR DETAIL:", error.message);
    process.exit(1);
  }
}

scrapeSakurazaka();
