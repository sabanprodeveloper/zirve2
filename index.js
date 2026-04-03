const express = require("express");
const { google } = require("googleapis");
const fs = require("fs");
const path = require("path");

const app = express();

// Static dosyaları serve et
app.use(express.static('public'));

const SHEET_ID = "1pK9xgfZ9GHJVZvjxLv-85PeWcceWlA_ajD6hupNS5tI";
const SHEET_NAME = "Form Yanıtları 1"; // Doğru sayfa adı
const COLUMN_RANGE = "A2:F1000"; // Tüm verileri al, sonra B sütununu seçeceğiz
const RANGE = `${SHEET_NAME}!${COLUMN_RANGE}`; // Dinamik olarak oluşturulan aralık

// Google Sheets API ayarları - Credentials'ı ortam değişkeninden veya dosyadan al
let authConfig;
const credentialsPath = path.join(__dirname, "credentials.json");

try {
  if (process.env.GOOGLE_CREDENTIALS) {
    // Railway: Environment variable'dan oku
    let credString = process.env.GOOGLE_CREDENTIALS;
    console.log("📌 GOOGLE_CREDENTIALS bulundu, uzunluk:", credString.length);
    
    // Eğer base64 ise decode et
    if (!credString.includes('{')) {
      console.log("🔄 Base64 decode ediliyor...");
      try {
        credString = Buffer.from(credString, 'base64').toString('utf8');
        console.log("✓ Base64 decode başarılı");
      } catch (e) {
        console.error("❌ Base64 decode başarısız:", e.message);
        throw e;
      }
    }
    
    authConfig = JSON.parse(credString);
    console.log("✓ Credentials environment variable'dan yüklendi (type:", authConfig.type, ")");
  } else if (fs.existsSync(credentialsPath)) {
    // Local: credentials.json dosyasından oku
    authConfig = require(credentialsPath);
    console.log("✓ Credentials dosyasından yüklendi (type:", authConfig.type, ")");
  } else {
    throw new Error("GOOGLE_CREDENTIALS env var veya credentials.json bulunamadı");
  }
} catch (err) {
  console.error("❌ Credentials yüklemesi başarısız:", err.message);
  console.error("Detay:", err.stack);
  authConfig = null;
}

// Google Auth initialize et
let auth;
if (authConfig) {
  auth = new google.auth.GoogleAuth({
    credentials: authConfig,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
} else {
  console.warn("⚠️  Google Sheets API bağlantısı devre dışı");
  auth = null;
}

// Spreadsheet'teki tüm sheet adlarını kontrol et
async function checkSheetNames() {
  if (!auth) {
    throw new Error("Google Sheets API credentials yüklenmedi");
  }
  try {
    const client = await auth.getClient();
    const sheets = google.sheets({ version: "v4", auth: client });
    
    const res = await sheets.spreadsheets.get({
      spreadsheetId: SHEET_ID,
    });

    const sheetNames = res.data.sheets.map(sheet => sheet.properties.title);
    console.log("\n=== Kullanılabilir Sheet Adları ===");
    sheetNames.forEach((name, index) => {
      console.log(`${index + 1}. "${name}"`);
    });
    console.log("===================================\n");
    return sheetNames;
  } catch (err) {
    console.error("Sheet Adları Kontrol Hatası:", err.message);
    throw err;
  }
}

// Sheets’ten veri çekme fonksiyonu
async function getFormData() {  if (!auth) {
    throw new Error("Google Sheets API credentials yüklenmedi");
  }  try {
    const client = await auth.getClient();
    const sheets = google.sheets({ version: "v4", auth: client });

    console.log("Sheet ID:", SHEET_ID);
    console.log("Range:", RANGE);

    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: RANGE,
    });

    console.log("Veri geldi:", res.data.values);
    return res.data.values;
  } catch (err) {
    console.error("getFormData Hatası:", err.message);
    console.error("Hata Detayları:", {
      code: err.code,
      message: err.message,
      errors: err.errors,
      response: err.response?.data?.error,
      config: err.config,
    });
    throw err; // tekrar fırlat, endpoint handle etsin
  }
}

// İsimleri temiz çekmek (başlığı at, boş hücreleri de include et)
function getNames(data) {
  try {
    if (!data || data.length < 2) return [];
    return data
      .slice(1) // Başlık satırını atla
      .map(row => (row && row[1]) || ""); // 1. index = B sütunu (Ad-Soyad)
  } catch (err) {
    console.error("getNames Hatası:", err);
    throw err;
  }
}

// Endpoint: Tüm isimler
app.get("/names", async (req, res) => {
  try {
    const data = await getFormData();
    const names = getNames(data);
    res.json(names);
  } catch (err) {
    console.error("/names Hatası:", err);
    res.status(500).send("Hata: dvshjsdhjdhgj " + err.message);
  }
});

// Endpoint: Rastgele kazanan
app.get("/winner", async (req, res) => {
  try {
    const data = await getFormData();
    const names = getNames(data);
    if (names.length === 0) return res.status(404).send("Hiç isim yok");
    const winner = names[Math.floor(Math.random() * names.length)];
    res.json({ winner });
  } catch (err) {
    console.error("/winner Hatası:", err);
    res.status(500).send("Hata: " + err.message);
  }
});

// Server'ı başlat
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`✓ Server çalışıyor: http://localhost:${PORT}`);
  console.log(`✓ Veriler: http://localhost:${PORT}/names`);
  console.log(`✓ Kazanan: http://localhost:${PORT}/winner`);
  console.log("Base64 length:", process.env.GOOGLE_CREDENTIALS?.length);
  console.log("PORT:", process.env.PORT);
console.log("Base64 length:", process.env.GOOGLE_CREDENTIALS?.length);
  
  // Startup'ta credentials'ı test et (opsiyonel)
  if (auth) {
    checkSheetNames().then(sheets => {
      console.log("✓ Google Sheets bağlantısı başarılı");
    }).catch(err => {
      console.warn("⚠️  Google Sheets bağlantısında sorun:", err.message);
      console.warn("   Endpoint'ler erişilemeyecektir");
    });
  } else {
    console.warn("⚠️  Google Sheets credentials yüklenmedi - /names ve /winner endpoint'leri çalışmayacaktır");
  }
});