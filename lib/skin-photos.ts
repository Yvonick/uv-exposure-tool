// People are cited as illustrative phototype examples by Ochs Dermatology.
// Their portraits are not individual clinical assessments or a visual typing test.
type Photo = { src: string; name: string; source: string; credit: string; license: string; licenseUrl: string };
export const skinPhotos: Record<string, { tone: string; photos: Photo[] }> = {
  "I": {
    "tone": "Very fair",
    "photos": [
      {
        "src": "/photos/skin-types/portrait-1-a.jpg",
        "name": "Emma Stone",
        "source": "https://commons.wikimedia.org/wiki/File:Emma_Stone_at_the_2025_Venice_Film_Festival-6313_(cropped).jpg",
        "credit": "Harald Krichel",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "src": "/photos/skin-types/portrait-1-b.jpg",
        "name": "Hugh Grant",
        "source": "https://commons.wikimedia.org/wiki/File:Hugh_Grant_in_2014.jpg",
        "credit": "Kurt Kulac",
        "license": "CC BY-SA 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
      }
    ]
  },
  "II": {
    "tone": "Fair",
    "photos": [
      {
        "src": "/photos/skin-types/portrait-2-a.jpg",
        "name": "Kate Winslet",
        "source": "https://commons.wikimedia.org/wiki/File:KateWinslet_(cropped).jpg",
        "credit": "Colleen Sturtevant",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "src": "/photos/skin-types/portrait-2-b.jpg",
        "name": "Owen Wilson",
        "source": "https://commons.wikimedia.org/wiki/File:Owen_Wilson_Cannes_2011.jpg",
        "credit": "Georges Biard",
        "license": "CC BY-SA 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
      }
    ]
  },
  "III": {
    "tone": "Medium",
    "photos": [
      {
        "src": "/photos/skin-types/portrait-3-a.jpg",
        "name": "Sandra Bullock",
        "source": "https://commons.wikimedia.org/wiki/File:Sandra_Bullock,_The_Heat,_London,_2013_(crop).jpg",
        "credit": "Richard Goldschmidt / Keraunoscopia",
        "license": "CC BY 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by/3.0"
      },
      {
        "src": "/photos/skin-types/portrait-3-b.jpg",
        "name": "George Clooney",
        "source": "https://commons.wikimedia.org/wiki/File:George_Clooney_Jay_Kelly-19_(cropped).jpg",
        "credit": "Bryan Berlin",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      }
    ]
  },
  "IV": {
    "tone": "Olive / light brown",
    "photos": [
      {
        "src": "/photos/skin-types/portrait-4-a.jpg",
        "name": "Jessica Alba",
        "source": "https://commons.wikimedia.org/wiki/File:Jessica_Alba_-_Los_Angeles_Comic_Con_2025.jpg",
        "credit": "Kevin Paul",
        "license": "CC BY 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by/4.0"
      },
      {
        "src": "/photos/skin-types/portrait-4-b.jpg",
        "name": "Dev Patel",
        "source": "https://commons.wikimedia.org/wiki/File:SXSW_2024_-_Dev_Patel_2.jpg",
        "credit": "Ariela Ortiz Barrantes",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      }
    ]
  },
  "V": {
    "tone": "Brown",
    "photos": [
      {
        "src": "/photos/skin-types/portrait-5-a.jpg",
        "name": "Halle Berry",
        "source": "https://commons.wikimedia.org/wiki/File:Halle_Berry-1910.jpg",
        "credit": "Harald Krichel / WikiPortraits",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "src": "/photos/skin-types/portrait-5-b.jpg",
        "name": "Will Smith",
        "source": "https://commons.wikimedia.org/wiki/File:TechCrunch_Disrupt_San_Francisco_2019_-_Day_1_(48834070763)_(cropped).jpg",
        "credit": "Steve Jennings/Getty Images for TechCrunch",
        "license": "CC BY 2.0",
        "licenseUrl": "https://creativecommons.org/licenses/by/2.0"
      }
    ]
  },
  "VI": {
    "tone": "Deep brown",
    "photos": [
      {
        "src": "/photos/skin-types/portrait-6-a.jpg",
        "name": "Lupita Nyong’o",
        "source": "https://commons.wikimedia.org/wiki/File:LupitaNyongo-byPhilipRomano.jpg",
        "credit": "Philip Romano",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "src": "/photos/skin-types/portrait-6-b.jpg",
        "name": "Taye Diggs",
        "source": "https://commons.wikimedia.org/wiki/File:Taye_Diggs_2015.jpg",
        "credit": "Larry D. Moore",
        "license": "CC BY 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by/4.0"
      }
    ]
  }
};
