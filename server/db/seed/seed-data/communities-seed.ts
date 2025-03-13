import type {
  InsertCommunity,
  InsertThread,
  InsertThreadVote,
} from "../../schema";
import {
  getRandomBanner,
  getRandomIcon,
} from "../../../../frontend/src/lib/utils";

export const communitiesSeedData: InsertCommunity[] = [
  {
    banner: getRandomBanner(),
    icon: getRandomIcon(),
    name: "funny",
    description:
      "Where humor comes alive - share memes, jokes, and laugh-worthy content",
    isPrivate: false,
  },
  {
    banner: getRandomBanner(),
    icon: getRandomIcon(),
    name: "Ask",
    description:
      "Your curiosity hub - ask questions on any topic and get answers from the community",
    isPrivate: false,
  },
  {
    banner: getRandomBanner(),
    icon: getRandomIcon(),
    name: "programming",
    description:
      "Code, collaborate, and solve problems with fellow developers across all languages",
    isPrivate: false,
  },
  {
    banner: getRandomBanner(),
    icon: getRandomIcon(),
    name: "news",
    description:
      "Stay informed with breaking stories, current events, and thoughtful analysis",
    isPrivate: false,
  },
  {
    banner: getRandomBanner(),
    icon: getRandomIcon(),
    name: "politics",
    description:
      "Civil discourse on governance, policy debates, and political developments worldwide",
    isPrivate: false,
  },
  {
    banner: getRandomBanner(),
    icon: getRandomIcon(),
    name: "science",
    description:
      "Explore discoveries, research breakthroughs, and the wonders of the scientific world",
    isPrivate: false,
  },
  {
    banner: getRandomBanner(),
    icon: getRandomIcon(),
    name: "sports",
    description:
      "Celebrate athletics with game discussions, highlights, and fan conversations",
    isPrivate: false,
  },
  {
    banner: getRandomBanner(),
    icon: getRandomIcon(),
    name: "technology",
    description:
      "Navigate the latest innovations, gadgets, and digital trends shaping our future",
    isPrivate: false,
  },
  {
    banner: getRandomBanner(),
    icon: getRandomIcon(),
    name: "worldnews",
    description:
      "Global perspectives on international events and developments across continents",
    isPrivate: false,
  },
  {
    banner: getRandomBanner(),
    icon: getRandomIcon(),
    name: "gaming",
    description:
      "Connect with fellow gamers to discuss titles, strategies, and industry news",
    isPrivate: false,
  },
  {
    banner: getRandomBanner(),
    icon: getRandomIcon(),
    name: "movies",
    description:
      "Discuss films, directors, actors, and everything cinema-related",
    isPrivate: false,
  },
  {
    banner: getRandomBanner(),
    icon: getRandomIcon(),
    name: "books",
    description:
      "For bibliophiles to share recommendations, reviews, and literary discussions",
    isPrivate: false,
  },
  {
    banner: getRandomBanner(),
    icon: getRandomIcon(),
    name: "music",
    description:
      "Share your favorite tunes, discuss artists, and explore new genres together",
    isPrivate: false,
  },
  {
    banner: getRandomBanner(),
    icon: getRandomIcon(),
    name: "fitness",
    description:
      "Tips, motivation, and discussions about exercise, nutrition, and healthy living",
    isPrivate: false,
  },
  {
    banner: getRandomBanner(),
    icon: getRandomIcon(),
    name: "food",
    description:
      "Recipes, restaurant recommendations, and culinary conversations for food lovers",
    isPrivate: false,
  },
  {
    banner: getRandomBanner(),
    icon: getRandomIcon(),
    name: "photography",
    description:
      "Showcase your shots, discuss techniques, and get feedback from fellow photographers",
    isPrivate: false,
  },
  {
    banner: getRandomBanner(),
    icon: getRandomIcon(),
    name: "art",
    description:
      "A canvas for sharing and discussing all forms of visual and conceptual art",
    isPrivate: false,
  },
  {
    banner: getRandomBanner(),
    icon: getRandomIcon(),
    name: "space",
    description:
      "Explore the cosmos, discuss astronomy, and stay updated on space exploration",
    isPrivate: false,
  },
  {
    banner: getRandomBanner(),
    icon: getRandomIcon(),
    name: "history",
    description:
      "Journey through time with discussions about historical events, figures, and perspectives",
    isPrivate: false,
  },
  {
    banner: getRandomBanner(),
    icon: getRandomIcon(),
    name: "philosophy",
    description:
      "Thoughtful discussions on ideas, ethics, existence, and the nature of reality",
    isPrivate: false,
  },
  {
    banner: getRandomBanner(),
    icon: getRandomIcon(),
    name: "travel",
    description:
      "Share adventures, destinations, tips, and travel experiences from around the globe",
    isPrivate: false,
  },
  {
    banner: getRandomBanner(),
    icon: getRandomIcon(),
    name: "DIY",
    description:
      "Crafts, home projects, and creative solutions for the hands-on community",
    isPrivate: false,
  },
  {
    banner: getRandomBanner(),
    icon: getRandomIcon(),
    name: "environment",
    description:
      "Discuss sustainability, conservation efforts, and environmental challenges",
    isPrivate: false,
  },
  {
    banner: getRandomBanner(),
    icon: getRandomIcon(),
    name: "finance",
    description:
      "Investment strategies, financial advice, and discussions on economics",
    isPrivate: false,
  },
  {
    banner: getRandomBanner(),
    icon: getRandomIcon(),
    name: "fashion",
    description:
      "Trends, styles, designers, and personal expression through clothing",
    isPrivate: false,
  },
  {
    banner: getRandomBanner(),
    icon: getRandomIcon(),
    name: "pets",
    description:
      "Celebrate and share advice about our furry, feathered, and scaly companions",
    isPrivate: false,
  },
  {
    banner: getRandomBanner(),
    icon: getRandomIcon(),
    name: "gardening",
    description:
      "Tips, inspiration, and discussions for plant enthusiasts of all skill levels",
    isPrivate: false,
  },
  {
    banner: getRandomBanner(),
    icon: getRandomIcon(),
    name: "psychology",
    description:
      "Explore human behavior, mental health awareness, and psychological concepts",
    isPrivate: false,
  },
  {
    banner: getRandomBanner(),
    icon: getRandomIcon(),
    name: "education",
    description:
      "Resources, discussions, and support for learners and educators at all levels",
    isPrivate: false,
  },
  {
    banner: getRandomBanner(),
    icon: getRandomIcon(),
    name: "writing",
    description:
      "For authors, poets, and writers to share work, advice, and literary discussions",
    isPrivate: false,
  },
  {
    banner: getRandomBanner(),
    icon: getRandomIcon(),
    name: "language",
    description:
      "Learning, teaching, and appreciating languages from around the world",
    isPrivate: false,
  },
  {
    banner: getRandomBanner(),
    icon: getRandomIcon(),
    name: "relationships",
    description:
      "Navigate the complexities of human connections, dating advice, and support",
    isPrivate: false,
  },
  {
    banner: getRandomBanner(),
    icon: getRandomIcon(),
    name: "cars",
    description:
      "Automotive enthusiasts discussing vehicles, maintenance, and driving passion",
    isPrivate: false,
  },
  {
    banner: getRandomBanner(),
    icon: getRandomIcon(),
    name: "startups",
    description:
      "Entrepreneurship, innovation, and building the next generation of businesses",
    isPrivate: false,
  },
  {
    banner: getRandomBanner(),
    icon: getRandomIcon(),
    name: "cryptocurrency",
    description:
      "Discussing blockchain technology, digital currencies, and the future of finance",
    isPrivate: false,
  },
  {
    banner: getRandomBanner(),
    icon: getRandomIcon(),
    name: "parenting",
    description:
      "Support, advice, and stories about raising children and family life",
    isPrivate: false,
  },
  {
    banner: getRandomBanner(),
    icon: getRandomIcon(),
    name: "architecture",
    description:
      "Celebrating design, buildings, and the spaces we create and inhabit",
    isPrivate: false,
  },
  {
    banner: getRandomBanner(),
    icon: getRandomIcon(),
    name: "animation",
    description:
      "From classic cartoons to modern CGI - discussing all forms of animated content",
    isPrivate: false,
  },
  {
    banner: getRandomBanner(),
    icon: getRandomIcon(),
    name: "minimalism",
    description:
      "Living with less, intentional choices, and finding value beyond possessions",
    isPrivate: false,
  },
  {
    banner: getRandomBanner(),
    icon: getRandomIcon(),
    name: "health",
    description:
      "Discussions on wellness, medical insights, and maintaining physical wellbeing",
    isPrivate: false,
  },
];
