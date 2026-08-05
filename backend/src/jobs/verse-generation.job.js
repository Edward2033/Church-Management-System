/**
 * Verse Generation Job
 * Automatically generates daily verses and prayer verses for the next 7 days
 * Runs daily at 1:00 AM
 */
const cron = require('node-cron');
const pool = require('../lib/db');

// Curated Bible verses for daily inspiration
const DAILY_VERSES = [
  {
    reference: 'Psalm 23:1',
    verse_text: 'The Lord is my shepherd; I shall not want.',
    book: 'Psalm',
    chapter: 23,
    verse_number: 1,
    encouragement: 'God provides for all your needs. Trust in His perfect care and guidance today.'
  },
  {
    reference: 'Philippians 4:13',
    verse_text: 'I can do all things through Christ who strengthens me.',
    book: 'Philippians',
    chapter: 4,
    verse_number: 13,
    encouragement: 'With Christ\'s strength, no challenge is too great. Face today with confidence in Him.'
  },
  {
    reference: 'Proverbs 3:5-6',
    verse_text: 'Trust in the Lord with all your heart, and lean not on your own understanding; in all your ways acknowledge Him, and He shall direct your paths.',
    book: 'Proverbs',
    chapter: 3,
    verse_number: 5,
    encouragement: 'Let God guide your decisions today. His wisdom surpasses all understanding.'
  },
  {
    reference: 'Joshua 1:9',
    verse_text: 'Have I not commanded you? Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go.',
    book: 'Joshua',
    chapter: 1,
    verse_number: 9,
    encouragement: 'God is with you in every situation. Step forward boldly knowing He never leaves your side.'
  },
  {
    reference: 'Jeremiah 29:11',
    verse_text: 'For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, plans to give you hope and a future.',
    book: 'Jeremiah',
    chapter: 29,
    verse_number: 11,
    encouragement: 'God has a beautiful plan for your life. Trust His timing and His purpose.'
  },
  {
    reference: 'Romans 8:28',
    verse_text: 'And we know that in all things God works for the good of those who love him, who have been called according to his purpose.',
    book: 'Romans',
    chapter: 8,
    verse_number: 28,
    encouragement: 'Even in difficult times, God is working everything together for your good.'
  },
  {
    reference: 'Matthew 11:28',
    verse_text: 'Come to me, all you who are weary and burdened, and I will give you rest.',
    book: 'Matthew',
    chapter: 11,
    verse_number: 28,
    encouragement: 'Bring your burdens to Jesus today. He offers rest and peace for your weary soul.'
  },
  {
    reference: 'Isaiah 40:31',
    verse_text: 'But those who hope in the Lord will renew their strength. They will soar on wings like eagles; they will run and not grow weary, they will walk and not be faint.',
    book: 'Isaiah',
    chapter: 40,
    verse_number: 31,
    encouragement: 'Place your hope in God and watch your strength be renewed. He empowers you to soar.'
  },
  {
    reference: '2 Corinthians 12:9',
    verse_text: 'But he said to me, "My grace is sufficient for you, for my power is made perfect in weakness."',
    book: '2 Corinthians',
    chapter: 12,
    verse_number: 9,
    encouragement: 'God\'s grace is more than enough. In your weakness, His power shines brightest.'
  },
  {
    reference: 'Psalm 46:1',
    verse_text: 'God is our refuge and strength, an ever-present help in trouble.',
    book: 'Psalm',
    chapter: 46,
    verse_number: 1,
    encouragement: 'Whatever you face today, God is your safe place and source of strength.'
  },
  {
    reference: 'John 3:16',
    verse_text: 'For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.',
    book: 'John',
    chapter: 3,
    verse_number: 16,
    encouragement: 'You are deeply loved by God. His sacrifice shows the immeasurable depth of His love for you.'
  },
  {
    reference: 'Ephesians 2:8-9',
    verse_text: 'For it is by grace you have been saved, through faith—and this is not from yourselves, it is the gift of God—not by works, so that no one can boast.',
    book: 'Ephesians',
    chapter: 2,
    verse_number: 8,
    encouragement: 'Salvation is God\'s free gift to you. Rest in His grace, not in your own efforts.'
  },
  {
    reference: 'Psalm 119:105',
    verse_text: 'Your word is a lamp for my feet, a light on my path.',
    book: 'Psalm',
    chapter: 119,
    verse_number: 105,
    encouragement: 'Let God\'s Word illuminate your path today. His truth guides every step.'
  },
  {
    reference: '1 Corinthians 10:13',
    verse_text: 'No temptation has overtaken you except what is common to mankind. And God is faithful; he will not let you be tempted beyond what you can bear.',
    book: '1 Corinthians',
    chapter: 10,
    verse_number: 13,
    encouragement: 'God knows your limits and provides a way through every temptation. You can overcome.'
  }
];

// Curated prayer verses with prayers
const PRAYER_VERSES = [
  {
    reference: 'Philippians 4:6-7',
    verse_text: 'Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God. And the peace of God, which transcends all understanding, will guard your hearts and your minds in Christ Jesus.',
    book: 'Philippians',
    chapter: 4,
    verse_number: 6,
    explanation: 'This verse teaches us to bring all our worries to God through prayer, replacing anxiety with His supernatural peace.',
    prayer_text: 'Lord, I lay all my anxieties and concerns before You today. Help me to trust You completely and experience Your peace that surpasses understanding. Guard my heart and mind in Christ Jesus. Amen.'
  },
  {
    reference: 'Matthew 6:9-13',
    verse_text: 'Our Father in heaven, hallowed be your name, your kingdom come, your will be done, on earth as it is in heaven. Give us today our daily bread. And forgive us our debts, as we also have forgiven our debtors. And lead us not into temptation, but deliver us from the evil one.',
    book: 'Matthew',
    chapter: 6,
    verse_number: 9,
    explanation: 'Jesus teaches us how to pray, honoring God while seeking His provision, forgiveness, and protection.',
    prayer_text: 'Heavenly Father, I honor Your holy name. May Your kingdom come and Your will be done in my life today. Provide for my needs, forgive my sins as I forgive others, and protect me from evil. In Jesus\' name, Amen.'
  },
  {
    reference: '1 Thessalonians 5:16-18',
    verse_text: 'Rejoice always, pray continually, give thanks in all circumstances; for this is God\'s will for you in Christ Jesus.',
    book: '1 Thessalonians',
    chapter: 5,
    verse_number: 16,
    explanation: 'God calls us to maintain an attitude of joy, constant prayer, and gratitude regardless of circumstances.',
    prayer_text: 'Lord, help me to rejoice always, pray without ceasing, and give thanks in every circumstance. Let this be my lifestyle as I walk with You. Thank You for Your constant presence. Amen.'
  },
  {
    reference: 'Psalm 51:10',
    verse_text: 'Create in me a pure heart, O God, and renew a steadfast spirit within me.',
    book: 'Psalm',
    chapter: 51,
    verse_number: 10,
    explanation: 'David\'s prayer for spiritual renewal and purity, acknowledging only God can transform our hearts.',
    prayer_text: 'Father, create in me a clean heart and renew Your Spirit within me. Cleanse me from all impurity and strengthen my resolve to follow You faithfully. Make me new today. Amen.'
  },
  {
    reference: 'James 1:5',
    verse_text: 'If any of you lacks wisdom, you should ask God, who gives generously to all without finding fault, and it will be given to you.',
    book: 'James',
    chapter: 1,
    verse_number: 5,
    explanation: 'God promises to provide wisdom generously when we ask, without condemning us for needing it.',
    prayer_text: 'Lord, I need Your wisdom for the decisions I face today. Please guide my thoughts and actions with Your perfect understanding. I trust You to direct my path. Amen.'
  },
  {
    reference: 'Ephesians 3:20',
    verse_text: 'Now to him who is able to do immeasurably more than all we ask or imagine, according to his power that is at work within us.',
    book: 'Ephesians',
    chapter: 3,
    verse_number: 20,
    explanation: 'God\'s power within us enables Him to exceed our greatest prayers and imagination.',
    prayer_text: 'Mighty God, I believe You can do far more than I can ask or imagine. Work Your power in and through me today for Your glory. Help me to dream big and trust You completely. Amen.'
  },
  {
    reference: 'Romans 12:12',
    verse_text: 'Be joyful in hope, patient in affliction, faithful in prayer.',
    book: 'Romans',
    chapter: 12,
    verse_number: 12,
    explanation: 'This verse calls us to maintain hope, patience, and consistent prayer through all seasons of life.',
    prayer_text: 'Father, fill me with joyful hope, grant me patience in trials, and help me remain faithful in prayer. Strengthen my faith and keep my eyes fixed on You. Amen.'
  },
  {
    reference: 'Colossians 4:2',
    verse_text: 'Devote yourselves to prayer, being watchful and thankful.',
    book: 'Colossians',
    chapter: 4,
    verse_number: 2,
    explanation: 'We are called to be devoted, alert, and grateful in our prayer life.',
    prayer_text: 'Lord, help me to devote myself to prayer today. Keep me watchful for Your work and fill my heart with gratitude for all You\'ve done. Draw me closer to You. Amen.'
  },
  {
    reference: 'Psalm 143:8',
    verse_text: 'Let the morning bring me word of your unfailing love, for I have put my trust in you. Show me the way I should go, for to you I entrust my life.',
    book: 'Psalm',
    chapter: 143,
    verse_number: 8,
    explanation: 'A morning prayer trusting in God\'s unfailing love and seeking His guidance for the day ahead.',
    prayer_text: 'Good morning, Lord. Remind me of Your unfailing love as I start this day. I trust You completely. Please show me the path I should take today. I place my life in Your hands. Amen.'
  },
  {
    reference: 'Hebrews 4:16',
    verse_text: 'Let us then approach God\'s throne of grace with confidence, so that we may receive mercy and find grace to help us in our time of need.',
    book: 'Hebrews',
    chapter: 4,
    verse_number: 16,
    explanation: 'We can boldly approach God\'s throne, confident we\'ll receive mercy and grace when we need it most.',
    prayer_text: 'Father, I come boldly to Your throne of grace. Thank You that I can approach You with confidence. I need Your mercy and grace today. Please meet me in my time of need. Amen.'
  }
];

/**
 * Generate verses for the next N days
 */
async function generateVerses(daysAhead = 7) {
  try {
    console.log('[Verse Generation] Starting auto-generation for next', daysAhead, 'days...');

    const { rows: [church] } = await pool.query('SELECT id FROM churches LIMIT 1');
    if (!church) {
      console.log('[Verse Generation] No church found, skipping...');
      return;
    }

    const churchId = church.id;
    let dailyCount = 0;
    let prayerCount = 0;

    // Generate verses for next N days
    for (let i = 0; i < daysAhead; i++) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + i);
      const dateString = targetDate.toISOString().split('T')[0];

      // Check if daily verse already exists for this date
      const { rows: existingDaily } = await pool.query(
        'SELECT id FROM daily_verses WHERE church_id = $1 AND date = $2',
        [churchId, dateString]
      );

      if (existingDaily.length === 0) {
        // Select a verse based on day index (cycles through the array)
        const verseIndex = i % DAILY_VERSES.length;
        const verse = DAILY_VERSES[verseIndex];

        await pool.query(
          `INSERT INTO daily_verses 
            (church_id, verse_text, reference, book, chapter, verse_number, encouragement, date, is_active)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE)`,
          [churchId, verse.verse_text, verse.reference, verse.book, verse.chapter, 
           verse.verse_number, verse.encouragement, dateString]
        );
        dailyCount++;
        console.log(`[Verse Generation] Created daily verse for ${dateString}`);
      }

      // Check if prayer verse already exists for this date
      const { rows: existingPrayer } = await pool.query(
        'SELECT id FROM prayer_verses WHERE church_id = $1 AND date = $2',
        [churchId, dateString]
      );

      if (existingPrayer.length === 0) {
        // Select a prayer verse based on day index (cycles through the array)
        const verseIndex = i % PRAYER_VERSES.length;
        const verse = PRAYER_VERSES[verseIndex];

        await pool.query(
          `INSERT INTO prayer_verses 
            (church_id, verse_text, reference, book, chapter, verse_number, 
             explanation, prayer_text, date, is_active)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, TRUE)`,
          [churchId, verse.verse_text, verse.reference, verse.book, verse.chapter,
           verse.verse_number, verse.explanation, verse.prayer_text, dateString]
        );
        prayerCount++;
        console.log(`[Verse Generation] Created prayer verse for ${dateString}`);
      }
    }

    console.log(`[Verse Generation] Complete! Created ${dailyCount} daily verses and ${prayerCount} prayer verses.`);
  } catch (err) {
    console.error('[Verse Generation] Error:', err);
  }
}

/**
 * Clean up old verses (optional - keeps database tidy)
 */
async function cleanupOldVerses() {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const dateString = thirtyDaysAgo.toISOString().split('T')[0];

    const { rowCount: dailyDeleted } = await pool.query(
      'DELETE FROM daily_verses WHERE date < $1',
      [dateString]
    );

    const { rowCount: prayerDeleted } = await pool.query(
      'DELETE FROM prayer_verses WHERE date < $1',
      [dateString]
    );

    if (dailyDeleted > 0 || prayerDeleted > 0) {
      console.log(`[Verse Cleanup] Deleted ${dailyDeleted} daily verses and ${prayerDeleted} prayer verses older than 30 days`);
    }
  } catch (err) {
    console.error('[Verse Cleanup] Error:', err);
  }
}

/**
 * Initialize and start the cron job
 */
function startVerseGenerationJob() {
  console.log('[Verse Generation Job] Initializing...');

  // Run immediately on startup to ensure verses are populated
  setTimeout(() => {
    console.log('[Verse Generation Job] Running initial verse generation...');
    generateVerses(14); // Generate 2 weeks ahead on startup
  }, 5000); // Wait 5 seconds after server start

  // Schedule daily at 1:00 AM
  cron.schedule('0 1 * * *', () => {
    console.log('[Verse Generation Job] Running scheduled generation...');
    generateVerses(7); // Generate 1 week ahead daily
    cleanupOldVerses(); // Clean up old verses
  });

  console.log('[Verse Generation Job] Scheduled to run daily at 1:00 AM');
}

module.exports = { startVerseGenerationJob, generateVerses };
