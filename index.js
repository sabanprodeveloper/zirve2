const express = require("express");
const { google } = require("googleapis");
const fs = require("fs");
const path = require("path");
const admin = require("firebase-admin");

const app = express();

// Middleware: JSON body'yi parse et
app.use(express.json());

// Firebase Admin SDK Initialize
let firebaseConfig = null;

// Railway: Environment variable'dan oku
if (process.env.FIREBASE_CREDENTIALS) {
  try {
    let credString = process.env.FIREBASE_CREDENTIALS;
    console.log("📌 FIREBASE_CREDENTIALS bulundu, uzunluk:", credString.length);
    
    // Eğer base64 ise decode et
    if (!credString.includes('{')) {
      console.log("🔄 Base64 decode ediliyor...");
      credString = Buffer.from(credString, 'base64').toString('utf8');
      console.log("✓ Base64 decode başarılı");
    }
    
    firebaseConfig = JSON.parse(credString);
    console.log("✓ Firebase credentials environment variable'dan yüklendi");
  } catch (err) {
    console.error("❌ Firebase env variable parse hatası:", err.message);
  }
} 
// Local: dosyasından oku
else {
  const firebaseCredentialsPath = path.join(__dirname, "egz-26-firebase-adminsdk-fbsvc-bb56f66258.json");
  if (fs.existsSync(firebaseCredentialsPath)) {
    try {
      firebaseConfig = require(firebaseCredentialsPath);
      console.log("✓ Firebase credentials dosyasından yüklendi (local)");
    } catch (err) {
      console.error("❌ Firebase dosya parse hatası:", err.message);
    }
  } else {
    console.warn("⚠️  Firebase credentials bulunamadı (ne env var ne dosya)");
  }
}

// Firebase initialize et
if (firebaseConfig) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(firebaseConfig)
    });
    console.log("✓ Firebase Admin SDK initialized");
  } catch (err) {
    console.error("❌ Firebase initialization hatası:", err.message);
  }
} else {
  console.warn("⚠️  Firebase credentials yüklenmedi - Firebase devre dışı");
}

// Update the default route to redirect to /admin-login.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/admin-login.html'));
});

// Static dosyaları serve et
app.use(express.static('public'));

const SHEET_ID = "1pK9xgfZ9GHJVZvjxLv-85PeWcceWlA_ajD6hupNS5tI";
const SHEET_NAME = "Form Yanıtları 1"; // Doğru sayfa adı
const COLUMN_RANGE = "A2:G1000"; // Cinsiyeti de al (G sütunu)
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

// Email ve Ad-Soyadı kontrol etmek için fonksiyon
// Email, Ad, Cinsiyet bilgisini çeken fonksiyon
function getParticipants(data) {
  try {
    if (!data || data.length < 2) return [];
    return data
      .slice(1) // Başlık satırını atla
      .map(row => ({
        name: (row && row[1]) || "",
        email: (row && row[3]) ? row[3].toLowerCase().trim() : "", // D sütunu
        gender: (row && row[6]) ? row[6].trim() : "" // G sütunu (Cinsiyet)
      }))
      .filter(item => item.email && item.name); // Geçerli olanları filtrele
  } catch (err) {
    console.error("getParticipants Hatası:", err);
    throw err;
  }
}

function shuffleArray(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function selectRandom(participants, count) {
  if (!Array.isArray(participants) || participants.length === 0 || count <= 0) return [];
  return shuffleArray(participants).slice(0, count);
}

// Cinsiyete göre rastgele seçim (kadın/erkek dengesi öncelikli)
function selectByGender(participants, count) {
  try {
    const male = participants.filter(p => p.gender.toLowerCase() === 'erkek');
    const female = participants.filter(p => p.gender.toLowerCase() === 'kadın');
    
    console.log(`Erkek: ${male.length}, Kadın: ${female.length}, İstenen: ${count}`);
    
    const perGender = Math.floor(count / 2);
    let selected = [
      ...selectRandom(male, perGender),
      ...selectRandom(female, perGender)
    ];

    // count tek sayı veya bir cinsiyet eksikse kalan slotları doldur
    const remaining = count - selected.length;
    if (remaining > 0) {
      const selectedNames = new Set(selected.map(p => p.name));
      const fillPool = participants.filter(p => !selectedNames.has(p.name));
      selected = [...selected, ...selectRandom(fillPool, remaining)];
    }

    selected = shuffleArray(selected).slice(0, count);
    return selected;
  } catch (err) {
    console.error("selectByGender Hatası:", err);
    return [];
  }
}

// Ödül türüne göre seçim (bedava ve indirim)
function assignPrizes(selected, freeCount = 5) {
  try {
    const result = [];
    
    // İlk freeCount kişiye bedava, kalanına indirim
    selected.forEach((person, index) => {
      result.push({
        ...person,
        prizeType: index < freeCount ? 'Bedava' : '%30 İndirim'
      });
    });
    
    return result;
  } catch (err) {
    console.error("assignPrizes Hatası:", err);
    return selected;
  }
}

// Email, Ad, Cinsiyet bilgisini çeken eski fonksiyon (uyumluluk için)
function getEmails(data) {
  try {
    if (!data || data.length < 2) return [];
    return data
      .slice(1) // Başlık satırını atla
      .map(row => ({
        email: (row && row[3]) ? row[3].toLowerCase().trim() : "", // D sütunu (index 3)
        name: (row && row[1]) || ""
      }))
      .filter(item => item.email); // Boş email'leri filtrele
  } catch (err) {
    console.error("getEmails Hatası:", err);
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

// Endpoint: Email Kontrol
app.post("/check-email", async (req, res) => {
  try {
    console.log("📧 /check-email POST isteği alındı");
    const { email } = req.body;
    console.log("Email:", email);

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: "Geçersiz email" });
    }

    const cleanEmail = email.toLowerCase().trim();
    console.log("Temizlenmiş email:", cleanEmail);
    
    // Önce Firebase'de bu email daha önce kontrol edildi mi kontrol et
    const alreadyUsed = await checkEmailInFirebase(cleanEmail);
    if (alreadyUsed) {
      console.log("⚠️  Email daha önce kullanılmış:", cleanEmail);
      return res.json({
        found: null,
        alreadyUsed: true,
        message: "Bu email adresi daha önce kontrolü yapılmıştır"
      });
    }
    
    const data = await getFormData();
    console.log("Sheets verisi alındı, satır sayısı:", data?.length);
    
    const emails = getEmails(data);
    console.log("Email listesi oluşturuldu, toplam:", emails.length);
    console.log("Örnek emailler:", emails.slice(0, 3));

    const found = emails.find(item => item.email === cleanEmail);
    console.log("Arama sonucu:", found ? "Bulundu" : "Bulunamadı");

    if (found) {
      // Firebase'e veri kaydet
      await saveCheckToFirebase(cleanEmail, found.name, true);
      
      res.json({
        found: true,
        name: found.name,
        message: "Etkinliğe başarıyla katıldınız!"
      });
    } else {
      // Firebase'e başarısız kontrol kaydını kaydet (opsiyonel)
      // await saveCheckToFirebase(cleanEmail, null, false);
      
      res.json({
        found: false,
        message: "Bu email etkinliğe kayıtlı değil"
      });
    }
  } catch (err) {
    console.error("/check-email Hatası:", err);
    res.status(500).json({ error: "Email kontrol hatası: " + err.message });
  }
});

// Endpoint: Cinsiyet ve ödül türüne göre kazanan seçim
app.post("/winners-select", async (req, res) => {
  try {
    console.log("🎲 /winners-select POST isteği alındı");
    const { draw, count, alreadySelected = [] } = req.body;

    if (!draw || typeof count !== 'number' || count <= 0) {
      return res.status(400).json({ error: "Geçersiz parametreler" });
    }

    const data = await getFormData();
    const allParticipants = getParticipants(data);
    
    // Daha önce seçilmiş olanları filtrele
    const alreadySelectedNames = new Set(alreadySelected.map(w => 
      typeof w === 'string' ? w : w.name
    ));
    const remainingParticipants = allParticipants.filter(p => !alreadySelectedNames.has(p.name));
    const allowRepeatBecauseInsufficient = remainingParticipants.length < count;
    const participantsForDraw = allowRepeatBecauseInsufficient ? allParticipants : remainingParticipants;
    
    console.log(
      `Toplam katılımcı: ${allParticipants.length}, Seçilmiş: ${alreadySelected.length}, ` +
      `Kalan benzersiz: ${remainingParticipants.length}, Tekrar İzni: ${allowRepeatBecauseInsufficient}`
    );

    let selected = [];

    // Çekiliş türüne göre seçim yap
    if (draw === 'miracle') {
      // Miracle: 8 kadın, 8 erkek
      selected = selectByGender(participantsForDraw, count);
    } else if (draw === 'plantso') {
      // Plantso: 5 bedava, 5 %30 indirim
      const temp = selectByGender(participantsForDraw, count);
      selected = assignPrizes(temp, 5);
    } else {
      // Diğer çekilişler: normal rastgele seçim
      selected = selectRandom(participantsForDraw, count);
    }

    if (selected.length < count && !allowRepeatBecauseInsufficient) {
      return res.status(400).json({ 
        error: `Çekiliş için yeterli katılımcı bulunamadı. Bulunan: ${selected.length}, İstenen: ${count}` 
      });
    }

    console.log(`✓ ${selected.length} kazanan seçildi`);
    res.json({
      success: true,
      winners: selected.map(w => ({
        name: w.name,
        gender: w.gender,
        prizeType: w.prizeType || null
      }))
    });
  } catch (err) {
    console.error("/winners-select Hatası:", err);
    res.status(500).json({ error: "Kazanan seçim hatası: " + err.message });
  }
});

// Firebase'de email daha önce kontrol edildi mi kontrol et
async function checkEmailInFirebase(email) {
  try {
    if (!admin.apps.length) {
      return false;
    }

    const db = admin.firestore();
    const snapshot = await db.collection('email_checks')
      .where('email', '==', email)
      .limit(1)
      .get();

    return !snapshot.empty;
  } catch (err) {
    console.error("Firebase kontrol hatası:", err);
    return false;
  }
}

// Firebase'e email kontrol kaydını kaydet
async function saveCheckToFirebase(email, name, found) {
  try {
    if (!admin.apps.length) {
      console.warn("⚠️  Firebase initialize edilmemiş");
      return;
    }

    const db = admin.firestore();
    const timestamp = new Date().toISOString();
    
    await db.collection('email_checks').add({
      email: email,
      name: name || 'Bilinmiyor',
      found: found,
      timestamp: timestamp,
      date: new Date()
    });

    console.log(`✓ Email kontrol kaydı Firebase'ye kaydedildi: ${email}`);
  } catch (err) {
    console.error("Firebase kaydetme hatası:", err);
    // Firebase hatası endpoint'i kırmasın, sadece log yapıp devam et
  }
}

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

// Firebase'e çekiliş sonuçlarını kaydet
async function saveCekilisSonucToFirebase(cekilisKodu, cekilisAdi, odul, kazananlar, options = {}) {
  try {
    if (!admin.apps.length) {
      console.warn("⚠️  Firebase initialize edilmemiş");
      return;
    }

    const db = admin.firestore();
    const timestamp = new Date().toISOString();
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    // Plantso için özel işlem - bedava ve indirim ayrı ayrı kaydet
    if (cekilisKodu === 'plantso') {
      const bedava = kazananlar.filter(k => k.prizeType === 'Bedava');
      const indirim = kazananlar.filter(k => k.prizeType === '%30 İndirim');
      
      // Bedava kaydını kaydet
      if (bedava.length > 0) {
        const docIdBedava = `plantso_bedava_${today}`;
        await db.collection('cekilis_sonuclari').doc(docIdBedava).set({
          cekilisAdi: cekilisAdi,
          cekilisKodu: cekilisKodu,
          kategori: 'Bedava',
          kazananlar: bedava.map(k => ({
            name: k.name,
            gender: k.gender || '',
            prizeType: 'Bedava'
          })),
          toplam: bedava.length,
          tarih: timestamp,
          odul: odul,
          date: new Date()
        });
        console.log(`✓ Plantso Bedava sonucu Firebase'ye kaydedildi: ${docIdBedava}`);
      }
      
      // İndirim kaydını kaydet
      if (indirim.length > 0) {
        const docIdIndirim = `plantso_indirim_${today}`;
        await db.collection('cekilis_sonuclari').doc(docIdIndirim).set({
          cekilisAdi: cekilisAdi,
          cekilisKodu: cekilisKodu,
          kategori: '%30 İndirim',
          kazananlar: indirim.map(k => ({
            name: k.name,
            gender: k.gender || '',
            prizeType: '%30 İndirim'
          })),
          toplam: indirim.length,
          tarih: timestamp,
          odul: odul,
          date: new Date()
        });
        console.log(`✓ Plantso İndirim sonucu Firebase'ye kaydedildi: ${docIdIndirim}`);
      }
    } else {
      // Diğer çekilişler için normal kayıt
      const docId = `${cekilisKodu}_${today}`;
      await db.collection('cekilis_sonuclari').doc(docId).set({
        cekilisAdi: cekilisAdi,
        cekilisKodu: cekilisKodu,
        kazananlar: kazananlar.map(k => ({
          name: k.name || k,
          gender: (typeof k === 'object' && k.gender) ? k.gender : '',
          prizeType: (typeof k === 'object' && k.prizeType) ? k.prizeType : null
        })),
        toplam: kazananlar.length,
        tarih: timestamp,
        odul: odul,
        date: new Date()
      });
      console.log(`✓ ${cekilisAdi} sonucu Firebase'ye kaydedildi: ${docId}`);
    }
  } catch (err) {
    console.error("Firebase çekiliş sonucu kaydetme hatası:", err);
    // Firebase hatası endpoint'i kırmasın
  }
}

// Endpoint: Çekiliş sonucunu kaydet
app.post("/save-cekilis-result", async (req, res) => {
  try {
    console.log("💾 /save-cekilis-result POST isteği alındı");
    const { cekilisKodu, cekilisAdi, odul, kazananlar } = req.body;

    if (!cekilisKodu || !kazananlar || !Array.isArray(kazananlar)) {
      return res.status(400).json({ error: "Geçersiz parametreler" });
    }

    // Firebase'e kaydet
    await saveCekilisSonucToFirebase(cekilisKodu, cekilisAdi, odul, kazananlar);

    res.json({
      success: true,
      message: `${cekilisAdi} sonucu Firebase'ye kaydedildi`,
      savedCount: kazananlar.length
    });
  } catch (err) {
    console.error("/save-cekilis-result Hatası:", err);
    res.status(500).json({ error: "Çekiliş sonucu kaydetme hatası: " + err.message });
  }
});

// Login sonrası QR kod sayfasına yönlendirme
app.post('/login', (req, res) => {
  const { token } = req.body;
  if (token === 'EGZ-26') {
    res.redirect('/qrcode.html'); // QR kod sayfasına yönlendir
  } else {
    res.status(401).send('Geçersiz token');
  }
});

// QR kod sayfasından ana sayfaya geçiş
app.get('/qrcode', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/qrcode.html'));
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