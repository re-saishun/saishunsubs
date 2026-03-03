const fs = require('fs');

// Konfigurasi Mapping: Nama di Web Sakurazaka => Key di JSON
const memberMapping = {
  "Haru Katsumata": "haru_katsumata",
  "Konomi Asai": "asai_konomi",
  "Ui Yamakawa": "ui_yamakawa"
};

const PROXY_URL = "https://cors-proxy1.vercel.app/api/fetch?url=";
const TARGET_URL = "https://sakurazaka46.com/s/s46/search/artist";

async function updateData() {
  try {
    console.log("Fetching data from Sakurazaka46...");
    const response = await fetch(PROXY_URL + encodeURIComponent(TARGET_URL));
    const html = await response.text();

    // Menggunakan regex sederhana untuk parsing karena lingkungan Node.js tanpa DOMParser
    // Mencari blok <li> hingga </li> yang berisi data member
    const memberBlocks = html.match(/<li class="box"[\s\S]*?<\/li>/g);

    if (!memberBlocks) throw new Error("Tidak bisa menemukan data member di HTML.");

    // Baca file JSON yang sudah ada
    let blogProfil = {};
    if (fs.existsSync('blogprofil.json')) {
      blogProfil = JSON.parse(fs.readFileSync('blogprofil.json', 'utf8'));
    }

    memberBlocks.forEach(block => {
      // Ekstrak Nama Romaji
      const nameMatch = block.match(/<p class="name">([\s\S]*?)<\/p>/);
      const nameRomaji = nameMatch ? nameMatch[1].replace(//g, '').trim() : null;

      if (nameRomaji && memberMapping[nameRomaji]) {
        const jsonKey = memberMapping[nameRomaji];
        
        // Ekstrak Nama Jepang (Kana)
        const kanaMatch = block.match(/<p class="kana">([\s\S]*?)<\/p>/);
        const nameJp = kanaMatch ? kanaMatch[1].replace(//g, '').trim() : "";

        // Ekstrak Image URL
        const imgMatch = block.match(/<img src="([\s\S]*?)"/);
        let imgPath = imgMatch ? imgMatch[1] : "";
        const imgFullUrl = imgPath.startsWith('http') ? imgPath : "https://sakurazaka46.com" + imgPath;

        // Update data di object
        blogProfil[jsonKey] = {
          name_romaji: nameRomaji,
          name_jp: nameJp,
          img: imgFullUrl,
          last_updated: new Date().toISOString()
        };
        
        console.log(`Updated: ${nameRomaji}`);
      }
    });

    // Simpan kembali ke file
    fs.writeFileSync('blogprofil.json', JSON.stringify(blogProfil, null, 2));
    console.log("File blogprofil.json berhasil diperbarui!");

  } catch (error) {
    console.error("Gagal update data:", error);
    process.exit(1);
  }
}

updateData();
