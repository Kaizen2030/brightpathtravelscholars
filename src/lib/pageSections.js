const PAGE_SECTION_DEFAULTS = {
  home: {
    hero: {
      label: 'Hero',
      enabled: true,
      order: 1,
      badge_text: 'USA-Based Study Abroad Consultancy',
      heading: "Your Gateway to the World's Best Universities",
      subheading:
        'Trusted by 10,000+ students. Free consultation. Expert counsellors. 400+ university partners.',
      primary_btn_text: 'Start Your Journey',
      primary_btn_url: '/apply',
      secondary_btn_text: 'Book Free Consultation',
      secondary_btn_url: '/contact',
      media_url: '',
      media_secondary_url: '',
      items: [],
      settings: {
        overlay_opacity: 0.56,
        background_images: [{ image_url: '', title: 'Slide 1' }],
        stats: [
          { value: 400, suffix: '+', label: 'University Partners' },
          { value: 15, suffix: '+', label: 'Years Experience' },
          { value: 10000, suffix: '+', label: 'Students Placed' },
          { value: 98, suffix: '%', label: 'Visa Success Rate' },
        ],
        feature_card: {
          kicker: 'Admission Roadmap',
          heading: 'From shortlist to offer letter',
          body: 'Clear counselling, faster applications, stronger visa preparation.',
          pills: ['400+ Partners', 'Visa Experts', 'Pre-Departure Support'],
        },
        compact_card: {
          title: 'Trusted by families',
          body: 'Personal support for every milestone.',
        },
      },
    },
    events: {
      label: 'Events',
      enabled: true,
      order: 2,
      badge_text: 'Live Events',
      heading: 'Upcoming Events',
      subheading: 'Meet partner universities, join visa talks, and reserve your seat before spaces fill up.',
      body_text: '',
      primary_btn_text: '',
      primary_btn_url: '',
      secondary_btn_text: '',
      secondary_btn_url: '',
      media_url: '',
      media_secondary_url: '',
      items: [],
      settings: {},
    },
    why_nexora: {
      label: 'Why Brightpath',
      enabled: true,
      order: 3,
      badge_text: 'Why Brightpath',
      heading: 'Why 10,000+ Students Choose Brightpath',
      subheading:
        'We guide students from their first counselling call to visa approval, pre-departure planning, and arrival.',
      media_url: '',
      media_secondary_url: '',
      items: [
        { text: 'Priority agent with 400+ institutions' },
        { text: 'Dedicated specialist counsellors' },
        { text: 'Free consultation and application support' },
        { text: 'Pre-departure briefings included' },
        { text: 'Expert visa team with 98% success rate' },
        { text: 'SIM card provided before travel' },
      ],
      settings: {
        visual_badge_value: 98,
        visual_badge_suffix: '%',
        visual_badge_label: 'Visa success rate',
        visual_heading: 'Applications prepared with precision',
        visual_body:
          'We keep every document, deadline, and university response moving in the right order.',
        link_text: 'Learn More',
        link_url: '/about',
      },
    },
    how_it_works: {
      label: 'How It Works',
      enabled: true,
      order: 4,
      badge_text: 'Simple Process',
      heading: 'Your Journey in 5 Simple Steps',
      subheading: 'A structured process that keeps your application moving with clarity and confidence.',
      items: [
        {
          title: 'Book Free Consultation',
          description: 'Speak with a counsellor about your goals, budget, and best-fit destinations.',
        },
        {
          title: 'Prepare Your Documents',
          description: 'We help you gather transcripts, passports, statements, and supporting materials.',
        },
        {
          title: 'Meet Offer Conditions',
          description: 'We track university feedback and guide you through any pending requirements.',
        },
        {
          title: 'Visa Application',
          description: 'Our team prepares your visa file carefully and keeps timelines on track.',
        },
        {
          title: 'Fly & Arrive',
          description: 'You leave with briefings, travel guidance, and arrival support already sorted.',
        },
      ],
      settings: {},
    },
    destinations: {
      label: 'Destinations',
      enabled: true,
      order: 5,
      badge_text: 'Destinations',
      heading: 'Study Destinations',
      subheading: 'Explore top destinations with strong student support, global rankings, and career pathways.',
      items: [
        { slug: 'uk', code: 'GB', name: 'UK', subtitle: '120+ partner universities', image_url: '' },
        { slug: 'australia', code: 'AU', name: 'Australia', subtitle: '70+ partner universities', image_url: '' },
        { slug: 'canada', code: 'CA', name: 'Canada', subtitle: '65+ partner universities', image_url: '' },
        { slug: 'usa', code: 'US', name: 'USA', subtitle: '80+ partner universities', image_url: '' },
        { slug: 'new-zealand', code: 'NZ', name: 'New Zealand', subtitle: '25+ partner universities', image_url: '' },
        { slug: 'dubai', code: 'AE', name: 'Dubai', subtitle: '20+ partner universities', image_url: '' },
        { slug: 'europe', code: 'EU', name: 'Europe', subtitle: '55+ partner universities', image_url: '' },
        { slug: 'malaysia', code: 'MY', name: 'Malaysia', subtitle: '15+ partner universities', image_url: '' },
        { slug: 'turkey', code: 'TR', name: 'Turkey', subtitle: '22+ partner universities', image_url: '' },
        { slug: 'china', code: 'CN', name: 'China', subtitle: '45+ partner universities', image_url: '' },
      ],
      settings: {},
    },
    testimonials: {
      label: 'Testimonials',
      enabled: true,
      order: 6,
      badge_text: 'Student Stories',
      heading: 'Student Success Stories',
      subheading: 'Hear from students who trusted Brightpath to plan their study abroad journey.',
      items: [],
      settings: {},
    },
    cta: {
      label: 'CTA',
      enabled: true,
      order: 7,
      badge_text: 'Take the Next Step',
      heading: 'Ready to Study Abroad?',
      subheading:
        'Book a free consultation today and let our counsellors map your best-fit universities and visa plan.',
      primary_btn_text: 'Book Free Consultation',
      primary_btn_url: '/contact',
      secondary_btn_text: 'WhatsApp Us',
      secondary_btn_url: 'https://wa.me/15551234567',
      items: [],
      settings: {},
    },
  },
  about: {
    hero: {
      label: 'Hero',
      enabled: true,
      order: 1,
      badge_text: 'About Brightpath',
      heading: 'We help students step confidently into global education.',
      subheading:
        'For more than 15 years, Brightpath Travel Scholars has supported students with university applications, visa strategy, and practical preparation for life abroad.',
      settings: {},
    },
    story: {
      label: 'Story',
      enabled: true,
      order: 2,
      badge_text: 'Our Story',
      heading: 'From first consultation to arrival abroad, we stay close to the journey.',
      subheading:
        'Brightpath Travel Scholars was built to make world-class education feel reachable for students and families worldwide. We combine destination expertise with a hands-on support model that keeps applications clear, timely, and realistic.',
      body_text:
        'With 400+ institution partnerships and a strong network of student destinations, we continue to shape a study abroad experience that is ambitious, ethical, and deeply practical.',
      items: [
        { title: '400+ university partners', description: 'Wide destination choice and direct application support.' },
        { title: 'U.S.-based support', description: 'Local guidance with a global admissions perspective.' },
        { title: 'Student-first standards', description: 'Student outcomes, trust, and consistency remain our benchmark.' },
      ],
      settings: {
        visual_tag: '15+ years of guidance',
        visual_heading: 'Built on trust, outcomes, and informed advice',
        visual_body:
          'Our U.S.-based team has helped students access universities across the UK, Canada, Australia, the USA, Europe, Dubai, and beyond.',
      },
    },
    mission_vision: {
      label: 'Mission & Vision',
      enabled: true,
      order: 3,
      items: [],
      settings: {
        mission: {
          badge: 'Mission',
          heading: 'To help students access life-changing global education with clarity and confidence.',
          body: 'We simplify study abroad by combining expert counselling, careful admissions preparation, and dependable visa guidance for students worldwide.',
        },
        vision: {
          badge: 'Vision',
          heading: "To become one of the most trusted bridges between global talent and the world's best universities.",
          body: 'We want every qualified student to feel seen, prepared, and connected to international opportunities that match their goals and potential.',
        },
      },
    },
    values: {
      label: 'Values',
      enabled: true,
      order: 4,
      badge_text: 'Our Values',
      heading: 'The principles that shape every student interaction.',
      subheading:
        'We care deeply about trust, usefulness, and creating a process students can actually move through with confidence.',
      items: [
        { title: 'Integrity', description: 'We advise students honestly and build every recommendation around real fit, not pressure.' },
        { title: 'Excellence', description: 'Every application, statement, and visa file is handled with detail and professional care.' },
        { title: 'Student-First', description: 'Our process is designed around student goals, confidence, and long-term success.' },
        { title: 'Innovation', description: 'We keep improving how students research, apply, and prepare for their next chapter.' },
        { title: 'Accessibility', description: 'Expert study abroad guidance should feel approachable, responsive, and easy to understand.' },
        { title: 'Global Mindset', description: 'We connect local ambition to global opportunity with practical, future-focused guidance.' },
      ],
      settings: {},
    },
    team: {
      label: 'Team',
      enabled: true,
      order: 5,
      badge_text: 'Meet The Team',
      heading: 'The counsellors and advisors behind the student journey.',
      subheading:
        'From admissions strategy to visa support, our team works across the full pathway and keeps every next step understandable.',
      items: [],
      settings: {},
    },
    stats: {
      label: 'Stats',
      enabled: true,
      order: 6,
      items: [],
      settings: {
        stats: [
          { value: 15, suffix: '+', label: 'Years of experience' },
          { value: 400, suffix: '+', label: 'University partners' },
          { value: 10000, suffix: '+', label: 'Students placed' },
          { value: 98, suffix: '%', label: 'Visa success rate' },
        ],
      },
    },
    cta: {
      label: 'CTA',
      enabled: true,
      order: 7,
      badge_text: 'Ready to Begin?',
      heading: "Let's map your best-fit study destination together.",
      subheading:
        'Book a free consultation and get tailored advice on courses, entry requirements, budget, and timelines.',
      primary_btn_text: 'Book Free Consultation',
      primary_btn_url: '/contact',
      secondary_btn_text: 'Apply Now',
      secondary_btn_url: '/apply',
      items: [],
      settings: {},
    },
  },
  study_abroad: {
    hero: {
      label: 'Hero',
      enabled: true,
      order: 1,
      badge_text: 'Study Abroad',
      heading: 'Discover destinations that fit your ambitions, budget, and long-term goals.',
      subheading:
        'Brightpath helps students compare countries, prepare strong applications, access scholarships, and move confidently through the visa process.',
      primary_btn_text: 'Start Application',
      primary_btn_url: '/apply',
      secondary_btn_text: 'Book Consultation',
      secondary_btn_url: '/contact',
      media_url: '',
      settings: {
        map_card_title: 'Choose from 10+ destinations',
        map_card_body: 'From the UK and Canada to Dubai, Europe, and Malaysia.',
        map_card_badge: 'Global pathways',
      },
    },
    destinations: {
      label: 'Destinations',
      enabled: true,
      order: 2,
      badge_text: 'Destinations',
      heading: 'Find the right country for your course and future plans.',
      subheading:
        'Every destination has a different mix of tuition levels, work options, scholarship access, and post-study opportunities.',
      items: [
        {
          slug: 'uk',
          code: 'GB',
          name: 'United Kingdom',
          summary: 'High-ranking universities, broad scholarship options, and strong post-study pathways.',
          universities: ['University of Manchester', 'University of Leeds', 'Coventry University'],
          image_url: '',
        },
        {
          slug: 'australia',
          code: 'AU',
          name: 'Australia',
          summary: 'Global-quality teaching, student support, and vibrant multicultural campuses.',
          universities: ['Deakin University', 'Griffith University', 'University of Adelaide'],
          image_url: '',
        },
        {
          slug: 'canada',
          code: 'CA',
          name: 'Canada',
          summary: 'Welcoming student destinations with strong employability and migration interest.',
          universities: ['University of Windsor', 'York University', 'University of Manitoba'],
          image_url: '',
        },
        {
          slug: 'usa',
          code: 'US',
          name: 'United States',
          summary: 'Wide course choice, high research output, and dynamic campus communities.',
          universities: ['Arizona State University', 'Pace University', 'University of South Florida'],
          image_url: '',
        },
        {
          slug: 'new-zealand',
          code: 'NZ',
          name: 'New Zealand',
          summary: 'Supportive study environment with strong quality assurance and student wellbeing.',
          universities: ['University of Auckland', 'Massey University', 'AUT'],
          image_url: '',
        },
        {
          slug: 'dubai',
          code: 'AE',
          name: 'Dubai',
          summary: 'Modern city campuses, international branch institutions, and regional accessibility.',
          universities: ['University of Birmingham Dubai', 'Middlesex Dubai', 'Heriot-Watt Dubai'],
          image_url: '',
        },
        {
          slug: 'europe',
          code: 'EU',
          name: 'Europe',
          summary: 'Affordable options, diverse cultures, and expanding English-taught programmes.',
          universities: ['EU Business School', 'University of Europe', 'Budapest Metropolitan University'],
          image_url: '',
        },
        {
          slug: 'malaysia',
          code: 'MY',
          name: 'Malaysia',
          summary: 'Cost-effective programmes, branch campuses, and diverse student life.',
          universities: ["Taylor's University", 'Sunway University', 'UCSI University'],
          image_url: '',
        },
        {
          slug: 'turkey',
          code: 'TR',
          name: 'Turkey',
          summary: 'Competitive tuition, cultural richness, and increasing scholarship availability.',
          universities: ['Bahcesehir University', 'Istanbul Aydin University', 'Ozyegin University'],
          image_url: '',
        },
        {
          slug: 'china',
          code: 'CN',
          name: 'China',
          summary: 'Technology-driven universities, strong research ecosystems, and expanding scholarship access.',
          universities: ['Tsinghua University', 'Peking University', 'Fudan University'],
          image_url: '',
        },
      ],
      settings: {},
    },
    steps: {
      label: 'How To Apply',
      enabled: true,
      order: 3,
      badge_text: 'How To Apply',
      heading: 'Your journey in 5 guided steps.',
      subheading:
        'We help you move from the first conversation to travel readiness with a structured, student-friendly process.',
      items: [
        {
          title: 'Book Free Consultation',
          description: 'We assess your academic background, budget, goals, and the countries that match your priorities.',
        },
        {
          title: 'Prepare Your Documents',
          description: 'We help you organise transcripts, passport details, references, personal statements, and finances.',
        },
        {
          title: 'Meet Offer Conditions',
          description: 'Once your offers arrive, we guide you through any pending fees, test requirements, or missing documents.',
        },
        {
          title: 'Visa Application',
          description: 'Our visa team supports file preparation, appointment planning, and the key documents embassies need.',
        },
        {
          title: 'Fly & Arrive',
          description: 'You receive pre-departure briefings, arrival tips, and practical support before you travel.',
        },
      ],
      settings: {},
    },
    requirements: {
      label: 'Requirements',
      enabled: true,
      order: 4,
      items: [],
      settings: {
        academic: {
          badge: 'Academic Requirements',
          heading: 'What universities usually look for.',
          points: [
            'Completed secondary school, diploma, or degree transcripts depending on your level.',
            'Minimum grades that match your chosen course and destination.',
            'Relevant prerequisite subjects for competitive programmes.',
            'English test scores where required by the institution.',
            'Personal statement or motivation letter for selected universities.',
          ],
        },
        documents: {
          badge: 'Document Requirements',
          heading: 'Core documents we help you prepare.',
          points: [
            'Valid passport bio-data page.',
            'Academic transcripts and certificates.',
            'Curriculum vitae for postgraduate applicants where needed.',
            'Financial documents for tuition and visa processing.',
            'Reference letters, portfolio items, or work history if the programme requires them.',
          ],
        },
      },
    },
    scholarships: {
      label: 'Scholarships',
      enabled: true,
      order: 5,
      badge_text: 'Scholarships',
      heading: 'Funding opportunities we can help you track.',
      subheading:
        'Scholarship availability changes by university and intake, so we combine live listings with guided recommendations.',
      items: [],
      settings: {},
    },
    faq: {
      label: 'FAQ',
      enabled: true,
      order: 6,
      badge_text: 'FAQ',
      heading: 'Questions students ask us all the time.',
      subheading: 'Tap a question below to expand the answer and understand what to expect from the process.',
      items: [
        {
          question: 'How much does it cost to study abroad?',
          answer:
            'Costs depend on destination, programme, and living expenses. We help you compare tuition, accommodation, and visa-related costs before you apply.',
        },
        {
          question: 'How long does the process usually take?',
          answer:
            'Many students begin 6 to 12 months before their intended intake so there is enough time for applications, offers, and visa preparation.',
        },
        {
          question: 'Can Brightpath help me find scholarships?',
          answer:
            'Yes. We identify scholarships linked to your destination, academics, and university shortlist, then help you apply where possible.',
        },
        {
          question: 'Do I need an English proficiency test?',
          answer:
            'Some universities require IELTS, TOEFL, Duolingo, or equivalent proof. Requirements vary by country and programme.',
        },
        {
          question: 'How does the visa process work?',
          answer:
            'Once you meet offer conditions, we prepare your visa file, review your documents, and guide you through booking and submission steps.',
        },
        {
          question: 'Can you help with accommodation?',
          answer:
            'Yes. We share student accommodation options, on-campus housing guidance, and practical arrival information where available.',
        },
      ],
      settings: {},
    },
    cta: {
      label: 'CTA',
      enabled: true,
      order: 7,
      badge_text: 'Next Step',
      heading: 'Ready to start your international study plan?',
      subheading:
        'Book a free consultation or start your application today and let Brightpath help you build the next move.',
      primary_btn_text: 'Book Free Consultation',
      primary_btn_url: '/contact',
      secondary_btn_text: 'Apply Now',
      secondary_btn_url: '/apply',
      items: [],
      settings: {},
    },
  },
  work_abroad: {
    hero: {
      label: 'Hero',
      enabled: true,
      order: 1,
      badge_text: 'Work Abroad 2025',
      heading: 'Find your job abroad in 60 seconds.',
      subheading: 'Skilled and unskilled roles with visa support across Canada, the USA, Europe, the UAE, and more.',
      primary_btn_text: 'Browse All Jobs',
      primary_btn_url: '/work-abroad',
      secondary_btn_text: 'Create Profile',
      secondary_btn_url: '/contact',
      items: [],
      settings: {
        trust_pills: [
          { icon: 'shield', label: 'Visa sponsorship' },
          { icon: 'home', label: 'Accommodation available' },
          { icon: 'users', label: '4,200+ placed abroad' },
        ],
        search_hint: 'Job title, skill, or company',
        filter_hint: 'Filter by category, salary, and job type.',
      },
    },
    cta: {
      label: 'CTA',
      enabled: true,
      order: 2,
      badge_text: 'Next Step',
      heading: 'Ready to apply for a job abroad?',
      subheading: 'Create your profile, save your CV, and start applying to roles that fit your goals.',
      primary_btn_text: 'Browse All Jobs',
      primary_btn_url: '/work-abroad',
      secondary_btn_text: 'Create Profile',
      secondary_btn_url: '/contact',
      items: [],
      settings: {},
    },
  },
  events_page: {
    hero: {
      label: 'Hero',
      enabled: true,
      order: 1,
      badge_text: 'Events',
      heading: 'University fairs, webinars, visa talks, and pre-departure sessions.',
      subheading:
        'Stay close to the next opportunity to meet partner universities, understand visa steps, and prepare for your study abroad journey with confidence.',
      settings: {
        filters: [
          { key: 'all', label: 'All' },
          { key: 'upcoming', label: 'Upcoming' },
          { key: 'university_open_day', label: 'University Open Days' },
          { key: 'visa_talk', label: 'Visa Talks' },
          { key: 'pre_departure', label: 'Pre-Departure' },
          { key: 'webinar', label: 'Webinars' },
          { key: 'scholarship', label: 'Scholarships' },
        ],
      },
    },
    upcoming: {
      label: 'Upcoming',
      enabled: true,
      order: 2,
      badge_text: 'Upcoming',
      heading: 'Plan your next session with Brightpath.',
      subheading: 'Browse upcoming student events and reserve your place before registration closes.',
      settings: {
        empty_heading: 'No upcoming events for this filter yet.',
        empty_body: 'Switch filters or subscribe below to hear when new sessions open.',
      },
    },
    past: {
      label: 'Past',
      enabled: true,
      order: 3,
      badge_text: 'Past Events',
      heading: 'Past events and student meetups.',
      subheading: 'Catch up on previous briefings, destination spotlights, and scholarship-focused sessions.',
      settings: {
        empty_body: 'No past events to show for this filter yet.',
      },
    },
    newsletter: {
      label: 'Newsletter',
      enabled: true,
      order: 4,
      badge_text: 'Stay Updated',
      heading: 'Get notified when the next Brightpath event opens.',
      subheading: 'Receive updates about university visits, webinars, and deadlines that matter to your journey.',
      primary_btn_text: 'Subscribe',
      settings: {
        placeholder: 'Enter your email',
        success_message: 'Thanks. We will notify you about upcoming Brightpath events.',
        empty_message: 'Please enter your email address.',
      },
    },
  },
  community: {
    hero: {
      label: 'Hero',
      enabled: true,
      order: 1,
      badge_text: 'Community',
      heading: 'A student community for questions, wins, and real replies.',
      subheading:
        'Ask questions, share updates, and get responses from the Brightpath team and other signed-in students in one friendly place.',
      primary_btn_text: 'Join the Discussion',
      primary_btn_url: '#community-board',
      secondary_btn_text: 'Browse Events',
      secondary_btn_url: '/events',
      media_url: '',
      media_secondary_url: '',
      items: [],
      settings: {
        stats: [
          { value: 24, suffix: '+', label: 'Live Replies' },
          { value: 6, suffix: '+', label: 'Discussion Paths' },
          { value: 1, suffix: '', label: 'Supportive Space' },
        ],
      },
    },
    gallery: {
      label: 'Gallery',
      enabled: true,
      order: 2,
      badge_text: 'Moments',
      heading: 'Moments from the student journey',
      subheading: 'A visual-style space for the milestones, wins, and transitions students care about most.',
      items: [
        {
          title: 'Offer Letter Wins',
          caption: 'Students celebrating university admits and next-step breakthroughs.',
          tone: 'gold',
          image_url: '',
          image_urls: [],
        },
        {
          title: 'Visa Approval Moments',
          caption: 'Big milestones from document-ready to visa success.',
          tone: 'navy',
          image_url: '',
          image_urls: [],
        },
        {
          title: 'Pre-Departure Sessions',
          caption: 'Briefings, checklists, and student Q&A before takeoff.',
          tone: 'sky',
          image_url: '',
          image_urls: [],
        },
        {
          title: 'Campus Arrival Stories',
          caption: 'First days in new cities, new classrooms, and new communities.',
          tone: 'emerald',
          image_url: '',
          image_urls: [],
        },
        {
          title: 'Graduation Highlights',
          caption: 'A look at the outcomes students work toward from day one.',
          tone: 'rose',
          image_url: '',
          image_urls: [],
        },
        {
          title: 'Scholarship Successes',
          caption: 'Merit, university, and leadership-based funding journeys.',
          tone: 'violet',
          image_url: '',
          image_urls: [],
        },
      ],
      settings: {},
    },
    board: {
      label: 'Board',
      enabled: true,
      order: 3,
      badge_text: 'Ask & Answer',
      heading: 'Ask a question, start a thread, or reply to another student.',
      subheading:
        'Signed-in students can create new questions below, and the Brightpath team can jump in with helpful replies when needed.',
      settings: {
        categories: [
          { key: 'general', label: 'General Questions' },
          { key: 'admissions', label: 'Admissions' },
          { key: 'visa', label: 'Visa & Travel' },
          { key: 'scholarship', label: 'Scholarships' },
          { key: 'destination', label: 'Destination Advice' },
          { key: 'accommodation', label: 'Accommodation' },
        ],
        empty_heading: 'No questions yet — start the first conversation.',
        empty_body: 'Be the first to ask a useful question for your journey or for the next student coming after you.',
        composer_title: 'Ask the community',
        composer_body:
          'Write a clear question so the team and other students can give useful answers. Keep it respectful and specific.',
      },
    },
    cta: {
      label: 'CTA',
      enabled: true,
      order: 4,
      badge_text: 'Keep Going',
      heading: 'Want more hands-on support?',
      subheading:
        'Use the community for quick questions, then book a consultation when you need a deeper one-on-one plan.',
      primary_btn_text: 'Book Consultation',
      primary_btn_url: '/contact',
      secondary_btn_text: 'See Events',
      secondary_btn_url: '/events',
      items: [],
      settings: {},
    },
  },
  contact: {
    hero: {
      label: 'Hero',
      enabled: true,
      order: 1,
      badge_text: 'Contact',
      heading: "Let's plan your study abroad path together.",
      subheading:
        'Reach out to the Brightpath team for destination guidance, consultation booking, university selection, and visa support.',
      settings: {},
    },
    info_cards: {
      label: 'Info Cards',
      enabled: true,
      order: 2,
        items: [
        { title: 'Visit Us', value: 'Jacksonville, GA 31544, USA', description: 'Meet our counsellors in person or online for a detailed planning session.' },
        { title: 'Call / WhatsApp', value: '+18149274526', description: 'WhatsApp Us', url: 'https://wa.me/18149274526' },
        { title: 'Email Us', value: 'info@brightpathtravelscholars.com', description: 'Send your questions and our team will respond with the best next steps.' },
      ],
      settings: {},
    },
    form: {
      label: 'Form',
      enabled: true,
      order: 3,
      badge_text: 'Send a Message',
      heading: 'Tell us what you need help with.',
      subheading: 'Share a few details and we will guide you toward the right destination, course, or next step.',
      settings: {
        subject_options: ['General Inquiry', 'Book Consultation', 'University Info', 'Visa Help', 'Other'],
        message_placeholder: 'Tell us about the destination, course, or support you need...',
        submit_text: 'Submit',
        success_message: 'Your message has been sent. We will get back to you shortly.',
        error_message: 'We could not send your message right now. Please try again in a moment.',
      },
    },
    sidebar: {
      label: 'Sidebar',
      enabled: true,
      order: 4,
      items: [],
      settings: {
      map_title: 'Jacksonville, GA Office',
      map_body: 'Jacksonville, GA 31544, USA',
        hours_title: 'Office Hours',
        hours: ['Mon-Fri: 8:30AM - 5:00PM', 'Sat: 8:30AM - 3:00PM', 'Sun: Closed'],
        socials_title: 'Connect With Brightpath',
        socials: [
          { label: 'Facebook', url: 'https://facebook.com' },
          { label: 'Instagram', url: 'https://instagram.com' },
          { label: 'Twitter', url: 'https://twitter.com' },
        ],
      },
    },
    cta: {
      label: 'CTA',
      enabled: true,
      order: 5,
      badge_text: 'Consultation',
      heading: 'Prefer a guided one-on-one conversation?',
      subheading:
        'Book a consultation and let us help you shortlist destinations, review requirements, and map the right timeline.',
      primary_btn_text: 'Start Application',
      primary_btn_url: '/apply',
      secondary_btn_text: 'WhatsApp Support',
      secondary_btn_url: 'https://wa.me/15551234567',
      items: [],
      settings: {},
    },
  },
  apply: {
    hero: {
      label: 'Hero',
      enabled: true,
      order: 1,
      badge_text: 'Apply',
      heading: 'Start your study abroad application with Brightpath.',
      subheading:
        'Complete the form below and our counsellors will review your academic background, destination preferences, and scholarship interests.',
      settings: {},
    },
    wizard: {
      label: 'Wizard',
      enabled: true,
      order: 2,
      items: [],
      settings: {
        step_labels: ['Personal Info', 'Academic Background', 'Study Preferences', 'Review & Submit'],
        destination_options: [
          'United Kingdom',
          'Australia',
          'Canada',
          'United States',
          'New Zealand',
          'Dubai',
          'Europe',
          'Malaysia',
          'Turkey',
          'China',
        ],
        intake_options: ['January 2025', 'May 2025', 'September 2025', 'January 2026', 'May 2026', 'September 2026'],
        course_types: ['Undergraduate', 'Postgraduate', 'Diploma', 'Foundation'],
        english_tests: ['IELTS', 'TOEFL', 'Duolingo', 'None'],
        scholarship_options: ['yes', 'no'],
      },
    },
    success: {
      label: 'Success',
      enabled: true,
      order: 3,
      heading: 'Application submitted successfully.',
      subheading: 'Our team will review your details and contact you with the next steps.',
      primary_btn_text: 'Start Another Application',
      items: [],
      settings: {},
    },
  },
  blog: {
    hero: {
      label: 'Hero',
      enabled: true,
      order: 1,
      badge_text: 'Blog',
      heading: 'Guides, scholarship tips, visa advice, and student stories.',
      subheading:
        'Explore practical insights from the Brightpath team to help you choose destinations, prepare your documents, and understand what comes next.',
      settings: {
        filters: ['All', 'Study Tips', 'Visa Guide', 'Destinations', 'Scholarships', 'Student Stories'],
      },
    },
    featured: {
      label: 'Featured',
      enabled: true,
      order: 2,
      heading: 'No posts available yet.',
      subheading: 'Check back soon for destination guidance, scholarship updates, and student stories.',
      settings: {
        loading_heading: 'Loading posts...',
        loading_body: 'We are pulling the latest articles from Brightpath.',
      },
    },
    grid: {
      label: 'Grid',
      enabled: true,
      order: 3,
      settings: {
        empty_body: 'No additional posts for this filter on the current page.',
      },
    },
  },
  login: {
    hero: {
      label: 'Hero',
      enabled: true,
      order: 1,
      badge_text: 'Welcome Back',
      heading: 'Brightpath Travel Scholars',
      subheading: "Your Gateway to the World's Best Universities",
      items: [
        { title: 'Track your application', description: 'See the latest status updates from our counsellors.' },
        { title: 'Manage your profile', description: 'Keep your contact details current for faster support.' },
        { title: 'Stay prepared', description: 'Review events, consultations, and your next action steps.' },
      ],
      settings: {},
    },
    form: {
      label: 'Form',
      enabled: true,
      order: 2,
      heading: 'Sign In',
      subheading: 'Use your Brightpath account to access your student dashboard.',
      primary_btn_text: 'Sign In',
      settings: {
        footer_text: 'New here?',
        footer_link_text: 'Create an account',
        footer_link_url: '/register',
        forgot_link_text: 'Forgot your password?',
      },
    },
  },
  register: {
    hero: {
      label: 'Hero',
      enabled: true,
      order: 1,
      badge_text: 'Start Here',
      heading: 'Brightpath Travel Scholars',
      subheading: "Your Gateway to the World's Best Universities",
      items: [
        { title: 'Personalised guidance', description: 'Build your profile once and let our counsellors support the rest.' },
        { title: 'Application tracking', description: 'See your destination, intake, and application status in one place.' },
        { title: 'Direct support', description: 'Connect with the Brightpath team for visas, scholarships, and events.' },
      ],
      settings: {},
    },
    form: {
      label: 'Form',
      enabled: true,
      order: 2,
      heading: 'Create Your Account',
      subheading: 'Set up your student account and we will help you take the next step.',
      primary_btn_text: 'Register',
      settings: {
        footer_text: 'Already have an account?',
        footer_link_text: 'Sign in',
        footer_link_url: '/login',
        success_message: 'Account created. Please check your email to confirm your registration before signing in.',
      },
    },
  },
  forgot_password: {
    hero: {
      label: 'Recovery',
      enabled: true,
      order: 1,
      badge_text: 'Account Recovery',
      heading: 'Reset Your Password',
      subheading: 'Enter your email address and we will send you a reset link.',
      primary_btn_text: 'Send Reset Link',
      settings: {
        footer_text: 'Remembered your password?',
        footer_link_text: 'Back to sign in',
        footer_link_url: '/login',
        success_message: 'Password reset instructions have been sent to your email address.',
      },
    },
  },
}

const PAGE_LABELS = {
  home: 'Home',
  about: 'About',
  study_abroad: 'Study Abroad',
  events_page: 'Events',
  community: 'Community',
  contact: 'Contact',
  apply: 'Apply',
  blog: 'Blog',
  login: 'Login',
  register: 'Register',
  forgot_password: 'Forgot Password',
}

function cloneValue(value) {
  return JSON.parse(JSON.stringify(value))
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

const BRAND_TEXT_REPLACEMENTS = [
  [/\bNexora Education\b/gi, 'Brightpath Travel Scholars'],
  [/\bAbout Nexora\b/gi, 'About Brightpath'],
  [/\bConnect With Nexora\b/gi, 'Connect With Brightpath'],
  [/\bNexora office location\b/gi, 'Brightpath office location'],
  [/\bnexoraeducation\.com\b/gi, 'brightpathtravelscholars.com'],
  [/\bnexoraeducation\b/gi, 'brightpathtravelscholars'],
  [/\bNexora\b/gi, 'Brightpath'],
]

function sanitizeBrandText(value) {
  if (typeof value !== 'string') return value

  return BRAND_TEXT_REPLACEMENTS.reduce((current, [pattern, replacement]) => current.replace(pattern, replacement), value)
}

function sanitizeBrandContent(value) {
  if (typeof value === 'string') return sanitizeBrandText(value)
  if (Array.isArray(value)) return value.map((item) => sanitizeBrandContent(item))
  if (!isPlainObject(value)) return value

  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [key, sanitizeBrandContent(entry)]),
  )
}

function normalizeItems(items, fallback) {
  return Array.isArray(items) ? cloneValue(items) : cloneValue(fallback ?? [])
}

function normalizeSettings(settings, fallback) {
  if (!isPlainObject(settings)) return cloneValue(fallback ?? {})
  return {
    ...(fallback ?? {}),
    ...cloneValue(settings),
  }
}

export function getPageOptions() {
  const excludedKeys = new Set(['login', 'register', 'forgot_password'])
  return Object.entries(PAGE_LABELS)
    .filter(([key]) => !excludedKeys.has(key))
    .map(([key, label]) => ({ key, label }))
}

export function getPageSectionDefaults(pageKey) {
  return cloneValue(PAGE_SECTION_DEFAULTS[pageKey] ?? {})
}

export function mergePageSections(pageKey, rows = []) {
  const defaults = getPageSectionDefaults(pageKey)
  const sanitizedRows = rows.map((row) => sanitizeBrandContent(row))

  sanitizedRows.forEach((row) => {
    const defaultSection = defaults[row.section_key] ?? {
      label: row.label || row.section_key,
      enabled: true,
      order: 0,
      items: [],
      settings: {},
    }

    defaults[row.section_key] = {
      ...defaultSection,
      label: row.label ?? defaultSection.label,
      heading: row.heading ?? defaultSection.heading,
      subheading: row.subheading ?? defaultSection.subheading,
      body_text: row.body_text ?? defaultSection.body_text,
      badge_text: row.badge_text ?? defaultSection.badge_text,
      primary_btn_text: row.primary_btn_text ?? defaultSection.primary_btn_text,
      primary_btn_url: row.primary_btn_url ?? defaultSection.primary_btn_url,
      secondary_btn_text: row.secondary_btn_text ?? defaultSection.secondary_btn_text,
      secondary_btn_url: row.secondary_btn_url ?? defaultSection.secondary_btn_url,
      media_url: row.media_url ?? defaultSection.media_url,
      media_secondary_url: row.media_secondary_url ?? defaultSection.media_secondary_url,
      enabled: row.enabled ?? defaultSection.enabled,
      order: row.order_index ?? defaultSection.order,
      items: normalizeItems(row.items_json, defaultSection.items),
      settings: normalizeSettings(row.settings_json, defaultSection.settings),
    }
  })

  return defaults
}

export function buildPageSectionRowsForAdmin(rows = []) {
  const rowsByKey = new Map(rows.map((row) => {
    const sanitizedRow = sanitizeBrandContent(row)
    return [`${sanitizedRow.page_key}:${sanitizedRow.section_key}`, sanitizedRow]
  }))
  const result = {}

  Object.keys(PAGE_SECTION_DEFAULTS).forEach((pageKey) => {
    const defaults = getPageSectionDefaults(pageKey)

    result[pageKey] = Object.entries(defaults).map(([sectionKey, section]) => {
      const existing = rowsByKey.get(`${pageKey}:${sectionKey}`)

      return {
        id: existing?.id ?? null,
        page_key: pageKey,
        section_key: sectionKey,
        label: existing?.label ?? section.label ?? sectionKey,
        heading: existing?.heading ?? section.heading ?? '',
        subheading: existing?.subheading ?? section.subheading ?? '',
        body_text: existing?.body_text ?? section.body_text ?? '',
        badge_text: existing?.badge_text ?? section.badge_text ?? '',
        primary_btn_text: existing?.primary_btn_text ?? section.primary_btn_text ?? '',
        primary_btn_url: existing?.primary_btn_url ?? section.primary_btn_url ?? '',
        secondary_btn_text: existing?.secondary_btn_text ?? section.secondary_btn_text ?? '',
        secondary_btn_url: existing?.secondary_btn_url ?? section.secondary_btn_url ?? '',
        media_url: existing?.media_url ?? section.media_url ?? '',
        media_secondary_url: existing?.media_secondary_url ?? section.media_secondary_url ?? '',
        enabled: existing?.enabled ?? section.enabled ?? true,
        order_index: existing?.order_index ?? section.order ?? 0,
        items_json: normalizeItems(existing?.items_json, section.items),
        settings_json: normalizeSettings(existing?.settings_json, section.settings),
      }
    })
  })

  return result
}

export function serializePageSectionRow(row) {
  const sanitizedRow = sanitizeBrandContent(row)

  return {
    id: sanitizedRow.id || undefined,
    page_key: sanitizedRow.page_key,
    section_key: sanitizedRow.section_key,
    label: sanitizedRow.label?.trim() || sanitizedRow.section_key,
    heading: sanitizedRow.heading?.trim() || '',
    subheading: sanitizedRow.subheading?.trim() || '',
    body_text: sanitizedRow.body_text?.trim() || '',
    badge_text: sanitizedRow.badge_text?.trim() || '',
    primary_btn_text: sanitizedRow.primary_btn_text?.trim() || '',
    primary_btn_url: sanitizedRow.primary_btn_url?.trim() || '',
    secondary_btn_text: sanitizedRow.secondary_btn_text?.trim() || '',
    secondary_btn_url: sanitizedRow.secondary_btn_url?.trim() || '',
    media_url: sanitizedRow.media_url?.trim() || '',
    media_secondary_url: sanitizedRow.media_secondary_url?.trim() || '',
    enabled: sanitizedRow.enabled !== false,
    order_index: Number(sanitizedRow.order_index) || 0,
    items_json: Array.isArray(sanitizedRow.items_json) ? sanitizedRow.items_json : [],
    settings_json: isPlainObject(sanitizedRow.settings_json) ? sanitizedRow.settings_json : {},
    updated_at: new Date().toISOString(),
  }
}

export { PAGE_LABELS, PAGE_SECTION_DEFAULTS }
