export const drinks = {
  mojito: {
    id: 'mojito',
    name: 'Mojito Classic',
    tagline: 'Scroll to watch it being made',
    video: '/videos/mojito.mp4',
    poster: '/videos/poster.jpg',
    chapters: [
      { t: 0.5, label: 'White Rum' },
      { t: 3.5, label: 'Fresh Mint' },
      { t: 7, label: 'Lime' },
      { t: 10.5, label: 'Sugar' },
      { t: 14, label: 'Soda' },
    ],
  },
}

export const activeDrink = drinks.mojito
