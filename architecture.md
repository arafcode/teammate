# Teammate - Proje Mimarisi

Bu proje, ölçeklenebilirlik ve bakım kolaylığı için **Model-View-Controller (MVC)** tasarım desenini benimser.

## Klasör Yapısı

```
teammate/
├── public/             # Statik dosyalar (HTML, CSS, İstemci tarafı JS, Resimler)
│   ├── css/            # Derlenmiş CSS dosyaları
│   ├── js/             # Frontend JavaScript dosyaları
│   └── index.html      # Ana giriş sayfası (Prototip)
├── src/
│   ├── config/         # Veritabanı ve env yapılandırmaları
│   ├── controllers/    # İstekleri işleyen ve yanıt dönen fonksiyonlar
│   ├── models/         # Veritabanı şemaları ve iş mantığı
│   ├── routes/         # API rotaları (Endpoint tanımları)
│   ├── services/       # İş mantığının soyutlandığı servis katmanı
│   └── app.js          # Express uygulaması giriş noktası
├── .env                # Çevresel değişkenler (Git'e atılmaz)
├── docker-compose.yml  # MySQL ve diğer servislerin Docker yapılandırması
├── package.json        # Proje bağımlılıkları ve scriptler
├── tailwind.config.js  # Tailwind CSS yapılandırması
└── README.md           # Proje genel bilgileri
```

## Teknoloji Yığını ve Kararlar

- **Runtime:** Node.js
- **Framework:** Express.js (Hızlı ve minimalist web çatısı)
- **Veritabanı:** MySQL 8.0 (İlişkisel veritabanı, Docker üzerinde)
- **ORM/Query Builder:** İlerleyen aşamalarda Sequelize veya doğrudan `mysql2` kütüphanesi kullanılabilir.
- **Frontend:** HTML5, Tailwind CSS (Hızlı UI geliştirme için), Vanilla JS
- **Tasarım Dili:** Premium SaaS (Inter fontu, bol boşluk, temiz çizgiler)

## Veritabanı Tasarımı (Taslak)

- **Users:** Kullanıcı bilgileri
- **Listings:** İlan kayıtları (Category: 'RealLife' | 'Virtual')
- **Categories:** İlan kategorileri
- **Messages:** Kullanıcılar arası mesajlaşma
