# Zirve - Çekilişi Seçen Uygulama

Google Sheets'ten form verisi çekerek rastgele kazanan seçen web uygulaması.

## 🚀 Hızlı Başlangıç

### Yerel Geliştirme (Local)
```bash
# 1. Bağımlılıkları yükle
npm install

# 2. credentials.json dosyasını yerleştir (zaten var)

# 3. Sunucuyu başlat
node index.js

# 4. Tarayıcıda aç
# http://localhost:3000
```

---

## 📤 GitHub'a Yükleme

### Adım 1: Git Repository'si Oluştur
```bash
# Proje klasörüne git ini
git init
git add .
git commit -m "İlk commit - Zirve uygulaması"
```

### Adım 2: GitHub'da Repository Oluştur
1. [GitHub.com](https://github.com) 'a git
2. **Yeni Repository** oluş tur (Public veya Private)
3. Repository adını not et (örn: `zirve`)
4. README.md'yi GitHub tarafından oluşturmuyorum seçeneğini seç

### Adım 3: GitHub'a Push Et
```bash
git remote add origin https://github.com/KULLANICI_ADIN/zirve.git
git branch -M main
git push -u origin main
```

> **⚠️ ÖNEMLİ**: `credentials.json` dosyası `.gitignore`'da olduğu için GitHub'a yüklenmez (Güvenlidir! ✓)

---

## 🚂 Railway'e Deploy Etme

### Adım 1: Railway'e Git
1. [Railway.app](https://railway.app) 'a git
2. GitHub hesabınla login olun
3. **New Project** → **Deploy from GitHub**

### Adım 2: Repository'i Seç
- Zirve repository'sini seç
- Deploy et

### Adım 3: Environment Variables Ayarla
Railway Dashboard'da aşağıdaki adımları takip et:

1. **Project Settings** → **Variables** 
2. `GOOGLE_CREDENTIALS` değişkeni ekle

#### credentials.json'u encode etme:

**Windows (PowerShell):**
```powershell
$content = Get-Content "credentials.json" -Raw
[Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($content)) | Out-Clipboard
# Veya doğrudan:
certutil -encode credentials.json credentials.txt
# credentials.txt'i aç ve BASE64 kısımlarını kopyala
```

**Mac/Linux (Terminal):**
```bash
cat credentials.json | base64 | pbcopy
# veya
cat credentials.json | base64
```

3. Base64 encoded metni Railway'e yapıştır:
   - Variable: `GOOGLE_CREDENTIALS`
   - Value: (Base64 encoded credentials)

4. **Deploy** butonuna bas ve çalışmaya başla ✓

---

## 🔒 Güvenlik Notları

- ❌ **credentials.json'u asla GitHub'a yüklemek istemez**
- ✅ `.gitignore` çünkü korur
- ✅ Railway'e environment variables aracılığıyla eklenir
- ✅ Private key hiçbir yerde herkese açık değildir

---

## 📝 Dosya Yapısı

```
zirve/
├── index.js          # Main sunucu dosyası
├── package.json      # Bağımlılıklar
├── credentials.json  # Google Service Account (GitHub'a yüklenmez)
├── .gitignore        # Yüklemeyecek dosyalar
├── .env.example      # Örnek environment variables
├── README.md         # Bu dosya
└── public/
    ├── index.html
    ├── script.js
    └── style.css
```

---

## 🆘 Sorun Çözme

### ❌ "Credentials bulunamadı" hatası
**Çözüm**: `GOOGLE_CREDENTIALS` environment variable'ını Railroad'ta ayarladığını kontrol et

### ❌ Google Sheets API hatası
**Çözüm**: 
- Service Account'a Sheets'e erişim yetkisi verdiğini doğrula
- SHEET_ID doğru olup olmadığını kontrol et

---

## 📞 İletişim

Sorularız için issue açabilirsin!
