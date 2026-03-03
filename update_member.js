const fs = require('fs');
const path = require('path');

const PROXY_URL = "https://cors-proxy1.vercel.app/api/fetch?url=";
const TARGET_URL = "https://sakurazaka46.com/s/s46/search/artist";

async function scrapeSakurazaka() {
  try {
    const response = await fetch(PROXY_URL + encodeURIComponent(TARGET_URL));
    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
    
    const htmlText = await response.text();
    const memberBlocks = htmlText.match(/<li class="box"[\s\S]*?<\/li>/g);
    
    if (!memberBlocks) {
      process.exit(1);
    }

    const filePath = path.join(__dirname, 'blogprofil.json');
    if (!fs.existsSync(filePath)) {
      throw new Error("File not found");
    }

    let blogProfil = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const cleanRegex = //g;

    for (const block of memberBlocks) {
      const nameMatch = block.match(/<p class="name">([\s\S]*?)<\/p>/);
      if (nameMatch) {
        const nameRomaji = nameMatch[1].replace(cleanRegex, '').trim();
        const imgMatch = block.match(/<img src="([\s\S]*?)"/);
        const linkMatch = block.match(/<a href="([\s\S]*?)"/);
        const kanaMatch = block.match(/<p class="kana">([\s\S]*?)<\/p>/);

        let imgFullUrl = "";
        if (imgMatch) {
          const imgPath = imgMatch[1];
          imgFullUrl = imgPath.startsWith('http') ? imgPath : "https://sakurazaka46.com" + imgPath;
        }

        let linkFullUrl = "";
        if (linkMatch) {
          linkFullUrl = "https://sakurazaka46.com" + linkMatch[1].split('?')[0];
        }

        for (let key in blogProfil) {
          if (blogProfil[key].name_romaji.trim().toLowerCase() === nameRomaji.toLowerCase()) {
            blogProfil[key].img = imgFullUrl;
            blogProfil[key].link = linkFullUrl;
            if (kanaMatch) {
              blogProfil[key].name_jp = kanaMatch[1].replace(cleanRegex, '').trim();
            }
            console.log(`Updated: ${nameRomaji}`);
          }
        }
      }
    }

    fs.writeFileSync(filePath, JSON.stringify(blogProfil, null, 2), 'utf8');
    console.log("Done");

  } catch (error) {
    console.error(error.message);
