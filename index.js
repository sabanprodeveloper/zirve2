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

if (process.env.GOOGLE_CREDENTIALS) {
  // Railway: Environment variable'dan oku (base64 encoded olabilir)
  try {
    const credString = Buffer.from(process.env.GOOGLE_CREDENTIALS, 'base64').toString('utf8');
    authConfig = JSON.parse(credString);
    console.log("✓ Credentials environment variable'dan yüklendi");
  } catch (e) {
    // Base64 decode başarısızsa direkt JSON string olarak dene
    authConfig = JSON.parse(process.env.GOOGLE_CREDENTIALS);
    console.log("✓ Credentials JSON string'den yüklendi");
  }
} else if (fs.existsSync(credentialsPath)) {
  // Local: credentials.json dosyasından oku
  authConfig = require(credentialsPath);
  console.log("✓ Credentials dosyasından yüklendi");
} else {
  console.error("❌ Credentials bulunamadı! GOOGLE_CREDENTIALS env var veya credentials.json gerekli");
  process.exit(1);
}

const auth = new google.auth.GoogleAuth({
  credentials: authConfig,
  scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
});

// Spreadsheet'teki tüm sheet adlarını kontrol et
async function checkSheetNames() {
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
async function getFormData() {
  try {
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

// Sunucu başlatıldığında sheet adlarını kontrol et ve veri çekmeyi test et
checkSheetNames().then(sheets => {
  console.log("✓ Sheet adları başarıyla kontrol edildi");
  return getFormData();
}).then(data => {
  console.log("Başlangıç verisi:", data);
}).catch(err => {
  console.error("Başlangıçta hata oluştu:", err.message);
});

app.listen(process.env.PORT || 3000, () => console.log(`Server çalışıyor: http://localhost:${process.env.PORT || 3000}`));