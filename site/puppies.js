// puppies.js
const puppies = [
  { 
    id: "p1", name: "Rocky", color: "Chocolate", 
    img: "images/pup1.jpeg", 
    gallery: ["images/pup1.jpeg","images/pup1_1.jpeg","images/pup1_2.jpeg","images/pup1_3.jpeg"], 
    sold: false, gender: "Male 8WKS", review: "",
    price: 3000 
  },
  { 
    id: "p2", name: "Louie", color: "Chocolate tri Merle", 
    img: "images/pup2.jpeg", 
    gallery: ["images/pup2.jpeg","images/pup2_1.jpeg","images/pup2_2.jpeg","images/pup2_3.jpeg","images/pup2_4.jpeg"], 
    sold: false, gender: "Female 5WKS", 
    review: "",
    price: 3500 
  },
  { 
    id: "p3", name: "Daisy", color: "Chocolate tri Merle", 
    img: "images/pup3.jpeg", 
    gallery: ["images/pup3.jpeg","images/pup3_1.jpeg","images/pup3_2.jpeg"], 
    sold: false, gender: "Female 6WKS", review: "",
    price: 3500 
  },
  { 
    id: "p4", name: "Ruby", color: "Lilac tri", 
    img: "images/pup4.jpeg", 
    gallery: ["images/pup4.jpeg","images/pup4_1.jpeg","images/pup4_2.jpeg","images/pup4_3.jpeg","images/pup4_4.jpeg"], 
    sold: false, 
    gender: "Female 5 Wks", review: "",
    price: 3500 
  },
  { 
    id: "p5", name: "Max", color: "Chocolate merle", 
    img: "images/pup5.jpeg", 
    gallery: ["images/pup5.jpeg","images/pup5_1.jpeg"], 
    sold: true, 
    gender: "Male 6Wks", 
    review: "",
    price: 3000 
  },
  { 
    id: "p6", name: "Winston", color: "Blue tri", 
    img: "images/pup6.jpeg", 
    gallery: ["images/pup6.jpeg","images/pup6_1.jpeg","images/pup6_2.jpeg","images/pup6_3.jpeg","images/pup6_4.jpeg"], 
    sold: false,
    gender: "Male 5.5 Wks", 
    review: "",
    price: 3000 
  },
  { 
    id: "p7", name: "Duke", color: "Blue tri Merle", 
    img: "images/pup7.jpeg", 
    gallery: ["images/pup7.jpeg","images/pup7_1.jpeg","images/pup7_2.jpeg","images/pup7_3.jpeg","images/pup7_4.jpeg"], 
    sold: true, 
    gender: "Male 6 Wks", 
    review: "",
    price: 3000 
  },
  { 
    id: "p8", name: "Oscar", color: "Blue tri", 
    img: "images/pup8.jpeg", 
    gallery: ["images/pup8.jpeg","images/pup8_1.jpeg","images/pup8_2.jpeg","images/pup8_3.jpeg","images/pup8_4.jpeg"], 
    sold: false, 
    gender: "Male 6 Wks", 
    review: "",
    price: 3000 
  },
  { 
    id: "p9", name: "Buddy", color: "Black tri-color", 
    img: "images/pup9.jpeg", 
    gallery: ["images/pup9.jpeg","images/pup9_1.jpeg"], 
    sold: true, 
    gender: "Male", 
    review: "He loves to play, a joy to be around - Anna Flemming",
    price: 3000 
  },
  { 
    id: "p10", name: "Sadie", color: "Lilac & tan tri", 
    img: "images/pup10.jpeg", 
    gallery: ["images/pup10.jpeg","images/pup10_1.jpeg"], 
    sold: true, 
    gender: "Female", 
    review: "Sadie has been a joy! Excellent temperament. - Sarah K.",
    price: 3500 
  },
  { 
    id: "p11", name: "Toby", color: "Fawn & white (heavy wrinkles)", 
    img: "images/pup11.jpeg", 
    gallery: ["images/pup11.jpeg","images/pup11_1.jpeg"], 
    sold: true, 
    gender: "Male", 
    review: "He adjusted quickly and fits perfectly into our home. – Amanda L.",
    price: 3000 
  },
  { 
    id: "p12", name: "Lola", color: "Blue merle", 
    img: "images/pup12.jpeg", 
    gallery: ["images/pup12.jpeg","images/pup12_1.jpeg"], 
    sold: true, 
    gender: "Female", 
    review: "She is healthy, confident, and great with kids. – Jason M.",
    price: 3500 
  },
  { 
    id: "p13", name: "Rocko", color: "lilac with minimal white", 
    img: "images/pup13.jpeg", 
    gallery: ["images/pup13.jpeg","images/pup13_1.jpeg"], 
    sold: true, 
    gender: "Male", 
    review: "He exceeded our expectations in every way. – Brian S.",
    price: 3000 
  },
  { 
    id: "p14", name: "Ruby", color: "Lilac & white", 
    img: "images/pup14.jpeg", 
    gallery: ["images/pup14.jpeg","images/pup14_1.jpeg"], 
    sold: true, 
    gender: "Female", 
    review: "She is affectionate and full of personality. – Hannah P.",
    price: 3500 
  },
  { 
    id: "p15", name: "Leo", color: "Red Fawn", 
    img: "images/pup15.jpeg", 
    gallery: ["images/pup15.jpeg","images/pup15_1.jpeg"], 
    sold: true, 
    gender: "Male", 
    review: "He came home well-socialized and happy. – Kevin A.",
    price: 3000 
  },
  { 
    id: "p16", name: "Mia", color: "Chocolate Fawn", 
    img: "images/pup16.jpeg", 
    gallery: ["images/pup16.jpeg","images/pup16_1.jpg"], 
    sold: true, 
    gender: "Female", 
    review: "She is smart, gentle, and easy to train. – Rachel W.",
    price: 3500 
  },
  { 
    id: "p17", name: "Jack", color: "White & Brindle", 
    img: "images/pup17.jpeg", 
    gallery: ["images/pup17.jpeg","images/pup17_1.jpg"], 
    sold: true, 
    gender: "Male", 
    review: "He has brought so much happiness to our family. – Daniel C.",
    price: 3000 
  },
];

// Load puppies from localStorage if available, otherwise save default puppies
(function() {
  const stored = localStorage.getItem('puppiesCatalog');
  if (stored) {
    try {
      const storedPuppies = JSON.parse(stored);
      // Replace the puppies array with stored data
      puppies.length = 0;
      puppies.push(...storedPuppies);
    } catch (e) {
      console.log('Could not parse stored puppies, using defaults');
      localStorage.setItem('puppiesCatalog', JSON.stringify(puppies));
    }
  } else {
    // First time: save default puppies to localStorage
    localStorage.setItem('puppiesCatalog', JSON.stringify(puppies));
  }
})();