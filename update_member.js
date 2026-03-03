const fs = require('fs');
const path = require('path');

// Konfigurasi URL
const PROXY_URL = "https://cors-proxy1.vercel.app/api/fetch?url=";
const TARGET_URL = "https://sakurazaka46.com/s/s46/search/artist";

async function scrapeSakurazaka() {
  try {
    console.log("--- Memulai Sinkronisasi Data ---");
    
    const response = await fetch(PROXY_URL + encodeURIComponent(TARGET_URL));
    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
    
    const html = await response.text();
    console.log("Data HTML berhasil diambil dari proxy.");

    // Regex untuk mengambil setiap blok member
    const memberBlocks = html.match(/<li class="box"[\s\S]*?<\/li>/g);
    if (!memberBlocks) {
        console.error("HTML yang diterima tidak mengandung class 'box'.");
        process.exit(1);
    }

    // Gunakan path absolute agar GitHub Action tidak bingung
    const filePath = path.join(__dirname, 'blogprofil.json');
    
    if (!fs.existsSync(filePath)) {
        throw new Error("File blogprofil.json tidak ditemukan di root repository.");
    }

    let blogProfil = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    let updateCount = 0;

    memberBlocks.forEach(block => {
      // Ekstrak Nama Romaji (Menghapus komentar wovn-src)
      const nameMatch = block.match(/<p class="name">([\s\S]*?)<\/p>/);
      let nameRomaji = nameMatch ? nameMatch[1].replace(//g, '').trim() : null;

      if (nameRomaji) {
        // Ekstrak Image URL
        const imgMatch = block.match(/<img src="([\s\S]*?)"/);
        let imgPath = imgMatch ? imgMatch[1] : "";
        const imgFullUrl = imgPath.startsWith('http') ? imgPath : "https://sakurazaka46.com" + imgPath;

        // Ekstrak Link Profile
        const linkMatch = block.match(/<a href="([\s\S]*?)"/);
        let linkPath = linkMatch ? linkMatch[1] : "";
        const linkFullUrl = "https://sakurazaka46.com" + linkPath.split('?')[0];

        // Cari key di JSON yang punya name_romaji yang sama
        for (let key in blogProfil) {
          if (blogProfil[key].name_romaji.trim().toLowerCase() === nameRomaji.toLowerCase()) {
            blogProfil[key].img = imgFullUrl;
            blogProfil[key].link = linkFullUrl;
            updateCount++;
          }
        }
      }
    });

    // Simpan kembali ke blogprofil.json dengan format yang rapi
    fs.writeFileSync(filePath, JSON.stringify(blogProfil, null, 2), 'utf8');
    console.log(`--- Selesai! Berhasil mengupdate ${updateCount} member ---`);

  } catch (error) {
    console.error("DEBUG ERROR DETAIL:", error.message);
    process.exit(1); // Memberikan sinyal fail ke GitHub Action
  }
}

scrapeSakurazaka();
