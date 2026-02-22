import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export const exportTripDetailsToPDF = async (trip: any) => {
    const container = document.createElement("div");
    container.style.position = "fixed";
    container.style.left = "-9999px";
    container.style.top = "0";
    container.style.width = "1200px";
    container.style.background = "#f8fafc";
    container.style.fontFamily = "'Cairo', 'Tajawal', sans-serif";
    container.style.direction = "rtl";
    container.style.padding = "40px";

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return "غير محدد";
        return new Date(dateStr).toLocaleDateString("ar-EG", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    const formatTime = (dateStr?: string) => {
        if (!dateStr) return "";
        return new Date(dateStr).toLocaleTimeString("ar-EG", {
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const getTransportationLabel = (type: string) => {
        const types: Record<string, string> = {
            "bus-48": "حافلة 48 راكب",
            "minibus-28": "ميني باص 28 راكب",
            "van-14": "ميكروباص 14 راكب",
        };
        return types[type] || type;
    };

    /* ---------------- BUS LAYOUT ---------------- */
    const generateBusLayoutHTML = (
        unitType: string,
        busIndex: number,
        seatBookings: any[],
        busLabel: string
    ) => {
        const capacity =
            unitType === "bus-48"
                ? 48
                : unitType === "minibus-28"
                ? 28
                : unitType === "van-14"
                ? 14
                : 48;

        const busSeats = [];
        for (let i = 1; i <= capacity; i++) {
            const booking = seatBookings.find(
                (sb: any) =>
                    sb.seatNumber === String(i) &&
                    (sb.busIndex || 0) === busIndex
            );
            busSeats.push({
                num: i,
                name: booking ? booking.passengerName : null,
            });
        }

        // Group seats in rows of 4 for better layout
        const rows = [];
        for (let i = 0; i < busSeats.length; i += 4) {
            rows.push(busSeats.slice(i, i + 4));
        }

        return `
        <div class="bus-layout-page" style="
            background: white;
            border-radius: 32px;
            padding: 40px;
            margin-bottom: 40px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.08);
            page-break-after: always;
        ">
            <!-- Bus Header -->
            <div style="
                display: flex;
                align-items: center;
                gap: 20px;
                margin-bottom: 40px;
                padding-bottom: 20px;
                border-bottom: 3px solid #4f46e5;
            ">
                <div style="
                    width: 60px;
                    height: 60px;
                    background: #4f46e5;
                    border-radius: 20px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-size: 24px;
                ">
                    🚌
                </div>
                <div>
                    <h2 style="
                        font-size: 28px;
                        font-weight: 900;
                        color: #1e1b4b;
                        margin: 0 0 5px 0;
                    ">
                        ${busLabel}
                    </h2>
                    <p style="
                        color: #64748b;
                        font-size: 16px;
                        margin: 0;
                    ">
                        السعة الإجمالية: ${capacity} مقعد | الحجوزات: ${busSeats.filter(s => s.name).length}
                    </p>
                </div>
            </div>

            <!-- Seats Grid -->
            <div style="
                display: flex;
                flex-direction: column;
                gap: 12px;
            ">
                ${rows.map(row => `
                    <div style="
                        display: grid;
                        grid-template-columns: repeat(4, 1fr);
                        gap: 12px;
                    ">
                        ${row.map(seat => `
                            <div style="
                                background: ${seat.name ? '#e0e7ff' : 'white'};
                                border: 2px solid ${seat.name ? '#4f46e5' : '#e2e8f0'};
                                border-radius: 16px;
                                padding: 16px 12px;
                                display: flex;
                                flex-direction: column;
                                align-items: center;
                                justify-content: center;
                                text-align: center;
                                min-height: 100px;
                                box-shadow: ${seat.name ? '0 4px 12px rgba(79, 70, 229, 0.2)' : 'none'};
                                transition: all 0.3s ease;
                            ">
                                <span style="
                                    font-size: 14px;
                                    font-weight: 900;
                                    color: ${seat.name ? '#4f46e5' : '#94a3b8'};
                                    margin-bottom: 8px;
                                    background: ${seat.name ? '#ffffff' : '#f1f5f9'};
                                    padding: 4px 12px;
                                    border-radius: 20px;
                                ">
                                    مقعد ${seat.num}
                                </span>

                                ${seat.name ? `
                                    <span style="
                                        font-size: 15px;
                                        font-weight: 900;
                                        color: #1e1b4b;
                                        line-height: 1.4;
                                        word-break: break-word;
                                    ">
                                        ${seat.name}
                                    </span>
                                ` : `
                                    <span style="
                                        font-size: 14px;
                                        color: #94a3b8;
                                        font-weight: 600;
                                    ">
                                        شاغر
                                    </span>
                                `}
                            </div>
                        `).join('')}
                    </div>
                `).join('')}
            </div>

            <!-- Legend -->
            <div style="
                margin-top: 30px;
                padding-top: 20px;
                border-top: 2px dashed #e2e8f0;
                display: flex;
                gap: 30px;
                justify-content: center;
            ">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div style="width: 20px; height: 20px; background: #e0e7ff; border: 2px solid #4f46e5; border-radius: 6px;"></div>
                    <span style="color: #475569; font-weight: 600;">محجوز</span>
                </div>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div style="width: 20px; height: 20px; background: white; border: 2px solid #e2e8f0; border-radius: 6px;"></div>
                    <span style="color: #475569; font-weight: 600;">متاح</span>
                </div>
            </div>
        </div>
        `;
    };

    /* ---------------- STATS CARDS ---------------- */
    const totalBooked = trip.seatBookings?.length || 0;
    const acceptedBookings = trip.seatBookings?.filter((b: any) => b.status === 'accepted').length || 0;
    const availableSeats = trip.transportations?.reduce((acc: number, t: any) => 
        acc + (t.capacity * (t.count || 1)), 0) - totalBooked || 0;

    /* ---------------- MAIN CONTENT ---------------- */
    const transportationList =
        trip.transportations?.length > 0
            ? trip.transportations
            : [{ type: trip.transportationType || "bus-48", count: 1 }];

    let busLayoutsHTML = "";
    let busCounter = 0;

    transportationList.forEach((unit: any) => {
        const count = unit.count || 1;
        for (let i = 0; i < count; i++) {
            const busLabel = unit.count > 1 
                ? `${getTransportationLabel(unit.type)} ${i + 1}`
                : getTransportationLabel(unit.type);
            
            busLayoutsHTML += generateBusLayoutHTML(
                unit.type,
                busCounter,
                trip.seatBookings || [],
                busLabel
            );
            busCounter++;
        }
    });

    container.innerHTML = `
    <div style="max-width: 1100px; margin: 0 auto;">
        <!-- COVER PAGE -->
        <div style="
            background: linear-gradient(135deg, #4f46e5 0%, #1e1b4b 100%);
            border-radius: 48px;
            padding: 60px;
            color: white;
            margin-bottom: 40px;
            box-shadow: 0 30px 60px rgba(79, 70, 229, 0.3);
            position: relative;
            overflow: hidden;
            page-break-after: always;
        ">
            <!-- Decorative Elements -->
            <div style="
                position: absolute;
                top: -50px;
                right: -50px;
                width: 200px;
                height: 200px;
                background: rgba(255,255,255,0.1);
                border-radius: 50%;
            "></div>
            <div style="
                position: absolute;
                bottom: -80px;
                left: -80px;
                width: 300px;
                height: 300px;
                background: rgba(255,255,255,0.05);
                border-radius: 50%;
            "></div>

            <div style="position: relative; z-index: 2;">
                <!-- Trip Type Badge -->
                <div style="
                    background: rgba(255,255,255,0.2);
                    backdrop-filter: blur(10px);
                    display: inline-block;
                    padding: 10px 25px;
                    border-radius: 40px;
                    margin-bottom: 30px;
                    font-weight: 700;
                    font-size: 14px;
                    border: 1px solid rgba(255,255,255,0.3);
                ">
                    ${trip.difficulty || 'رحلة سياحية'} • ${trip.duration || 'يوم كامل'}
                </div>

                <h1 style="
                    font-size: 48px;
                    font-weight: 900;
                    margin: 0 0 20px 0;
                    line-height: 1.3;
                ">
                    ${trip.title}
                </h1>

                <div style="
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 20px;
                    margin: 40px 0;
                ">
                    <div style="
                        background: rgba(255,255,255,0.1);
                        border-radius: 24px;
                        padding: 20px;
                        backdrop-filter: blur(10px);
                    ">
                        <div style="font-size: 20px; margin-bottom: 5px;">📍</div>
                        <div style="font-weight: 700; margin-bottom: 5px;">الوجهة</div>
                        <div style="font-size: 18px; font-weight: 600;">${trip.destination}</div>
                    </div>
                    <div style="
                        background: rgba(255,255,255,0.1);
                        border-radius: 24px;
                        padding: 20px;
                        backdrop-filter: blur(10px);
                    ">
                        <div style="font-size: 20px; margin-bottom: 5px;">📅</div>
                        <div style="font-weight: 700; margin-bottom: 5px;">تاريخ الانطلاق</div>
                        <div style="font-size: 18px; font-weight: 600;">${formatDate(trip.startDate)}</div>
                    </div>
                    <div style="
                        background: rgba(255,255,255,0.1);
                        border-radius: 24px;
                        padding: 20px;
                        backdrop-filter: blur(10px);
                    ">
                        <div style="font-size: 20px; margin-bottom: 5px;">⏰</div>
                        <div style="font-weight: 700; margin-bottom: 5px;">وقت الانطلاق</div>
                        <div style="font-size: 18px; font-weight: 600;">${formatTime(trip.startDate)}</div>
                    </div>
                </div>

                <!-- Price Card -->
                <div style="
                    background: white;
                    border-radius: 32px;
                    padding: 30px;
                    margin-top: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                ">
                    <div>
                        <div style="color: #64748b; font-weight: 700; margin-bottom: 5px;">سعر الفرد</div>
                        <div style="color: #1e1b4b; font-size: 36px; font-weight: 900;">
                            ${trip.price?.toLocaleString() || '0'} 
                            <span style="font-size: 18px; color: #64748b; margin-right: 5px;">ج.م</span>
                        </div>
                    </div>
                    <div style="
                        background: #4f46e5;
                        color: white;
                        padding: 15px 30px;
                        border-radius: 60px;
                        font-weight: 900;
                        font-size: 20px;
                    ">
                        شامل الضرائب
                    </div>
                </div>
            </div>
        </div>

        

        <!-- DETAILS PAGE -->
        <div style="
            background: white;
            border-radius: 48px;
            padding: 50px;
            margin-bottom: 40px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.08);
            page-break-after: always;
        ">
            <h2 style="
                font-size: 32px;
                font-weight: 900;
                color: #1e1b4b;
                margin: 0 0 10px 0;
                position: relative;
                padding-bottom: 20px;
                border-bottom: 4px solid #4f46e5;
            ">
                تفاصيل الرحلة
            </h2>

            <!-- Key Info Grid -->
            <div style="
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 25px;
                margin: 40px 0;
            ">
                <div>
                    <div style="color: #64748b; font-weight: 600; margin-bottom: 5px;">نقطة التجمع</div>
                    <div style="font-weight: 900; font-size: 18px;">${trip.meetingLocation || 'غير محدد'}</div>
                </div>
                <div>
                    <div style="color: #64748b; font-weight: 600; margin-bottom: 5px;">مستوى الرحلة</div>
                    <div>
                        <span style="
                            background: ${trip.difficulty === 'صعب' ? '#fee2e2' : trip.difficulty === 'متوسط' ? '#fef3c7' : '#e0e7ff'};
                            color: ${trip.difficulty === 'صعب' ? '#ef4444' : trip.difficulty === 'متوسط' ? '#f59e0b' : '#4f46e5'};
                            padding: 8px 20px;
                            border-radius: 40px;
                            font-weight: 700;
                        ">
                            ${trip.difficulty || 'سهل'}
                        </span>
                    </div>
                </div>
                <div>
                    <div style="color: #64748b; font-weight: 600; margin-bottom: 5px;">مدة الرحلة</div>
                    <div style="font-weight: 900; font-size: 18px;">${trip.duration || 'غير محدد'}</div>
                </div>
                <div>
                    <div style="color: #64748b; font-weight: 600; margin-bottom: 5px;">وسيلة النقل</div>
                    <div style="font-weight: 900; font-size: 18px;">
                        ${transportationList.map((t: any) => 
                            getTransportationLabel(t.type) + (t.count > 1 ? ` (${t.count})` : '')
                        ).join(' - ')}
                    </div>
                </div>
            </div>

            <!-- Description -->
            <div style="margin: 40px 0;">
                <h3 style="font-size: 24px; font-weight: 900; color: #1e1b4b; margin-bottom: 20px;">وصف الرحلة</h3>
                <p style="line-height: 1.8; color: #475569; font-size: 16px;">
                    ${trip.shortDescription || 'لا يوجد وصف متاح'}
                </p>
            </div>

            <!-- Services Grid -->
            ${trip.includedServices?.length > 0 ? `
            <div style="margin: 40px 0;">
                <h3 style="font-size: 24px; font-weight: 900; color: #1e1b4b; margin-bottom: 20px;">الخدمات المشمولة</h3>
                <div style="
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 15px;
                ">
                    ${trip.includedServices.map((s: string) => `
                        <div style="
                            background: #f8fafc;
                            border-radius: 20px;
                            padding: 15px 20px;
                            display: flex;
                            align-items: center;
                            gap: 10px;
                        ">
                            <span style="color: #10b981; font-size: 20px;">✓</span>
                            <span style="font-weight: 600;">${s}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
            ` : ''}

            ${trip.restrictions?.length > 0 ? `
            <div style="margin: 40px 0;">
                <h3 style="font-size: 24px; font-weight: 900; color: #1e1b4b; margin-bottom: 20px;">الممنوعات</h3>
                <div style="
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 15px;
                ">
                    ${trip.restrictions.map((r: string) => `
                        <div style="
                            background: #fff1f2;
                            border-radius: 20px;
                            padding: 15px 20px;
                            display: flex;
                            align-items: center;
                            gap: 10px;
                        ">
                            <span style="color: #f43f5e; font-size: 20px;">✗</span>
                            <span style="font-weight: 600;">${r}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
            ` : ''}
        </div>

        <!-- ITINERARY PAGE -->
        ${trip.itinerary?.length > 0 ? `
        <div style="
            background: white;
            border-radius: 48px;
            padding: 50px;
            margin-bottom: 40px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.08);
            page-break-after: always;
        ">
            <h2 style="
                font-size: 32px;
                font-weight: 900;
                color: #1e1b4b;
                margin: 0 0 40px 0;
                position: relative;
                padding-bottom: 20px;
                border-bottom: 4px solid #4f46e5;
            ">
                البرنامج اليومي
            </h2>

            <div style="position: relative;">
                <!-- Timeline line -->
                <div style="
                    position: absolute;
                    right: 30px;
                    top: 0;
                    bottom: 0;
                    width: 4px;
                    background: #e2e8f0;
                "></div>

                ${trip.itinerary.map((it: any, index: number) => `
                    <div style="
                        position: relative;
                        margin-bottom: 40px;
                        padding-right: 80px;
                    ">
                        <!-- Timeline dot -->
                        <div style="
                            position: absolute;
                            right: 18px;
                            top: 0;
                            width: 28px;
                            height: 28px;
                            background: ${index === 0 ? '#4f46e5' : '#94a3b8'};
                            border: 4px solid white;
                            border-radius: 50%;
                            box-shadow: 0 4px 10px rgba(79,70,229,0.3);
                        "></div>

                        <!-- Day card -->
                        <div style="
                            background: #f8fafc;
                            border-radius: 24px;
                            padding: 25px;
                        ">
                            <div style="
                                display: inline-block;
                                background: ${index === 0 ? '#4f46e5' : '#e2e8f0'};
                                color: ${index === 0 ? 'white' : '#475569'};
                                padding: 8px 25px;
                                border-radius: 40px;
                                font-weight: 900;
                                margin-bottom: 15px;
                            ">
                                اليوم ${it.day}
                            </div>
                            <h3 style="
                                font-size: 22px;
                                font-weight: 900;
                                color: #1e1b4b;
                                margin: 10px 0;
                            ">
                                ${it.title}
                            </h3>
                            <p style="color: #64748b; line-height: 1.8;">
                                ${it.description}
                            </p>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
        ` : ''}

        <!-- BUS LAYOUTS -->
        ${busLayoutsHTML}

        <!-- NOTES PAGE -->
        <div style="
            background: white;
            border-radius: 48px;
            padding: 50px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.08);
        ">
            <h2 style="
                font-size: 32px;
                font-weight: 900;
                color: #1e1b4b;
                margin: 0 0 30px 0;
                position: relative;
                padding-bottom: 20px;
                border-bottom: 4px solid #4f46e5;
            ">
                ملاحظات وإرشادات
            </h2>

            <div style="
                background: #fef3c7;
                border-right: 8px solid #f59e0b;
                border-radius: 24px;
                padding: 30px;
                margin-bottom: 30px;
            ">
                <h3 style="font-size: 20px; font-weight: 900; color: #92400e; margin-bottom: 15px;">
                    ⚠️ مهم جداً
                </h3>
                <ul style="color: #92400e; line-height: 2; padding-right: 20px;">
                    <li>يرجى التواجد قبل موعد الانطلاق بساعة على الأقل</li>
                    <li>إحضار بطاقة الهوية الشخصية</li>
                    <li>الالتزام بتعليمات المرشد السياحي</li>
                </ul>
            </div>

            <div style="
                background: #f8fafc;
                border-radius: 24px;
                padding: 30px;
                text-align: center;
            ">
                <div style="font-size: 40px; margin-bottom: 15px;">📞</div>
                <h3 style="font-weight: 900; color: #1e1b4b; margin-bottom: 10px;">للتواصل والدعم</h3>
                <p style="color: #4f46e5; font-weight: 700; font-size: 18px;">${trip.contactPhone || 'غير متوفر'}</p>
                <p style="color: #64748b;">${trip.contactEmail || ''}</p>
            </div>

            <!-- Footer -->
            <div style="
                margin-top: 50px;
                padding-top: 30px;
                border-top: 2px dashed #e2e8f0;
                text-align: center;
                color: #94a3b8;
                font-size: 14px;
            ">
                تم إنشاء هذا التقرير في ${new Date().toLocaleDateString('ar-EG')}
            </div>
        </div>
    </div>
    `;

    document.body.appendChild(container);

    try {
        if ("fonts" in document) {
            await (document as any).fonts.ready;
        }

        const pdf = new jsPDF("p", "mm", "a4");
        const pdfWidth = pdf.internal.pageSize.getWidth();

        // Get all pages
        const pageElements = container.querySelectorAll('div[style*="page-break-after: always"]');
        
        for (let i = 0; i < pageElements.length; i++) {
            if (i > 0) pdf.addPage();

            const canvas = await html2canvas(pageElements[i] as HTMLElement, {
                scale: 2,
                useCORS: true,
                backgroundColor: "#ffffff",
                logging: false,
                allowTaint: true,
            });

            const imgData = canvas.toDataURL("image/png");
            const imgProps = pdf.getImageProperties(imgData);
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

            pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
        }

        pdf.save(`تقرير_رحلة_${trip.title.replace(/\s+/g, "_")}.pdf`);
        
    } catch (error) {
        console.error("Error generating PDF:", error);
        throw error;
    } finally {
        document.body.removeChild(container);
    }
};
