import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export const exportTripDetailsToPDF = async (trip: any) => {
    const container = document.createElement("div");
    container.style.position = "fixed";
    container.style.left = "-5000px"; // Far but within reasonable limits
    container.style.top = "0";
    container.style.opacity = "1"; // Keep fully opaque for rendering
    container.style.visibility = "visible";
    container.style.pointerEvents = "none";
    container.style.zIndex = "-1000";
    container.style.width = "1100px"; // Standard width for PDF export
    container.style.background = "#ffffff";
    container.style.fontFamily = "'Cairo', sans-serif";
    container.style.direction = "rtl";
    container.style.padding = "40px";
    container.style.color = "#000000";
    container.style.lineHeight = "1.6";

    // Add Google Fonts link to ensure Cairo is loaded
    const fontLink = document.createElement("link");
    fontLink.href = "https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap";
    fontLink.rel = "stylesheet";
    document.head.appendChild(fontLink);

    // Add explicit font-face to the container to ensure it's used
    const styleTag = document.createElement("style");
    styleTag.textContent = `
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap');
        * {
            font-family: 'Cairo', sans-serif !important;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            text-rendering: optimizeLegibility;
        }
        h1, h2, h3, h4 { font-weight: 900 !important; }
        p, div { font-weight: 500; }
        .page-break { page-break-after: always; }
    `;
    container.appendChild(styleTag);

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

    const totalCapacity = trip.transportations?.reduce((acc: number, t: any) => 
        acc + (t.capacity * (t.count || 1)), 0) || trip.totalCapacity || 0;
    const bookedCount = trip.seatBookings?.length || 0;
    const acceptedCount = trip.seatBookings?.filter((b: any) => b.status === 'accepted').length || 0;
    const totalRevenue = acceptedCount * (trip.price || 0);

    const company = trip.companyId && typeof trip.companyId === 'object' ? trip.companyId : null;

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

    const passengerListHTML = (trip.seatBookings && trip.seatBookings.length > 0) ? `
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
            margin: 0 0 30px 0;
            border-bottom: 4px solid #4f46e5;
            padding-bottom: 20px;
        ">
            قائمة الركاب والمشتركين
        </h2>
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px; text-align: right;">
            <thead>
                <tr style="background: #f1f5f9;">
                    <th style="padding: 15px; border: 1px solid #e2e8f0; font-weight: 900;">الاسم</th>
                    <th style="padding: 15px; border: 1px solid #e2e8f0; font-weight: 900;">رقم المقعد</th>
                    <th style="padding: 15px; border: 1px solid #e2e8f0; font-weight: 900;">الحافلة</th>
                    <th style="padding: 15px; border: 1px solid #e2e8f0; font-weight: 900;">الحالة</th>
                </tr>
            </thead>
            <tbody>
                ${trip.seatBookings.map((b: any) => `
                    <tr>
                        <td style="padding: 15px; border: 1px solid #e2e8f0; font-weight: 600;">${b.passengerName || 'غير معروف'}</td>
                        <td style="padding: 15px; border: 1px solid #e2e8f0;">${b.seatNumber}</td>
                        <td style="padding: 15px; border: 1px solid #e2e8f0;">${b.busIndex + 1}</td>
                        <td style="padding: 15px; border: 1px solid #e2e8f0;">
                            <span style="
                                padding: 4px 12px;
                                border-radius: 20px;
                                font-size: 12px;
                                font-weight: 700;
                                background: ${b.status === 'accepted' ? '#dcfce7' : '#fee2e2'};
                                color: ${b.status === 'accepted' ? '#166534' : '#991b1b'};
                            ">
                                ${b.status === 'accepted' ? 'مؤكد' : 'ملغي'}
                            </span>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
    ` : '';

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

                <!-- Company Header -->
                ${company ? `
                <div style="
                    display: flex;
                    align-items: center;
                    gap: 20px;
                    margin-bottom: 30px;
                    background: rgba(255,255,255,0.1);
                    padding: 20px;
                    border-radius: 24px;
                    backdrop-filter: blur(10px);
                ">
                    ${company.logo ? `<img src="${company.logo}" style="width: 60px; height: 60px; border-radius: 15px; object-cover: cover; background: white;" />` : '<div style="width: 60px; height: 60px; background: white; border-radius: 15px; display: flex; align-items: center; justify-content: center; color: #4f46e5; font-size: 24px;">🏢</div>'}
                    <div>
                        <div style="font-weight: 900; font-size: 18px;">${company.name}</div>
                        <div style="font-size: 12px; opacity: 0.8;">الشركة المنظمة للرحلة</div>
                    </div>
                </div>
                ` : ''}

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

        <!-- SUMMARY PAGE -->
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
                margin: 0 0 30px 0;
                border-bottom: 4px solid #4f46e5;
                padding-bottom: 20px;
            ">
                ملخص وتفاصيل الرحلة
            </h2>

            <!-- Trip Description Narrative -->
            <div style="
                background: #f8fafc;
                padding: 30px;
                border-radius: 32px;
                margin-bottom: 30px;
                border-right: 6px solid #4f46e5;
            ">
                <h3 style="font-size: 20px; font-weight: 900; color: #1e1b4b; margin-bottom: 15px;">عن هذه الرحلة</h3>
                <div style="font-size: 16px; color: #475569; line-height: 1.8; white-space: pre-wrap;">
                    ${trip.description || trip.shortDescription || 'لا يوجد وصف تفصيلي متاح لهذه الرحلة.'}
                </div>
            </div>

            <div style="
                font-size: 22px;
                font-weight: 900;
                color: #1e1b4b;
                margin-bottom: 20px;
            ">
                إحصائيات عامة
            </div>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px;">
                <div style="background: #f8fafc; padding: 25px; border-radius: 32px;">
                    <div style="color: #64748b; font-weight: 700; font-size: 14px; margin-bottom: 10px;">إجمالي المقاعد</div>
                    <div style="font-size: 36px; font-weight: 900; color: #1e1b4b;">${totalCapacity}</div>
                </div>
                <div style="background: #e0e7ff; padding: 25px; border-radius: 32px;">
                    <div style="color: #4f46e5; font-weight: 700; font-size: 14px; margin-bottom: 10px;">إجمالي الحجوزات</div>
                    <div style="font-size: 36px; font-weight: 900; color: #4f46e5;">${bookedCount}</div>
                </div>
                <div style="background: #dcfce7; padding: 25px; border-radius: 32px;">
                    <div style="color: #166534; font-weight: 700; font-size: 14px; margin-bottom: 10px;">الحجوزات المؤكدة</div>
                    <div style="font-size: 36px; font-weight: 900; color: #166534;">${acceptedCount}</div>
                </div>
                <div style="background: #fef3c7; padding: 25px; border-radius: 32px;">
                    <div style="color: #92400e; font-weight: 700; font-size: 14px; margin-bottom: 10px;">إجمالي الإيرادات</div>
                    <div style="font-size: 36px; font-weight: 900; color: #92400e;">${totalRevenue.toLocaleString()} <span style="font-size: 16px;">ج.م</span></div>
                </div>
            </div>

            <div style="margin-top: 40px; background: #f1f5f9; padding: 30px; border-radius: 32px;">
                <h3 style="font-weight: 900; margin-bottom: 15px;">نظرة عامة على المبيعات</h3>
                <div style="height: 10px; background: #e2e8f0; border-radius: 5px; overflow: hidden; display: flex;">
                    <div style="width: ${(acceptedCount / totalCapacity) * 100}%; background: #10b981;"></div>
                    <div style="width: ${((bookedCount - acceptedCount) / totalCapacity) * 100}%; background: #f59e0b;"></div>
                </div>
                <div style="display: flex; justify-content: space-between; margin-top: 10px; font-size: 12px; font-weight: 700;">
                    <span style="color: #10b981;">مؤكد: ${Math.round((acceptedCount / totalCapacity) * 100)}%</span>
                    <span style="color: #f59e0b;">معلق: ${Math.round(((bookedCount - acceptedCount) / totalCapacity) * 100)}%</span>
                    <span style="color: #94a3b8;">شاغر: ${Math.round(((totalCapacity - bookedCount) / totalCapacity) * 100)}%</span>
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

        <!-- PASSENGER LIST -->
        ${passengerListHTML}

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
            // Force load the font with a more specific check
            await (document as any).fonts.load('12pt Cairo');
            await (document as any).fonts.load('900 12pt Cairo');
            await (document as any).fonts.ready;
        }
        
        // Wait longer for fonts and layout to stabilize
        await new Promise(resolve => setTimeout(resolve, 3000));

        const pdf = new jsPDF("p", "mm", "a4");
        const pdfWidth = pdf.internal.pageSize.getWidth();

        // Get all pages
        const pageElements = container.querySelectorAll('.bus-layout-page, div[style*="page-break-after: always"]');
        
        for (let i = 0; i < pageElements.length; i++) {
            if (i > 0) pdf.addPage();

            const canvas = await html2canvas(pageElements[i] as HTMLElement, {
                scale: 3,
                useCORS: true,
                backgroundColor: "#ffffff",
                logging: false,
                allowTaint: false,
                imageTimeout: 15000,
                onclone: (doc) => {
                    const clonedContainer = doc.body.querySelector('div[style*="position: absolute"]');
                    if (clonedContainer) {
                        (clonedContainer as HTMLElement).style.opacity = "1";
                    }
                }
            });

            const imgData = canvas.toDataURL("image/jpeg", 0.95);
            const imgProps = pdf.getImageProperties(imgData);
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

            pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight, undefined, 'SLOW');
        }

        pdf.save(`تقرير_رحلة_${trip.title.replace(/\s+/g, "_")}.pdf`);
        
    } catch (error) {
        console.error("Error generating PDF:", error);
        throw error;
    } finally {
        document.body.removeChild(container);
    }
};
