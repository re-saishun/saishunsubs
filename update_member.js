const fs = require('fs');

// Konfigurasi URL
const PROXY_URL = "https://cors-proxy1.vercel.app/api/fetch?url=";
const TARGET_URL = "https://sakurazaka46.com/s/s46/search/artist";

async function scrapeSakurazaka() {
  try {
    console.log("Mengambil data terbaru dari Sakurazaka46...");
    const response = await fetch(PROXY_URL + encodeURIComponent(TARGET_URL));
    const html = await response.text();

    // Regex untuk mengambil setiap blok member
    const memberBlocks = html.match(/<li class="box"[\s\S]*?<\/li>/g);
    if (!memberBlocks) throw new Error("Format HTML berubah, tidak bisa parsing.");

    // Baca file blogprofil.json yang sudah ada
    const filePath = './blogprofil.json';
    let blogProfil = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    memberBlocks.forEach(block => {
      // Ekstrak Nama Romaji
      const nameMatch = block.match(/<p class="name">([\s\S]*?)<\/p>/);
      const nameRomaji = nameMatch ? nameMatch[1].replace(//g, '').trim() : null;

      // Ekstrak Image URL
      const imgMatch = block.match(/<img src="([\s\S]*?)"/);
      let imgPath = imgMatch ? imgMatch[1] : "";
      const imgFullUrl = imgPath.startsWith('http') ? imgPath : "https://sakurazaka46.com" + imgPath;

      // Ekstrak Link Profile
      const linkMatch = block.match(/<a href="([\s\S]*?)"/);
      let linkPath = linkMatch ? linkMatch[1] : "";
      const linkFullUrl = "https://sakurazaka46.com" + linkPath.split('?')[0];

      if (nameRomaji) {
        // Cari key di JSON yang punya name_romaji yang sama
        for (let key in blogProfil) {
          if (blogProfil[key].name_romaji.toLowerCase() === nameRomaji.toLowerCase()) {
            // Update hanya Image dan Link (agar desc tidak hilang)
            blogProfil[key].img = imgFullUrl;
            blogProfil[key].link = linkFullUrl;
            console.log(`✅ Updated: ${nameRomaji}`);
          }
        }
      }
    });

    // Simpan kembali ke blogprofil.json
    fs.writeFileSync(filePath, JSON.stringify(blogProfil, null, 2), 'utf8');
    console.log("Berhasil memperbarui blogprofil.json!");

  } catch (error) {
    console.error("Gagal menjalankan scraper:", error);
    process.exit(1);
  }
}

scrapeSakurazaka();
