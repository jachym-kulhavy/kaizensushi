/*
  MENU DATA – edit this file to fill in the real menu.

  Each item has: name, price, desc, img.
  - img is optional. If you leave it out, the site looks for
    assets/menu/<category-id>-<number>.jpg  (for example assets/menu/speciality-1.jpg).
  - If the picture does not exist yet, a calm placeholder with the file name is shown.

  Example of a real item (replace the generated placeholders with entries like this):

    { name: 'Název jídla', price: '189 Kč', desc: 'Ingredience a krátký popis.', img: 'assets/menu/speciality-1.jpg' }

  The numbers below match the structure agreed for the demo:
  5 Kaizen speciality, 4 sushi sety, 8 uramaki a futomaki, 8 hosomaki,
  3 bento box menu, 1 valentýnské menu.
*/
(function () {
  function placeholders(id, count) {
    var items = [];
    for (var i = 1; i <= count; i++) {
      items.push({
        name: 'Název položky ' + i,
        price: '000 Kč',
        desc: 'Popis ingrediencí doplníme z originálního menu.',
        img: 'assets/menu/' + id + '-' + i + '.jpg'
      });
    }
    return items;
  }

  window.KAIZEN_MENU = [
    { id: 'speciality', label: 'Kaizen speciality', note: '', items: placeholders('speciality', 5) },
    { id: 'sushi-sety', label: 'Sushi sety', note: '', items: placeholders('sushi-sety', 4) },
    { id: 'uramaki', label: 'Uramaki a futomaki', note: '', items: placeholders('uramaki', 8) },
    { id: 'hosomaki', label: 'Hosomaki', note: '', items: placeholders('hosomaki', 8) },
    {
      id: 'bento',
      label: 'Bento box menu',
      note: 'Bento box menu podáváme pouze ve čtvrtek od 11:00 do 14:00. Objednejte telefonicky ve středu.',
      items: placeholders('bento', 3)
    },
    { id: 'valentyn', label: 'Valentýnské menu', note: '', items: placeholders('valentyn', 1) }
  ];
})();
