// Things the tablet can offer as ready-made choices when reception sends a
// purchase prompt. Auntie Bev's list mirrors the online menu, prices and photos.

const photo = (id) => `https://139645915.cdn6.editmysite.com/uploads/1/3/9/6/139645915/${id}.png?width=600&optimize=medium`;

export const AUNTIE_BEVS_ITEMS = [
  { name: 'Chili Con Carne', price: 6, image_url: photo('S7H4HAOLH75JJH2W73PY644T') },
  { name: 'Al Pastor Rice', price: 11, image_url: photo('F3GPGXBLVV6FORI2L3UUCKHN') },
  { name: 'Beef Stroganoff', price: 11, image_url: photo('3VAEE4ETUWVMSUCKLZUGKV53') },
  { name: 'Oven Roasted Chicken', price: 11, image_url: photo('GBXZ34Q6OE4JJQN2FZRXJLBS') },
  { name: 'Cheese Tortellini', price: 11, image_url: photo('F6EMZ26YGG5SODFD6GDRFJQ3') },
  { name: 'Baked Bean Medley', price: 7, image_url: photo('ZZQFA5IMGWL6EVBBXN3NDQ4P') },
];

// Picture for a line on the tablet, matched by item name.
export const itemImage = (name) => AUNTIE_BEVS_ITEMS.find((item) => item.name === name)?.image_url || '';