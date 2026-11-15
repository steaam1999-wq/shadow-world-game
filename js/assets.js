// EMPIRE CITY — рисованные картинки.
// Значение: путь к файлу ("img/x.webp") или ячейка атласа { src, cols, rows, i } (i — номер слева направо, сверху вниз).
// Пустая строка — используется встроенный SVG.
"use strict";

const AT = {
  med: i => ({ src: "img/medallions.webp", cols: 3, rows: 3, i }),        // 0 карта · 1 город · 2 профиль · 3 герб · 4 портфель · 5 письмо · 6 телефон · 7 билеты · 8 часы
  res: i => ({ src: "img/residents.webp", cols: 4, rows: 4, i }),         // 16 портретов жителей
  dist: i => ({ src: "img/districts.webp", cols: 2, rows: 2, i })         // 0 Кингс · 1 Старый город · 2 доки · 3 Вест-сайд
};

const ASSETS = {
  // нижняя навигация и медальоны
  "nav.map": AT.med(0), "nav.city": AT.med(1), "nav.profile": AT.med(2), "nav.families": AT.med(3), "nav.items": AT.med(4),
  "icon.letter": AT.med(5), "icon.phone": AT.med(6), "icon.tickets": AT.med(7), "icon.watch": AT.med(8),
  "icon.menu": "", "icon.gear": "",
  // герой: сцена в полный рост для профиля и портрет для боёв и аватара
  "bg.profile": "img/character.webp", "hero.portrait": "img/player.webp", "hero.full": "",
  // стартовый экран
  "bg.start": "img/city.webp",
  // баннеры районов
  "loc.kings": AT.dist(0), "loc.old": AT.dist(1), "loc.prom": AT.dist(2), "loc.port": AT.dist(2), "loc.west": AT.dist(3), "loc.city": "img/city.webp",
  // гербы организаций
  "crest.harrigan": AT.med(3), "crest.moreno": "", "crest.bellini": "", "crest.police": "", "crest.city": "",
  // портреты персонажей
  "npc.victor": AT.res(0), "npc.elena": AT.res(1), "npc.alexander": AT.res(2), "npc.daniel": AT.res(3),
  "npc.margaret": AT.res(4), "npc.rafael": AT.res(5), "npc.sofia": AT.res(6), "npc.miguel": AT.res(7),
  "npc.antonio": AT.res(8), "npc.luca": AT.res(9), "npc.clark": AT.res(10), "npc.miller": AT.res(11),
  "npc.emma": AT.res(12), "npc.mark": AT.res(13), "npc.tommy": AT.res(14), "npc.nicholas": AT.res(15)
};
