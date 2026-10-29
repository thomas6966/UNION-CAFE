/*
 * Union Cafe — sayt sozlamalari.
 * "TODO" bilan belgilangan qiymatlarni haqiqiy ma’lumotlar bilan almashtiring.
 */
window.UNION_CONFIG = {
  hours: { open: '09:00', close: '23:00' }, // TODO: ish vaqtini tasdiqlang (Yandex sharhlarida 24/7 deyilgan)

  phone: {
    display: '+998 ** *** ** **', // TODO: haqiqiy telefon raqami
    raw: '', // TODO: '+998901234567' ko‘rinishida; bo‘sh bo‘lsa "tel:" havolasi o‘chiriladi
  },

  // TODO: aniq manzil
  address: {
    uz: 'Toshkent shahri, … tumani, … ko‘chasi',
    ru: 'г. Ташкент, … район, ул. …',
    en: 'Tashkent, … district, … street',
  },

  social: {
    instagram: '', // TODO: 'https://instagram.com/...'
    telegram: '', // TODO: 'https://t.me/...'
    yandex: 'https://yandex.com/maps/?text=Union%20Cafe%20Tashkent', // TODO: kafening aniq Yandex Maps sahifasi
  },

  map: {
    // "Yo‘nalish olish" tugmasi shu manzilni ochadi. TODO: kafening aniq xarita havolasi
    directionsUrl: 'https://yandex.com/maps/?text=Union%20Cafe%20Tashkent',
    // Yandex/Google xaritasining iframe src manzili. To‘ldirilsa, chizilgan blok o‘rniga haqiqiy xarita chiqadi
    embedUrl: '',
  },

  booking: {
    // Bronlarni qabul qilish usullari (birinchi to‘ldirilgani ishlatiladi):
    endpoint: '', // POST JSON qabul qiladigan manzil (masalan, backend yoki Google Apps Script)
    telegramUser: '', // masalan 'union_cafe' — forma Telegramda tayyor xabar bilan ochiladi
  },
};
