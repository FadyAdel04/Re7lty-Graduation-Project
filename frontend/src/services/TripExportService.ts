import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export const exportTripDetailsToPDF = async (trip: any) => {
    const container = document.createElement("div");
    container.style.position = "fixed";
    container.style.left = "-9999px";
    container.style.top = "0";
    container.style.width = "1000px";
    container.style.background = "white";
    container.style.fontFamily = "'Cairo', sans-serif";
    container.dir = "rtl";

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return "غير محدد";
        return new Date(dateStr).toLocaleDateString("ar-EG", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    /* ---------------- BUS LAYOUT ---------------- */

    const generateBusLayoutHTML = (
        unitType: string,
        busIndex: number,
        seatBookings: any[]
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

        return `
        <div class="bus-layout-page" style="padding:60px;">
            <h2 style="text-align:center;font-size:28px;font-weight:900;margin-bottom:40px;color:#1e1b4b;">
                توزيع مقاعد الحافلة رقم ${busIndex + 1}
            </h2>

            <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:18px;">
                ${busSeats
                    .map(
                        (seat) => `
                    <div style="
                        height:90px;
                        background:${seat.name ? "#e0e7ff" : "white"};
                        border:2px solid ${
                            seat.name ? "#4f46e5" : "#e2e8f0"
                        };
                        border-radius:16px;
                        display:flex;
                        flex-direction:column;
                        align-items:center;
                        justify-content:center;
                        padding:8px;
                        text-align:center;
                        box-sizing:border-box;
                    ">
                        <span style="font-size:12px;font-weight:900;color:${
                            seat.name ? "#4f46e5" : "#94a3b8"
                        };margin-bottom:6px;">
                            مقعد ${seat.num}
                        </span>

                        ${
                            seat.name
                                ? `<span style="
                                    font-size:14px;
                                    font-weight:900;
                                    color:#1e1b4b;
                                    line-height:1.3;
                                    word-break:break-word;
                                ">
                                    ${seat.name}
                                </span>`
                                : `<span style="
                                    font-size:13px;
                                    color:#cbd5e1;
                                    font-weight:800;
                                ">متاح</span>`
                        }
                    </div>
                `
                    )
                    .join("")}
            </div>
        </div>
        `;
    };

    /* ---------------- MAIN CONTENT ---------------- */

    const totalBooked = trip.seatBookings?.length || 0;

    const transportationList =
        trip.transportations?.length > 0
            ? trip.transportations
            : [{ type: trip.transportationType || "bus-48", count: 1 }];

    let busLayoutsHTML = "";

    transportationList.forEach((unit: any, idx: number) => {
        const count = unit.count || 1;
        for (let i = 0; i < count; i++) {
            busLayoutsHTML += generateBusLayoutHTML(
                unit.type,
                idx + i,
                trip.seatBookings || []
            );
        }
    });

    container.innerHTML = `
    <!-- COVER PAGE -->
    <div id="cover-page" style="
        padding:80px 60px;
        background:linear-gradient(135deg,#4f46e5,#1e1b4b);
        color:white;
        height:1000px;
        box-sizing:border-box;
    ">
        <h1 style="font-size:42px;font-weight:900;margin-bottom:30px;">
            ${trip.title}
        </h1>

        <p style="font-size:18px;margin-bottom:15px;">📍 ${trip.destination}</p>
        <p style="font-size:18px;margin-bottom:15px;">📅 ${formatDate(
            trip.startDate
        )}</p>
        <p style="font-size:18px;margin-bottom:15px;">⏱️ ${trip.duration}</p>

        <div style="
            margin-top:60px;
            background:rgba(255,255,255,0.15);
            padding:30px;
            border-radius:20px;
        ">
            <h2 style="font-size:28px;font-weight:900;">
                ${trip.price} ج.م
            </h2>
            <p style="opacity:0.8;">سعر الفرد</p>
        </div>
    </div>

    <!-- DETAILS PAGE -->
    <div id="details-page" style="padding:60px;">
        <h2 style="font-size:28px;font-weight:900;color:#1e1b4b;margin-bottom:20px;">
            تفاصيل الرحلة
        </h2>

        <p><strong>نقطة التجمع:</strong> ${trip.meetingLocation || "-"}</p>
        <p><strong>مستوى الرحلة:</strong> ${trip.difficulty || "سهل"}</p>
        <p><strong>عدد الحجوزات:</strong> ${totalBooked}</p>

        <hr style="margin:30px 0;" />

        <h3 style="font-size:20px;font-weight:900;">وصف الرحلة</h3>
        <p style="line-height:1.8;">${trip.shortDescription || "-"}</p>

        ${
            trip.includedServices?.length > 0
                ? `
        <h3 style="margin-top:40px;font-size:20px;font-weight:900;">الخدمات المشمولة</h3>
        <ul style="margin-top:15px;">
            ${trip.includedServices
                .map(
                    (s: string) =>
                        `<li style="margin-bottom:8px;">${s}</li>`
                )
                .join("")}
        </ul>
        `
                : ""
        }

        ${
            trip.itinerary?.length > 0
                ? `
        <h3 style="margin-top:40px;font-size:20px;font-weight:900;">البرنامج اليومي</h3>
        ${trip.itinerary
            .map(
                (it: any) => `
            <div style="margin-bottom:20px;">
                <strong>اليوم ${it.day} - ${it.title}</strong>
                <p style="margin-top:5px;">${it.description}</p>
            </div>
        `
            )
            .join("")}
        `
                : ""
        }
    </div>

    ${busLayoutsHTML}
    `;

    document.body.appendChild(container);

    try {
        if ("fonts" in document) {
            await (document as any).fonts.ready;
        }

        const pdf = new jsPDF("p", "mm", "a4");
        const pdfWidth = pdf.internal.pageSize.getWidth();

        const pages = [
            "#cover-page",
            "#details-page",
            ".bus-layout-page",
        ];

        for (let p = 0; p < pages.length; p++) {
            const elements =
                pages[p].startsWith(".")
                    ? container.querySelectorAll(pages[p])
                    : [container.querySelector(pages[p])];

            for (let i = 0; i < elements.length; i++) {
                if (p !== 0 || i !== 0) pdf.addPage();

                const canvas = await html2canvas(
                    elements[i] as HTMLElement,
                    {
                        scale: 3,
                        useCORS: true,
                        backgroundColor: "#ffffff",
                    }
                );

                const imgData = canvas.toDataURL("image/png");
                const props = pdf.getImageProperties(imgData);
                const height =
                    (props.height * pdfWidth) / props.width;

                pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, height);
            }
        }

        pdf.save(
            `تقرير_رحلة_${trip.title.replace(/\s+/g, "_")}.pdf`
        );
    } finally {
        document.body.removeChild(container);
    }
};
