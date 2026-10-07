export const drinks = {
  mojito: {
    id: 'blue-curacao-mojito',
    name: 'Blue Curacao Mojito',
    tagline: 'Scroll to watch every ingredient go in',
    video: '/videos/mojito.mp4',
    poster: '/videos/poster.jpg',
    chapters: [
      { t: 0, label: 'Crushed Ice' },
      { t: 2.5, label: 'Fresh Mint' },
      { t: 5, label: 'Lime' },
      { t: 7.5, label: 'Blue Curacao' },
      { t: 10.5, label: 'Soda Fizz' },
      { t: 13, label: 'Top-Up Pour' },
    ],
  },
}

export const activeDrink = drinks.mojito
