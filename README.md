# Union Cafe — sayt

Toshkentdagi Union Cafe uchun statik sayt (HTML + CSS + JavaScript, build kerak emas).
`index.html` ni brauzerda oching yoki istalgan hostingga (Netlify, GitHub Pages, oddiy hosting) joylang.

## Tuzilma

```
index.html            — sahifa strukturasi
css/styles.css        — dizayn (ranglar :root da)
js/config.js          — telefon, manzil, ijtimoiy tarmoqlar, xarita, bron sozlamalari  ← avval shuni to‘ldiring
js/menu-data.js       — menyu (taomlar, narxlar, kategoriyalar)
js/reviews-data.js    — mijozlar fikrlari
js/i18n.js            — UZ / RU / EN tarjimalar
js/main.js            — sayt logikasi
assets/img/brand      — logotip, favicon
assets/img/menu       — taom rasmlari (<taom-id>.jpg)
assets/img/gallery    — interyer rasmlari
```

## Nimani almashtirish kerak (TODO)

1. `js/config.js` — telefon, aniq manzil, Instagram / Telegram / Yandex Maps havolalari, xarita `embedUrl`.
2. Bron formasi: `booking.telegramUser` yoki `booking.endpoint` ni to‘ldiring — aks holda forma telefon raqamini ko‘rsatadi.
3. Rasmlar skrinshotlardan qirqilgan — mavjud original fotosuratlar bilan bir xil nom bilan almashtiring.
4. "Oshpaz tavsiyasi" belgisi: `menu-data.js` da `chef: true`.
5. Ichimliklar menyusi: `cat: 'hot'` / `cat: 'cold'` bilan taom qo‘shsangiz, tegishli tab o‘zi paydo bo‘ladi.
6. Production’da `index.html` dagi `og:image` uchun to‘liq (https://...) manzil yozing.

## Yangi taom qo‘shish

`js/menu-data.js` massiviga qo‘shing va rasmni `assets/img/menu/<id>.jpg` sifatida joylang:

```js
{ id: 'new-dish', cat: 'mains', price: 50000, macros: [500, 30, 20, 40],
  name: { uz: '…', ru: '…', en: '…' },
  desc: { uz: '…', ru: '…', en: '…' } },
```
