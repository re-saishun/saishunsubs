const fs = require('fs');
const path = require('path');

// Konfigurasi URL
const PROXY_URL = "https://cors-proxy1.vercel.app/api/fetch?url=";
const TARGET_URL = "https://sakurazaka46.com/s/s46/search/artist";

async function scrapeSakurazaka() {
  try {
    console.log("--- Memulai Sinkronisasi Data ---");
    
    // Menggunakan fetch dengan cara yang sama seperti di Grabber V2
    const response = await fetch(PROXY_URL + encodeURIComponent(TARGET_URL));
    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
    
    const htmlText = await response.text();
    console.log("Data HTML berhasil diambil dari proxy.");

    // Regex untuk mengambil setiap blok member sesuai struktur Sakurazaka
    const memberBlocks = htmlText.match(/<li class="box"[\s\S]*?<\/li>/g);
    if (!memberBlocks) {
        console.error("Gagal mendeteksi blok member. Periksa apakah HTML kosong atau terblokir.");
        process.exit(1);
    }

    // Path ke file blogprofil.json
    const filePath = path.join(__dirname, 'blogprofil.json');
    if (!fs.existsSync(filePath)) {
        throw new Error("File blogprofil.json tidak ditemukan!");
    }

    let blogProfil = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    let updateCount = 0;

    memberBlocks.forEach(block => {
      // 1. Ekstrak Nama Romaji & Bersihkan komentar wovn (seperti di Grabber V2)
      const nameMatch = block.match(/<p class="name">([\s\S]*?)<\/p>/);
      let nameRomaji = nameMatch ? nameMatch[1].replace(//g, '').trim() : null;

      if (nameRomaji) {
        // 2. Ekstrak Image URL & Tambahkan Domain jika path relatif
        const imgMatch = block.match(/<img src="([\s\S]*?)"/);
        let imgPath = imgMatch ? imgMatch[1] : "";
        const imgFullUrl = imgPath.startsWith('http') ? imgPath : "https://sakurazaka46.com" + imgPath;

        // 3. Ekstrak Link Profile & Bersihkan query string
        const linkMatch = block.match(/<a href="([\s\S]*?)"/);
        let linkPath = linkMatch ? linkMatch[1] : "";
        const linkFullUrl = linkPath ? "https://sakurazaka46.com" + linkPath.split('?')[0] : "";

        // 4. Update data ke JSON jika name_romaji cocok (Case Insensitive)
        for (let key in blogProfil) {
          if (blogProfil[key].name_romaji.trim().toLowerCase() === nameRomaji.toLowerCase()) {
            blogProfil[key].img = imgFullUrl;
            blogProfil[key].link = linkFullUrl;
            
            // Opsional: Jika ingin update nama JP juga dari web
            const kanaMatch = block.match(/<p class="kana">([\s\S]*?)<\/p>/);
            if (kanaMatch) {
              blogProfil[key].name_jp = kanaMatch[1].replace(//g, '').trim();
            }

            updateCount++;
            console.log(`Matched & Updated: ${nameRomaji}`);
          }
        }
      }
    });

    // Simpan kembali hasil update
    fs.writeFileSync(filePath, JSON.stringify(blogProfil, null, 2), 'utf8');
    console.log(`--- Selesai! Berhasil mengupdate ${updateCount} member ---`);

  } catch (error) {
    console.error("DEBUG ERROR DETAIL:", error.message);
    process.exit(1);
  }
}

scrapeSakurazaka();
