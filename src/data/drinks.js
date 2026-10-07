export const drinks = {
  mojito: {
    id: 'virgin-mojito',
    name: 'Virgin Mojito',
    tagline: 'Scroll to watch every ingredient go in',
    acts: [
      { t: 0, label: 'Crushed Ice', img: 'images/ice.jpg' },
      { t: 3, label: 'Fresh Mint', img: 'images/mint.jpg' },
      { t: 6, label: 'Lime', img: 'images/lime.jpg' },
      { t: 10, label: 'Sugar', img: 'images/sugar.jpg' },
      { t: 13.8, label: 'Soda Fizz', img: 'images/soda.jpg' },
      { t: 18.5, label: 'Serve', img: 'images/serve.jpg' },
    ],
    video: `${import.meta.env.BASE_URL}videos/mojito.mp4`,
    poster: `${import.meta.env.BASE_URL}videos/poster.jpg`,
  },
}

export const activeDrink = drinks.mojito