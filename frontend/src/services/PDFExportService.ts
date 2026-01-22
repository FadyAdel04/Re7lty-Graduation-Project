import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';

interface ReportData {
    period: {
        type: string;
        startDate: string;
        endDate: string;
        label: string;
    };
    overview: any;
    charts: any;
    topContent: any;
    dailyBreakdown: any[];
    generatedAt: string;
}

export class PDFExportService {
    private doc: jsPDF;
    private yPosition: number = 20;
    private pageWidth: number = 210; // A4 width in mm
    private margin: number = 15;

    constructor() {
        this.doc = new jsPDF('p', 'mm', 'a4');
    }

    async generateReport(data: ReportData, chartElements: HTMLElement[]): Promise<void> {
        try {
            // Add header
            this.addHeader(data.period);

            // Add overview statistics
            this.addOverviewSection(data.overview);

            // Add charts as images
            await this.addChartsSection(chartElements);

            // Add top content tables
            this.addTopContentSection(data.topContent);

            // Add daily breakdown table
            this.addDailyBreakdownTable(data.dailyBreakdown);

            // Add footer
            this.addFooter(data.generatedAt);

            // Download the PDF
            const fileName = `Platform_Report_${new Date().toISOString().split('T')[0]}.pdf`;
            this.doc.save(fileName);
        } catch (error) {
            console.error('Error generating PDF:', error);
            throw new Error('Failed to generate PDF');
        }
    }

    private addHeader(period: any): void {
        // Title
        this.doc.setFontSize(22);
        this.doc.setFont('helvetica', 'bold');
        this.doc.text('Platform Analytics Report', this.pageWidth / 2, this.yPosition, { align: 'center' });

        this.yPosition += 10;

        // Period info
        this.doc.setFontSize(12);
        this.doc.setFont('helvetica', 'normal');
        const periodLabel = period.type === 'daily' ? 'Last 24 Hours' :
            period.type === 'monthly' ? 'Last 30 Days' : 'Last 7 Days';
        this.doc.text(periodLabel, this.pageWidth / 2, this.yPosition, { align: 'center' });

        this.yPosition += 5;

        const startDate = new Date(period.startDate).toLocaleDateString('en-US');
        const endDate = new Date(period.endDate).toLocaleDateString('en-US');
        this.doc.setFontSize(10);
        this.doc.text(`${startDate} - ${endDate}`, this.pageWidth / 2, this.yPosition, { align: 'center' });

        this.yPosition += 15;

        // Separator line
        this.doc.setDrawColor(200, 200, 200);
        this.doc.line(this.margin, this.yPosition, this.pageWidth - this.margin, this.yPosition);
        this.yPosition += 10;
    }

    private addOverviewSection(overview: any): void {
        this.checkPageBreak(60);

        this.doc.setFontSize(14);
        this.doc.setFont('helvetica', 'bold');
        this.doc.text('Overview', this.margin, this.yPosition);
        this.yPosition += 8;

        // Create overview table
        const overviewData = [
            ['Total Users', overview.totalUsers.toString(), 'New Users', overview.newUsers.toString()],
            ['Total Trips', overview.totalTrips.toString(), 'New Trips', overview.newTrips.toString()],
            ['Total Companies', overview.totalCompanies.toString(), 'Active Companies', overview.activeCompanies.toString()],
            ['Total Reactions', overview.totalReactions.toString(), 'New Reactions', overview.newReactions.toString()],
            ['Total Comments', overview.totalComments.toString(), 'New Comments', overview.newComments.toString()],
        ];

        autoTable(this.doc, {
            startY: this.yPosition,
            head: [],
            body: overviewData,
            theme: 'grid',
            styles: {
                font: 'helvetica',
                fontSize: 10,
                halign: 'center',
                cellPadding: 3
            },
            columnStyles: {
                0: { fontStyle: 'bold', fillColor: [245, 245, 245] },
                2: { fontStyle: 'bold', fillColor: [245, 245, 245] }
            },
            margin: { left: this.margin, right: this.margin }
        });

        this.yPosition = (this.doc as any).lastAutoTable.finalY + 10;
    }

    private async addChartsSection(chartElements: HTMLElement[]): Promise<void> {
        this.checkPageBreak(80);

        this.doc.setFontSize(14);
        this.doc.setFont('helvetica', 'bold');
        this.doc.text('Charts', this.margin, this.yPosition);
        this.yPosition += 10;

        for (const element of chartElements) {
            if (!element) continue;

            try {
                // Capture chart as image
                const canvas = await html2canvas(element, {
                    scale: 2,
                    backgroundColor: '#ffffff',
                    logging: false
                });

                const imgData = canvas.toDataURL('image/png');
                const imgWidth = this.pageWidth - (2 * this.margin);
                const imgHeight = (canvas.height * imgWidth) / canvas.width;

                this.checkPageBreak(imgHeight + 10);

                this.doc.addImage(imgData, 'PNG', this.margin, this.yPosition, imgWidth, imgHeight);
                this.yPosition += imgHeight + 10;
            } catch (error) {
                console.error('Error capturing chart:', error);
            }
        }
    }

    private addTopContentSection(topContent: any): void {
        this.checkPageBreak(60);

        // Top Trips
        if (topContent.trips && topContent.trips.length > 0) {
            this.doc.setFontSize(14);
            this.doc.setFont('helvetica', 'bold');
            this.doc.text('Top Trips', this.margin, this.yPosition);
            this.yPosition += 8;

            const tripsData = topContent.trips.slice(0, 5).map((trip: any, index: number) => [
                (index + 1).toString(),
                trip.title || 'No Title',
                trip.destination || '-',
                trip.likes?.toString() || '0',
                trip.saves?.toString() || '0'
            ]);

            autoTable(this.doc, {
                startY: this.yPosition,
                head: [['#', 'Title', 'Destination', 'Likes', 'Saves']],
                body: tripsData,
                theme: 'striped',
                styles: {
                    font: 'helvetica',
                    fontSize: 9,
                    halign: 'center'
                },
                headStyles: {
                    fillColor: [249, 115, 22],
                    textColor: 255,
                    fontStyle: 'bold'
                },
                margin: { left: this.margin, right: this.margin }
            });

            this.yPosition = (this.doc as any).lastAutoTable.finalY + 10;
        }

        // Top Companies
        if (topContent.companies && topContent.companies.length > 0) {
            this.checkPageBreak(60);

            this.doc.setFontSize(14);
            this.doc.setFont('helvetica', 'bold');
            this.doc.text('Top Companies', this.margin, this.yPosition);
            this.yPosition += 8;

            const companiesData = topContent.companies.slice(0, 5).map((company: any, index: number) => [
                (index + 1).toString(),
                company.name || 'No Name',
                company.tripsCount?.toString() || '0',
                company.rating?.toFixed(1) || '-'
            ]);

            autoTable(this.doc, {
                startY: this.yPosition,
                head: [['#', 'Company Name', 'Trips Count', 'Rating']],
                body: companiesData,
                theme: 'striped',
                styles: {
                    font: 'helvetica',
                    fontSize: 9,
                    halign: 'center'
                },
                headStyles: {
                    fillColor: [249, 115, 22],
                    textColor: 255,
                    fontStyle: 'bold'
                },
                margin: { left: this.margin, right: this.margin }
            });

            this.yPosition = (this.doc as any).lastAutoTable.finalY + 10;
        }
    }

    private addDailyBreakdownTable(dailyBreakdown: any[]): void {
        if (!dailyBreakdown || dailyBreakdown.length === 0) return;

        this.checkPageBreak(60);

        this.doc.setFontSize(14);
        this.doc.setFont('helvetica', 'bold');
        this.doc.text('Daily Breakdown', this.margin, this.yPosition);
        this.yPosition += 8;

        const breakdownData = dailyBreakdown.map((day: any) => [
            day.date || day.dayName,
            day.users?.toString() || '0',
            day.trips?.toString() || '0',
            day.reactions?.toString() || '0',
            day.comments?.toString() || '0'
        ]);

        autoTable(this.doc, {
            startY: this.yPosition,
            head: [['Date', 'Users', 'Trips', 'Reactions', 'Comments']],
            body: breakdownData,
            theme: 'grid',
            styles: {
                font: 'helvetica',
                fontSize: 9,
                halign: 'center'
            },
            headStyles: {
                fillColor: [249, 115, 22],
                textColor: 255,
                fontStyle: 'bold'
            },
            margin: { left: this.margin, right: this.margin }
        });

        this.yPosition = (this.doc as any).lastAutoTable.finalY + 10;
    }

    private addFooter(generatedAt: string): void {
        const pageCount = this.doc.getNumberOfPages();

        for (let i = 1; i <= pageCount; i++) {
            this.doc.setPage(i);
            this.doc.setFontSize(8);
            this.doc.setFont('helvetica', 'normal');
            this.doc.setTextColor(150, 150, 150);

            const footerText = `Generated: ${new Date(generatedAt).toLocaleString('en-US')}`;
            this.doc.text(footerText, this.pageWidth / 2, 285, { align: 'center' });

            const pageText = `Page ${i} of ${pageCount}`;
            this.doc.text(pageText, this.pageWidth - this.margin, 285, { align: 'right' });
        }
    }

    private checkPageBreak(requiredSpace: number): void {
        if (this.yPosition + requiredSpace > 270) {
            this.doc.addPage();
            this.yPosition = 20;
        }
    }
}

export const exportReportToPDF = async (data: ReportData, chartElements: HTMLElement[]): Promise<void> => {
    const service = new PDFExportService();
    await service.generateReport(data, chartElements);
};
