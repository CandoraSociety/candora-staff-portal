// Things the tablet can offer as ready-made choices when reception sends a
// purchase prompt. Auntie Bev's list mirrors the online menu and prices.

export const AUNTIE_BEVS_ITEMS = [
  {
    name: 'Chili Con Carne',
    price: 6,
    image_url: 'https://media.base44.com/images/public/6a249282cb496579542673b7/318ff6ce7_generated_image.png',
  },
  {
    name: 'Al Pastor Rice',
    price: 11,
    image_url: 'https://media.base44.com/images/public/6a249282cb496579542673b7/146116af0_generated_image.png',
  },
  {
    name: 'Beef Stroganoff',
    price: 11,
    image_url: 'https://media.base44.com/images/public/6a249282cb496579542673b7/afa992e55_generated_image.png',
  },
  {
    name: 'Oven Roasted Chicken',
    price: 11,
    image_url: 'https://media.base44.com/images/public/6a249282cb496579542673b7/bbf46eecf_generated_image.png',
  },
  {
    name: 'Cheese Tortellini',
    price: 11,
    image_url: 'https://media.base44.com/images/public/6a249282cb496579542673b7/5cd500a61_generated_image.png',
  },
  {
    name: 'Baked Bean Medley',
    price: 7,
    image_url: 'https://media.base44.com/images/public/6a249282cb496579542673b7/88eaf63dd_generated_image.png',
  },
];

// Picture for a line on the tablet, matched by item name.
export const itemImage = (name) => AUNTIE_BEVS_ITEMS.find((item) => item.name === name)?.image_url || '';