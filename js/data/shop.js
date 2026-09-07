/* =========================================================================
   shop.js — avatar customisation and the Star Sparks store.

   Design rules, deliberately:
     - Everything is buyable with Sparks earned by playing. No real money,
       no random boxes, no timed pressure, nothing hidden behind chance.
     - Outfits are athletic. A young gymnast should look like an athlete
       who is proud of what her body does, not like a doll.
     - Nothing here affects scoring. Cosmetics stay cosmetic.
   ========================================================================= */

(function (global) {
  'use strict';

  var SKINS = [
    { id: 'sk1', hex: '#7a4a2b', name: 'Deep' },
    { id: 'sk2', hex: '#a0643c', name: 'Warm' },
    { id: 'sk3', hex: '#c98b62', name: 'Golden' },
    { id: 'sk4', hex: '#e0a97e', name: 'Honey' },
    { id: 'sk5', hex: '#f0c9a8', name: 'Light' },
    { id: 'sk6', hex: '#5c3520', name: 'Rich' }
  ];

  var HAIR_COLORS = [
    { id: 'hc1', hex: '#1c1108', name: 'Black' },
    { id: 'hc2', hex: '#2b1a12', name: 'Dark Brown' },
    { id: 'hc3', hex: '#6b4326', name: 'Chestnut' },
    { id: 'hc4', hex: '#b07636', name: 'Caramel' },
    { id: 'hc5', hex: '#8b2fbf', name: 'Violet', cost: 120 },
    { id: 'hc6', hex: '#1fa5c9', name: 'Ocean', cost: 120 },
    { id: 'hc7', hex: '#e8407a', name: 'Rose', cost: 120 }
  ];

  var HAIR_STYLES = [
    { id: 'ponytail', name: 'Ponytail', icon: '💁', cost: 0 },
    { id: 'buns',     name: 'Space Buns', icon: '👧', cost: 180 },
    { id: 'braids',   name: 'Braids', icon: '🧑', cost: 180 },
    { id: 'afro',     name: 'Afro Puff', icon: '🧒', cost: 180 },
    { id: 'bun',      name: 'Top Bun', icon: '🙋', cost: 140 }
  ];

  var LEOTARDS = [
    { id: 'lt1', name: 'Academy Pink',  a: '#ff4f9a', b: '#7a3cff', cost: 0 },
    { id: 'lt2', name: 'Ocean Fade',    a: '#4fd1ff', b: '#2b6cff', cost: 150 },
    { id: 'lt3', name: 'Sunburst',      a: '#ffc84a', b: '#ff6b3d', cost: 150 },
    { id: 'lt4', name: 'Mint Chrome',   a: '#7dffb8', b: '#1fa5c9', cost: 200 },
    { id: 'lt5', name: 'Violet Storm',  a: '#c17bff', b: '#5a1fa8', cost: 200 },
    { id: 'lt6', name: 'Midnight Gold', a: '#2b2148', b: '#ffc84a', cost: 320 },
    { id: 'lt7', name: 'Champion Red',  a: '#ff4d4d', b: '#8b1038', cost: 320 },
    { id: 'lt8', name: 'Acroverse Neon',a: '#00ffc8', b: '#ff00a8', cost: 500 }
  ];

  var CELEBRATIONS = [
    { id: 'sparkle',  name: 'Sparkle Burst', icon: '✨', cost: 0 },
    { id: 'confetti', name: 'Confetti Storm', icon: '🎊', cost: 160 },
    { id: 'fireworks',name: 'Fireworks',      icon: '🎆', cost: 260 },
    { id: 'hearts',   name: 'Heart Shower',   icon: '💖', cost: 220 },
    { id: 'stars',    name: 'Star Rain',      icon: '🌟', cost: 300 }
  ];

  /* Trophy-room decorations. Purely for the room, purely for pride. */
  var DECOR = [
    { id: 'banner',  name: 'Academy Banner',   icon: '🎌', cost: 140 },
    { id: 'plant',   name: 'Corner Plant',     icon: '🪴', cost: 100 },
    { id: 'rug',     name: 'Champion Rug',     icon: '🟥', cost: 180 },
    { id: 'lights',  name: 'String Lights',    icon: '💡', cost: 160 },
    { id: 'poster',  name: 'Motivation Poster',icon: '🖼️', cost: 120 },
    { id: 'cabinet', name: 'Trophy Cabinet',   icon: '🏆', cost: 400 }
  ];

  function costOf(item) { return item.cost === undefined ? 0 : item.cost; }

  var CATEGORIES = [
    { key: 'hairStyle',   label: 'Hairstyle',    items: HAIR_STYLES,  field: 'hairStyle' },
    { key: 'leo',         label: 'Leotard',      items: LEOTARDS,     field: 'leo' },
    { key: 'celebration', label: 'Celebration',  items: CELEBRATIONS, field: 'celebration' },
    { key: 'decor',       label: 'Trophy Room',  items: DECOR,        field: null }
  ];

  global.Shop = {
    skins: SKINS, hairColors: HAIR_COLORS, hairStyles: HAIR_STYLES,
    leotards: LEOTARDS, celebrations: CELEBRATIONS, decor: DECOR,
    categories: CATEGORIES,
    costOf: costOf,
    /* free items are owned from the start */
    freeIds: function () {
      var out = [];
      [HAIR_STYLES, LEOTARDS, CELEBRATIONS].forEach(function (g) {
        g.forEach(function (i) { if (costOf(i) === 0) out.push(i.id); });
      });
      return out;
    },
    find: function (id) {
      var all = HAIR_STYLES.concat(LEOTARDS, CELEBRATIONS, DECOR, HAIR_COLORS);
      for (var i = 0; i < all.length; i++) if (all[i].id === id) return all[i];
      return null;
    }
  };
})(window);
