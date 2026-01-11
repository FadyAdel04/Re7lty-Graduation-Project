import { Company, Trip } from '@/types/corporateTrips';

// Companies Data
export const companies: Company[] = [
    {
        id: 'safari-travel',
        name: 'سفاري ترافيل',
        logo: 'https://images.unsplash.com/photo-1545199616-5e589098ac4c?auto=format&fit=crop&q=80&w=200',
        rating: 4.8,
        description: 'متخصصون في رحلات السفاري والمغامرات الصحراوية في جميع أنحاء المملكة.',
        contactInfo: {
            phone: '+966 50 123 4567',
            whatsapp: '+966 50 123 4567',
            email: 'info@safaritravel.sa',
            website: 'https://safaritravel.sa',
            address: 'الرياض، المملكة العربية السعودية'
        },
        tags: ['سفاري', 'مغامرات', 'تخييم'],
        color: 'from-orange-400 to-red-500',
        tripsCount: 5
    },
    {
        id: 'blue-wave',
        name: 'بلو ويف للسياحة',
        logo: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?auto=format&fit=crop&q=80&w=200',
        rating: 4.9,
        description: 'رحلات بحرية فاخرة، غوص، وأنشطة مائية في البحر الأحمر.',
        contactInfo: {
            phone: '+966 50 234 5678',
            whatsapp: '+966 50 234 5678',
            email: 'contact@bluewave.sa',
            website: 'https://bluewave.sa',
            address: 'جدة، المملكة العربية السعودية'
        },
        tags: ['بحرية', 'غوص', 'يخوت'],
        color: 'from-blue-400 to-cyan-500',
        tripsCount: 4
    },
    {
        id: 'mountain-peaks',
        name: 'قمم الجبال',
        logo: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=200',
        rating: 4.7,
        description: 'نأخذك إلى أعلى القمم، رحلات هايكنج وتسلق للمحترفين والمبتدئين.',
        contactInfo: {
            phone: '+966 50 345 6789',
            whatsapp: '+966 50 345 6789',
            email: 'info@mountainpeaks.sa',
            website: 'https://mountainpeaks.sa',
            address: 'أبها، المملكة العربية السعودية'
        },
        tags: ['هايكنج', 'تسلق', 'طبيعة'],
        color: 'from-green-400 to-emerald-600',
        tripsCount: 4
    },
    {
        id: 'heritage-tours',
        name: 'التراث العريق',
        logo: 'https://images.unsplash.com/photo-1588661783303-6251b54c8675?auto=format&fit=crop&q=80&w=200',
        rating: 4.6,
        description: 'جولات ثقافية وتاريخية لاستكشاف المعالم الأثرية والأسواق القديمة.',
        contactInfo: {
            phone: '+966 50 456 7890',
            whatsapp: '+966 50 456 7890',
            email: 'tours@heritage.sa',
            address: 'الرياض، المملكة العربية السعودية'
        },
        tags: ['تراث', 'ثقافة', 'تاريخ'],
        color: 'from-amber-400 to-yellow-600',
        tripsCount: 3
    },
    {
        id: 'sky-tours',
        name: 'سكاي تورز',
        logo: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&q=80&w=200',
        rating: 4.5,
        description: 'حجوزات طيران وفنادق ورحلات VIP لرجال الأعمال والعائلات.',
        contactInfo: {
            phone: '+966 50 567 8901',
            whatsapp: '+966 50 567 8901',
            email: 'vip@skytours.sa',
            website: 'https://skytours.sa',
            address: 'جدة، المملكة العربية السعودية'
        },
        tags: ['VIP', 'فنادق', 'طيران'],
        color: 'from-purple-400 to-indigo-600',
        tripsCount: 2
    },
    {
        id: 'elite-trips',
        name: 'رحلات النخبة',
        logo: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&q=80&w=200',
        rating: 4.9,
        description: 'تنظيم رحلات جماعية للشركات والمؤسسات ببرامج مخصصة.',
        contactInfo: {
            phone: '+966 50 678 9012',
            whatsapp: '+966 50 678 9012',
            email: 'elite@elitetrips.sa',
            website: 'https://elitetrips.sa',
            address: 'الرياض، المملكة العربية السعودية'
        },
        tags: ['شركات', 'مجموعات', 'فعاليات'],
        color: 'from-slate-400 to-gray-600',
        tripsCount: 2
    }
];

// Trips Data
export const trips: Trip[] = [
    // Safari Travel Trips
    {
        id: 'desert-stars-camp-vip',
        title: 'مخيم النجوم الصحراوي VIP',
        destination: 'العلا',
        duration: '3 أيام',
        price: '2500',
        rating: 4.9,
        images: [
            'https://images.unsplash.com/photo-1545199616-5e589098ac4c?auto=format&fit=crop&q=80&w=1000',
            'https://images.unsplash.com/photo-1509316785289-025f5b846b35?auto=format&fit=crop&q=80&w=1000',
            'https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?auto=format&fit=crop&q=80&w=1000'
        ],
        shortDescription: 'تجربة تخييم فاخرة تحت النجوم في صحراء العلا مع أنشطة مغامرات متنوعة',
        fullDescription: 'استمتع بتجربة تخييم استثنائية في قلب صحراء العلا الساحرة. يشمل البرنامج إقامة في خيام VIP مجهزة بالكامل، وجبات تقليدية فاخرة، جولات سفاري مثيرة، ومشاهدة النجوم مع خبراء الفلك.',
        itinerary: [
            {
                day: 1,
                title: 'الوصول والاستقبال',
                description: 'الوصول إلى المخيم والاستقبال الترحيبي',
                activities: ['الوصول إلى المخيم', 'تسجيل الدخول في الخيام VIP', 'جولة تعريفية بالمخيم', 'عشاء ترحيبي تقليدي', 'جلسة قهوة عربية حول النار']
            },
            {
                day: 2,
                title: 'يوم المغامرات',
                description: 'يوم حافل بالأنشطة والمغامرات الصحراوية',
                activities: ['إفطار صحراوي', 'جولة سفاري بسيارات الدفع الرباعي', 'ركوب الجمال', 'غداء في الصحراء', 'التزلج على الرمال', 'مشاهدة غروب الشمس', 'عشاء فاخر', 'جلسة مشاهدة النجوم مع خبير فلك']
            },
            {
                day: 3,
                title: 'الختام والمغادرة',
                description: 'صباح هادئ وجولة ختامية',
                activities: ['إفطار مع إطلالة الشروق', 'جولة في المعالم القريبة', 'تسوق الهدايا التذكارية', 'الغداء الختامي', 'المغادرة']
            }
        ],
        includedServices: [
            'إقامة 3 أيام في خيام VIP مكيفة',
            'جميع الوجبات (3 إفطار، 3 غداء، 3 عشاء)',
            'جولات السفاري بسيارات حديثة',
            'مرشد سياحي متخصص',
            'جميع الأنشطة المذكورة',
            'جلسة مشاهدة النجوم مع خبير',
            'تأمين شامل'
        ],
        excludedServices: [
            'تذاكر الطيران',
            'المشتريات الشخصية',
            'الأنشطة الإضافية غير المذكورة',
            'الإكراميات'
        ],
        meetingLocation: 'مطار العلا الدولي - صالة الوصول',
        bookingMethod: {
            whatsapp: true,
            phone: true,
            website: true
        },
        companyId: 'safari-travel',
        likes: 342,
        maxGroupSize: 20,
        difficulty: 'متوسط'
    },
    {
        id: 'empty-quarter-adventure',
        title: 'مغامرة الربع الخالي',
        destination: 'الربع الخالي',
        duration: '5 أيام',
        price: '3500',
        rating: 4.8,
        images: [
            'https://images.unsplash.com/photo-1509316785289-025f5b846b35?auto=format&fit=crop&q=80&w=1000',
            'https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?auto=format&fit=crop&q=80&w=1000'
        ],
        shortDescription: 'رحلة استكشافية في أكبر صحراء رملية متصلة في العالم',
        fullDescription: 'انطلق في مغامرة لا تُنسى في قلب الربع الخالي، أكبر صحراء رملية متصلة في العالم. تجربة فريدة للمغامرين الباحثين عن التحدي والجمال الطبيعي الخلاب.',
        itinerary: [
            {
                day: 1,
                title: 'بداية المغامرة',
                description: 'الانطلاق نحو الصحراء',
                activities: ['التجمع في نقطة الانطلاق', 'رحلة برية إلى الصحراء', 'إعداد المخيم', 'عشاء تقليدي']
            },
            {
                day: 2,
                title: 'استكشاف الكثبان',
                description: 'يوم كامل من الاستكشاف',
                activities: ['رحلة سفاري صباحية', 'تسلق الكثبان الرملية', 'التصوير الفوتوغرافي', 'غداء في الصحراء', 'جلسة غروب الشمس']
            },
            {
                day: 3,
                title: 'الحياة البرية',
                description: 'اكتشاف الحياة الصحراوية',
                activities: ['مراقبة الحياة البرية', 'تتبع آثار الحيوانات', 'ورشة البقاء في الصحراء', 'ليلة تحت النجوم']
            },
            {
                day: 4,
                title: 'التراث الصحراوي',
                description: 'التعرف على الثقافة المحلية',
                activities: ['زيارة موقع أثري', 'تعلم مهارات البدو', 'إعداد القهوة العربية', 'أمسية تراثية']
            },
            {
                day: 5,
                title: 'العودة',
                description: 'ختام الرحلة',
                activities: ['إفطار الوداع', 'جولة أخيرة', 'العودة إلى نقطة الانطلاق']
            }
        ],
        includedServices: [
            'النقل من وإلى نقطة الانطلاق',
            'إقامة في مخيم صحراوي',
            'جميع الوجبات',
            'مرشد خبير',
            'معدات التخييم',
            'تأمين شامل'
        ],
        excludedServices: [
            'المعدات الشخصية',
            'المشتريات الشخصية',
            'الإكراميات'
        ],
        meetingLocation: 'الرياض - موقع يحدد لاحقاً',
        bookingMethod: {
            whatsapp: true,
            phone: true,
            website: true
        },
        companyId: 'safari-travel',
        likes: 189,
        maxGroupSize: 15,
        difficulty: 'صعب'
    },
    {
        id: 'najd-desert-safari',
        title: 'سفاري نجد الكلاسيكي',
        destination: 'صحراء نجد',
        duration: 'يوم كامل',
        price: '450',
        rating: 4.7,
        images: [
            'https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?auto=format&fit=crop&q=80&w=1000'
        ],
        shortDescription: 'رحلة يومية مثيرة في صحراء نجد مع أنشطة متنوعة',
        fullDescription: 'استمتع بيوم كامل من المغامرات في صحراء نجد الساحرة. رحلة مثالية للعائلات والأصدقاء الباحثين عن تجربة صحراوية أصيلة.',
        itinerary: [
            {
                day: 1,
                title: 'يوم المغامرة',
                description: 'يوم كامل من الأنشطة الصحراوية',
                activities: [
                    'الانطلاق صباحاً من الرياض',
                    'جولة سفاري بسيارات الدفع الرباعي',
                    'التزلج على الرمال',
                    'ركوب الجمال',
                    'غداء تقليدي في الصحراء',
                    'جلسة قهوة عربية',
                    'العودة مساءً'
                ]
            }
        ],
        includedServices: [
            'النقل من وإلى الرياض',
            'جولة سفاري',
            'وجبة غداء',
            'جميع الأنشطة',
            'مرشد سياحي',
            'تأمين'
        ],
        excludedServices: [
            'المشتريات الشخصية',
            'الإكراميات'
        ],
        meetingLocation: 'الرياض - نقطة تجمع مركزية',
        bookingMethod: {
            whatsapp: true,
            phone: true,
            website: true
        },
        companyId: 'safari-travel',
        likes: 267,
        maxGroupSize: 30,
        difficulty: 'سهل'
    },

    // Blue Wave Trips
    {
        id: 'red-sea-luxury-yacht',
        title: 'رحلة اليخت الفاخر - البحر الأحمر',
        destination: 'جدة',
        duration: 'يوم كامل',
        price: '1800',
        rating: 4.8,
        images: [
            'https://images.unsplash.com/photo-1569263979104-865ab7cd8d13?auto=format&fit=crop&q=80&w=1000',
            'https://images.unsplash.com/photo-1559827260-dc66d52bef19?auto=format&fit=crop&q=80&w=1000'
        ],
        shortDescription: 'تجربة يخت فاخرة في مياه البحر الأحمر الزرقاء الصافية',
        fullDescription: 'استمتع بيوم لا يُنسى على متن يخت فاخر في البحر الأحمر. تجربة مثالية للعائلات والمجموعات الباحثة عن الاسترخاء والمتعة.',
        itinerary: [
            {
                day: 1,
                title: 'يوم بحري فاخر',
                description: 'رحلة يخت كاملة',
                activities: [
                    'الصعود على اليخت صباحاً',
                    'إبحار في البحر الأحمر',
                    'السباحة والغطس',
                    'وجبة غداء فاخرة على متن اليخت',
                    'الاسترخاء والتشمس',
                    'صيد الأسماك (اختياري)',
                    'العودة مساءً'
                ]
            }
        ],
        includedServices: [
            'استئجار يخت فاخر ليوم كامل',
            'طاقم محترف',
            'وجبة غداء فاخرة',
            'مشروبات ومرطبات',
            'معدات الغطس',
            'تأمين شامل'
        ],
        excludedServices: [
            'النقل من وإلى الميناء',
            'معدات الصيد الاحترافية',
            'الإكراميات'
        ],
        meetingLocation: 'ميناء جدة - رصيف اليخوت',
        bookingMethod: {
            whatsapp: true,
            phone: true,
            website: true
        },
        companyId: 'blue-wave',
        likes: 215,
        maxGroupSize: 12,
        difficulty: 'سهل'
    },
    {
        id: 'diving-adventure-farasan',
        title: 'مغامرة الغوص في جزر فرسان',
        destination: 'جزر فرسان',
        duration: '3 أيام',
        price: '2200',
        rating: 4.9,
        images: [
            'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&q=80&w=1000',
            'https://images.unsplash.com/photo-1559827260-dc66d52bef19?auto=format&fit=crop&q=80&w=1000'
        ],
        shortDescription: 'رحلة غوص احترافية في أجمل الشعاب المرجانية بالبحر الأحمر',
        fullDescription: 'اكتشف عالم البحر الأحمر الساحر في جزر فرسان. رحلة مثالية لعشاق الغوص والطبيعة البحرية.',
        itinerary: [
            {
                day: 1,
                title: 'الوصول والتجهيز',
                description: 'الوصول إلى جزر فرسان',
                activities: ['الوصول إلى جيزان', 'العبور إلى جزر فرسان', 'تسجيل الدخول في الفندق', 'جلسة تعريفية عن الغوص', 'عشاء بحري']
            },
            {
                day: 2,
                title: 'يوم الغوص الأول',
                description: 'استكشاف الشعاب المرجانية',
                activities: ['إفطار', 'رحلة غوص صباحية (غطستان)', 'غداء على الشاطئ', 'رحلة غوص مسائية', 'عشاء']
            },
            {
                day: 3,
                title: 'الغوص والعودة',
                description: 'آخر غطسة وختام الرحلة',
                activities: ['إفطار', 'غطسة ختامية', 'جولة في الجزيرة', 'غداء', 'العودة إلى جيزان']
            }
        ],
        includedServices: [
            'النقل من وإلى جيزان',
            'إقامة ليلتين',
            'جميع الوجبات',
            '6 غطسات غوص',
            'معدات الغوص الكاملة',
            'مدرب غوص محترف',
            'تأمين'
        ],
        excludedServices: [
            'تذاكر الطيران إلى جيزان',
            'شهادة الغوص (يجب إحضارها)',
            'المشتريات الشخصية'
        ],
        meetingLocation: 'مطار جيزان - صالة الوصول',
        bookingMethod: {
            whatsapp: true,
            phone: true,
            website: true
        },
        companyId: 'blue-wave',
        likes: 178,
        maxGroupSize: 10,
        difficulty: 'متوسط'
    },

    // Mountain Peaks Trips
    {
        id: 'asir-peaks-hiking',
        title: 'قمم السودة - هايكنج المترفين',
        destination: 'أبها',
        duration: 'يومين',
        price: '950',
        rating: 4.9,
        images: [
            'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=1000',
            'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&q=80&w=1000'
        ],
        shortDescription: 'رحلة هايكنج في أعلى قمة في المملكة مع إطلالات خلابة',
        fullDescription: 'استمتع برحلة هايكنج استثنائية في جبال السودة، أعلى قمة في المملكة. تجربة مثالية لعشاق الطبيعة والمغامرات الجبلية.',
        itinerary: [
            {
                day: 1,
                title: 'الصعود إلى القمة',
                description: 'بداية رحلة الهايكنج',
                activities: ['التجمع في أبها', 'الانطلاق إلى جبل السودة', 'بدء رحلة الهايكنج', 'غداء في الطبيعة', 'الوصول إلى المخيم', 'عشاء جبلي']
            },
            {
                day: 2,
                title: 'القمة والعودة',
                description: 'الوصول إلى القمة',
                activities: ['إفطار مع شروق الشمس', 'الوصول إلى القمة', 'جلسة تصوير', 'النزول', 'غداء', 'العودة إلى أبها']
            }
        ],
        includedServices: [
            'النقل من وإلى أبها',
            'مرشد جبلي محترف',
            'جميع الوجبات',
            'معدات التخييم',
            'معدات السلامة',
            'تأمين'
        ],
        excludedServices: [
            'معدات الهايكنج الشخصية',
            'المشتريات الشخصية'
        ],
        meetingLocation: 'أبها - فندق قصر أبها',
        bookingMethod: {
            whatsapp: true,
            phone: true,
            website: true
        },
        companyId: 'mountain-peaks',
        likes: 189,
        maxGroupSize: 15,
        difficulty: 'متوسط'
    },
    {
        id: 'taif-rose-trail',
        title: 'درب الورد في الطائف',
        destination: 'الطائف',
        duration: 'يوم كامل',
        price: '550',
        rating: 4.6,
        images: [
            'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&q=80&w=1000'
        ],
        shortDescription: 'رحلة هايكنج في مزارع الورد الطائفي الشهير',
        fullDescription: 'استكشف جمال الطائف من خلال رحلة هايكنج في مزارع الورد الشهيرة. تجربة فريدة تجمع بين الطبيعة والتراث.',
        itinerary: [
            {
                day: 1,
                title: 'يوم الورد',
                description: 'رحلة كاملة في مزارع الورد',
                activities: [
                    'الانطلاق من الطائف',
                    'هايكنج في مزارع الورد',
                    'زيارة مصنع ماء الورد',
                    'غداء تقليدي',
                    'جولة في السوق القديم',
                    'العودة'
                ]
            }
        ],
        includedServices: [
            'النقل',
            'مرشد سياحي',
            'وجبة غداء',
            'زيارة المصنع',
            'هدية من ماء الورد'
        ],
        excludedServices: [
            'المشتريات الشخصية'
        ],
        meetingLocation: 'الطائف - ميدان الملك فيصل',
        bookingMethod: {
            whatsapp: true,
            phone: true,
            website: false
        },
        companyId: 'mountain-peaks',
        likes: 145,
        maxGroupSize: 25,
        difficulty: 'سهل'
    },

    // Heritage Tours Trips
    {
        id: 'diriyah-historical-tour',
        title: 'جولة الدرعية التاريخية',
        destination: 'الرياض',
        duration: '5 ساعات',
        price: '350',
        rating: 4.7,
        images: [
            'https://images.unsplash.com/photo-1588661783303-6251b54c8675?auto=format&fit=crop&q=80&w=1000'
        ],
        shortDescription: 'استكشف التاريخ العريق للمملكة في حي الطريف التاريخي',
        fullDescription: 'انطلق في رحلة عبر الزمن في الدرعية التاريخية، مهد الدولة السعودية الأولى. جولة ثقافية غنية بالمعلومات والتاريخ.',
        itinerary: [
            {
                day: 1,
                title: 'جولة تاريخية',
                description: 'استكشاف الدرعية',
                activities: [
                    'التجمع في الدرعية',
                    'جولة في حي الطريف',
                    'زيارة المتحف',
                    'غداء في مطعم تراثي',
                    'جولة في السوق القديم',
                    'العودة'
                ]
            }
        ],
        includedServices: [
            'مرشد تاريخي متخصص',
            'تذاكر الدخول',
            'وجبة غداء تراثية',
            'النقل (اختياري)'
        ],
        excludedServices: [
            'المشتريات الشخصية',
            'الهدايا التذكارية'
        ],
        meetingLocation: 'الدرعية - بوابة الدرعية',
        bookingMethod: {
            whatsapp: true,
            phone: true,
            website: false
        },
        companyId: 'heritage-tours',
        likes: 450,
        maxGroupSize: 30,
        difficulty: 'سهل'
    },
    {
        id: 'jeddah-old-town',
        title: 'جدة البلد - التراث الحجازي',
        destination: 'جدة',
        duration: '4 ساعات',
        price: '300',
        rating: 4.8,
        images: [
            'https://images.unsplash.com/photo-1591604466107-ec97de577aff?auto=format&fit=crop&q=80&w=1000'
        ],
        shortDescription: 'جولة في جدة التاريخية وأسواقها العريقة',
        fullDescription: 'اكتشف سحر جدة القديمة وتراثها الحجازي الأصيل. جولة في الأزقة التاريخية والأسواق التقليدية.',
        itinerary: [
            {
                day: 1,
                title: 'جدة التاريخية',
                description: 'جولة في البلد',
                activities: [
                    'التجمع في جدة البلد',
                    'جولة في البيوت التراثية',
                    'زيارة المساجد التاريخية',
                    'غداء حجازي تقليدي',
                    'جولة في الأسواق',
                    'العودة'
                ]
            }
        ],
        includedServices: [
            'مرشد محلي',
            'وجبة غداء',
            'تذاكر الدخول'
        ],
        excludedServices: [
            'النقل',
            'المشتريات'
        ],
        meetingLocation: 'جدة البلد - بيت نصيف',
        bookingMethod: {
            whatsapp: true,
            phone: true,
            website: false
        },
        companyId: 'heritage-tours',
        likes: 389,
        maxGroupSize: 25,
        difficulty: 'سهل'
    },

    // Sky Tours Trips
    {
        id: 'luxury-dubai-package',
        title: 'باقة دبي الفاخرة',
        destination: 'دبي',
        duration: '4 أيام',
        price: '4500',
        rating: 4.9,
        images: [
            'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&q=80&w=1000'
        ],
        shortDescription: 'إقامة فاخرة في دبي مع جولات VIP',
        fullDescription: 'استمتع بتجربة فاخرة في دبي تشمل إقامة في فندق 5 نجوم، جولات VIP، وتجارب استثنائية.',
        itinerary: [
            {
                day: 1,
                title: 'الوصول والاستقبال',
                description: 'الوصول إلى دبي',
                activities: ['استقبال VIP في المطار', 'تسجيل الدخول في الفندق', 'عشاء في برج خليفة']
            },
            {
                day: 2,
                title: 'جولة المدينة',
                description: 'استكشاف دبي',
                activities: ['جولة في دبي مول', 'زيارة برج خليفة', 'غداء فاخر', 'جولة بحرية']
            },
            {
                day: 3,
                title: 'الصحراء والتسوق',
                description: 'يوم متنوع',
                activities: ['سفاري صحراوي', 'تسوق في الأسواق', 'عشاء صحراوي']
            },
            {
                day: 4,
                title: 'المغادرة',
                description: 'ختام الرحلة',
                activities: ['إفطار في الفندق', 'وقت حر', 'التوصيل إلى المطار']
            }
        ],
        includedServices: [
            'تذاكر طيران',
            'إقامة 4 نجوم في فندق 5 نجوم',
            'جميع الوجبات',
            'جميع الجولات',
            'مرشد خاص',
            'تأمين شامل'
        ],
        excludedServices: [
            'التأشيرة',
            'المشتريات الشخصية'
        ],
        meetingLocation: 'مطار الملك عبدالعزيز - جدة',
        bookingMethod: {
            whatsapp: true,
            phone: true,
            website: true
        },
        companyId: 'sky-tours',
        likes: 567,
        maxGroupSize: 8,
        difficulty: 'سهل'
    },

    // Elite Trips
    {
        id: 'corporate-team-building',
        title: 'برنامج بناء الفريق للشركات',
        destination: 'أبها',
        duration: '3 أيام',
        price: '1500',
        rating: 4.8,
        images: [
            'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&q=80&w=1000'
        ],
        shortDescription: 'برنامج متكامل لبناء الفريق وتعزيز التواصل بين الموظفين',
        fullDescription: 'برنامج احترافي مصمم خصيصاً للشركات لتعزيز روح الفريق والتواصل بين الموظفين من خلال أنشطة متنوعة ومدروسة.',
        itinerary: [
            {
                day: 1,
                title: 'الوصول والتعارف',
                description: 'بداية البرنامج',
                activities: ['الوصول والاستقبال', 'جلسة تعارف', 'أنشطة كسر الجليد', 'عشاء جماعي']
            },
            {
                day: 2,
                title: 'أنشطة بناء الفريق',
                description: 'يوم الأنشطة',
                activities: ['ورش عمل', 'تحديات جماعية', 'أنشطة خارجية', 'جلسة تقييم']
            },
            {
                day: 3,
                title: 'الختام',
                description: 'ختام البرنامج',
                activities: ['جلسة ختامية', 'تكريم', 'المغادرة']
            }
        ],
        includedServices: [
            'إقامة 3 أيام',
            'جميع الوجبات',
            'جميع الأنشطة',
            'مدربين محترفين',
            'قاعات اجتماعات',
            'مواد تدريبية'
        ],
        excludedServices: [
            'النقل من وإلى المدينة'
        ],
        meetingLocation: 'أبها - فندق يحدد لاحقاً',
        bookingMethod: {
            whatsapp: true,
            phone: true,
            website: true
        },
        companyId: 'elite-trips',
        likes: 234,
        maxGroupSize: 50,
        difficulty: 'سهل'
    }
];
