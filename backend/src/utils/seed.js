require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');

const User = require('../models/User');
const Organizer = require('../models/Organizer');
const Event = require('../models/Event');
const BlogPost = require('../models/BlogPost');

const POSTER = (seed) => `https://picsum.photos/seed/${seed}/900/600`;

async function seed() {
  await connectDB();
  console.log('Seeding FEVA FEST sample data...');

  await Promise.all([
    User.deleteMany({}),
    Organizer.deleteMany({}),
    Event.deleteMany({}),
    BlogPost.deleteMany({}),
  ]);

  const admin = await User.create({
    fullName: 'FEVA FEST Admin',
    email: 'admin@fevafest.co.ke',
    phoneNumber: '0700000000',
    password: 'Admin@12345',
    role: 'admin',
    isSuperAdmin: true,
  });

  await User.create({
    fullName: 'FEVA FEST Staff Admin',
    email: 'staffadmin@fevafest.co.ke',
    phoneNumber: '0700000001',
    password: 'StaffAdmin@123',
    role: 'admin',
    isSuperAdmin: false,
  });

  const organizerUser = await User.create({
    fullName: 'Amani Events Ltd',
    email: 'organizer@fevafest.co.ke',
    phoneNumber: '0711000000',
    password: 'Organizer@123',
    role: 'organizer',
  });

  const organizer = await Organizer.create({
    user: organizerUser._id,
    businessName: 'Amani Events Ltd',
    description: 'Premier event production company based in Nairobi, Kenya.',
    contactEmail: 'organizer@fevafest.co.ke',
    contactPhone: '0711000000',
    isApproved: true,
    isVerified: true,
  });

  organizerUser.organizer = organizer._id;
  await organizerUser.save();

  await User.create({
    fullName: 'Test Customer',
    email: 'customer@fevafest.co.ke',
    phoneNumber: '0722000000',
    password: 'Customer@123',
    role: 'customer',
  });

  const daysFromNow = (n) => {
    const d = new Date();
    d.setDate(d.getDate() + n);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const sampleEvents = [
    {
      title: 'Nairobi Music Festival',
      category: 'Festivals',
      description:
        'The biggest annual celebration of Kenyan and East African music, bringing together top artists across multiple stages for a full day of live performances, food, and culture.',
      posterImage: POSTER('nairobi-music-fest'),
      venue: 'Uhuru Gardens',
      location: 'Nairobi',
      startDate: daysFromNow(20),
      startTime: '12:00 PM',
      endTime: '11:00 PM',
      tags: ['music', 'festival', 'live'],
      isFeatured: true,
      ticketTypes: [
        { name: 'Early Bird', price: 1500, quantityTotal: 200, description: 'Limited early access tickets.' },
        { name: 'Regular', price: 2500, quantityTotal: 800, description: 'Standard entry.' },
        { name: 'VIP', price: 6000, quantityTotal: 150, description: 'VIP lounge access and fast-track entry.' },
        { name: 'VVIP', price: 12000, quantityTotal: 50, description: 'Backstage access, private bar and meet & greet.' },
      ],
    },
    {
      title: 'Kenya Food & Culture Fest',
      category: 'Food & Lifestyle',
      description:
        'A vibrant showcase of Kenyan cuisine, crafts and culture featuring top chefs, local cooking demos, artisan markets and family entertainment.',
      posterImage: POSTER('kenya-food-fest'),
      venue: 'KICC Grounds',
      location: 'Nairobi',
      startDate: daysFromNow(15),
      startTime: '10:00 AM',
      endTime: '8:00 PM',
      tags: ['food', 'culture', 'family'],
      isFeatured: true,
      ticketTypes: [
        { name: 'Regular', price: 800, quantityTotal: 1000, description: 'General entry.' },
        { name: 'VIP', price: 2500, quantityTotal: 200, description: 'VIP tasting access.' },
      ],
    },
    {
      title: 'Nairobi Comedy Night',
      category: 'Comedy',
      description:
        'An unforgettable night of stand-up comedy with Kenya’s funniest comedians and special guest performers.',
      posterImage: POSTER('nairobi-comedy'),
      venue: 'Carnivore Grounds',
      location: 'Nairobi',
      startDate: daysFromNow(10),
      startTime: '7:00 PM',
      endTime: '10:00 PM',
      tags: ['comedy', 'nightlife'],
      ticketTypes: [
        { name: 'Regular', price: 1000, quantityTotal: 400, description: 'Standard seating.' },
        { name: 'VIP', price: 2500, quantityTotal: 100, description: 'Front row VIP seating.' },
      ],
    },
    {
      title: 'Afro Beats Live',
      category: 'Concerts',
      description:
        'A high-energy live concert celebrating the best of Afrobeats with top regional and international acts.',
      posterImage: POSTER('afro-beats-live'),
      venue: 'Kasarani Indoor Arena',
      location: 'Nairobi',
      startDate: daysFromNow(30),
      startTime: '6:00 PM',
      endTime: '1:00 AM',
      tags: ['music', 'concert', 'afrobeats'],
      isFeatured: true,
      ticketTypes: [
        { name: 'Regular', price: 2000, quantityTotal: 1500, description: 'General standing.' },
        { name: 'VIP', price: 5000, quantityTotal: 300, description: 'Reserved VIP seating.' },
        { name: 'VVIP', price: 15000, quantityTotal: 60, description: 'Backstage and artist meet & greet.' },
      ],
    },
    {
      title: 'Eldoret Music Festival',
      category: 'Music',
      description:
        'A celebration of local talent and rising stars in the heart of the Rift Valley, featuring live bands and DJs.',
      posterImage: POSTER('eldoret-music-fest'),
      venue: 'Eldoret Sports Club',
      location: 'Eldoret',
      startDate: daysFromNow(25),
      startTime: '11:00 AM',
      endTime: '10:00 PM',
      tags: ['music', 'festival'],
      ticketTypes: [
        { name: 'Regular', price: 1000, quantityTotal: 600, description: 'General entry.' },
        { name: 'VIP', price: 3000, quantityTotal: 120, description: 'VIP section access.' },
      ],
    },
    {
      title: 'Mombasa Beach Festival',
      category: 'Festivals',
      description:
        'Sun, sand and music collide at the coast’s premier beach festival featuring live DJs, water sports and beachside food stalls.',
      posterImage: POSTER('mombasa-beach-fest'),
      venue: 'Nyali Beach',
      location: 'Mombasa',
      startDate: daysFromNow(40),
      startTime: '9:00 AM',
      endTime: '9:00 PM',
      tags: ['beach', 'festival', 'music'],
      isFeatured: true,
      ticketTypes: [
        { name: 'Early Bird', price: 1200, quantityTotal: 300, description: 'Discounted early access.' },
        { name: 'Regular', price: 1800, quantityTotal: 1000, description: 'General entry.' },
        { name: 'VIP', price: 4500, quantityTotal: 200, description: 'Beachfront VIP cabana.' },
      ],
    },
    {
      title: 'Kenya Motorsport Experience',
      category: 'Sports',
      description:
        'Kenya’s premier motorsport showcase featuring rally cars, drift exhibitions and a professional track day for enthusiasts.',
      posterImage: POSTER('kenya-motorsport'),
      venue: 'Rift Valley Motorsports Club',
      location: 'Nakuru',
      startDate: daysFromNow(35),
      startTime: '7:00 AM',
      endTime: '6:00 PM',
      tags: ['motorsport', 'sports'],
      ticketTypes: [
        { name: 'Early Bird', price: 500, quantityTotal: 300, description: 'Discounted advance ticket.' },
        { name: 'Regular', price: 650, quantityTotal: 700, description: 'Standard gate access.' },
        { name: 'VIP', price: 1000, quantityTotal: 150, description: 'Trackside VIP viewing.' },
      ],
    },
    {
      title: 'Nairobi Tech & Innovation Conference',
      category: 'Conferences',
      description:
        'A gathering of Kenya’s top tech leaders, startups and investors discussing the future of innovation in East Africa.',
      posterImage: POSTER('nairobi-tech-conf'),
      venue: 'Sarit Expo Centre',
      location: 'Nairobi',
      startDate: daysFromNow(18),
      startTime: '8:00 AM',
      endTime: '5:00 PM',
      tags: ['tech', 'conference', 'business'],
      ticketTypes: [
        { name: 'Regular', price: 3000, quantityTotal: 500, description: 'Full conference access.' },
        { name: 'VIP', price: 8000, quantityTotal: 100, description: 'VIP networking lounge access.' },
      ],
    },
  ];

  for (const data of sampleEvents) {
    await Event.create({ ...data, organizer: organizer._id, status: 'published' });
  }

  const blogPosts = [
    {
      title: 'Top 10 Events Not To Miss This Season in Kenya',
      excerpt: 'From music festivals to food fairs, here is your complete guide to the season’s biggest events.',
      content:
        'Kenya’s event calendar is packed this season. From the Nairobi Music Festival to the Mombasa Beach Festival, there is something for everyone. In this guide we round up the top ten experiences you should not miss, along with tips on getting the best ticket deals early.',
      isFeatured: true,
    },
    {
      title: 'How to Buy Event Tickets Online Safely',
      excerpt: 'A quick guide to safely purchasing event tickets online in Kenya using M-Pesa.',
      content:
        'Buying tickets online has never been easier, but safety still matters. Always buy from verified platforms like FEVA FEST, keep your ticket confirmation, and never share your M-Pesa PIN with anyone. Here is everything you need to know before your next purchase.',
    },
    {
      title: 'Behind the Scenes: Planning a Successful Festival',
      excerpt: 'We speak to leading Kenyan event organizers about what it takes to pull off a major festival.',
      content:
        'Organizing a festival takes months of planning, from securing a venue to coordinating artists and vendors. We sat down with organizers behind some of Kenya’s biggest festivals to learn their secrets to success.',
    },
  ];

  for (const post of blogPosts) {
    await BlogPost.create({ ...post, author: admin._id });
  }

  console.log('Seeding complete.');
  console.log('Superadmin login: admin@fevafest.co.ke / Admin@12345 (sees Payments, can create admins)');
  console.log('Admin login:      staffadmin@fevafest.co.ke / StaffAdmin@123 (no Payments access)');
  console.log('Organizer login:  organizer@fevafest.co.ke / Organizer@123');
  console.log('Customer login:   customer@fevafest.co.ke / Customer@123');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
